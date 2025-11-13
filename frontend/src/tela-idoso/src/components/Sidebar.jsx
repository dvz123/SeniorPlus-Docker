import React from 'react'
import { useAuth } from '../../../tela-auth/src/contexts/AuthContext'
import '../styles/Sidebar.css'

export default function Sidebar({ toggleSidebar, isOpen, variant = 'drawer' }) {
  const { logout } = useAuth()
  const isDrawer = variant === 'drawer'

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
