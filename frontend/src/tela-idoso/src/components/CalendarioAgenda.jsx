import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import '../styles/CalendarioAgenda.css';
import { CalendarDays, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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
import { useMedication } from '../../../tela-cuidador/src/contexts/MedicationContext';
import { useToast } from '../../../contexts/ToastContext';
import { useUser } from '../../../tela-cuidador/src/contexts/UserContext';
import { api } from '../../../tela-auth/src/services/api';

const toIsoDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return null;
};

const filterMedicamentosByDate = (lista, targetDate) => {
  const targetIso = toIsoDate(targetDate);
  if (!targetIso) return [];
  return (lista || []).filter((med) => {
    const inicio = toIsoDate(med.dataInicio || med.data_inicio);
    if (!inicio) return false;
    const fim = toIsoDate(med.dataFim || med.data_fim);
    const repetir = med.repetirDiariamente ?? med.repetir_diariamente ?? false;
    const isAfterStart = inicio <= targetIso;
    const isBeforeEnd = !fim || targetIso <= fim;
    if (repetir || (fim && fim !== inicio)) {
      return isAfterStart && isBeforeEnd;
    }
    return inicio === targetIso;
  });
};
 
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const CalendarioAgenda = () => {
  const { events, getEventsByDate } = useEvents() || {};
  const { getTodayMedications } = useMedication() || {};
  const { showError } = useToast();
  const { elderlyData } = useUser() || {};
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [eventosHojeApi, setEventosHojeApi] = useState([]);
  const [medicamentosHojeApi, setMedicamentosHojeApi] = useState([]);
  const liveRef = useRef(null); // região live para leitores de tela
  const [filtroTipos, setFiltroTipos] = useState([]); // tipos ativos
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [expandirMini, setExpandirMini] = useState(false);
  const showErrorRef = useRef(showError);
  const lastToastRef = useRef("");

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  // Carregar estado persistido
  useEffect(() => {
    try {
      const raw = localStorage.getItem('calendarioUI');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.filtroTipos)) setFiltroTipos(parsed.filtroTipos);
        if (typeof parsed.mostrarFiltro === 'boolean') setMostrarFiltro(parsed.mostrarFiltro);
        if (typeof parsed.expandirMini === 'boolean') setExpandirMini(parsed.expandirMini);
      }
    } catch (_) { /* ignore */ }
  }, []);

  // Persistir estado quando mudar
  useEffect(() => {
    try {
      localStorage.setItem('calendarioUI', JSON.stringify({ filtroTipos, mostrarFiltro, expandirMini }));
    } catch(_) {}
  }, [filtroTipos, mostrarFiltro, expandirMini]);
 
  const eventosNormalizados = useMemo(() => {
    if (!events || events.length === 0) return [];
 
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

  // Tipos distintos para filtros (derivado dos eventos + API do dia)
  const tiposDisponiveis = useMemo(() => {
    const setTipos = new Set();
    eventosNormalizados.forEach(e => e.tipo && setTipos.add(e.tipo));
    (eventosHojeApi || []).forEach(ev => {
      const t = ev.category || ev.categoria || ev.tipo;
      if (t) setTipos.add(t);
    });
    return Array.from(setTipos).sort();
  }, [eventosNormalizados, eventosHojeApi]);

  const toggleTipo = (tipo) => {
    setFiltroTipos(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]);
    try { anunciar(`Filtro ${tipo} ${filtroTipos.includes(tipo) ? 'removido' : 'aplicado'}`); } catch(_) {}
  };

  const limparFiltros = () => {
    setFiltroTipos([]);
    try { anunciar('Filtros limpos'); } catch(_) {}
  };
 
  const tipoCss = (tipo) => (tipo ? tipo.toLowerCase().replace(/[^a-z0-9]+/gi, '-') : 'outro');
 
  const anunciar = (texto) => {
    if (!liveRef.current) return;
    liveRef.current.textContent = texto;
  };

  const alterarMes = (direcao) => {
    const novoMes = direcao === 'anterior' ? subMonths(mesAtual, 1) : addMonths(mesAtual, 1);
    setMesAtual(novoMes);
    setDiaSelecionado(null);
    try {
      anunciar(`Mês ${format(novoMes, 'MMMM yyyy', { locale: ptBR })}`);
    } catch(_) {}
  };

  const irParaHoje = () => {
    const hojeLocal = new Date();
    setMesAtual(hojeLocal);
    setDiaSelecionado(hojeLocal);
    try {
      anunciar('Voltando para hoje');
    } catch(_) {}
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
 
  const eventosDoDia = useCallback((data) =>
    eventosNormalizados.filter((evento) => isSameDay(evento.data, data)), [eventosNormalizados]);
 
  const eventosDoMes = eventosNormalizados.filter(
    (evento) =>
      evento.data.getMonth() === mesAtual.getMonth() &&
      evento.data.getFullYear() === mesAtual.getFullYear(),
  );

  // Aplica filtro de tipos se houver
  const aplicaFiltroTipos = (lista) => {
    if (!filtroTipos.length) return lista;
    return lista.filter(ev => filtroTipos.includes(ev.tipo));
  };

  const hoje = new Date();

  const onKeyDownDia = (e, data) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setDiaSelecionado(data);
      try { anunciar(`Dia ${format(data, 'dd/MM/yyyy')}`); } catch(_) {}
    }
    if (e.key === 'ArrowLeft') setDiaSelecionado(addDays(data, -1));
    if (e.key === 'ArrowRight') setDiaSelecionado(addDays(data, 1));
    if (e.key === 'ArrowUp') setDiaSelecionado(addDays(data, -7));
    if (e.key === 'ArrowDown') setDiaSelecionado(addDays(data, 7));
    if (e.key === 'PageUp') alterarMes('anterior');
    if (e.key === 'PageDown') alterarMes('proximo');
  };

  // Integração com API (graciosa): busca eventos e medicamentos de hoje do idoso quando houver id
  useEffect(() => {
    let cancelado = false;
    const fetchHoje = async () => {
      const cpf = elderlyData?.cpf || elderlyData?.id;
      if (!cpf) return;
      try {
        setLoading(true);
        setErro("");
        lastToastRef.current = "";
        const [evtResp, medResp] = await Promise.allSettled([
          api.listEventosDeHoje(cpf),
          api.listMedicamentos(cpf),
        ]);
        if (!cancelado) {
          if (evtResp.status === 'fulfilled' && Array.isArray(evtResp.value)) {
            setEventosHojeApi(evtResp.value);
          } else {
            setEventosHojeApi([]);
          }
          if (medResp.status === 'fulfilled' && Array.isArray(medResp.value)) {
            setMedicamentosHojeApi(filterMedicamentosByDate(medResp.value, new Date()));
          } else {
            setMedicamentosHojeApi([]);
          }
        }
      } catch (e) {
        const msg = e?.message || 'Falha ao carregar agenda.';
        setErro(msg);
        if (showErrorRef.current && lastToastRef.current !== msg) {
          showErrorRef.current(msg);
          lastToastRef.current = msg;
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    fetchHoje();
    return () => {
      cancelado = true;
    };
  }, [elderlyData?.cpf, elderlyData?.id]);

  return (
    <div className="calendario-container">
      <div className="cabecalho-calendario" role="heading" aria-level={2} aria-label="Calendário e Agenda">
        <CalendarDays size={20} />
        <h2>Calendário e Agenda</h2>
      </div>

      <div className="calendario-box" role="region" aria-label="Calendário do mês">
        <div className="calendario-topo">
          <div className="topo-esquerda">
            <button onClick={() => alterarMes('anterior')} className="btn-mes" aria-label="Mês anterior"><ChevronLeft /></button>
          </div>
          <h3 aria-live="polite">{format(mesAtual, 'MMMM yyyy', { locale: ptBR })}</h3>
          <div className="topo-direita">
            <button onClick={() => alterarMes('proximo')} className="btn-mes" aria-label="Próximo mês"><ChevronRight /></button>
            <button onClick={irParaHoje} className="btn-hoje" aria-label="Ir para hoje">Hoje</button>
            <button onClick={() => setMostrarFiltro(v => !v)} className="btn-hoje" aria-pressed={mostrarFiltro} aria-label="Mostrar ou ocultar filtros"><Filter size={16} /></button>
          </div>
        </div>

        {/* Mini painel: próximos 3 eventos de hoje */}
        {(() => {
          const doDiaCtx = eventosDoDia(hoje);
          const doDiaApi = (eventosHojeApi || []).map((ev, idx) => {
            const [year, month, day] = String(ev.date || ev.data || '').split('-').map(Number);
            const [h, m] = String(ev.startTime || ev.horaInicio || '00:00').split(':').map((v) => Number(v) || 0);
            const data = year ? new Date(year, (month || 1) - 1, day || 1, h, m) : new Date();
            return {
              id: String(ev.id ?? `api-${idx}`),
              data,
              titulo: ev.title || ev.titulo || 'Evento',
              descricao: ev.description || ev.descricao || '',
              tipo: ev.category || ev.categoria || 'Outro',
              horario: ev.startTime || ev.horaInicio || '00:00',
              fim: ev.endTime || ev.horaFim || '',
              local: ev.location || ev.local || '',
              status: ev.status,
              original: ev,
            };
          });
          const todosHoje = aplicaFiltroTipos([...doDiaCtx, ...doDiaApi]).sort((a,b) => a.data - b.data);
          const agora = new Date();
          const proximos = todosHoje.filter(e => e.data >= agora).slice(0,3);
          const mostrar = proximos.length > 0 ? proximos : todosHoje.slice(0,3);
          return (
            <div className="mini-painel" role="region" aria-label="Próximos eventos de hoje">
              <div className="mini-header">
                <span>Próximos de hoje</span>
                <span className="badge" aria-hidden="true">{mostrar.length}</span>
                <button
                  type="button"
                  className="mini-toggle"
                  onClick={() => setExpandirMini(v => !v)}
                  aria-expanded={expandirMini}
                  aria-label={expandirMini ? 'Recolher lista completa' : 'Expandir para ver todos os eventos de hoje'}
                >
                  {expandirMini ? 'Recolher' : 'Ver todos'}
                </button>
              </div>
              {mostrar.length > 0 ? (
                <div className={expandirMini ? 'mini-grid expandida' : 'mini-grid'}>
                  {(expandirMini ? todosHoje : mostrar).map((evento) => (
                    <div key={`mini-${evento.id}-${evento.horario}`} className={`mini-card tipo-${tipoCss(evento.tipo)}`} tabIndex={0} aria-label={`${format(evento.data, 'HH:mm')} ${evento.titulo}`}>
                      <div className="mini-hora">{format(evento.data, 'HH:mm')}</div>
                      <div className="mini-titulo">{evento.titulo}</div>
                      {evento.status && <div className="mini-status">{evento.status}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mini-vazio">Sem eventos hoje.</p>
              )}
            </div>
          );
        })()}

        {mostrarFiltro && (
          <div className="filtros-tipos" role="group" aria-label="Filtros de tipo de evento">
            {tiposDisponiveis.length === 0 ? (
              <p className="filtros-vazio">Sem tipos para filtrar.</p>
            ) : (
              <div className="chips">
                {tiposDisponiveis.map(tipo => {
                  const ativo = filtroTipos.includes(tipo);
                  return (
                    <button
                      key={tipo}
                      type="button"
                      className={`chip ${ativo ? 'ativo' : ''}`}
                      onClick={() => toggleTipo(tipo)}
                      aria-pressed={ativo}
                      aria-label={`Filtro tipo ${tipo} ${ativo ? 'ativo' : 'inativo'}`}
                    >
                      {tipo}
                      <span className="badge" aria-hidden="true">
                        {eventosNormalizados.filter(e => e.tipo === tipo).length}
                      </span>
                    </button>
                  );
                })}
                {filtroTipos.length > 0 && (
                  <button type="button" className="chip limpar" onClick={limparFiltros} aria-label="Limpar todos os filtros">Limpar</button>
                )}
              </div>
            )}
          </div>
        )}

        <p id="ajuda-teclado" className="sr-only">
          Use as setas para navegar entre os dias. Enter seleciona o dia. PageUp/PageDown mudam o mês. O botão Hoje volta para a data atual.
        </p>
        <div className="calendario-grid" role="grid" aria-label="Dias do mês" aria-describedby="ajuda-teclado">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
            <div key={dia} className="calendario-dia-titulo" role="columnheader">{dia}</div>
          ))}

          {dias.map((data, index) => {
            const eventosHoje = eventosDoDia(data);
            return (
              <div
                key={index}
                className={`calendario-dia ${!isSameMonth(data, mesAtual) ? 'fora-do-mes' : ''}
                ${isSameDay(data, diaSelecionado ?? new Date(0)) ? 'dia-selecionado' : ''}
                ${isSameDay(data, hoje) ? 'dia-hoje' : ''}`}
                onClick={() => setDiaSelecionado(data)}
                role="gridcell"
                tabIndex={0}
                aria-selected={isSameDay(data, diaSelecionado ?? new Date(0))}
                onKeyDown={(e) => onKeyDownDia(e, data)}
              >
                <span>{format(data, 'd')}</span>
                {eventosHoje.length > 0 && <span className="marcador-evento" />}
              </div>
            );
          })}
        </div>

        {loading && <p role="status" aria-live="polite">Carregando agenda...</p>}
        {erro && !loading && <p role="alert">{erro}</p>}

        {/* Região live para anúncios acessíveis */}
        <span className="sr-only" aria-live="polite" ref={liveRef} />

        {/* Eventos do dia selecionado */}
        {diaSelecionado && (
          <div className="eventos-lista">
            <h4>
              Eventos em {format(diaSelecionado, 'dd/MM/yyyy')}
              {(() => {
                const isHoje = isSameDay(diaSelecionado, hoje);
                const doDiaCtx = eventosDoDia(diaSelecionado);
                const doDiaApi = isHoje
                  ? (eventosHojeApi || []).map((ev, idx) => {
                      const [year, month, day] = String(ev.date || ev.data || '').split('-').map(Number);
                      const [h, m] = String(ev.startTime || ev.horaInicio || '00:00').split(':').map((v) => Number(v) || 0);
                      const data = year ? new Date(year, (month || 1) - 1, day || 1, h, m) : new Date();
                      return {
                        id: String(ev.id ?? `api-${idx}`),
                        data,
                        titulo: ev.title || ev.titulo || 'Evento',
                        descricao: ev.description || ev.descricao || '',
                        tipo: ev.category || ev.categoria || 'Outro',
                        horario: ev.startTime || ev.horaInicio || '00:00',
                        fim: ev.endTime || ev.horaFim || '',
                        local: ev.location || ev.local || '',
                        status: ev.status,
                        original: ev,
                      };
                    })
                  : [];
                const lista = aplicaFiltroTipos([...doDiaCtx, ...doDiaApi]);
                return <span> ({lista.length})</span>
              })()}
            </h4>
            <div className="eventos-scroll">
               {(() => {
                 // Combina eventos do contexto e, se o dia selecionado for hoje, também os vindos da API
                 const isHoje = isSameDay(diaSelecionado, hoje);
                 const doDiaCtx = eventosDoDia(diaSelecionado);
                 const doDiaApi = isHoje
                   ? (eventosHojeApi || []).map((ev, idx) => {
                       // Normaliza shape da API para o shape usado na UI
                       const [year, month, day] = String(ev.date || ev.data || '').split('-').map(Number);
                       const [h, m] = String(ev.startTime || ev.horaInicio || '00:00').split(':').map((v) => Number(v) || 0);
                       const data = year ? new Date(year, (month || 1) - 1, day || 1, h, m) : new Date();
                       return {
                         id: String(ev.id ?? `api-${idx}`),
                         data,
                         titulo: ev.title || ev.titulo || 'Evento',
                         descricao: ev.description || ev.descricao || '',
                         tipo: ev.category || ev.categoria || 'Outro',
                         horario: ev.startTime || ev.horaInicio || '00:00',
                         fim: ev.endTime || ev.horaFim || '',
                         local: ev.location || ev.local || '',
                         status: ev.status,
                         original: ev,
                       };
                     })
                   : [];
                 const lista = aplicaFiltroTipos([...doDiaCtx, ...doDiaApi]).sort((a,b) => a.data - b.data);
                 return lista.length > 0 ? (
                   lista.map((evento) => (
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
                 );
               })()}
            </div>
          </div>
        )}

        {/* Eventos do mês */}
        <div className="eventos-lista">
          <h4>
            Eventos do mês
            <span> ({aplicaFiltroTipos(eventosDoMes).length})</span>
          </h4>
          <div className="eventos-scroll">
            {aplicaFiltroTipos(eventosDoMes).length > 0 ? (
              aplicaFiltroTipos([...eventosDoMes]).sort((a,b) => a.data - b.data).map((evento) => (
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

        {/* Medicamentos de hoje */}
        <div className="eventos-lista">
          <h4>
            Medicamentos de hoje
            {(() => {
              try {
                const medsCtx = (getTodayMedications && getTodayMedications()) || [];
                const medsApi = Array.isArray(medicamentosHojeApi) ? medicamentosHojeApi : [];
                const meds = [...medsCtx, ...medsApi];
                return <span> ({meds.length})</span>
              } catch (_) { return null }
            })()}
          </h4>
          <div className="eventos-scroll">
            {(() => {
              try {
                const medsCtx = (getTodayMedications && getTodayMedications()) || [];
                const medsApi = Array.isArray(medicamentosHojeApi) ? medicamentosHojeApi : [];
                const meds = [...medsCtx, ...medsApi];
                if (!meds || meds.length === 0) return <p>Nenhum medicamento para hoje.</p>;
                return meds.map((med, idx) => (
                  <div key={med.id || `med-${idx}`} className="evento-card tipo-medicacao" aria-label={`Medicamento ${med.name || med.nome || `#${idx + 1}`}`}>
                    <div className="evento-data">
                      <strong>{med.name || med.nome || `Medicamento ${idx + 1}`}</strong>
                    </div>
                    <div className="evento-descricao">{(med.dosage || med.dosagem || '')} {med.instructions ? `• ${med.instructions}` : ''}</div>
                    {Array.isArray(med.times) && med.times.length > 0 ? (
                      <small className="evento-status">Horários: {med.times.join(', ')}</small>
                    ) : med.horarios ? (
                      <small className="evento-status">Horários: {String(med.horarios)}</small>
                    ) : null}
                  </div>
                ));
              } catch (e) {
                return <p>Não foi possível carregar os medicamentos.</p>;
              }
            })()}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarioAgenda;
