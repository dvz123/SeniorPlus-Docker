import { useMedication } from "../contexts/MedicationContext"
import "../styles/MedicationCard.css"

function MedicationCard() {
  const { getTodayMedications, recordMedicationTaken } = useMedication()
  const todayMedications = getTodayMedications()

  const handleRecordClick = (medicationId) => {
    recordMedicationTaken(medicationId, true)
  }

  // Group medications by time
  const medicationsByTime = todayMedications.reduce((acc, medication) => {
    const times = medication.time.split(",")
    times.forEach((time) => {
      const trimmedTime = time.trim()
      if (!acc[trimmedTime]) {
        acc[trimmedTime] = []
      }
      acc[trimmedTime].push(medication)
    })
    return acc
  }, {})

  // Sort times
  const sortedTimes = Object.keys(medicationsByTime).sort()

  return (
    <div className="medication-card-component">
      <div className="medication-card-header">
        <h2 className="medication-card-title">
          <svg
            className="medication-title-icon"
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
          Medicamentos de Hoje
        </h2>
      </div>
      <div className="medication-card-content">
        {sortedTimes.length === 0 ? (
          <div className="no-medications-message">
            <p>Nenhum medicamento para hoje.</p>
          </div>
        ) : (
          <div className="medication-times-list">
            {sortedTimes.map((time) => (
              <div key={time} className="medication-time-group">
                <div className="medication-time">{time}</div>
                <div className="medication-items">
                  {medicationsByTime[time].map((medication) => (
                    <div key={medication.id} className="medication-item">
                      <div className="medication-details">
                        <p className="medication-name">{medication.name}</p>
                        <p className="medication-dosage">{medication.dosage}</p>
                      </div>
                      <button
                        className="record-medication-btn"
                        onClick={() => handleRecordClick(medication.id)}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicationCard
