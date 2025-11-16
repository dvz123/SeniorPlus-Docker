"use client"

import { Link, useNavigate } from "react-router-dom"
import "../styles/Sidebar.css"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"
import { useChat } from "../../../contexts/ChatContext"
import { useCaregiverProfile } from "../contexts/CaregiverProfileContext"

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { caregiverProfile } = useCaregiverProfile()
  const { openChat } = useChat()
  const handleOpenChat = () => {
    if (toggleSidebar) {
      toggleSidebar()
      // Delay para garantir que a sidebar conclua a animação antes de abrir o chat
      setTimeout(() => openChat({ source: "sidebar" }), 180)
      return
    }
    openChat({ source: "sidebar" })
  }

  // Obter nome do usuário autenticado. Vários backends usam 'name', 'nome' ou 'fullName'
  const displayName =
    caregiverProfile?.displayName ||
    currentUser?.name ||
    currentUser?.nome ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Usuário"

  const avatarUrl = caregiverProfile?.photoUrl || currentUser?.photoUrl || currentUser?.fotoUrl || null

  const getInitials = (name) => {
    if (!name) return "U"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const resolveRoleLabel = () => {
    switch (currentUser?.role) {
      case "caregiver":
        return "Cuidador"
      case "elderly":
        return "Idoso"
      case "admin":
        return "Administrador"
      default:
        return "Usuário"
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      toggleSidebar?.()
      navigate("/login", { replace: true })
    }
  }

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "active" : ""}`} onClick={toggleSidebar}></div>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-button" onClick={toggleSidebar}>
            <svg
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="sidebar-content">
          <div className="user-info">
            <div className="avatar-large">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${displayName}`}
                  onError={(event) => {
                    event.currentTarget.style.display = "none"
                    const fallback = event.currentTarget.parentElement?.querySelector(".avatar-fallback-large")
                    if (fallback) fallback.style.display = "flex"
                  }}
                />
              ) : null}
              <div
                className="avatar-fallback-large"
                style={{ display: avatarUrl ? "none" : "flex" }}
                aria-hidden={Boolean(avatarUrl)}
              >
                {getInitials(displayName)}
              </div>
            </div>
            <div className="user-details">
              <h3>{displayName}</h3>
              <p>{resolveRoleLabel()}</p>
            </div>
          </div>
          <nav className="sidebar-nav">
            <Link to="/tela-cuidador" className="nav-item" onClick={toggleSidebar}>
              <svg
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
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Início
            </Link>
            <Link to="/atualizar-dados" className="nav-item" onClick={toggleSidebar}>
              <svg
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Atualizar Dados do Idoso
            </Link>
            <Link to="/medicamentos" className="nav-item" onClick={toggleSidebar}>
              <svg
                className="quick-access-icon"
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
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                <path d="m8.5 8.5 7 7" />
              </svg>
              Medicamentos
            </Link>
            <Link to="/registrar-eventos" className="nav-item" onClick={toggleSidebar}>
              <svg
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
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              Registrar Eventos
            </Link>
            <Link to="/calendario" className="nav-item" onClick={toggleSidebar}>
              <svg
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
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
                <line x1="3" x2="21" y1="16" y2="16" />
              </svg>
              Agenda
            </Link>
            <Link to="/relatorios" className="nav-item" onClick={toggleSidebar}>
              <svg
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
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
              Relatórios
            </Link>
            <Link to="/emergencia" className="nav-item emergency-nav-item" onClick={toggleSidebar}>
              <svg
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
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              Emergência
            </Link>
            <div className="nav-item chat-nav-item" onClick={handleOpenChat}>
              <svg
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Chat
            </div>
            <Link to="/configuracoes" className="nav-item" onClick={toggleSidebar}>
              <svg
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
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Configurações
            </Link>
            <button type="button" className="nav-item logout" onClick={handleLogout}>
              <svg
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              Sair
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

export default Sidebar
