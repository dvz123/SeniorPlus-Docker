import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/Agenda.css';
import { CalendarDays, Pill } from 'lucide-react';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Simulação de eventos (você pode conectar com banco/API depois)
  const formatDate = selectedDate.toLocaleDateString('pt-BR');
  const events = []; // Exemplo: [{ date: '26/05/2025', title: 'Consulta médica' }]
  const meds = [];   // Exemplo: [{ date: '26/05/2025', name: 'Paracetamol 500mg' }]

  const eventsToday = events.filter(e => e.date === formatDate);
  const medsToday = meds.filter(m => m.date === formatDate);

  return (
    <div className="agenda-wrapper">
      <div className="calendar-container">
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          locale="pt-BR"
        />
      </div>

      <div className="agenda-day-card">
        <h3 className="agenda-title">
          <CalendarDays className="agenda-icon" />
          Eventos de {formatDate}
        </h3>
        <div className="agenda-box agenda-info">
          {eventsToday.length > 0
            ? eventsToday.map((event, idx) => (
                <div key={idx}>{event.title}</div>
              ))
            : 'Nenhum evento para este dia.'}
        </div>
        <div className="agenda-box agenda-add">
          + Adicionar evento
        </div>
      </div>

      <div className="agenda-day-card">
        <h3 className="agenda-title">
          <Pill className="agenda-icon" />
          Medicamentos de {formatDate}
        </h3>
        <div className="agenda-box agenda-info">
          {medsToday.length > 0
            ? medsToday.map((med, idx) => (
                <div key={idx}>{med.name}</div>
              ))
            : 'Nenhum medicamento para este dia.'}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
