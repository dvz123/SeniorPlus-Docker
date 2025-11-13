import { useState } from "react"
import ProfileCard from "../components/ProfileCard"
import EventsCard from "../components/EventsCard"
import MedicationCard from "../components/MedicationCard"
import QuickAccess from "../components/QuickAccess"
import EventForm from "../components/EventForm"
import "../styles/Home.css"

function Home() {
  const [showEventForm, setShowEventForm] = useState(false)

  return (
    <div className="container">
      <main className="main">
        <div className="top-grid">
          <ProfileCard />
          <div className="cards-column">
            <EventsCard onAddClick={() => setShowEventForm(true)} />
            <MedicationCard />
          </div>
        </div>
        <QuickAccess />

        {showEventForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Adicionar Evento</h2>
                <button className="close-modal" onClick={() => setShowEventForm(false)}>
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
              <EventForm onSubmit={() => setShowEventForm(false)} onCancel={() => setShowEventForm(false)} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
