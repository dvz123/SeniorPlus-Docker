import { useState } from "react"
import { useMedication } from "../contexts/MedicationContext"
import { useToast } from "../../../contexts/ToastContext"
import "../styles/MedicationForm.css"

function MedicationForm({ onSubmit, onCancel, initialData = null }) {
  const { addMedication, updateMedication } = useMedication()
  const { showError } = useToast()
  const today = new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      dosage: "",
      frequency: "",
      time: "",
      startDate: today,
      endDate: "",
      instructions: "",
      status: "active",
      reminders: true,
      notes: "",
    },
  )

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      if (showError) {
        showError("A data de término deve ser posterior à data de início.")
      }
      return
    }

    const timeSlots = String(formData.time || "")
      .split(",")
      .map((slot) => slot.trim())
      .filter(Boolean)

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
    const hasInvalidTime = timeSlots.some((slot) => !timePattern.test(slot))

    if (hasInvalidTime) {
      if (showError) {
        showError("Informe horários válidos no formato HH:MM, separados por vírgula.")
      }
      return
    }

    if (initialData) {
      updateMedication(initialData.id, formData)
    } else {
      addMedication(
        formData.name,
        formData.dosage,
        formData.frequency,
        formData.time,
        formData.startDate,
        formData.endDate,
        formData.instructions,
      )
    }

    onSubmit()
  }

  return (
    <form className="medication-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Nome do Medicamento*</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dosage">Dosagem*</label>
          <input type="text" id="dosage" name="dosage" value={formData.dosage} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="frequency">Frequência*</label>
          <input
            type="text"
            id="frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            placeholder="Ex: 1x ao dia, 8/8h"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="time">Horários*</label>
        <input
          type="text"
          id="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          placeholder="Ex: 08:00,20:00 (separar por vírgula)"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startDate">Data de Início*</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">Data de Término</label>
          <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="instructions">Instruções</label>
        <textarea
          id="instructions"
          name="instructions"
          value={formData.instructions}
          onChange={handleChange}
          rows="2"
          placeholder="Ex: Tomar com água, após as refeições"
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Observações</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          placeholder="Ex: Para controle de pressão arterial"
        ></textarea>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="discontinued">Descontinuado</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              id="reminders"
              name="reminders"
              checked={formData.reminders}
              onChange={handleChange}
            />
            <span className="checkbox-label">Ativar lembretes</span>
          </label>
        </div>
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

export default MedicationForm
