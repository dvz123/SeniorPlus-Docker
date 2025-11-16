import { createContext, useState, useContext, useEffect, useRef, useCallback } from "react"
import { useMedication } from "../tela-cuidador/src/contexts/MedicationContext"
import { useEvents } from "../tela-cuidador/src/contexts/EventsContext"
import { emitEmergencyNotification } from "../utils/emergency"
import { useToast } from "./ToastContext"
import { useAuth } from "../tela-auth/src/contexts/AuthContext"

const NotificationContext = createContext()

export const useNotification = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const storageKey = currentUser ? `notifications:${currentUser.id || currentUser.email || "default"}` : null

  const [notifications, setNotifications] = useState([])

  const [unreadCount, setUnreadCount] = useState(0)
  const [permission, setPermission] = useState("default")
  const { medications } = useMedication()
  const { events } = useEvents()
  const notificationLockRef = useRef(new Set())
  const audioContextRef = useRef(null)
  const lastSoundRef = useRef(0)

  // Salvar notificações no localStorage
  useEffect(() => {
    if (!currentUser) {
      notificationLockRef.current.clear()
      setNotifications([])
      setUnreadCount(0)
      localStorage.removeItem("notifications")
      Object.keys(localStorage)
        .filter((key) => key.startsWith("notifications:"))
        .forEach((key) => localStorage.removeItem(key))
      return
    }

    const raw = storageKey ? localStorage.getItem(storageKey) || localStorage.getItem("notifications") : null
    if (!raw) {
      setNotifications([])
      return
    }

    try {
      const parsed = JSON.parse(raw)
      setNotifications(Array.isArray(parsed) ? parsed : [])
    } catch (_) {
      setNotifications([])
    }
  }, [currentUser, storageKey])

  useEffect(() => {
    if (!currentUser || !storageKey) return
    localStorage.setItem(storageKey, JSON.stringify(notifications))
    if (storageKey !== "notifications") {
      localStorage.removeItem("notifications")
    }
  }, [notifications, currentUser, storageKey])

  useEffect(() => {
    const count = notifications.filter((notification) => !notification.read).length
    setUnreadCount(count)
  }, [notifications])

  // Verificar permissão de notificações
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) {
        return
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const ctx = audioContextRef.current
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {})
      }

      const now = Date.now()
      if (now - lastSoundRef.current < 2500) {
        return
      }

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = "triangle"
      const startTime = ctx.currentTime
      oscillator.frequency.setValueAtTime(880, startTime)
      oscillator.frequency.exponentialRampToValueAtTime(660, startTime + 0.4)

      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.95)

      lastSoundRef.current = now
    } catch (error) {
      console.warn("Falha ao tocar alerta sonoro", error)
    }
  }, [])

  // Verificar medicamentos e eventos para criar notificações
  useEffect(() => {
    checkMedicationReminders()
    checkEventReminders()

    // Configurar verificação periódica
    const interval = setInterval(() => {
      checkMedicationReminders()
      checkEventReminders()
    }, 60000) // Verificar a cada minuto

    return () => clearInterval(interval)
  }, [medications, events, notifications])

  const isSameDay = (dateA, dateB) => dateA.toISOString().split("T")[0] === dateB.toISOString().split("T")[0]

  const hasNotification = (predicate) => notifications.some(predicate)

  const purgeObsoleteLocks = (todayISO) => {
    notificationLockRef.current.forEach((rawKey) => {
      try {
        const parsed = JSON.parse(rawKey)
        if (!parsed?.date || parsed.date === todayISO) {
          return
        }
        notificationLockRef.current.delete(rawKey)
      } catch (error) {
        // Se a chave não for JSON válido, remove para evitar crescimento infinito
        notificationLockRef.current.delete(rawKey)
      }
    })
  }

  // Solicitar permissão para notificações

  const { showSuccess, showError } = useToast() || {}

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('API Notification não suportada neste navegador')
      return 'unsupported'
    }
    if (Notification.permission === 'granted') {
      setPermission(true)
      return 'granted'
    }
    if (Notification.permission === 'denied') {
      return 'denied'
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setPermission(true)
        if (showSuccess) showSuccess('Notificações do sistema ativadas.')
      } else if (permission === 'denied') {
        if (showError) showError('Permissão negada para notificações.')
      }
      return permission
    } catch (e) {
      console.warn('Falha ao solicitar permissão de notificação', e)
      return 'default'
    }
  }, [showSuccess, showError])

  // Verificar medicamentos para lembretes
  const checkMedicationReminders = () => {
    if (!medications || medications.length === 0) return

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`
    const todayISO = now.toISOString().split("T")[0]

    purgeObsoleteLocks(todayISO)

    medications.forEach((medication) => {
      if (medication.status !== "active") return

      const timeSlots = Array.isArray(medication.times) ? medication.times : String(medication.time || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      timeSlots.forEach((timeSlot) => {
        if (timeSlot !== currentTime) return

        const notificationKey = JSON.stringify({
          type: "medication",
          target: medication.id,
          time: timeSlot,
          date: todayISO,
        })
        if (notificationLockRef.current.has(notificationKey)) return

        const alreadyExists = hasNotification(
          (notification) =>
            notification.type === "medication" &&
            notification.data?.medicationId === medication.id &&
            notification.data?.scheduleTime === timeSlot &&
            isSameDay(new Date(notification.time), now),
        )

        if (alreadyExists) {
          notificationLockRef.current.add(notificationKey)
          return
        }

        const notification = {
          id: Date.now().toString(),
          type: "medication",
          title: "Lembrete de Medicamento",
          message: `Hora de tomar ${medication.name} - ${medication.dosage}`,
          time: new Date().toISOString(),
          read: false,
          data: {
            medicationId: medication.id,
            medicationName: medication.name,
            scheduleTime: timeSlot,
          },
        }

        // Adicionar à lista de notificações
        addNotification(notification)
        playNotificationSound()
        notificationLockRef.current.add(notificationKey)

        // Enviar notificação do navegador se permitido
        if (permission === "granted") {
          sendBrowserNotification(notification.title, notification.message)
        }
      })
    })
  }

  // Verificar eventos para lembretes
  const checkEventReminders = () => {
    if (!events || events.length === 0) return

    const now = new Date()
    const today = now.toISOString().split("T")[0]
    purgeObsoleteLocks(today)

    events.forEach((event) => {
      if (event.date !== today) return

      const eventTime = event.startTime || "00:00"
      const [eventHour, eventMinute] = eventTime.split(":").map(Number)

      // Calcular tempo para o evento (em minutos)
      const eventDate = new Date(event.date)
      eventDate.setHours(eventHour, eventMinute, 0, 0)

      const timeDiff = (eventDate.getTime() - now.getTime()) / (1000 * 60)

      // Notificar 30 minutos antes
      if (timeDiff > 29 && timeDiff < 31) {
        const notificationKey = JSON.stringify({
          type: "event",
          target: event.id,
          time: eventTime,
          date: event.date,
        })
        if (notificationLockRef.current.has(notificationKey)) return

        const alreadyExists = hasNotification(
          (notification) =>
            notification.type === "event" &&
            notification.data?.eventId === event.id &&
            notification.data?.eventTitle === event.title &&
            isSameDay(new Date(notification.time), now),
        )

        if (alreadyExists) {
          notificationLockRef.current.add(notificationKey)
          return
        }

        // Criar notificação
        const notification = {
          id: Date.now().toString(),
          type: "event",
          title: "Lembrete de Evento",
          message: `${event.title} começa em 30 minutos (${event.startTime})`,
          time: new Date().toISOString(),
          read: false,
          data: {
            eventId: event.id,
            eventTitle: event.title,
            scheduleTime: event.startTime,
          },
        }

        // Adicionar à lista de notificações
        addNotification(notification)
        playNotificationSound()
        notificationLockRef.current.add(notificationKey)

        // Enviar notificação do navegador se permitido
        if (permission === "granted") {
          sendBrowserNotification(notification.title, notification.message)
        }
      }
    })
  }

  // Enviar notificação do navegador
  const sendBrowserNotification = (title, message) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return
    }

    try {
      new Notification(title, {
        body: message,
        icon: "/logo.png",
        silent: false,
      })
    } catch (error) {
      console.error("Erro ao enviar notificação:", error)
    }
  }

  // Adicionar notificação
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev])
  }, [])

  // Registrar ações de emergência com helper centralizado
  const notifyEmergencyAction = useCallback(
    (payload) => {
      emitEmergencyNotification({ ...payload, addNotification })
    },
    [addNotification],
  )

  // Marcar notificação como lida
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Marcar todas as notificações como lidas
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  // Remover notificação
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Limpar todas as notificações
  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Criar notificação manual
  const createNotification = (title, message, type = "info") => {
    const notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      time: new Date().toISOString(),
      read: false,
    }

    addNotification(notification)

    if (permission === "granted") {
      sendBrowserNotification(title, message)
    }

    return notification.id
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        permission,
        requestPermission,
        addNotification,
  notifyEmergencyAction,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        createNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
