import React, { useMemo } from "react"
import { Calendar, Pill, ChevronRight } from "lucide-react"
import { useMedication } from "../../../tela-cuidador/src/contexts/MedicationContext"
import { useEvents } from "../../../tela-cuidador/src/contexts/EventsContext"
import "../styles/ResumoDoDia.css"

const formatHour = (timeString) => {
  if (!timeString) return "--:--"
  const [hours, minutes] = String(timeString).split(":")
  return `${hours?.padStart(2, "0") || "--"}:${minutes?.padStart(2, "0") || "--"}`
}

const parseTimeToDate = (time) => {
  if (!time) return null
  const [hours, minutes] = String(time).split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

const ResumoDoDia = ({ onOpenMedications, onOpenEvents }) => {
  const { getTodayMedications } = useMedication()
  const { getTodayEvents } = useEvents()

  const { nextMedication, remainingMedications } = useMemo(() => {
    try {
      const medsToday = (getTodayMedications?.() || []).flatMap((med) => {
        const times = Array.isArray(med.times)
          ? med.times
          : String(med.time || "")
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)

        return times.map((time) => ({
          id: `${med.id}-${time}`,
          name: med.name || med.nome,
          dosage: med.dosage || med.dosagem,
          time,
        }))
      })

      const now = new Date()
      const upcoming = medsToday
        .map((item) => ({ ...item, date: parseTimeToDate(item.time) }))
        .filter((item) => item.date)
        .sort((a, b) => a.date - b.date)

      const next = upcoming.find((item) => item.date >= now) || upcoming[0]
      const remaining = Math.max(medsToday.length - (next ? 1 : 0), 0)

      return { nextMedication: next, remainingMedications: remaining }
    } catch (error) {
      console.warn("Falha ao gerar resumo de medicamentos", error)
      return { nextMedication: null, remainingMedications: 0 }
    }
  }, [getTodayMedications])

  const { nextEvent, remainingEvents } = useMemo(() => {
    try {
      const eventsToday = getTodayEvents?.() || []
      const now = new Date()
      const upcoming = eventsToday
        .map((event) => ({ ...event, date: parseTimeToDate(event.startTime) }))
        .filter((event) => event.date)
        .sort((a, b) => a.date - b.date)

      const next = upcoming.find((event) => event.date >= now) || upcoming[0]
      const remaining = Math.max(eventsToday.length - (next ? 1 : 0), 0)

      return { nextEvent: next, remainingEvents: remaining }
    } catch (error) {
      console.warn("Falha ao gerar resumo de eventos", error)
      return { nextEvent: null, remainingEvents: 0 }
    }
  }, [getTodayEvents])

  return (
    <section className="idoso-resumo" aria-label="Resumo rápido do dia">
      <article className="resumo-card">
        <div className="resumo-icon resumo-icon-med">
          <Pill size={28} strokeWidth={1.6} />
        </div>
        <div className="resumo-content">
          <h3>Próximo medicamento</h3>
          {nextMedication ? (
            <>
              <p className="resumo-strong">{nextMedication.name}</p>
              <p className="resumo-sub">{formatHour(nextMedication.time)} • {nextMedication.dosage}</p>
              {remainingMedications > 0 && (
                <span className="resumo-extra">+ {remainingMedications} horários restantes hoje</span>
              )}
            </>
          ) : (
            <p className="resumo-empty">Nenhum medicamento para hoje.</p>
          )}
        </div>
        <button className="resumo-cta" onClick={onOpenMedications} type="button">
          Ver detalhes
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </article>

      <article className="resumo-card">
        <div className="resumo-icon resumo-icon-event">
          <Calendar size={28} strokeWidth={1.6} />
        </div>
        <div className="resumo-content">
          <h3>Próximo compromisso</h3>
          {nextEvent ? (
            <>
              <p className="resumo-strong">{nextEvent.title}</p>
              <p className="resumo-sub">{formatHour(nextEvent.startTime)} • {nextEvent.location || "Local a combinar"}</p>
              {remainingEvents > 0 && <span className="resumo-extra">+ {remainingEvents} outros compromissos hoje</span>}
            </>
          ) : (
            <p className="resumo-empty">Nenhum compromisso agendado.</p>
          )}
        </div>
        <button className="resumo-cta" onClick={onOpenEvents} type="button">
          Ver agenda
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </article>
    </section>
  )
}

export default ResumoDoDia
