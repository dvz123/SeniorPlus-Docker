import React, { useMemo } from 'react';
import '../styles/EventosDoDia.css';
import { Calendar, Check, X } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { useEvents } from '../../../tela-cuidador/src/contexts/EventsContext';

const EventosDoDia = () => {
  const { showError } = useToast();
  const { getTodayEvents, toggleEventStatus } = useEvents();

  const eventos = useMemo(() => {
    try {
      const list = getTodayEvents() || [];
      // Normaliza para o shape esperado neste componente
      return list.map((e) => ({
        id: e.id,
        hora: e.startTime || '00:00',
        descricao: e.title || e.description || 'Evento',
        status: e.status,
        original: e,
      }));
    } catch (error) {
      console.error('Erro ao obter eventos do contexto:', error);
      showError('Não foi possível carregar os eventos de hoje.');
      return [];
    }
  }, [getTodayEvents, showError]);

  const alternarStatus = (evento) => {
    if (!evento?.id) return;
    toggleEventStatus(evento.id);
  };

  return (
    <div className="eventos-container" role="region" aria-label="Eventos do dia">
      <div className="eventos-header" role="heading" aria-level={3}>
        <Calendar size={18} />
        <span>Eventos do dia</span>
      </div>

      <div className="eventos-body" role="list">
        {eventos.length === 0 ? (
          <div className="evento-card1 empty" role="note" aria-live="polite">
            <span>Nenhum evento para hoje.</span>
          </div>
        ) : (
          eventos.map((evento, index) => (
            <div
              key={index}
              id={`evento-${evento.id}`}
              className={`evento-card1 ${evento.status === 'Concluído' ? 'concluido' : 'pendente'}`}
              role="listitem"
              tabIndex={0}
              aria-pressed={evento.status === 'Concluído'}
              aria-label={`Evento às ${evento.hora}: ${evento.descricao}. Status ${evento.status}. Pressione Enter para alternar.`}
              onClick={() => alternarStatus(evento)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  alternarStatus(evento);
                }
              }}
            >
              <div className="evento-hora">{evento.hora}</div>
              <div className="evento-descricao">{evento.descricao}</div>
              <div className="evento-status">
                <span>{evento.status}</span>
                {evento.status === 'Concluído' ? (
                  <Check size={16} className="status-icon" />
                ) : (
                  <X size={16} className="status-icon" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventosDoDia;
