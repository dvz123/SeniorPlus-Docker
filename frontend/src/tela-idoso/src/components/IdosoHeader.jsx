import React, { useMemo, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { useTheme } from "../../../contexts/ThemeContext"
import NotificationCenter from "../../../components/NotificationCenter"
import "../styles/Header.css"
import Sidebar from "./SidebarDrawer"
import { useUser } from "../../../tela-cuidador/src/contexts/UserContext"
import { useResidentIdentity } from "../hooks/useResidentIdentity"

export default function IdosoHeader() {
  const { currentUser } = useAuth()
  const userContext = useUser()
  const elderlyData = userContext?.elderlyData
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()

  const { name: displayName, avatarUrl, initials } = useResidentIdentity({
    currentUser,
    fallbackProfile: elderlyData,
  })

  const personaLabel = useMemo(() => {
    if (currentUser?.role === "elderly") return "Perfil do idoso"
    if (currentUser?.role === "caregiver") return "Assistido"
    return "Perfil"
  }, [currentUser?.role])

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
          <span className="idoso-header__eyebrow" aria-hidden="true">{personaLabel}</span>
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
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Foto de ${displayName}`}
                onError={(event) => {
                  event.currentTarget.style.display = "none"
                  const fallback = event.currentTarget.parentElement?.querySelector(
                    ".idoso-header__initials",
                  )
                  if (fallback) fallback.style.display = "flex"
                }}
              />
            ) : null}
            <span
              className="idoso-header__initials"
              style={{ display: avatarUrl ? "none" : "flex" }}
              aria-hidden={Boolean(avatarUrl)}
            >
              {initials || "ID"}
            </span>
          </button>
        </div>
      </header>
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        residentName={displayName}
        residentAvatar={avatarUrl}
        residentInitials={initials}
      />
    </>
  )
}
