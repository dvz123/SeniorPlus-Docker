import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useEvents } from "../contexts/EventsContext"
import EventForm from "./EventForm"
import "../styles/EventsCard.css"

function EventsCard() {
  const { getTodayEvents } = useEvents()
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const todayEvents = getTodayEvents()

  const handleAddClick = () => {
    setShowForm(true)
  }

  const handleFormSubmit = () => {
    setShowForm(false)
  }

  const handleFormCancel = () => {
    setShowForm(false)
  }

  const handleViewAllClick = () => {
    navigate("/registrar-eventos")
  }

  const handleOpenInCalendar = (date) => {
    if (!date) return
    navigate("/calendario", { state: { focusDate: date } })
  }

  // Function to get the appropriate icon based on category
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Atividade":
        return (
          <svg
            className="event-icon"
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )
      case "Consulta":
        return (
          <svg
            className="event-icon"
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
        )
      case "Social":
        return (
          <svg
            className="event-icon"
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
        )
      case "Medicação":
        return (
          <svg
            className="event-icon"
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
            <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
            <path d="m5 2 5 5" />
            <path d="M2 13h7" />
            <path d="M22 20v2h-2" />
            <path d="M20 14v4h-4" />
            <path d="M13 20h-2" />
            <path d="M16 14h-3" />
          </svg>
        )
      default:
        return (
          <svg
            className="event-icon"
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
        )
    }
  }

  return (
    <div className="events-card">
      <div className="events-header">
        <h2 className="events-title">
          <svg
            className="events-title-icon"
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
          Eventos do dia
        </h2>
        {todayEvents.length > 0 && (
          <button className="view-all-button" onClick={handleViewAllClick}>
            Ver todos
          </button>
        )}
      </div>
      <div className="events-content">
        <div className="events-list">
          {todayEvents.length === 0 ? (
            <div className="no-events-message">
              <p>Nenhum evento para hoje.</p>
            </div>
          ) : (
            todayEvents.map((event) => (
              <div
                key={event.id}
                className="event-item"
                role="button"
                tabIndex={0}
                onClick={() => handleOpenInCalendar(event.date)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleOpenInCalendar(event.date)
                  }
                }}
              >
                <div className="event-content">
                  <div className={`event-icon-${event.category.toLowerCase()}`}>{getCategoryIcon(event.category)}</div>
                  <div>
                    <p className="event-name">{event.title}</p>
                    <p className="event-time">
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>
                <span className={`event-badge-${event.category.toLowerCase()}`}>{event.category}</span>
              </div>
            ))
          )}

          <button className="add-event-button" onClick={handleAddClick}>
            <svg
              className="add-event-icon"
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
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Adicionar evento
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>Novo Evento</h2>
            <EventForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
          </div>
        </div>
      )}
    </div>
  )
}

export default EventsCard
