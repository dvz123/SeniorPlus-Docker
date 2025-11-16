"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "../tela-cuidador/src/contexts/UserContext"
import { useAuth } from "../tela-auth/src/contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext" 
import { useChat } from "../contexts/ChatContext"
import { api } from "../tela-auth/src/services/api"
import "../styles/ChatModal.css"

function ChatModal() {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [isTyping] = useState(false)
    const messagesEndRef = useRef(null)
    const { elderlyData, isCareGiver } = useUser()
    const { currentUser } = useAuth()
    const { darkMode } = useTheme() 
    const { isOpen, closeChat } = useChat()

    const [loadingMessages, setLoadingMessages] = useState(false)

    const normalizeActor = (value) => (value || "").toString().trim().toLowerCase()
    const normalizeIdentifier = (value) => (value || "").toString().replace(/\D/g, "")

    const isCurrentUser = (value) => {
        if (!value) return false
        const normalized = normalizeActor(value)
        return [currentUser?.name, currentUser?.email, currentUser?.username]
            .filter(Boolean)
            .some((candidate) => normalizeActor(candidate) === normalized)
    }

    const isCurrentElderly = (value) => {
        if (!value) return false
        const normalized = normalizeActor(value)
        return [elderlyData?.name, elderlyData?.email, elderlyData?.displayName]
            .filter(Boolean)
            .some((candidate) => normalizeActor(candidate) === normalized)
    }

    const resolveSenderRole = (rawSender, rawRecipient) => {
        const normalizedSender = normalizeActor(rawSender)
        const normalizedRecipient = normalizeActor(rawRecipient)

        if (["caregiver", "cuidador", "cuidadora"].includes(normalizedSender)) {
            return "caregiver"
        }
        if (["elderly", "idoso", "idosa"].includes(normalizedSender)) {
            return "elderly"
        }
        if (isCurrentUser(rawSender)) {
            return currentUser?.role || (isCareGiver() ? "caregiver" : "elderly")
        }
        if (isCurrentElderly(rawSender)) {
            return "elderly"
        }
        if (isCurrentUser(rawRecipient)) {
            return isCareGiver() ? "elderly" : "caregiver"
        }
        if (isCurrentElderly(rawRecipient)) {
            return "caregiver"
        }
        return isCareGiver() ? "elderly" : "caregiver"
    }

    // Carregar mensagens do idoso selecionado quando o modal abrir
    useEffect(() => {
        const loadMessages = async () => {
            if (!isOpen) return
            const activeIdentifier = {
                cpf: elderlyData?.cpf || null,
                id: elderlyData?.id || null,
            }

            if (!activeIdentifier.cpf && !activeIdentifier.id) {
                setMessages([])
                return
            }

            const activeCpf = normalizeIdentifier(activeIdentifier.cpf)
            const activeId = activeIdentifier.id ? String(activeIdentifier.id) : null

            setLoadingMessages(true)
            try {
                const resp = await api.getMensagensDoIdoso(activeIdentifier)
                // Espera-se que resp seja um array de mensagens; se não, tenta adaptar
                const fetched = Array.isArray(resp) ? resp : resp.messages || []

                const mapped = fetched
                    .map((m) => {
                        const associatedCpfRaw = m.idosoCpf || m.idoso_id || (m.idoso && (m.idoso.cpf || m.idoso.id))
                        const associatedCpf = normalizeIdentifier(associatedCpfRaw)
                        const fromCpfRaw = m.remetenteCpf || m.fromCpf || null
                        const toCpfRaw = m.destinatarioCpf || m.toCpf || null
                        const fromCpf = normalizeIdentifier(fromCpfRaw) || fromCpfRaw
                        const toCpf = normalizeIdentifier(toCpfRaw) || toCpfRaw
                        const messageIdosoCpf = associatedCpf || associatedCpfRaw || null
                        const senderRole = resolveSenderRole(m.remetente, m.destinatario)
                        const timestamp = m.dataHora || m.timestamp || new Date().toISOString()
                        return {
                            id: m.id ?? `srv_${Date.now()}_${Math.random()}`,
                            fromId: m.fromId || null,
                            toId: m.toId || null,
                            fromCpf,
                            toCpf,
                            idosoCpf: messageIdosoCpf,
                            senderRole,
                            message: m.conteudo || m.message || m.text || '',
                            timestamp,
                            read: m.lida || m.read || false,
                            __normalizedCpf: associatedCpf,
                            __fromCpfNormalized: normalizeIdentifier(fromCpfRaw),
                            __toCpfNormalized: normalizeIdentifier(toCpfRaw),
                        }
                    })
                    .filter((msg) => {
                        if (!activeCpf && !activeId) return true
                        const candidateCpfs = [msg.__normalizedCpf, msg.__fromCpfNormalized, msg.__toCpfNormalized]
                            .filter(Boolean)
                        if (activeCpf && candidateCpfs.includes(activeCpf)) {
                            return true
                        }
                        if (activeId && (String(msg.toId) === activeId || String(msg.fromId) === activeId)) {
                            return true
                        }
                        return !activeCpf && candidateCpfs.length === 0
                    })

                setMessages((prev) => {
                    const byId = new Map()
                    mapped.forEach((msg) => {
                        byId.set(String(msg.id), msg)
                    })

                    prev.forEach((existing) => {
                        const key = String(existing.id ?? '')
                        if (byId.has(key)) {
                            return
                        }
                        if (key.startsWith('tmp_')) {
                            byId.set(key, existing)
                        }
                    })

                    const merged = Array.from(byId.values()).sort(
                        (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
                    )
                    return merged.map(({ __normalizedCpf, __fromCpfNormalized, __toCpfNormalized, ...rest }) => rest)
                })
            } catch (error) {
                console.error('Erro ao carregar mensagens:', error)
                setMessages([])
            } finally {
                setLoadingMessages(false)
            }
        }

        loadMessages()
        // Polling para atualizar mensagens enquanto o modal estiver aberto
        let interval = null
        if (isOpen) {
            interval = setInterval(() => {
                loadMessages()
            }, 10000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isOpen, elderlyData, currentUser, isCareGiver])

    // Listener para mensagens vindas de outros componentes (ex: tela-idoso)
    useEffect(() => {
        function onRemoteMessage(e) {
            const msg = e.detail
            if (!msg || !msg.id) return

            const activeCpf = normalizeIdentifier(elderlyData?.cpf)
            const activeId = elderlyData?.id ? String(elderlyData.id) : null
            const caregiverCpf = normalizeIdentifier(currentUser?.cpf)
            const caregiverId = currentUser?.id ? String(currentUser.id) : null

            const belongsToActiveChat = () => {
                const msgCpfCandidates = [msg.idosoCpf, msg.toCpf, msg.fromCpf].map(normalizeIdentifier).filter(Boolean)
                const msgIdCandidates = [msg.toId, msg.fromId].filter(Boolean).map((value) => String(value))

                if (activeCpf && msgCpfCandidates.length > 0) {
                    if (msgCpfCandidates.includes(activeCpf)) return true
                    return false
                }

                if (activeId && msgIdCandidates.length > 0) {
                    if (msgIdCandidates.includes(activeId)) return true
                    return false
                }

                return !activeCpf && !activeId
            }

            const addressesCurrentCaregiver = () => {
                if (!caregiverCpf && !caregiverId) return true
                const candidateCpfs = [msg.toCpf, msg.fromCpf].map(normalizeIdentifier).filter(Boolean)
                if (caregiverCpf && candidateCpfs.length && !candidateCpfs.includes(caregiverCpf)) return false
                if (caregiverId && msg.toId && msg.fromId) {
                    const idMatch = String(msg.toId) === caregiverId || String(msg.fromId) === caregiverId
                    if (!idMatch) return false
                }
                return true
            }

            if (!belongsToActiveChat() || !addressesCurrentCaregiver()) {
                return
            }

            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev
                const next = [...prev, msg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                return next
            })
        }

        window.addEventListener('message:received', onRemoteMessage)
        return () => window.removeEventListener('message:received', onRemoteMessage)
    }, [elderlyData, currentUser])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const handleSendMessage = (e) => {
        e.preventDefault()
        const targetIdentifier = {
            cpf: elderlyData?.cpf || null,
            id: elderlyData?.id || null,
        }
        if (!newMessage.trim() || (!targetIdentifier.cpf && !targetIdentifier.id)) return

        const caregiverCpf = normalizeIdentifier(currentUser?.cpf)
        const fallbackCaregiverId = currentUser?.id ? String(currentUser.id) : null
        const activeCpf = normalizeIdentifier(targetIdentifier.cpf)
        const activeId = targetIdentifier.id ? String(targetIdentifier.id) : null
        // Monta payload conforme entidade Mensagem do backend
        const payload = {
            conteudo: newMessage.trim(),
            remetente: currentUser?.name || currentUser?.email || 'Desconhecido',
            destinatario: elderlyData?.name || ('Idoso ' + (elderlyData?.id || '')),
        }
        if (elderlyData?.id) {
            payload.idoso = { id: elderlyData.id }
        }

        // Otimista: adiciona à UI imediatamente no formato padronizado
        const optimistic = {
            id: `tmp_${Date.now()}`,
            fromId: currentUser?.id || null,
            toId: elderlyData?.id || null,
            fromCpf: caregiverCpf || fallbackCaregiverId,
            toCpf: activeCpf || activeId,
            idosoCpf: activeCpf || activeId,
            senderRole: resolveSenderRole(payload.remetente, payload.destinatario),
            message: payload.conteudo,
            timestamp: new Date().toISOString(),
            read: false,
        }
        setMessages((prev) => [...prev, optimistic])
        setNewMessage("")

        // Envia para o backend
        (async () => {
            try {
            const resp = await api.enviarMensagem(targetIdentifier, payload)
                // Backend retorna objeto Mensagem (com id e dataHora)
                if (resp && resp.id) {
                    const mapped = {
                        id: resp.id ?? optimistic.id,
                        fromId: resp.fromId || null,
                        toId: resp.toId || null,
                        fromCpf: resp.fromCpf || caregiverCpf || fallbackCaregiverId,
                        toCpf: resp.toCpf || activeCpf || activeId,
                        idosoCpf: resp.idosoCpf || activeCpf || activeId,
                        senderRole: resolveSenderRole(resp.remetente, resp.destinatario),
                        message: resp.conteudo || payload.conteudo,
                        timestamp: resp.dataHora || new Date().toISOString(),
                        read: resp.lida || false,
                    }
                    setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? mapped : m)))
                    // Notifica outras abas/componentes que uma nova mensagem foi recebida/enviada
                    try {
                        window.dispatchEvent(new CustomEvent('message:received', { detail: mapped }))
                    } catch (e) {
                        // noop
                    }
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error)
                // opcional: marcar como falha ou mostrar toast
            }
        })()
    }

    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatDate = (timestamp) => {
        const date = new Date(timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return "Hoje"
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Ontem"
        } else {
            return date.toLocaleDateString("pt-BR")
        }
    }

    const groupMessagesByDate = (messages) => {
        const groups = {}
        messages.forEach((message) => {
            const date = formatDate(message.timestamp)
            if (!groups[date]) {
                groups[date] = []
            }
            groups[date].push(message)
        })
        return groups
    }

    if (!isOpen) return null

    const messageGroups = groupMessagesByDate(messages)
    const recipientName = elderlyData?.name || "Idoso"

    return (
        <div
            className="chat-modal-overlay"
            data-theme={darkMode ? "dark" : "light"}
            onClick={closeChat}
        >
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-avatar">
                            <div className="avatar-circle">{recipientName.charAt(0).toUpperCase()}</div>
                            <div className="online-indicator"></div>
                        </div>
                        <div className="chat-user-info">
                            <h3>{recipientName}</h3>
                            <span className="chat-status">Online</span>
                        </div>
                    </div>
                    <button className="chat-close-button" onClick={closeChat}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                {/* Mensagens */}
                <div className="chat-messages">
                    {loadingMessages && (
                        <div className="chat-loading">Carregando mensagens...</div>
                    )}
                    {Object.entries(messageGroups).map(([date, dayMessages]) => (
                        <div key={date}>
                            <div className="chat-date-separator"><span>{date}</span></div>
                            {dayMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`chat-message ${
                                        message.senderRole === (isCareGiver() ? "caregiver" : "elderly") ? "sent" : "received"
                                    }`}
                                >
                                    <div className="message-bubble">
                                        <p>{message.message}</p>
                                        <div className="message-info">
                                            <span className="message-time">{formatTime(message.timestamp)}</span>
                                            {message.senderRole === (isCareGiver() ? "caregiver" : "elderly") && (
                                                <div className="message-status">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                        className={message.read ? "read" : ""}
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="chat-message received">
                            <div className="message-bubble typing">
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <div className="chat-input-container">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={elderlyData ? "Digite sua mensagem..." : "Selecione um idoso para iniciar o chat"}
                            className="chat-input"
                            maxLength={500}
                            disabled={!elderlyData}
                        />
                        <button
                            type="submit"
                            className="chat-send-button"
                            disabled={!newMessage.trim() || !elderlyData}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m22 2-7 20-4-9-9-4Z" />
                                <path d="M22 2 11 13" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ChatModal
