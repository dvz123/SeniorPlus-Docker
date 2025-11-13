"use client"

import { useState, useMemo } from "react"
import { useEvents } from "../contexts/EventsContext"

import EventForm from "../components/EventForm"
import ConfirmDialog from "../components/ConfirmDialog"
import "../styles/RegistrarEventos.css"
import BackButton from "../../../components/BackButton"

function RegistrarEventos() {
  const { events, deleteEvent } = useEvents()
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [filter, setFilter] = useState("all")
  // Helpers to handle dates in local timezone to avoid off-by-one issues
  const toLocalISODate = (d) => {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const parseLocalDate = (str) => {
    if (!str) return new Date(NaN)
    const [y, m, d] = String(str).split("-").map((v) => parseInt(v, 10))
    return new Date(y, (m || 1) - 1, d || 1)
  }

  const today = useMemo(() => new Date(), [])
  const defaultEnd = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d
  }, [])

  const [dateRange, setDateRange] = useState({
    start: toLocalISODate(today),
    end: toLocalISODate(defaultEnd),
  })
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    title: "",
    message: "",
  })

  const handleAddClick = () => {
    setEditingEvent(null)
    setShowForm(true)
  }

  const handleEditClick = (event) => {
    setEditingEvent(event)
    setShowForm(true)
  }

  const handleFormSubmit = (isEditing) => {
    setShowForm(false)
    setEditingEvent(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingEvent(null)
  }

  const handleDeleteClick = (id, title) => {
    setConfirmDialog({
      isOpen: true,
      id,
      title: "Excluir Evento",
      message: `Tem certeza que deseja excluir o evento "${title}"? Esta ação não pode ser desfeita.`,
    })
  }

  const handleConfirmDelete = () => {
    deleteEvent(confirmDialog.id)
    setConfirmDialog({ ...confirmDialog, isOpen: false })
  }

  const handleCancelDelete = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false })
  }

  const handleFilterChange = (e) => {
    setFilter(e.target.value)
  }

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target
    setDateRange({
      ...dateRange,
      [name]: value,
    })
  }

  const filteredEvents = events
    .filter((event) => {
      // Filter by date range (parse dates in local timezone)
      const eventDate = parseLocalDate(event.date)
      const startDate = parseLocalDate(dateRange.start)
      const endDate = parseLocalDate(dateRange.end)
      return eventDate >= startDate && eventDate <= endDate
    })
    .filter((event) => {
      // Filter by category
      if (filter === "all") return true
      return event.category === filter
    })
    .sort((a, b) => {
      // Sort by date and time
      const dateA = parseLocalDate(a.date)
      const dateB = parseLocalDate(b.date)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB
      }
      return a.startTime.localeCompare(b.startTime)
    })

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = event.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(event)
    return acc
  }, {})

  const formatDate = (dateString) => {
    const date = parseLocalDate(dateString)
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return date.toLocaleDateString("pt-BR", options)
  }

  return (
    <div className="container">
      <main className="main">
        <BackButton />

        <div className="page-header">
          <h1>Registrar Eventos</h1>
          <p>Gerencie e registre os eventos e atividades do paciente.</p>
        </div>

        <div className="events-controls">
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="filter">Filtrar por:</label>
              <select id="filter" value={filter} onChange={handleFilterChange}>
                <option value="all">Todos</option>
                <option value="Atividade">Atividade</option>
                <option value="Consulta">Consulta</option>
                <option value="Social">Social</option>
                <option value="Medicação">Medicação</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="dateStart">De:</label>
              <input type="date" id="dateStart" name="start" value={dateRange.start} onChange={handleDateRangeChange} />
            </div>
            <div className="filter-group">
              <label htmlFor="dateEnd">Até:</label>
              <input type="date" id="dateEnd" name="end" value={dateRange.end} onChange={handleDateRangeChange} />
            </div>
          </div>
          <button className="add-event-btn" onClick={handleAddClick}>
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
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Adicionar Evento
          </button>
        </div>

        {showForm && (
          <div className="form-overlay">
            <div className="form-container">
              <div className="modal-header">
                <h2>{editingEvent ? "Editar Evento" : "Adicionar Evento"}</h2>
                <button className="close-modal" onClick={handleFormCancel}>
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
              <EventForm
                onSubmit={() => handleFormSubmit(!!editingEvent)}
                onCancel={handleFormCancel}
                initialData={editingEvent}
              />
            </div>
          </div>
        )}

        <div className="events-list-container">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="no-events">
              <p>Nenhum evento encontrado para o período selecionado.</p>
              <button className="add-event-btn-small" onClick={handleAddClick}>
                Adicionar Evento
              </button>
            </div>
          ) : (
            Object.keys(groupedEvents)
              .sort((a, b) => new Date(a) - new Date(b))
              .map((date) => (
                <div key={date} className="events-day">
                  <h2 className="date-header">{formatDate(date)}</h2>
                  <div className="events-group">
                    {groupedEvents[date].map((event) => (
                      <div key={event.id} className="event-card">
                        <div className={`event-category ${event.category.toLowerCase()}`}>{event.category}</div>
                        <div className="event-details">
                          <h3>{event.title}</h3>
                          <div className="event-time">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
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
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.location && (
                            <div className="event-location">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="10" r="3" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                              {event.location}
                            </div>
                          )}
                          {event.description && <p className="event-description">{event.description}</p>}
                        </div>
                        <div className="event-actions">
                          <button className="edit-btn" onClick={() => handleEditClick(event)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                            Editar
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteClick(event.id, event.title)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" x2="10" y1="11" y2="17" />
                              <line x1="14" x2="14" y1="11" y2="17" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          confirmText="Excluir"
          cancelText="Cancelar"
          type="danger"
        />
      </main>
    </div>
  )
}

export default RegistrarEventos
