// Converted to JS (no tsconfig). Rename to .jsx for CRA tooling.
import React, { useMemo, useState } from 'react';
import '../styles/CalendarioAgenda.css';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEvents } from '../../../tela-cuidador/src/contexts/EventsContext';

// Lightweight runtime shape (removed TS types for compatibility without tsconfig)
// Keeping JSDoc for editor hints.
/** @typedef {{id:string,data:Date,titulo:string,descricao:string,tipo:string,horario:string,fim:string,local:string,status?:string,original:any}} CalendarioEvento */

/**
 * Add days to a date (helper kept local)
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const CalendarioAgenda = () => {
  // Events context yields caregiver-managed events.
  const { events } = useEvents() || {};
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  const eventosNormalizados = useMemo(() => {
    if (!events || events.length === 0) return [];

  /** @type {CalendarioEvento[]} */
  const normalizados = [];

    events.forEach((event) => {
      if (!event?.date) return;

      const [year, month, day] = String(event.date).split('-').map(Number);
      const [hour, minute] = String(event.startTime || '00:00')
        .split(':')
        .map((value) => Number(value) || 0);

      const data = new Date(year, (month || 1) - 1, day || 1, hour, minute);

      if (Number.isNaN(data.getTime())) return;

      normalizados.push({
        id: String(event.id ?? `${event.title}-${event.date}`),
        data,
        titulo: event.title || 'Evento',
        descricao: event.description || '',
        tipo: event.category || 'Outro',
        horario: event.startTime || '00:00',
        fim: event.endTime || '',
        local: event.location || '',
        status: event.status,
        original: event,
      });
    });

    return normalizados;
  }, [events]);

  const tipoCss = (tipo) => (tipo ? tipo.toLowerCase().replace(/[^a-z0-9]+/gi, '-') : 'outro');

  const alterarMes = (direcao) => {
    const novoMes = direcao === 'anterior' ? subMonths(mesAtual, 1) : addMonths(mesAtual, 1);
    setMesAtual(novoMes);
    setDiaSelecionado(null);
  };

  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  const inicioSemana = startOfWeek(inicioMes, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(fimMes, { weekStartsOn: 0 });

  const dias = [];
  let dia = inicioSemana;
  while (dia <= fimSemana) {
    dias.push(dia);
    dia = addDays(dia, 1);
  }

  const eventosDoDia = (data) =>
    eventosNormalizados.filter((evento) => isSameDay(evento.data, data));

  const eventosDoMes = eventosNormalizados.filter(
    (evento) =>
      evento.data.getMonth() === mesAtual.getMonth() &&
      evento.data.getFullYear() === mesAtual.getFullYear(),
  );

  return (
    <div className="calendario-container">
      <div className="cabecalho-calendario">
        <CalendarDays size={20} />
        <h2>Calendário e Agenda</h2>
      </div>

      <div className="calendario-box">
        <div className="calendario-topo">
          <button onClick={() => alterarMes('anterior')} className="btn-mes"><ChevronLeft /></button>
          <h3>{format(mesAtual, 'MMMM yyyy', { locale: ptBR })}</h3>
          <button onClick={() => alterarMes('proximo')} className="btn-mes"><ChevronRight /></button>
        </div>

        <div className="calendario-grid">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
            <div key={dia} className="calendario-dia-titulo">{dia}</div>
          ))}

          {dias.map((data, index) => {
            const eventosHoje = eventosDoDia(data);
            return (
              <div
                key={index}
                className={`calendario-dia ${!isSameMonth(data, mesAtual) ? 'fora-do-mes' : ''}
                ${isSameDay(data, diaSelecionado ?? new Date(0)) ? 'dia-selecionado' : ''}`}
                onClick={() => setDiaSelecionado(data)}
              >
                <span>{format(data, 'd')}</span>
                {eventosHoje.length > 0 && <span className="marcador-evento" />}
              </div>
            );
          })}
        </div>

        {/* Eventos do dia selecionado */}
        {diaSelecionado && (
          <div className="eventos-lista">
            <h4>Eventos em {format(diaSelecionado, 'dd/MM/yyyy')}</h4>
            <div className="eventos-scroll">
              {eventosDoDia(diaSelecionado).length > 0 ? (
                eventosDoDia(diaSelecionado).map((evento) => (
                  <div key={`${evento.id}-${evento.horario}`} className={`evento-card tipo-${tipoCss(evento.tipo)}`}>
                    <div className="evento-data">
                      <strong>{format(evento.data, 'dd/MM - HH:mm')}</strong>
                    </div>
                    <div className="evento-descricao">{evento.titulo}</div>
                    {evento.descricao && <div className="evento-detalhe">{evento.descricao}</div>}
                    {evento.status && <small className="evento-status">Status: {evento.status}</small>}
                    <span className="evento-tipo">{evento.tipo}</span>
                  </div>
                ))
              ) : (
                <p>Sem eventos para este dia.</p>
              )}
            </div>
          </div>
        )}

        {/* Eventos do mês */}
        <div className="eventos-lista">
          <h4>Eventos do mês</h4>
          <div className="eventos-scroll">
            {eventosDoMes.length > 0 ? (
              eventosDoMes.map((evento) => (
                <div key={`${evento.id}-${evento.horario}`} className={`evento-card tipo-${tipoCss(evento.tipo)}`}>
                  <div className="evento-data">
                    <strong>{format(evento.data, 'dd/MM - HH:mm')}</strong>
                  </div>
                  <div className="evento-descricao">{evento.titulo}</div>
                  {evento.descricao && <div className="evento-detalhe">{evento.descricao}</div>}
                  <span className="evento-tipo">{evento.tipo}</span>
                </div>
              ))
            ) : (
              <p>Sem eventos neste mês.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarioAgenda;
