"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useUser } from "../tela-cuidador/src/contexts/UserContext"
import { useAuth } from "../tela-auth/src/contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext" 
import { useChat } from "../contexts/ChatContext"
import { api } from "../tela-auth/src/services/api"
import {
    normalizeIdentifierDigits,
    collectStoredResidentEntries,
    collectIdentitySources,
    resolveResidentCpf,
    resolveResidentId,
    mergeIdentityRecords,
} from "../utils/chatIdentity"
import "../styles/ChatModal.css"

const CHAT_TIMEZONE = "America/Sao_Paulo"
const ONE_DAY_MS = 24 * 60 * 60 * 1000

function ChatModal() {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [isTyping] = useState(false)
    const messagesEndRef = useRef(null)
    const isFetchingMessagesRef = useRef(false)
    const { elderlyData, isCareGiver } = useUser()
    const { currentUser } = useAuth()
    const { darkMode } = useTheme() 
    const { isOpen, closeChat } = useChat()

    const [loadingMessages, setLoadingMessages] = useState(false)
    const [residentRecords, setResidentRecords] = useState(() => collectStoredResidentEntries())
    const [selectedResidentKey, setSelectedResidentKey] = useState(() => {
        if (typeof window === "undefined") return ""
        return window.localStorage?.getItem?.("caregiverChatResidentKey") || ""
    })

    const timeFormatter = useMemo(
        () => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: CHAT_TIMEZONE }),
        [],
    )
    const readableDateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                timeZone: CHAT_TIMEZONE,
            }),
        [],
    )
    const dateKeyFormatter = useMemo(
        () => new Intl.DateTimeFormat("en-CA", { timeZone: CHAT_TIMEZONE }),
        [],
    )

    const normalizeActor = (value) => (value || "").toString().trim().toLowerCase()
    const normalizeIdentifier = (value) => normalizeIdentifierDigits(value)

    const sanitizeMessage = useCallback((rawValue) => {
        if (!rawValue) return ""
        return rawValue
            .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
            .replace(/\s+/g, " ")
            .trim()
    }, [])

    const pickResidentName = (source) => {
        if (!source || typeof source !== "object") return null
        const keys = ["nome", "name", "displayName", "apelido", "firstName", "fullName"]
        for (const key of keys) {
            const value = source[key]
            if (typeof value === "string" && value.trim()) {
                return value.trim()
            }
        }
        return null
    }

    const formatCpf = (value) => {
        const digits = normalizeIdentifier(value)
        if (!digits) return null
        if (digits.length === 11) {
            return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
        }
        return digits
    }

    const buildOptionLabel = (option) => {
        if (!option) return ""
        if (!option.cpf) return option.name
        const formatted = formatCpf(option.cpf)
        if (!formatted || formatted === option.name) return option.name
        return `${option.name} (${formatted})`
    }

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

    useEffect(() => {
        const refreshFromStorage = () => {
            const entries = collectStoredResidentEntries()
            setResidentRecords((prev) => mergeIdentityRecords(prev, entries))
        }

        refreshFromStorage()

        if (typeof window !== "undefined") {
            window.addEventListener("storage", refreshFromStorage)
            window.addEventListener("residentProfileUpdated", refreshFromStorage)
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("storage", refreshFromStorage)
                window.removeEventListener("residentProfileUpdated", refreshFromStorage)
            }
        }
    }, [])

    useEffect(() => {
        if (!elderlyData) return
        setResidentRecords((prev) => mergeIdentityRecords(prev, [elderlyData]))
    }, [elderlyData])

    const identitySources = useMemo(() => {
        const base = [
            elderlyData,
            currentUser?.assistedPerson,
            currentUser?.elderlyProfile,
            ...(residentRecords || []),
        ]
        return collectIdentitySources(base)
    }, [elderlyData, currentUser, residentRecords])

    const activeCpf = useMemo(() => resolveResidentCpf(identitySources), [identitySources])
    const activeId = useMemo(() => resolveResidentId(identitySources), [identitySources])

    const fallbackCpf = useMemo(() => {
        const candidate =
            elderlyData?.cpf ||
            elderlyData?.documento ||
            elderlyData?.document ||
            elderlyData?.documentNumber ||
            elderlyData?.cpfSelecionado ||
            elderlyData?.cpfPaciente ||
            elderlyData?.cpfIdoso ||
            elderlyData?.cpf_responsavel
        const digits = normalizeIdentifier(candidate)
        return digits || null
    }, [elderlyData])

    const fallbackId = useMemo(() => {
        const candidate =
            elderlyData?.id ||
            elderlyData?.idosoId ||
            elderlyData?.identifier ||
            elderlyData?.codigo ||
            elderlyData?.pessoaId
        if (candidate === undefined || candidate === null || candidate === "") {
            return null
        }
        return String(candidate)
    }, [elderlyData])

    const caregiverCpf = useMemo(() => normalizeIdentifier(currentUser?.cpf), [currentUser?.cpf])
    const caregiverId = useMemo(
        () => (currentUser?.id !== undefined && currentUser?.id !== null ? String(currentUser.id) : null),
        [currentUser?.id],
    )

    const residentOptions = useMemo(() => {
        const options = []
        const seenKeys = new Set()
        identitySources.forEach((source, index) => {
            if (!source || typeof source !== "object") return
            const cpf = normalizeIdentifier(source.cpf || source.idosoCpf || source.documento)
            const possibleId =
                source.id ||
                source.idosoId ||
                source.idoso_id ||
                (source.idoso && (source.idoso.id || source.idoso.cpf)) ||
                source.identifier
            const id = possibleId !== undefined && possibleId !== null && possibleId !== "" ? String(possibleId) : null
            const key = cpf ? `cpf:${cpf}` : id ? `id:${id}` : `idx:${index}`
            if (seenKeys.has(key)) return
            const name = pickResidentName(source) || (cpf ? formatCpf(cpf) : `Idoso ${options.length + 1}`)
            options.push({ key, name, cpf: cpf || null, id, source })
            seenKeys.add(key)
        })
        return options
    }, [identitySources])

    useEffect(() => {
        if (!residentOptions.length) return
        if (selectedResidentKey && residentOptions.some((opt) => opt.key === selectedResidentKey)) return
        setSelectedResidentKey(residentOptions[0]?.key || "")
    }, [residentOptions, selectedResidentKey])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (selectedResidentKey) {
            window.localStorage.setItem("caregiverChatResidentKey", selectedResidentKey)
        } else {
            window.localStorage.removeItem("caregiverChatResidentKey")
        }
    }, [selectedResidentKey])

    const selectedResident = useMemo(
        () => residentOptions.find((opt) => opt.key === selectedResidentKey) || null,
        [residentOptions, selectedResidentKey],
    )

    const resolvedCpf = selectedResident?.cpf || activeCpf || fallbackCpf || null
    const resolvedId = selectedResident?.id || activeId || fallbackId || null

    const activeIdentifier = useMemo(
        () => ({ cpf: resolvedCpf, id: resolvedId }),
        [resolvedCpf, resolvedId],
    )

    const hasActiveTarget = Boolean(resolvedCpf || resolvedId)

    useEffect(() => {
        if (!isOpen) return
        if (residentOptions.length > 0) return
        let cancelled = false
        const fetchDefaultResident = async () => {
            try {
                const response = await api.get("/api/v1/idoso/informacoesIdoso")
                if (!response || cancelled) return
                setResidentRecords((prev) => mergeIdentityRecords(prev, [response]))
                if (typeof window !== "undefined") {
                    try {
                        window.localStorage.setItem("residentProfile", JSON.stringify(response))
                        window.dispatchEvent(new Event("residentProfileUpdated"))
                    } catch (storageError) {
                        console.warn("Não foi possível armazenar o residente padrão", storageError)
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar idoso vinculado para o chat:", error)
            }
        }
        fetchDefaultResident()
        return () => {
            cancelled = true
        }
    }, [isOpen, residentOptions.length])

    const handleResidentSelection = useCallback((event) => {
        setSelectedResidentKey(event.target.value)
    }, [])

    const resolveSenderRole = useCallback(
        (rawSender, rawRecipient) => {
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
        },
        [currentUser, isCareGiver, isCurrentElderly, isCurrentUser],
    )

    const residentName = useMemo(() => {
        if (selectedResident?.name) return selectedResident.name
        const prioritizedSources = []
        identitySources.forEach((source) => {
            if (!source || typeof source !== "object") return
            const sourceCpf = normalizeIdentifier(source.cpf || source.idosoCpf || source.documento)
            const possibleId =
                source.id ||
                source.idosoId ||
                source.idoso_id ||
                (source.idoso && (source.idoso.id || source.idoso.cpf)) ||
                source.identifier
            const normalizedId =
                possibleId !== undefined && possibleId !== null ? String(possibleId) : null
            if (resolvedCpf && sourceCpf && sourceCpf === resolvedCpf) {
                prioritizedSources.push(source)
                return
            }
            if (resolvedId && normalizedId && normalizedId === String(resolvedId)) {
                prioritizedSources.push(source)
            }
        })

        const orderedCandidates = [
            ...prioritizedSources,
            elderlyData,
            ...(residentRecords || []),
        ]

        for (const candidate of orderedCandidates) {
            const name = pickResidentName(candidate)
            if (name) return name
        }
        return "Idoso"
    }, [selectedResident, resolvedCpf, resolvedId, elderlyData, identitySources, residentRecords])

    const fetchMessages = useCallback(
        async ({ silent = false } = {}) => {
            if (!isOpen) return
            if (!hasActiveTarget) {
                setMessages([])
                setLoadingMessages(false)
                return
            }

            if (isFetchingMessagesRef.current) {
                return
            }
            isFetchingMessagesRef.current = true
            if (!silent) {
                setLoadingMessages(true)
            }

            const activeCpfDigits = resolvedCpf || null
            const activeIdValue = resolvedId ? String(resolvedId) : null

            try {
                const resp = await api.getMensagensDoIdoso(activeIdentifier)
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
                        if (!activeCpfDigits && !activeIdValue) return true
                        const candidateCpfs = [msg.__normalizedCpf, msg.__fromCpfNormalized, msg.__toCpfNormalized]
                            .filter(Boolean)
                        if (activeCpfDigits && candidateCpfs.includes(activeCpfDigits)) {
                            return true
                        }
                        if (activeIdValue && (String(msg.toId) === activeIdValue || String(msg.fromId) === activeIdValue)) {
                            return true
                        }
                        return !activeCpfDigits && candidateCpfs.length === 0
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
                if (!silent) {
                    setMessages([])
                }
            } finally {
                if (!silent) {
                    setLoadingMessages(false)
                }
                isFetchingMessagesRef.current = false
            }
        },
        [isOpen, hasActiveTarget, resolvedCpf, resolvedId, activeIdentifier, resolveSenderRole],
    )

    useEffect(() => {
        if (!isOpen) {
            return undefined
        }

        fetchMessages()
        const interval = setInterval(() => {
            fetchMessages({ silent: true })
        }, 5000)

        return () => {
            clearInterval(interval)
        }
    }, [fetchMessages, isOpen])

    // Listener para mensagens vindas de outros componentes (ex: tela-idoso)
    useEffect(() => {
        function onRemoteMessage(e) {
            const msg = e.detail
            if (!msg || !msg.id) return

            const belongsToActiveChat = () => {
                const msgCpfCandidates = [msg.idosoCpf, msg.toCpf, msg.fromCpf].map(normalizeIdentifier).filter(Boolean)
                const msgIdCandidates = [msg.toId, msg.fromId].filter(Boolean).map((value) => String(value))

                if (resolvedCpf && msgCpfCandidates.length > 0) {
                    if (msgCpfCandidates.includes(resolvedCpf)) return true
                    return false
                }

                if (resolvedId && msgIdCandidates.length > 0) {
                    if (msgIdCandidates.includes(resolvedId)) return true
                    return false
                }

                return !resolvedCpf && !resolvedId
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
    }, [resolvedCpf, resolvedId, caregiverCpf, caregiverId, elderlyData, currentUser])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const handleSendMessage = (e) => {
        e.preventDefault()
        const targetIdentifier = activeIdentifier
        const sanitizedContent = sanitizeMessage(newMessage)
        if (!sanitizedContent || !hasActiveTarget) {
            return
        }

        const caregiverCpfDigits = caregiverCpf
        const fallbackCaregiverId = caregiverId
        const activeCpfDigits = resolvedCpf || null
        const activeIdValue = resolvedId ? String(resolvedId) : null
        // Monta payload conforme entidade Mensagem do backend
        const payload = {
            conteudo: sanitizedContent,
            message: sanitizedContent,
            texto: sanitizedContent,
            remetente: currentUser?.name || currentUser?.email || 'Desconhecido',
            destinatario: residentName,
        }
        if (elderlyData?.id) {
            payload.idoso = { id: elderlyData.id }
        }
        if (!payload.idoso && activeIdValue) {
            payload.idoso = { id: activeIdValue }
        }
        if (activeCpfDigits) {
            payload.idosoCpf = activeCpfDigits
        }

        // Otimista: adiciona à UI imediatamente no formato padronizado
        const optimistic = {
            id: `tmp_${Date.now()}`,
            fromId: currentUser?.id || null,
            toId: elderlyData?.id || activeIdValue,
            fromCpf: caregiverCpfDigits || fallbackCaregiverId,
            toCpf: activeCpfDigits || activeIdValue,
            idosoCpf: activeCpfDigits || activeIdValue,
            senderRole: resolveSenderRole(payload.remetente, payload.destinatario),
            message: sanitizedContent,
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
                        fromCpf: resp.fromCpf || caregiverCpfDigits || fallbackCaregiverId,
                        toCpf: resp.toCpf || activeCpfDigits || activeIdValue,
                        idosoCpf: resp.idosoCpf || activeCpfDigits || activeIdValue,
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
                    await fetchMessages({ silent: true })
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error)
                // opcional: marcar como falha ou mostrar toast
            }
        })()
    }

    const formatTime = useCallback(
        (timestamp) => {
            const date = new Date(timestamp)
            if (Number.isNaN(date.getTime())) return ""
            return timeFormatter.format(date)
        },
        [timeFormatter],
    )

    const formatDate = useCallback(
        (timestamp) => {
            const date = new Date(timestamp)
            if (Number.isNaN(date.getTime())) return ""
            const messageKey = dateKeyFormatter.format(date)
            const todayKey = dateKeyFormatter.format(new Date())
            const yesterdayKey = dateKeyFormatter.format(new Date(Date.now() - ONE_DAY_MS))

            if (messageKey === todayKey) {
                return "Hoje"
            }
            if (messageKey === yesterdayKey) {
                return "Ontem"
            }

            const formatted = readableDateFormatter.format(date)
            return formatted ? formatted.charAt(0).toUpperCase() + formatted.slice(1) : ""
        },
        [dateKeyFormatter, readableDateFormatter],
    )

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
    const recipientName = residentName

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

                {residentOptions.length > 0 && (
                    <div className="chat-target-bar">
                        <label htmlFor="chat-target-select">Conversar com</label>
                        <select
                            id="chat-target-select"
                            className="chat-target-select"
                            value={selectedResidentKey}
                            onChange={handleResidentSelection}
                            disabled={residentOptions.length <= 1}
                        >
                            {residentOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                    {buildOptionLabel(option)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

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
                            placeholder={hasActiveTarget ? "Digite sua mensagem..." : "Selecione um idoso para iniciar o chat"}
                            className="chat-input"
                            maxLength={500}
                            disabled={!hasActiveTarget}
                        />
                        <button
                            type="submit"
                            className="chat-send-button"
                            disabled={!newMessage.trim() || !hasActiveTarget}
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
