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

    // Carregar mensagens do idoso selecionado quando o modal abrir
    useEffect(() => {
        const loadMessages = async () => {
            if (!isOpen) return
            if (!elderlyData?.id) {
                setMessages([])
                return
            }

            setLoadingMessages(true)
            try {
                const resp = await api.getMensagensDoIdoso(elderlyData.id)
                // Espera-se que resp seja um array de mensagens; se não, tenta adaptar
                const fetched = Array.isArray(resp) ? resp : resp.messages || []

                // Mapeia mensagens do backend para formato padronizado da UI
                const mapped = fetched.map((m) => {
                    const senderRole = (m.remetente === 'caregiver' || m.remetente === 'elderly')
                        ? m.remetente
                        : (currentUser && (m.remetente === currentUser.name || m.remetente === currentUser.email))
                            ? currentUser.role
                            : (isCareGiver() ? 'elderly' : 'caregiver')

                    return {
                        id: m.id || Date.now() + Math.random(),
                        fromId: m.fromId || null,
                        toId: m.toId || null,
                        senderRole: senderRole,
                        message: m.conteudo || m.message || m.text || '',
                        timestamp: m.dataHora || m.timestamp || new Date().toISOString(),
                        read: m.lida || m.read || false,
                    }
                })
                setMessages(mapped)
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
            // Se a mensagem pertence ao idoso atual, adiciona
            if (msg.fromId === elderlyData?.id || msg.toId === elderlyData?.id || msg.toId === currentUser?.id) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev
                    return [...prev, msg]
                })
            }
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
        if (!newMessage.trim()) return
        // Monta payload conforme entidade Mensagem do backend
        const payload = {
            conteudo: newMessage.trim(),
            remetente: currentUser?.name || currentUser?.email || 'Desconhecido',
            destinatario: elderlyData?.name || ('Idoso ' + (elderlyData?.id || '')),
            idoso: { id: elderlyData?.id }
        }

        // Otimista: adiciona à UI imediatamente no formato padronizado
        const optimistic = {
            id: Date.now(),
            fromId: currentUser?.id || null,
            toId: elderlyData?.id || null,
            senderRole: currentUser?.role || (isCareGiver() ? 'caregiver' : 'elderly'),
            message: payload.conteudo,
            timestamp: new Date().toISOString(),
            read: false,
        }
        setMessages((prev) => [...prev, optimistic])
        setNewMessage("")

        // Envia para o backend
        (async () => {
            try {
                const resp = await api.enviarMensagem(payload)
                // Backend retorna objeto Mensagem (com id e dataHora)
                if (resp && resp.id) {
                    const mapped = {
                        id: resp.id,
                        fromId: resp.fromId || null,
                        toId: resp.toId || null,
                        senderRole: (resp.remetente === 'caregiver' || resp.remetente === 'elderly') ? resp.remetente : (currentUser?.role || (isCareGiver() ? 'caregiver' : 'elderly')),
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
