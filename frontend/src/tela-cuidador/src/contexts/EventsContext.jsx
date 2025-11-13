import { createContext, useState, useContext, useEffect, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { useToast } from "../../../contexts/ToastContext"

const EventsContext = createContext()

export const useEvents = () => useContext(EventsContext)

export const EventsProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()

  const EVENT_STATUS = useMemo(
    () => ({
      PENDING: "Pendente",
      DONE: "Concluído",
    }),
    [],
  )

  const normalizeEvent = (event) => {
    if (!event) return null
    const base = {
      id: event.id || uuidv4(),
      title: event.title || event.titulo || "",
      date: event.date || event.data || new Date().toISOString().split("T")[0],
      startTime: event.startTime || event.horaInicio || event.start || "",
      endTime: event.endTime || event.horaFim || event.end || "",
      location: event.location || event.local || "",
      description: event.description || event.descricao || "",
      category: event.category || event.categoria || "Outro",
      createdAt: event.createdAt || event.criadoEm || new Date().toISOString(),
      updatedAt: event.updatedAt || event.atualizadoEm || new Date().toISOString(),
      status: event.status || EVENT_STATUS.PENDING,
    }

    if (base.status !== EVENT_STATUS.PENDING && base.status !== EVENT_STATUS.DONE) {
      base.status = EVENT_STATUS.PENDING
    }

    return base
  }

  const [events, setEvents] = useState(() => {
    // Verificar se o usuário está autenticado (usa authToken gerenciado pelo AuthContext)
    const isAuthenticated = localStorage.getItem("authToken") !== null || localStorage.getItem("isLoggedIn") === 'true'

    if (!isAuthenticated) {
      return []
    }

    const savedEvents = localStorage.getItem("events")
    if (!savedEvents) return []

    try {
      const parsed = JSON.parse(savedEvents)
      return Array.isArray(parsed) ? parsed.map((evt) => normalizeEvent(evt)).filter(Boolean) : []
    } catch (error) {
      console.error("Erro ao carregar eventos do storage:", error)
      return []
    }
  })

  // Limpar dados quando o usuário fizer logout
  useEffect(() => {
    if (!currentUser) {
      setEvents([])
    }
  }, [currentUser])

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("events", JSON.stringify(events))
    }
  }, [events, currentUser])

  const addEvent = (title, date, startTime, endTime, location, description, category) => {
    const newEvent = normalizeEvent({
      id: uuidv4(),
      title,
      date,
      startTime,
      endTime,
      location,
      description,
      category: category || "Outro",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: EVENT_STATUS.PENDING,
    })

    setEvents([...events, newEvent])
    showSuccess(`Evento "${title}" adicionado com sucesso!`)
    return newEvent
  }

  const updateEvent = (id, updatedEvent) => {
    setEvents(
      events.map((event) => {
        if (event.id === id) {
          return normalizeEvent({
            ...event,
            ...updatedEvent,
            updatedAt: new Date().toISOString(),
            status: updatedEvent.status || event.status,
          })
        }
        return event
      }),
    )
    showSuccess(`Evento atualizado com sucesso!`)
  }

  const deleteEvent = (id) => {
    const eventToDelete = events.find((event) => event.id === id)
    setEvents(events.filter((event) => event.id !== id))
    if (eventToDelete) {
      showSuccess(`Evento "${eventToDelete.title}" removido com sucesso!`)
    }
  }

  const toggleEventStatus = (id) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== id) return event
        const nextStatus = event.status === EVENT_STATUS.DONE ? EVENT_STATUS.PENDING : EVENT_STATUS.DONE
        const updated = {
          ...event,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        }
        showInfo(`Evento "${event.title}" marcado como ${nextStatus.toLowerCase()}.`)
        return updated
      }),
    )
  }

  const getTodayEvents = () => {
    const today = new Date().toISOString().split("T")[0]
    return events
      .filter((event) => event.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const getEventsByDate = (date) => {
    return events.filter((event) => event.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const getEventsByDateRange = (startDate, endDate) => {
    return events
      .filter((event) => {
        return event.date >= startDate && event.date <= endDate
      })
      .sort((a, b) => {
        // Primeiro ordenar por data
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }
        // Se a data for a mesma, ordenar por hora de início
        return a.startTime.localeCompare(b.startTime)
      })
  }

  const getEventsByCategory = (category) => {
    return events.filter((event) => event.category === category).sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Função para importar eventos de CSV
  const importEventsFromCSV = (csvData) => {
    try {
      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        showError("Dados CSV inválidos ou vazios")
        return []
      }

      // Processar os dados CSV e adicionar como eventos
      const newEvents = csvData.map((item) =>
        normalizeEvent({
          id: uuidv4(),
          title: item.titulo || item.title || "",
          date: item.data || item.date || new Date().toISOString().split("T")[0],
          startTime: item.horaInicio || item.startTime || "",
          endTime: item.horaFim || item.endTime || "",
          location: item.local || item.location || "",
          description: item.descricao || item.description || "",
          category: item.categoria || item.category || "Outro",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: EVENT_STATUS.PENDING,
        }),
      )

      // Validar os dados antes de adicionar
      const validEvents = newEvents.filter((event) => event.title && event.date && event.startTime)

      if (validEvents.length === 0) {
        showError("Nenhum evento válido encontrado no arquivo CSV")
        return []
      }

      setEvents((prev) => [...prev, ...validEvents])
      showSuccess(`${validEvents.length} eventos importados com sucesso!`)
      return validEvents
    } catch (error) {
      console.error("Erro ao importar eventos:", error)
      showError(`Erro ao importar eventos: ${error.message}`)
      return []
    }
  }

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
  toggleEventStatus,
        getTodayEvents,
        getEventsByDate,
        getEventsByDateRange,
        getEventsByCategory,
        importEventsFromCSV,
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export default EventsProvider
