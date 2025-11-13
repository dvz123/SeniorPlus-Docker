import React, { useCallback, useEffect, useState } from 'react';
import './styles/Dashboard.css';
import PainelPrincipal from './components/PainelPrincipal.jsx';
import PainelAcessibilidade from './components/PainelAcessibilidade.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import ResumoDoDia from './components/ResumoDoDia.jsx';
import AcoesRapidas from './components/AcoesRapidas.jsx';
import MedicamentosHoje from './components/MedicamentosHoje.jsx';
import EventosDoDia from './components/EventosDoDia.jsx';
import CalendarioAgenda from './components/CalendarioAgenda.jsx';
import EmergencyPopup from './components/EmergencyPopup.jsx';

const Dashboard = () => {
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [eventsModalOpen, setEventsModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const closeMedModal = useCallback(() => setMedModalOpen(false), []);
  const closeEventsModal = useCallback(() => setEventsModalOpen(false), []);

  useEffect(() => {
    if (!medModalOpen && !eventsModalOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMedModalOpen(false);
        setEventsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [medModalOpen, eventsModalOpen]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-top-bar">
        <PainelAcessibilidade />
      </div>

      <section className="dashboard-main" aria-label="Resumo principal">
        <div className="dashboard-main-grid">
          <PainelPrincipal />
          <ProfileCard />
        </div>
      </section>

      <ResumoDoDia onOpenMedications={() => setMedModalOpen(true)} onOpenEvents={() => setEventsModalOpen(true)} />

      <AcoesRapidas
        onOpenMedications={() => setMedModalOpen(true)}
        onOpenEvents={() => setEventsModalOpen(true)}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
      />

      {medModalOpen && (
        <div
          className="idoso-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Medicamentos de hoje"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMedModal();
          }}
        >
          <div className="overlay-card">
            <button type="button" className="overlay-close" onClick={closeMedModal} aria-label="Fechar medicamentos">
              ×
            </button>
            <MedicamentosHoje />
          </div>
        </div>
      )}

      {eventsModalOpen && (
        <div
          className="idoso-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Eventos do dia"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeEventsModal();
          }}
        >
          <div className="overlay-card">
            <button type="button" className="overlay-close" onClick={closeEventsModal} aria-label="Fechar eventos">
              ×
            </button>
            <EventosDoDia />
          </div>
        </div>
      )}

      <CalendarioAgenda />

      <EmergencyPopup isOpen={emergencyModalOpen} onClose={() => setEmergencyModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
