import React, { useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  CalendarDays,
  HeartPulse,
  Bell,
  UsersRound,
  Settings2,
  UserCheck,
  X,
  LogOut,
} from "lucide-react"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { useUser } from "../../../tela-cuidador/src/contexts/UserContext"
import "../styles/Sidebar.css"
import { useResidentIdentity } from "../hooks/useResidentIdentity"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/tela-idoso/dashboard", target: "idoso-root" },
  { id: "agenda", label: "Agenda", icon: CalendarDays, route: "/tela-idoso/dashboard", target: "calendario-section" },
  { id: "saude", label: "Saúde", icon: HeartPulse, route: "/tela-idoso/dashboard", target: "medicamentos-hoje" },
  { id: "notificacoes", label: "Notificações", icon: Bell, route: "/tela-idoso/dashboard", target: "notification-center" },
  { id: "contatos", label: "Contatos", icon: UsersRound, route: "/tela-idoso/dashboard", target: "emergency-contacts" },
  { id: "solicitacoes", label: "Solicitações", icon: UserCheck, route: "/tela-idoso/solicitacoes" },
  { id: "configuracoes", label: "Configurações", icon: Settings2, route: "/tela-idoso/configuracoes" },
]

export default function SidebarDrawer({ isOpen, toggleSidebar, residentName, residentAvatar, residentInitials }) {
  const { logout, currentUser } = useAuth()
  const userContext = useUser()
  const elderlyData = userContext?.elderlyData
  const identity = useResidentIdentity({
    currentUser,
    fallbackProfile: elderlyData,
  })
  const displayName = residentName || identity.name
  const displayAvatar = residentAvatar || identity.avatarUrl
  const displayInitials = residentInitials || identity.initials
  const identityLabel = currentUser?.role === "elderly" ? "Seu perfil" : "Idoso assistido"
  const navigate = useNavigate()

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape" && isOpen) {
        toggleSidebar()
      }
    },
    [isOpen, toggleSidebar],
  )

  const handleNavigate = useMemo(() => {
    return ({ target, route }) => {
      if (route) {
        navigate(route)
        if (target) {
          setTimeout(() => {
            const element = document.getElementById(target)
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          }, 180)
        }
        toggleSidebar()
        return
      }

      if (!target) {
        toggleSidebar()
        return
      }

      const element = document.getElementById(target)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      toggleSidebar()
    }
  }, [navigate, toggleSidebar])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.warn("Erro ao sair", error)
    } finally {
      window.location.assign("/login")
    }
  }

  return (
    <>
      <div
        className={`idoso-sidebar-overlay${isOpen ? " open" : ""}`}
        onClick={toggleSidebar}
        aria-hidden={!isOpen}
        role="presentation"
      />
      <aside
        className={`idoso-sidebar-wrapper${isOpen ? " open" : ""}`}
        role="dialog"
        aria-label="Menu do idoso"
        aria-modal="true"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onKeyDown={handleKeyDown}
      >
        <div className="idoso-sidebar" role="navigation" aria-label="Seções principais">
          <div className="sidebar-header">
            <span>Menu</span>
            <button type="button" className="sidebar-close" onClick={toggleSidebar} aria-label="Fechar menu">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="sidebar-profile" aria-label="Perfil do idoso">
            <div className="sidebar-profile__avatar" aria-hidden={!displayAvatar}>
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={`Foto de ${displayName}`}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                    const fallback = event.currentTarget.parentElement?.querySelector('.sidebar-profile__initials')
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
              ) : null}
              <span
                className="sidebar-profile__initials"
                style={{ display: displayAvatar ? 'none' : 'flex' }}
                aria-hidden={Boolean(displayAvatar)}
              >
                {displayInitials || 'ID'}
              </span>
            </div>
            <div className="sidebar-profile__info">
              <span className="sidebar-profile__eyebrow">{identityLabel}</span>
              <strong>{displayName}</strong>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ id, label, icon: Icon, target, route }) => (
              <button
                key={id}
                type="button"
                className="nav-link"
                onClick={() => handleNavigate({ target, route })}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button type="button" className="logout-button" onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
