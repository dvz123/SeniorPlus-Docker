import ProfileCard from "../components/ProfileCard"
import EventsCard from "../components/EventsCard"
import QuickAccess from "../components/QuickAccess"
import DashboardHighlights from "../components/DashboardHighlights"
import "../styles/Dashboard.css"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"

function Dashboard() {
  const { currentUser } = useAuth()
  const caregiverName = currentUser?.name || currentUser?.nome || "Cuidador"

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  })()

  return (
    <div className="caregiver-dashboard">
      <header className="caregiver-hero" aria-label="Resumo do cuidador">
        <div>
          <p className="hero-eyebrow">{greeting}</p>
          <h1 className="hero-title">{caregiverName}, aqui está o cuidado de hoje</h1>
          <p className="hero-subtitle">Acompanhe o idoso com rapidez e saiba onde agir primeiro.</p>
        </div>
        <div className="hero-badge" aria-hidden="true">
          <span>Modo cuidador</span>
        </div>
      </header>

      <DashboardHighlights />

      <section className="caregiver-grid" aria-label="Informações principais">
        <ProfileCard />
        <EventsCard />
      </section>

      <section className="caregiver-quick" aria-label="Acesso rápido">
        <QuickAccess />
      </section>
    </div>
  )
}

export default Dashboard
