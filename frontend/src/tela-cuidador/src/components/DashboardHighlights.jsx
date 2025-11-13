import { useMemo } from "react"
import { CalendarCheck, Clock, BellRing } from "lucide-react"
import { useMedication } from "../contexts/MedicationContext"
import { useEvents } from "../contexts/EventsContext"
import { useNotification } from "../../../contexts/NotificationContext"
import "../styles/DashboardHighlights.css"

const DashboardHighlights = () => {
  const { getTodayMedications } = useMedication()
  const { getTodayEvents } = useEvents()
  const { unreadCount } = useNotification() || { unreadCount: 0 }

  const medsSummary = useMemo(() => {
    try {
      const medications = getTodayMedications?.() || []
      const totalDoses = medications.reduce((count, med) => {
        const times = Array.isArray(med.times)
          ? med.times
          : String(med.time || "")
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)
        return count + times.length
      }, 0)

      const pending = medications.filter((med) => med.status !== "completed").length
      return { totalDoses, pending }
    } catch (error) {
      console.warn("Falha ao calcular resumo de medicamentos", error)
      return { totalDoses: 0, pending: 0 }
    }
  }, [getTodayMedications])

  const eventsSummary = useMemo(() => {
    try {
      const events = getTodayEvents?.() || []
      const pending = events.filter((event) => event.status !== "Concluído").length
      return { count: events.length, pending }
    } catch (error) {
      console.warn("Falha ao calcular resumo de eventos", error)
      return { count: 0, pending: 0 }
    }
  }, [getTodayEvents])

  return (
    <section className="caregiver-highlights" aria-label="Indicadores principais">
      <article className="highlight-card">
        <span className="highlight-icon highlight-icon-green" aria-hidden="true">
          <Clock size={26} strokeWidth={1.8} />
        </span>
        <div className="highlight-text">
          <p className="highlight-label">Doses previstas hoje</p>
          <strong className="highlight-value">{medsSummary.totalDoses}</strong>
          <small>{medsSummary.pending} pendentes para registrar</small>
        </div>
      </article>

      <article className="highlight-card">
        <span className="highlight-icon highlight-icon-blue" aria-hidden="true">
          <CalendarCheck size={26} strokeWidth={1.8} />
        </span>
        <div className="highlight-text">
          <p className="highlight-label">Eventos do dia</p>
          <strong className="highlight-value">{eventsSummary.count}</strong>
          <small>{eventsSummary.pending} aguardando confirmação</small>
        </div>
      </article>

      <article className="highlight-card">
        <span className="highlight-icon highlight-icon-amber" aria-hidden="true">
          <BellRing size={26} strokeWidth={1.8} />
        </span>
        <div className="highlight-text">
          <p className="highlight-label">Notificações</p>
          <strong className="highlight-value">{unreadCount || 0}</strong>
          <small>mensagens não lidas</small>
        </div>
      </article>
    </section>
  )
}

export default DashboardHighlights
