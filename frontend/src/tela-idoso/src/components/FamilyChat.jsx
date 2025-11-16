import React, { useState, useEffect, useRef } from "react";
import { MessageCircleHeart, Smile, Send } from "lucide-react";
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
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const normalizeIdentifier = (value) => (value || "").toString().replace(/\D/g, "");
  const normalizeActor = (value) => (value || "").toString().trim().toLowerCase();

  const isCurrentUser = (value) => {
    if (!value) return false;
    const normalized = normalizeActor(value);
    return [currentUser?.name, currentUser?.email, currentUser?.username]
      .filter(Boolean)
      .some((candidate) => normalizeActor(candidate) === normalized);
  };

  const resolveSenderRole = (remetente, destinatario) => {
    const normalizedSender = normalizeActor(remetente);
    const normalizedRecipient = normalizeActor(destinatario);

    if (["caregiver", "cuidador", "cuidadora"].includes(normalizedSender)) {
      return "caregiver";
    }
    if (["elderly", "idoso", "idosa"].includes(normalizedSender)) {
      return "elderly";
    }
    if (isCurrentUser(remetente)) {
      return "elderly";
    }
    if (isCurrentUser(destinatario)) {
      return "caregiver";
    }
    if (["familia", "family"].includes(normalizedSender)) {
      return "caregiver";
    }
    return "caregiver";
  };

  // Carrega cache local primeiro para resposta instantânea
  useEffect(() => {
    const normalizedCpf = normalizeIdentifier(currentUser?.cpf);
    const fallbackId = currentUser?.id ? String(currentUser.id) : null;
    const storageKey = normalizedCpf || fallbackId;
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(`familyChat_${storageKey}`);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          // Garantir ordenação crescente por timestamp
          const sorted = [...cached].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
          setMessages(sorted);
        }
      }
    } catch (_) {/* ignore */}
  }, [currentUser?.cpf, currentUser?.id]);

  // Busca periódica no backend
  useEffect(() => {
    const fetchMessages = async () => {
      const userCpf = normalizeIdentifier(currentUser?.cpf) || null;
      const userId = currentUser?.id ? String(currentUser.id) : null;
      if (!userCpf && !userId) return;
      try {
        setIsLoading(true);
        const data = await api.getMensagensDoIdoso({ cpf: userCpf, id: userId });
        const mapped = Array.isArray(data)
          ? data.map((m) => ({
              id: m.id ?? `srv_${Date.now()}_${Math.random()}`,
              fromId: m.fromId || null,
              toId: m.toId || null,
              fromCpf: normalizeIdentifier(m.remetenteCpf || m.fromCpf) || m.remetenteCpf || m.fromCpf || null,
              toCpf: normalizeIdentifier(m.destinatarioCpf || m.toCpf) || m.destinatarioCpf || m.toCpf || null,
              idosoCpf:
                normalizeIdentifier(m.idosoCpf || (m.idoso && m.idoso.cpf)) ||
                (m.idoso && String(m.idoso.id)) ||
                userCpf ||
                userId,
              senderRole: resolveSenderRole(m.remetente, m.destinatario),
              message: m.conteudo || m.message || '',
              timestamp: m.dataHora || m.timestamp || new Date().toISOString(),
              read: m.lida || m.read || false,
            }))
          : [];
        // Ordena por timestamp ASC
        const sorted = mapped.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages((prev) => {
          const byId = new Map(sorted.map((msg) => [String(msg.id), msg]));
          prev.forEach((existing) => {
            const key = String(existing.id ?? '');
            if (byId.has(key)) return;
            if (key.startsWith('tmp_')) {
              byId.set(key, existing);
            }
          });
          const merged = Array.from(byId.values()).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
          const storageKey = `familyChat_${userCpf || userId}`;
          try { localStorage.setItem(storageKey, JSON.stringify(merged)); } catch(_) {}
          return merged;
        });
        setError(null);
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
  }, [currentUser?.cpf, currentUser?.id]);
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
    const userCpf = normalizeIdentifier(currentUser?.cpf) || null;
    const userId = currentUser?.id ? String(currentUser.id) : null;
    if (!newMessage.trim() || (!userCpf && !userId)) return;
    setIsSending(true);
    const mensagem = {
      conteudo: newMessage,
      remetente: currentUser?.name || currentUser?.email || 'Idoso',
      destinatario: 'Cuidador',
    };
    if (currentUser?.id) {
      mensagem.idoso = { id: currentUser.id };
    }
    if (userCpf) {
      mensagem.idosoCpf = userCpf;
    }

    // Otimisticamente adiciona mensagem local
    const optimistic = {
      id: `tmp_${Date.now()}`,
      fromId: currentUser?.id || null,
      toId: null,
      fromCpf: userCpf || userId,
      toCpf: null,
      idosoCpf: userCpf || userId,
      senderRole: resolveSenderRole(mensagem.remetente, mensagem.destinatario),
      message: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => {
      const next = [...prev, optimistic];
      const storageKey = `familyChat_${userCpf || userId}`;
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch(_) {}
      return next;
    })

    try {
      const novaMensagem = await api.enviarMensagem({ cpf: userCpf, id: userId }, mensagem);
      // Mapear resposta do backend para a mensagem real
      const mapped = {
        id: novaMensagem.id ?? optimistic.id,
        fromId: novaMensagem.fromId || currentUser?.id || null,
        toId: novaMensagem.toId || null,
        fromCpf: normalizeIdentifier(novaMensagem.fromCpf) || novaMensagem.fromCpf || userCpf || userId,
        toCpf: novaMensagem.toCpf || null,
        idosoCpf: normalizeIdentifier(novaMensagem.idosoCpf) || novaMensagem.idosoCpf || userCpf || userId,
        senderRole: resolveSenderRole(novaMensagem.remetente, novaMensagem.destinatario),
        message: novaMensagem.conteudo || newMessage,
        timestamp: novaMensagem.dataHora || new Date().toISOString(),
        read: novaMensagem.lida || false,
      }
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === optimistic.id ? mapped : m));
        const storageKey = `familyChat_${userCpf || userId}`;
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch(_) {}
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
        const storageKey = `familyChat_${userCpf || userId}`;
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch(_) {}
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
      const normalizedCpf = normalizeIdentifier(currentUser?.cpf)
      const fallbackId = currentUser?.id ? String(currentUser.id) : null
      const storageKey = normalizedCpf || fallbackId
      const matchesCurrentElderly = () => {
        if (!storageKey) return false
        const candidateCpfs = [msg.idosoCpf, msg.toCpf, msg.fromCpf].map(normalizeIdentifier).filter(Boolean)
        if (normalizedCpf && candidateCpfs.length && candidateCpfs.includes(normalizedCpf)) {
          return true
        }
        const candidateIds = [msg.idosoId, msg.toId, msg.fromId]
          .map((value) => (value !== undefined && value !== null ? String(value) : null))
          .filter(Boolean)
        if (fallbackId && candidateIds.length && candidateIds.includes(fallbackId)) {
          return true
        }
        if (!normalizedCpf && !fallbackId) {
          return msg.senderRole !== 'caregiver'
        }
        return !normalizedCpf && candidateCpfs.length === 0
      }

      if (!matchesCurrentElderly()) {
        return
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
        if (storageKey) {
          try { localStorage.setItem(`familyChat_${storageKey}`, JSON.stringify(next)); } catch(_) {}
        }
        return next;
      })
    }

    window.addEventListener('message:received', onRemoteMessage)
    return () => window.removeEventListener('message:received', onRemoteMessage)
  }, [currentUser?.cpf, currentUser?.id])

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
        <MessageCircleHeart size={20} />
        <span>Mensagens com o cuidador</span>
      </div>

      <div className="family-chat-body" ref={chatBodyRef}>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : messages.length === 0 ? (
          <div className="family-message empty">
            <span>Inicie uma conversa com o cuidador.</span>
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
                <p className="from">{msg.senderRole === 'elderly' ? 'Você' : 'Cuidador'}</p>
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
          placeholder="Envie uma mensagem para o cuidador..."
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
