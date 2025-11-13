import { useState } from "react"
import { useEvents } from "../contexts/EventsContext"
import { useToast } from "../../../contexts/ToastContext"
import "../styles/EventForm.css"

function EventForm({ onSubmit, onCancel, initialData = null }) {
  const { addEvent, updateEvent } = useEvents()
  const { showError } = useToast()
  const today = new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState(
    initialData || {
      title: "",
      description: "",
      date: today,
      startTime: "",
      endTime: "",
      category: "Outro",
      location: "",
    },
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      if (showError) {
        showError("A hora de término deve ser posterior à hora de início.")
      }
      return
    }

    if (initialData) {
      updateEvent(initialData.id, formData)
    } else {
      addEvent(
        formData.title,
        formData.date,
        formData.startTime,
        formData.endTime,
        formData.location,
        formData.description,
        formData.category,
      )
    }

    onSubmit()
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">Título*</label>
        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="description">Descrição</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        ></textarea>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">Data*</label>
          <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} min={today} required />
        </div>

        <div className="form-group">
          <label htmlFor="category">Categoria*</label>
          <select id="category" name="category" value={formData.category} onChange={handleChange} required>
            <option value="Atividade">Atividade</option>
            <option value="Consulta">Consulta</option>
            <option value="Social">Social</option>
            <option value="Medicação">Medicação</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startTime">Hora de início*</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">Hora de término*</label>
          <input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="location">Local</label>
        <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} />
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="submit-button">
          {initialData ? "Atualizar" : "Adicionar"}
        </button>
      </div>
    </form>
  )
}

export default EventForm
