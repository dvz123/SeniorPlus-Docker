import { useState } from "react"
import { useMedication } from "../contexts/MedicationContext"
import MedicationForm from "../components/MedicationForm"
import MedicationHistoryForm from "../components/MedicationHistoryForm"
import ConfirmDialog from "../components/ConfirmDialog"
import "../styles/Medicamentos.css"
import BackButton from "../../../components/BackButton"

function Medicamentos() {
  const { medications, deleteMedication, getMedicationHistory } = useMedication()
  const [activeTab, setActiveTab] = useState("active")
  const [showForm, setShowForm] = useState(false)
  const [editingMedication, setEditingMedication] = useState(null)
  const [showHistoryForm, setShowHistoryForm] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedMedicationHistory, setSelectedMedicationHistory] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    title: "",
    message: "",
  })

  const handleAddClick = () => {
    setEditingMedication(null)
    setShowForm(true)
  }

  const handleEditClick = (medication) => {
    setEditingMedication(medication)
    setShowForm(true)
  }

  const handleFormSubmit = (isEditing) => {
    setShowForm(false)
    setEditingMedication(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingMedication(null)
  }

  const handleDeleteClick = (id, name) => {
    setConfirmDialog({
      isOpen: true,
      id,
      title: "Excluir Medicamento",
      message: `Tem certeza que deseja excluir o medicamento "${name}"? Esta ação não pode ser desfeita.`,
    })
  }

  const handleConfirmDelete = () => {
    deleteMedication(confirmDialog.id)
    setConfirmDialog({ ...confirmDialog, isOpen: false })

  }

  const handleCancelDelete = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false })
  }

  const handleRecordClick = (medication) => {
    setSelectedMedication(medication)
    setShowHistoryForm(true)
  }

  const handleHistoryFormSubmit = () => {
    setShowHistoryForm(false)
    setSelectedMedication(null)

  }

  const handleViewHistoryClick = (medication) => {
    setSelectedMedicationHistory(medication)
    setShowHistory(true)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
    setSelectedMedicationHistory(null)
  }

  const filteredMedications = medications.filter((medication) => {
    if (activeTab === "active") return medication.status === "active"
    if (activeTab === "paused") return medication.status === "paused"
    if (activeTab === "discontinued") return medication.status === "discontinued"
    return true
  })

  const formatDate = (dateString) => {
    if (!dateString) return "Contínuo"
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("pt-BR", options)
  }

  return (
    <div className="container">
      <main className="main">
        <BackButton />

        <div className="page-header">
          <h1>Medicamentos</h1>
          <p>Gerencie os medicamentos e lembretes do paciente.</p>
        </div>

        <div className="medications-controls">
          <div className="tabs">
            <button className={`tab ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
              Ativos
            </button>
            <button className={`tab ${activeTab === "paused" ? "active" : ""}`} onClick={() => setActiveTab("paused")}>
              Pausados
            </button>
            <button
              className={`tab ${activeTab === "discontinued" ? "active" : ""}`}
              onClick={() => setActiveTab("discontinued")}
            >
              Descontinuados
            </button>
            <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
              Todos
            </button>
          </div>
          <button className="add-medication-btn" onClick={handleAddClick}>
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
            Adicionar Medicamento
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingMedication ? "Editar Medicamento" : "Adicionar Medicamento"}</h2>
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
              <MedicationForm
                onSubmit={() => handleFormSubmit(!!editingMedication)}
                onCancel={handleFormCancel}
                initialData={editingMedication}
              />
            </div>
          </div>
        )}

        {showHistoryForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Registrar Medicamento</h2>
                <button className="close-modal" onClick={() => setShowHistoryForm(false)}>
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
              <MedicationHistoryForm
                medicationId={selectedMedication.id}
                medicationName={selectedMedication.name}
                onSubmit={handleHistoryFormSubmit}
              />
            </div>
          </div>
        )}

        {showHistory && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Histórico: {selectedMedicationHistory.name}</h2>
                <button className="close-modal" onClick={handleCloseHistory}>
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
              <div className="history-content scrollable-content">
                {getMedicationHistory(selectedMedicationHistory.id).length === 0 ? (
                  <p className="no-history">Nenhum registro encontrado para este medicamento.</p>
                ) : (
                  <div className="history-list">
                    {getMedicationHistory(selectedMedicationHistory.id)
                      .sort((a, b) => new Date(b.date + "T" + b.time) - new Date(a.date + "T" + a.time))
                      .map((record) => (
                        <div key={record.id} className="history-item">
                          <div className="history-date">
                            {new Date(record.date).toLocaleDateString("pt-BR")} às {record.time}
                          </div>
                          <div className={`history-status ${record.taken ? "taken" : "not-taken"}`}>
                            {record.taken ? "Tomado" : "Não tomado"}
                          </div>
                          {record.notes && <div className="history-notes">{record.notes}</div>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="medications-list">
          {filteredMedications.length === 0 ? (
            <div className="no-medications">
              <p>Nenhum medicamento encontrado nesta categoria.</p>
              <button className="add-medication-btn-small" onClick={handleAddClick}>
                Adicionar Medicamento
              </button>
            </div>
          ) : (
            filteredMedications.map((medication) => (
              <div key={medication.id} className={`medication-card ${medication.status}`}>
                <div className="medication-header">
                  <h3>{medication.name}</h3>
                  <div className="medication-status">
                    {medication.status === "active"
                      ? "Ativo"
                      : medication.status === "paused"
                        ? "Pausado"
                        : "Descontinuado"}
                  </div>
                </div>
                <div className="medication-details">
                  <div className="medication-info scrollable-content">
                    <div className="info-item">
                      <span className="info-label">Dosagem:</span>
                      <span className="info-value">{medication.dosage}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Frequência:</span>
                      <span className="info-value">{medication.frequency}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Horários:</span>
                      <span className="info-value">{medication.time}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Período:</span>
                      <span className="info-value">
                        {formatDate(medication.startDate)} até {formatDate(medication.endDate)}
                      </span>
                    </div>
                    {medication.instructions && (
                      <div className="info-item full-width">
                        <span className="info-label">Instruções:</span>
                        <span className="info-value">{medication.instructions}</span>
                      </div>
                    )}
                    {medication.notes && (
                      <div className="info-item full-width">
                        <span className="info-label">Observações:</span>
                        <span className="info-value">{medication.notes}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">Lembretes:</span>
                      <span className="info-value">{medication.reminders ? "Ativados" : "Desativados"}</span>
                    </div>
                  </div>
                </div>
                <div className="medication-actions">
                  <button
                    className="action-btn record-btn"
                    onClick={() => handleRecordClick(medication)}
                    disabled={medication.status !== "active"}
                  >
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
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Registrar
                  </button>
                  <button className="action-btn history-btn" onClick={() => handleViewHistoryClick(medication)}>
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
                      <path d="M3 3v18h18" />
                      <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                    Histórico
                  </button>
                  <button className="action-btn edit-btn" onClick={() => handleEditClick(medication)}>
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
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteClick(medication.id, medication.name)}
                  >
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
            ))
          )}
        </div>

        <div className="today-medications">
          <h2>Medicamentos de Hoje</h2>
          <div className="today-list scrollable-content">
            {medications
              .filter((med) => med.status === "active")
              .flatMap((medication) => {
                const times = medication.time.split(",")
                return times.map((time, index) => (
                  <div key={`${medication.id}-${index}`} className="today-item">
                    <div className="today-time">{time.trim()}</div>
                    <div className="today-details">
                      <div className="today-name">{medication.name}</div>
                      <div className="today-dosage">{medication.dosage}</div>
                    </div>
                    <button
                      className="today-record-btn"
                      onClick={() => handleRecordClick(medication)}
                      title="Registrar medicamento"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </button>
                  </div>
                ))
              })
              .sort((a, b) => {
                const timeA = a.props.children[0].props.children
                const timeB = b.props.children[0].props.children
                return timeA.localeCompare(timeB)
              })}
          </div>
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

export default Medicamentos
