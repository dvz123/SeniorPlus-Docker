import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useEvents } from "../contexts/EventsContext"
import { useMedication } from "../contexts/MedicationContext"
import "../styles/Calendario.css"
import BackButton from "../../../components/BackButton"

function Calendario() {
  const { events } = useEvents()
  const { medications } = useMedication()
  const location = useLocation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayEvents, setDayEvents] = useState([])
  const [dayMedications, setDayMedications] = useState([])
  const [focusDate, setFocusDate] = useState(null)

  useEffect(() => {
    const incomingDate = location.state?.focusDate
    if (!incomingDate) return

    const parsed = new Date(incomingDate)
    if (Number.isNaN(parsed.getTime())) return

    setFocusDate(parsed)
    setCurrentDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
  }, [location.state])

  // Gerar dias do calendário
  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1)
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0)

    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, etc.)
    const firstDayOfWeek = firstDay.getDay()

    // Dias do mês anterior para completar a primeira semana
    const prevMonthDays = []
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = new Date(year, month, -i)
      prevMonthDays.unshift({
        date: day,
        isCurrentMonth: false,
        isToday: isSameDay(day, new Date()),
      })
    }

    // Dias do mês atual
    const currentMonthDays = []
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i)
      currentMonthDays.push({
        date: day,
        isCurrentMonth: true,
        isToday: isSameDay(day, new Date()),
      })
    }

    // Dias do próximo mês para completar a última semana
    const nextMonthDays = []
    const remainingDays = (7 - ((prevMonthDays.length + currentMonthDays.length) % 7)) % 7
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i)
      nextMonthDays.push({
        date: day,
        isCurrentMonth: false,
        isToday: isSameDay(day, new Date()),
      })
    }

    // Combinar todos os dias
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]

    // Adicionar eventos e medicamentos a cada dia
    const daysWithItems = allDays.map((day) => {
      const dateStr = formatDateToString(day.date)
      const dayEvents = events.filter((event) => event.date === dateStr)
      const dayMeds = medications.filter((med) => {
        const startDate = new Date(med.startDate)
        const endDate = med.endDate ? new Date(med.endDate) : new Date(2099, 11, 31)
        return med.status === "active" && day.date >= startDate && day.date <= endDate
      })

      return {
        ...day,
        hasEvents: dayEvents.length > 0,
        hasMedications: dayMeds.length > 0,
        eventCount: dayEvents.length,
        medicationCount: dayMeds.length,
      }
    })

    setCalendarDays(daysWithItems)
  }, [currentDate, events, medications])

  // Verificar se duas datas são o mesmo dia
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  // Formatar data para string no formato YYYY-MM-DD
  const formatDateToString = (date) => {
    return date.toISOString().split("T")[0]
  }

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Navegar para o mês atual
  const goToCurrentMonth = () => {
    setCurrentDate(new Date())
  }

  // Selecionar um dia
  const handleDayClick = (day) => {
    setSelectedDay(day)

    // Buscar eventos do dia
    const dateStr = formatDateToString(day.date)
    const filteredEvents = events
      .filter((event) => event.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    // Buscar medicamentos do dia
    const filteredMedications = medications.filter((med) => {
      const startDate = new Date(med.startDate)
      const endDate = med.endDate ? new Date(med.endDate) : new Date(2099, 11, 31)
      return med.status === "active" && day.date >= startDate && day.date <= endDate
    })

    setDayEvents(filteredEvents)
    setDayMedications(filteredMedications)
  }

  useEffect(() => {
    if (!focusDate || calendarDays.length === 0) return

    const match = calendarDays.find((day) => isSameDay(day.date, focusDate))
    if (!match) return

    setSelectedDay(match)

    const dateStr = formatDateToString(match.date)
    const filteredEvents = events
      .filter((event) => event.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    const filteredMedications = medications.filter((med) => {
      const startDate = new Date(med.startDate)
      const endDate = med.endDate ? new Date(med.endDate) : new Date(2099, 11, 31)
      return med.status === "active" && match.date >= startDate && match.date <= endDate
    })

    setDayEvents(filteredEvents)
    setDayMedications(filteredMedications)
    setFocusDate(null)
  }, [focusDate, calendarDays, events, medications])

  // Formatar nome do mês
  const formatMonth = (date) => {
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  // Formatar data completa
  const formatFullDate = (date) => {
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }

  // Nomes dos dias da semana
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  return (
    <div className="container">
      <main className="main">
        <BackButton />

        <div className="page-header">
          <h1>Calendário</h1>
          <p>Visualize eventos e medicamentos em um calendário mensal.</p>
        </div>

        <div className="calendar-container">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
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
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h2 className="calendar-title">{formatMonth(currentDate)}</h2>
              <button className="calendar-nav-btn" onClick={goToNextMonth}>
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
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            <button className="today-btn" onClick={goToCurrentMonth}>
              Hoje
            </button>
          </div>

          <div className="calendar-grid">
            {/* Dias da semana */}
            {weekDays.map((day, index) => (
              <div key={index} className="calendar-weekday">
                {day}
              </div>
            ))}

            {/* Dias do calendário */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${day.isCurrentMonth ? "" : "other-month"} ${
                  day.isToday ? "today" : ""
                } ${selectedDay && isSameDay(day.date, selectedDay.date) ? "selected" : ""}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="day-number">{day.date.getDate()}</div>
                {day.hasEvents && (
                  <div className="day-indicator event-indicator">
                    {day.eventCount > 3 ? `${day.eventCount} eventos` : ""}
                  </div>
                )}
                {day.hasMedications && (
                  <div className="day-indicator medication-indicator">
                    {day.medicationCount > 3 ? `${day.medicationCount} medicamentos` : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedDay && (
          <div className="day-details">
            <h3 className="day-details-title">{formatFullDate(selectedDay.date)}</h3>

            <div className="day-details-content">
              <div className="day-events">
                <h4>Eventos</h4>
                {dayEvents.length === 0 ? (
                  <p className="no-items">Nenhum evento para este dia.</p>
                ) : (
                  <div className="day-items-list scrollable-content">
                    {dayEvents.map((event) => (
                      <div key={event.id} className="day-event-item">
                        <div className={`event-tag ${event.category.toLowerCase()}`}></div>
                        <div className="event-time">{event.startTime}</div>
                        <div className="event-info">
                          <div className="event-title">{event.title}</div>
                          <div className="event-category-label">{event.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="day-medications">
                <h4>Medicamentos</h4>
                {dayMedications.length === 0 ? (
                  <p className="no-items">Nenhum medicamento para este dia.</p>
                ) : (
                  <div className="day-items-list scrollable-content">
                    {dayMedications.map((medication) => (
                      <div key={medication.id} className="day-medication-item">
                        <div className="medication-times">
                          {medication.time.split(",").map((time, index) => (
                            <div key={index} className="medication-time">
                              {time.trim()}
                            </div>
                          ))}
                        </div>
                        <div className="medication-info">
                          <div className="medication-name">{medication.name}</div>
                          <div className="medication-dosage">{medication.dosage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Calendario
