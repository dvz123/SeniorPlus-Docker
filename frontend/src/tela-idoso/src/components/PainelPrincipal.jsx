import React from 'react';
import { FaClock } from 'react-icons/fa';
import FamilyChat from './FamilyChat.jsx';
import '../styles/PainelPrincipal.css'

import { useChat } from '../../../contexts/ChatContext';
import { MessageCircle } from 'lucide-react';

const PainelPrincipal = () => {
  const { openChat } = useChat();
  const agora = new Date();

  const horaAtual = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="painel-container">
      {/* Horário e data */}
      <div className="painel-topo">
        <div className="hora">
          <FaClock size={18} />
          <span className="hora-atual">{horaAtual}</span>
        </div>
        <div className="data">{dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}</div>
      </div>

      {/* Mensagem de boas-vindas */}
      <div className="boas-vindas">
        <strong className="verde">Bem-vindo!</strong>
        <p>Sua rotina de hoje está organizada</p>
      </div>

      {/* Componente de mensagens */}
      <FamilyChat />
      <div className="painel-actions">
        <button
          type="button"
          className="painel-chat-button"
          onClick={openChat}
          aria-label="Abrir chat de ajuda"
          title="Abrir chat"
        >
          <MessageCircle size={20} /> Conversar com o cuidador
        </button>
      </div>
    </div>
  );
};
export default PainelPrincipal;
