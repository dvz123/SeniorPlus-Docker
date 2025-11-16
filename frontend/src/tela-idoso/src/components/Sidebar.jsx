import React from 'react'
import { useAuth } from '../../../tela-auth/src/contexts/AuthContext'
import { useUser } from '../../../tela-cuidador/src/contexts/UserContext'
import { useResidentIdentity } from '../hooks/useResidentIdentity'
import '../styles/Sidebar.css'

export default function Sidebar({ toggleSidebar, isOpen, variant = 'drawer', residentName, residentAvatar, residentInitials }) {
  const { logout, currentUser } = useAuth()
  const userContext = useUser()
  const elderlyData = userContext?.elderlyData
  const identity = useResidentIdentity({ currentUser, fallbackProfile: elderlyData })
  const displayName = residentName || identity.name
  const displayAvatar = residentAvatar || identity.avatarUrl
  const displayInitials = residentInitials || identity.initials
  const isDrawer = variant === 'drawer'
  const identityLabel = currentUser?.role === 'elderly' ? 'Seu perfil' : 'Idoso assistido'

  const handleLogout = async () => {
    try {
      await logout()
      // Redirect to login
      window.location.assign('/login')
    } catch (e) {
      // fallback
      window.location.assign('/login')
    }
    if (isDrawer) {
      toggleSidebar?.()
    }
  }

  const scrollTo = (id) => (e) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (isDrawer) {
      toggleSidebar?.()
    }
  }

  const classes = ['idoso-sidebar', `idoso-sidebar--${variant}`]

  if (isDrawer && toggleSidebar) {
    classes.push('idoso-sidebar--interactive')
  }

  return (
    <aside
      className={classes.join(' ')}
      aria-label="Menu de navegação do idoso"
      aria-hidden={isDrawer ? !isOpen : undefined}
    >
      {isDrawer ? (
        <div className="sidebar-header">
          <span>Menu</span>
          <button type="button" className="sidebar-close" onClick={toggleSidebar} aria-label="Fechar menu">
            ×
          </button>
        </div>
      ) : (
        <div className="sidebar-header">Menu</div>
      )}
      <div className={`sidebar-profile${isDrawer ? ' sidebar-profile--compact' : ''}`} aria-label="Perfil do idoso">
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
        <a href="#idoso-root" className="nav-link" onClick={scrollTo('idoso-root')}>
          Início
        </a>
        <a href="#calendario" className="nav-link" onClick={scrollTo('calendario-section')}>
          Calendário
        </a>
        <a href="#eventos" className="nav-link" onClick={scrollTo('eventos-do-dia')}>
          Eventos do dia
        </a>
        <a href="#medicamentos" className="nav-link" onClick={scrollTo('medicamentos-hoje')}>
          Medicamentos
        </a>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>Sair</button>
      </div>
    </aside>
  )
}
