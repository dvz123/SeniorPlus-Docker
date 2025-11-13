import { useState } from "react"
import { useMedication } from "../contexts/MedicationContext"
import "../styles/MedicationHistoryForm.css"

function MedicationHistoryForm({ medicationId, medicationName, onSubmit }) {
  const { recordMedicationTaken } = useMedication()
  const [formData, setFormData] = useState({
    taken: true,
    notes: "",
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    recordMedicationTaken(medicationId, formData.taken, formData.notes)
    onSubmit()
  }

  return (
    <form className="history-form" onSubmit={handleSubmit}>
      <h3>Registrar medicamento: {medicationName}</h3>

      <div className="form-group radio-group">
        <div className="radio-options">
          <label className="radio-container">
            <input
              type="radio"
              name="taken"
              value="true"
              checked={formData.taken === true}
              onChange={() => setFormData({ ...formData, taken: true })}
            />
            <span className="radio-label">Medicamento tomado</span>
          </label>
          <label className="radio-container">
            <input
              type="radio"
              name="taken"
              value="false"
              checked={formData.taken === false}
              onChange={() => setFormData({ ...formData, taken: false })}
            />
            <span className="radio-label">Medicamento não tomado</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Observações</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Adicione observações sobre a administração do medicamento"
        ></textarea>
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-button">
          Registrar
        </button>
      </div>
    </form>
  )
}

export default MedicationHistoryForm
