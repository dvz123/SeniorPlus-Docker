import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, HeartPulse, Siren, UserCheck, Settings2 } from "lucide-react"
import "../styles/AcoesRapidas.css"

const AcoesRapidas = ({ onOpenMedications, onOpenEvents, onOpenEmergency }) => {
  const navigate = useNavigate()

  const actions = useMemo(() => [
    {
      id: "medicamentos",
      title: "Medicamentos",
      description: "Veja o que precisa tomar hoje",
      icon: <HeartPulse size={26} strokeWidth={1.8} aria-hidden="true" />,
      onClick: () => onOpenMedications?.(),
    },
    {
      id: "agenda",
      title: "Agenda do dia",
      description: "Compromissos importantes",
      icon: <CalendarDays size={26} strokeWidth={1.8} aria-hidden="true" />,
      onClick: () => onOpenEvents?.(),
    },
    {
      id: "solicitacoes",
      title: "Solicitações",
      description: "Gerencie cuidadores vinculados",
      icon: <UserCheck size={26} strokeWidth={1.8} aria-hidden="true" />,
      onClick: () => navigate("/tela-idoso/solicitacoes"),
    },
    {
      id: "configuracoes",
      title: "Configurações",
      description: "Preferências de acessibilidade",
      icon: <Settings2 size={26} strokeWidth={1.8} aria-hidden="true" />,
      onClick: () => navigate("/tela-idoso/configuracoes"),
    },
    {
      id: "emergencia",
      title: "Emergência",
      description: "Chamar ajuda imediata",
      icon: <Siren size={26} strokeWidth={1.8} aria-hidden="true" />,
      onClick: () => onOpenEmergency?.(),
      variant: "danger",
    },
  ], [navigate, onOpenEmergency, onOpenEvents, onOpenMedications])

  return (
    <section className="idoso-quick-actions" aria-label="Ações rápidas">
      {actions.map(({ id, title, description, icon, onClick, variant }) => (
        <button
          key={id}
          type="button"
          className={`quick-action-card${variant ? ` quick-action-card--${variant}` : ""}`}
          onClick={onClick}
        >
          <span className="quick-action-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="quick-action-text">
            <strong>{title}</strong>
            <small>{description}</small>
          </span>
        </button>
      ))}
    </section>
  )
}

export default AcoesRapidas
