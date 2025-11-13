"use client"

import { useTheme } from "../contexts/ThemeContext"
import NotificationCenter from "./NotificationCenter"
import { useChat } from "../contexts/ChatContext"
import "../styles/CaregiverHeader.css"
import { useAuth } from "../tela-auth/src/contexts/AuthContext"

function CaregiverHeader({ toggleSidebar }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { toggleChat } = useChat()
  const { currentUser } = useAuth()

  const displayName =
    currentUser?.name || currentUser?.nome || currentUser?.fullName || currentUser?.username || "Usuário"

  const getInitials = (name) => {
    if (!name) return "U"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <header className="caregiver-header">
      <div className="logo-container">
        <div className="logo-link" role="img" aria-label="Senior+">
          <svg
            className="logo-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <h1 className="logo">Senior+</h1>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="chat-toggle"
          onClick={() => toggleChat()}
          title="Abrir chat"
          aria-label="Abrir chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3h18v14H7l-4 4V3z" />
            <path d="M8 8h8" />
            <path d="M8 12h5" />
          </svg>
          <span>Chat</span>
        </button>
        <button
          className="theme-toggle"
          onClick={toggleDarkMode}
          title={darkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
          {darkMode ? (
            <svg
              className="theme-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2" />
              <path d="M12 21v2" />
              <path d="M4.22 4.22l1.42 1.42" />
              <path d="M18.36 18.36l1.42 1.42" />
              <path d="M1 12h2" />
              <path d="M21 12h2" />
              <path d="M4.22 19.78l1.42-1.42" />
              <path d="M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg
              className="theme-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>

        <NotificationCenter />

        <div className="avatar" onClick={toggleSidebar} title={displayName}>
          <img src="/placeholder.svg?height=40&width=40" alt="Foto do cuidador" />
          <div className="avatar-fallback">{getInitials(displayName)}</div>
        </div>
      </div>
    </header>
  )
}

export default CaregiverHeader
