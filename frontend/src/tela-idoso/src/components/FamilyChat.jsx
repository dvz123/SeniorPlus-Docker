import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Smile, Send } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import "../styles/FamilyChat.css";
import { api } from '../../../tela-auth/src/services/api';
import { useAuth } from '../../../tela-auth/src/contexts/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';
import { useToast } from '../../../contexts/ToastContext';

const FamilyChat = () => {
  const [messages, setMessages] = useState([]); // mensagens completas (ordenadas ASC)
  const [visibleCount, setVisibleCount] = useState(30); // quantas mensagens mostrar (lazy)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // Carrega cache local primeiro para resposta instantânea
  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(`familyChat_${user.id}`);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          // Garantir ordenação crescente por timestamp
          const sorted = [...cached].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
          setMessages(sorted);
        }
      }
    } catch (_) {/* ignore */}
  }, [user?.id]);

  // Busca periódica no backend
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const data = await api.getMensagensDoIdoso(user.id);
        const mapped = Array.isArray(data)
          ? data.map((m) => ({
              id: m.id,
              fromId: m.fromId || null,
              toId: m.toId || null,
              senderRole: (m.remetente === 'caregiver' || m.remetente === 'elderly') ? m.remetente : 'family',
              message: m.conteudo || m.message || '',
              timestamp: m.dataHora || m.timestamp || new Date().toISOString(),
              read: m.lida || m.read || false,
            }))
          : [];
        // Ordena por timestamp ASC
        const sorted = mapped.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(sorted);
        try { localStorage.setItem(`familyChat_${user.id}`, JSON.stringify(sorted)); } catch(_) {}
        // Ajusta visibleCount para mostrar pelo menos as últimas 30 (ou total se menor)
        setVisibleCount((prev) => {
          const min = 30;
            return Math.max(min, prev); // preserva se usuário já carregou mais
        });
      } catch (err) {
        setError(err.message);
        console.error('Erro ao carregar mensagens:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const chatBodyRef = useRef(null); // NOVO: ref para o body do chat

  useEffect(() => {
    // Ao atualizar mensagens, rola para o final apenas se já está perto do final (para não interromper leitura de histórico)
    if (chatBodyRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 120;
      if (isNearBottom) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;
    setIsSending(true);
    const mensagem = {
      conteudo: newMessage,
      remetente: user.name || user.email || 'Idoso',
      destinatario: 'Família',
      idoso: { id: user.id }
    };

    // Otimisticamente adiciona mensagem local
    const optimistic = {
      id: `tmp_${Date.now()}`,
      fromId: user.id,
      toId: null,
      senderRole: 'elderly',
      message: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => {
      const next = [...prev, optimistic];
      try { localStorage.setItem(`familyChat_${user.id}`, JSON.stringify(next)); } catch(_) {}
      return next;
    })

    try {
      const novaMensagem = await api.enviarMensagem(mensagem);
      // Mapear resposta do backend para a mensagem real
      const mapped = {
        id: novaMensagem.id,
        fromId: novaMensagem.fromId || user.id,
        toId: novaMensagem.toId || null,
        senderRole: (novaMensagem.remetente === 'caregiver' || novaMensagem.remetente === 'elderly') ? novaMensagem.remetente : 'elderly',
        message: novaMensagem.conteudo || newMessage,
        timestamp: novaMensagem.dataHora || new Date().toISOString(),
        read: novaMensagem.lida || false,
      }
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === optimistic.id ? mapped : m));
        try { localStorage.setItem(`familyChat_${user.id}`, JSON.stringify(next)); } catch(_) {}
        return next;
      });
      setNewMessage("");
      setShowEmojiPicker(false);
  if (showSuccess) showSuccess('Mensagem enviada com sucesso');
      // Dispatch event so other components (cuidador) can pick it up
      try {
        window.dispatchEvent(new CustomEvent('message:received', { detail: mapped }))
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
  if (showError) showError('Erro ao enviar mensagem');
      // opcional: marcar mensagem como falha; por enquanto, remove o otimistic
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== optimistic.id);
        try { localStorage.setItem(`familyChat_${user.id}`, JSON.stringify(next)); } catch(_) {}
        return next;
      });
    } finally {
      setIsSending(false);
    }
  };

  // Listener para mensagens recebidas por outros componentes
  useEffect(() => {
    function onRemoteMessage(e) {
      const msg = e.detail
      if (!msg || !msg.id) return
      // Apenas adiciona se for relevante para este usuário/idoso
      if (msg.toId === user.id || msg.fromId === user.id || msg.senderRole !== 'caregiver') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
          try { localStorage.setItem(`familyChat_${user.id}`, JSON.stringify(next)); } catch(_) {}
          return next;
        })
      }
    }

    window.addEventListener('message:received', onRemoteMessage)
    return () => window.removeEventListener('message:received', onRemoteMessage)
  }, [user?.id])

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    inputRef.current.focus();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
      inputRef.current?.focus();
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <div className="family-chat-card">
      <div className="family-chat-header">
        <MessageSquare size={20} />
        <span>Mensagens da Família</span>
      </div>

      <div className="family-chat-body" ref={chatBodyRef}>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : messages.length === 0 ? (
          <div className="family-message empty">
            <span>Nenhuma mensagem ainda.</span>
          </div>
        ) : (
          (() => {
            // Mensagens a exibir (lazy: últimas 'visibleCount')
            const total = messages.length;
            const startIndex = Math.max(0, total - visibleCount);
            const display = messages.slice(startIndex);
            const hasMore = startIndex > 0;
            return (
              <>
                {hasMore && (
                  <button
                    className="load-more-history"
                    onClick={() => setVisibleCount(v => v + 30)}
                    aria-label="Carregar mensagens anteriores"
                  >
                    Carregar mais mensagens
                  </button>
                )}
                {display.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`family-message ${msg.senderRole === "elderly" ? "own-message" : ""}`}
            >
              <div className="message-header">
                <p className="from">{msg.senderRole === 'elderly' ? 'Você' : (msg.senderRole === 'caregiver' ? 'Cuidador' : 'Família')}</p>
              </div>
              <div className="message-content">
                <p>{msg.message}</p>
                <span className="time">{new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
              </div>
            </div>
                ))}
              </>
            );
          })()
        )}
      </div>

      <div className="family-chat-input">
        <button
          className="emoji-button"
          title="Emoji"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          <Smile size={20} />
        </button>

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="emoji-picker-container">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          placeholder="Escreva sua resposta..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />

        <button 
          className="send-button" 
          onClick={handleSendMessage} 
          disabled={isSending || !newMessage.trim()}
        >
          {isSending ? (
            <LoadingSpinner size={18} className="sending-spinner" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default FamilyChat;
