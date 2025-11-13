import React, { useState, useEffect } from 'react';
import '../styles/MedicamentosHoje.css';
import { Pill } from 'lucide-react';
import { useMedication } from '../../../tela-cuidador/src/contexts/MedicationContext';

const MedicamentosHoje = () => {
  const { getTodayMedications, recordMedicationTaken } = useMedication();
  const [medsTomados, setMedsTomados] = useState({});

  const hoje = getTodayMedications();
  const medSignature = JSON.stringify(
    hoje.map((med) => ({ id: med.id, times: med.times, time: med.time })),
  );

  useEffect(() => {
    setMedsTomados((prev) => {
      const atualizados = {};

      hoje.forEach((med) => {
        const times = Array.isArray(med.times)
          ? med.times
          : String(med.time || '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);

        times.forEach((hora) => {
          const key = `${med.id}-${hora}`;
          atualizados[key] = key in prev ? prev[key] : false;
        });
      });

      return atualizados;
    });
  }, [medSignature]);

  const toggleTomado = (medicamento, horario) => {
    const key = `${medicamento.id}-${horario}`;
    setMedsTomados((prev) => {
      const atual = !!prev[key];
      const atualizado = { ...prev, [key]: !atual };

      // Registrar no histórico para manter cuidador e idoso sincronizados
      recordMedicationTaken(medicamento.id, !atual, `Horário ${horario}`);

      return atualizado;
    });
  };

  return (
    <div className="medicamentos-container" role="region" aria-label="Medicamentos de hoje">
      <div className="med-title" role="heading" aria-level={3}>
        <Pill size={18} />
        <span>Medicamentos de Hoje</span>
      </div>

      <div className="medicamentos-body" role="list">
        {hoje.length === 0 ? (
          <div className="med-card empty" role="note" aria-live="polite">
            <span>Nenhum medicamento para hoje.</span>
          </div>
        ) : (
          hoje.map((med) => {
            const horarios = Array.isArray(med.times)
              ? med.times
              : String(med.time || '')
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean);

            return (
            <div className="med-card" key={med.id} role="listitem" aria-label={`Medicamento ${med.name || med.nome}`}>
              <div className="med-nome">
                <strong>{med.name || med.nome}</strong> - {med.dosage || med.dosagem}
              </div>
              <div className="med-frequencia">Frequência: {med.frequency || med.frequencia}</div>
              <div className="med-horarios">
                {horarios.map((hora) => {
                  const key = `${med.id}-${hora}`;
                  const tomado = medsTomados[key] || false;
                  return (
                    <label
                      key={key}
                      className={`custom-checkbox${tomado ? ' taken' : ''}`}
                      aria-label={`Horário ${hora} para ${med.name || med.nome}. ${tomado ? 'Marcado como tomado' : 'Não tomado'}`}
                    >
                      <span className="hora-texto">{hora}</span>
                      <input
                        type="checkbox"
                        checked={tomado}
                        aria-checked={tomado}
                        aria-label={`Marcar ${hora} como ${tomado ? 'não tomado' : 'tomado'}`}
                        onChange={() => toggleTomado(med, hora)}
                      />
                      <span className="checkmark"></span>
                    </label>
                  );
                })}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MedicamentosHoje;
