import React, { useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { useTheme } from "../../../contexts/ThemeContext"
import NotificationCenter from "../../../components/NotificationCenter"
import "../styles/Header.css"
import Sidebar from "./SidebarDrawer"

export default function IdosoHeader() {
  const { currentUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()

  const displayName =
    currentUser?.name || currentUser?.nome || currentUser?.fullName || currentUser?.username || "Olá!"

  const getInitials = (name) => {
    if (!name) return ""
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <>
      <header className="idoso-header" role="banner">
        <div className="idoso-header__left">
          <button
            type="button"
            className="idoso-header__theme"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {darkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
        </div>

        <div className="idoso-header__brand" aria-live="polite">
          <span className="idoso-header__logo">Senior+</span>
          <span className="idoso-header__welcome">{displayName}</span>
        </div>

        <div className="idoso-header__actions">
          <div id="notification-center" className="idoso-header__notifications" aria-live="polite">
            <NotificationCenter />
          </div>
          <button
            type="button"
            className="idoso-header__avatar"
            aria-label="Abrir menu do perfil"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span className="idoso-header__initials">{getInitials(displayName)}</span>
          </button>
        </div>
      </header>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
    </>
  )
}
