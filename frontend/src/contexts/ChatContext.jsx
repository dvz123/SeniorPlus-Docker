"use client"

import { createContext, useCallback, useContext, useState } from "react"

const ChatContext = createContext(undefined)

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [origin, setOrigin] = useState(null)

  const openChat = useCallback((options = {}) => {
    if (options?.source) {
      setOrigin(options.source)
    }
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
    setOrigin(null)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const value = {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    origin,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat deve ser usado dentro de um ChatProvider")
  }
  return context
}
