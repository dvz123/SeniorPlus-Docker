import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Smile, Send } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import "../styles/FamilyChat.css";
import { api } from "../../../tela-auth/src/services/api";
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorMessage from "../../../components/ErrorMessage";
import useResidentIdentity from "../hooks/useResidentIdentity";
import {
  normalizeIdentifierDigits,
  collectStoredResidentEntries,
  collectIdentitySources,
  resolveResidentCpf,
  resolveResidentId,
  collectCaregiverCandidates,
  mergeIdentityRecords,
} from "../../../utils/chatIdentity";
const MIN_VISIBLE_MESSAGES = 30;
const DISPLAY_TIMEZONE = "America/Sao_Paulo";

const ISO_NO_TZ_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;
const DASHED_SPACE_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

const detectPreferredTimeZone = () => {
  if (typeof window === "undefined") {
    return DISPLAY_TIMEZONE;
  }

  try {
    const horaAtualElement = window.document.querySelector?.(".hora-atual");
    if (horaAtualElement?.dataset?.timezone) {
      return horaAtualElement.dataset.timezone;
    }

    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return resolved || DISPLAY_TIMEZONE;
  } catch (error) {
    console.warn("Não foi possível detectar o fuso horário preferido; usando padrão", error);
    return DISPLAY_TIMEZONE;
  }
};

const normalizeIdentifier = (value) => normalizeIdentifierDigits(value);
const normalizeActor = (value) => (value || "").toString().trim().toLowerCase();
const getMessageStorageKey = (cpf, id) => cpf || id || null;

const createDateFromParts = (
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  assumeUtc = false,
) => {
  const base = assumeUtc
    ? new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond))
    : new Date(year, month - 1, day, hour, minute, second, millisecond);
  return Number.isNaN(base.getTime()) ? null : base;
};

const hasExplicitTimezone = (input) => /([zZ]|[+-]\d{2}:?\d{2})$/.test(input);

const parseTimestampValue = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const normalized = value < 1e12 ? value * 1000 : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (!Number.isNaN(numeric)) {
        const normalized = trimmed.length <= 10 ? numeric * 1000 : numeric;
        const date = new Date(normalized);
        if (!Number.isNaN(date.getTime())) return date;
      }
    }

    const brMatch = trimmed.match(
      /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
    );
    if (brMatch) {
      const [, day, month, year, hour = "0", minute = "0", second = "0"] = brMatch;
      return createDateFromParts(
        Number(year),
        Number(month),
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        0,
        false,
      );
    }

    if (hasExplicitTimezone(trimmed)) {
      const normalized = /^\d{4}-\d{2}-\d{2}\s/.test(trimmed)
        ? trimmed.replace(" ", "T")
        : trimmed;
      const parsed = new Date(normalized);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const isoNoTzMatch = trimmed.match(ISO_NO_TZ_REGEX);
    if (isoNoTzMatch) {
      const [, year, month, day, hourGroup, minuteGroup, secondGroup, millisecondGroup] = isoNoTzMatch;
      const msValue = (millisecondGroup ?? "0").padEnd(3, "0");
      const hasTimePortion = hourGroup !== undefined && hourGroup !== null;
      return createDateFromParts(
        Number(year),
        Number(month),
        Number(day),
        Number(hourGroup ?? "0"),
        Number(minuteGroup ?? "0"),
        Number(secondGroup ?? "0"),
        Number(msValue),
        Boolean(hasTimePortion),
      );
    }

    const dashedMatch = trimmed.match(DASHED_SPACE_REGEX);
    if (dashedMatch) {
      const [, year, month, day, hour, minute, second = "0", millisecond = "0"] = dashedMatch;
      return createDateFromParts(
        Number(year),
        Number(month),
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        Number(millisecond.padEnd(3, "0")),
        true,
      );
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const ensureIsoTimestamp = (value) => {
  const parsed = parseTimestampValue(value);
  return parsed ? parsed.toISOString() : new Date().toISOString();
};

const compareByTimestamp = (a, b) => {
  const dateA = parseTimestampValue(a?.timestamp) || new Date(0);
  const dateB = parseTimestampValue(b?.timestamp) || new Date(0);
  return dateA - dateB;
};

const dedupeCaregiverCandidates = (candidates) => {
  const seen = new Set();
  const list = [];
  candidates.forEach((candidate) => {
    if (!candidate) return;
    const cpfKey = normalizeIdentifier(candidate.cpf);
    const nameKey = (candidate.nome || "").toLowerCase();
    const key = cpfKey ? `cpf:${cpfKey}` : nameKey ? `nome:${nameKey}` : `anon:${seen.size}`;
    if (seen.has(key)) return;
    seen.add(key);
    list.push(candidate);
  });
  return list;
};

const pickPrimaryCaregiver = (records) => {
  const candidates = dedupeCaregiverCandidates(records);
  if (candidates.length === 0) return null;
  return candidates.find((candidate) => candidate.cpf) || candidates[0];
};

const FamilyChat = () => {
  const [messages, setMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(MIN_VISIBLE_MESSAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [caregiver, setCaregiver] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [composerStatus, setComposerStatus] = useState(null);
  const [residentRecords, setResidentRecords] = useState(() => collectStoredResidentEntries());
  const [preferredTimeZone, setPreferredTimeZone] = useState(() => detectPreferredTimeZone());

  const { currentUser } = useAuth();
  const { profile: residentProfile } = useResidentIdentity({ currentUser });

  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);
  const initialLoadRef = useRef(true);
  const isFetchingRef = useRef(false);
  const composerStatusTimeoutRef = useRef(null);

  const showComposerStatus = useCallback((type, message) => {
    if (!message) {
      setComposerStatus(null);
      if (composerStatusTimeoutRef.current) {
        clearTimeout(composerStatusTimeoutRef.current);
        composerStatusTimeoutRef.current = null;
      }
      return;
    }

    setComposerStatus({ type, message });
    if (composerStatusTimeoutRef.current) {
      clearTimeout(composerStatusTimeoutRef.current);
    }
    composerStatusTimeoutRef.current = setTimeout(() => {
      setComposerStatus(null);
      composerStatusTimeoutRef.current = null;
    }, 4000);
  }, []);

  useEffect(
    () => () => {
      if (composerStatusTimeoutRef.current) {
        clearTimeout(composerStatusTimeoutRef.current);
      }
    },
    [],
  );

  const updateCaregiverFromRecords = useCallback((records) => {
    const candidates = [];
    records.forEach((record) => {
      candidates.push(...collectCaregiverCandidates(record));
    });
    const primary = pickPrimaryCaregiver(candidates);
    if (!primary) return;
    setCaregiver((prev) => {
      if (prev && prev.nome === primary.nome && prev.cpf === primary.cpf) {
        return prev;
      }
      return primary;
    });
  }, []);

  useEffect(() => {
    const refreshFromStorage = () => {
      const entries = collectStoredResidentEntries();
      setResidentRecords((prev) => mergeIdentityRecords(prev, entries));
      updateCaregiverFromRecords(entries);
    };

    refreshFromStorage();

    if (typeof window !== "undefined") {
      window.addEventListener("storage", refreshFromStorage);
      window.addEventListener("residentProfileUpdated", refreshFromStorage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", refreshFromStorage);
        window.removeEventListener("residentProfileUpdated", refreshFromStorage);
      }
    };
  }, [updateCaregiverFromRecords]);

  useEffect(() => {
    if (!residentProfile) return;
    setResidentRecords((prev) => mergeIdentityRecords(prev, [residentProfile]));
    updateCaregiverFromRecords([residentProfile]);
  }, [residentProfile, updateCaregiverFromRecords]);

  useEffect(() => {
    if (!currentUser) return undefined;

    let cancelled = false;

    const fetchCaregiverProfile = async () => {
      try {
        const response = await api.get("/api/v1/idoso/informacoesIdoso");
        const payloads = Array.isArray(response) ? response : [response];
        const valid = payloads.filter((item) => item && typeof item === "object");
        if (cancelled) return;

        if (valid.length > 0) {
          setResidentRecords((prev) => mergeIdentityRecords(prev, valid));
          updateCaregiverFromRecords(valid);
        }

        if (valid.length > 0 && typeof window !== "undefined") {
          try {
            const caregivers = valid.flatMap((entry) => collectCaregiverCandidates(entry));
            const enriched = {
              ...(valid[0] && typeof valid[0] === "object" ? valid[0] : {}),
              cuidadores: caregivers,
            };
            window.localStorage.setItem("residentProfile", JSON.stringify(enriched));
            window.dispatchEvent(new Event("residentProfileUpdated"));
          } catch (persistError) {
            console.warn("Não foi possível persistir o perfil do residente", persistError);
          }
        }
      } catch (caregiverError) {
        console.error("Erro ao carregar dados do cuidador vinculado:", caregiverError);
      }
    };

    fetchCaregiverProfile();
    return () => {
      cancelled = true;
    };
  }, [currentUser, updateCaregiverFromRecords]);

  const identitySources = useMemo(() => {
    const base = [
      currentUser,
      currentUser?.profile,
      currentUser?.elderlyProfile,
      currentUser?.assistedPerson,
      residentProfile,
      ...residentRecords,
    ];
    return collectIdentitySources(base);
  }, [currentUser, residentProfile, residentRecords]);

  const normalizedUserCpf = useMemo(
    () => resolveResidentCpf(identitySources),
    [identitySources],
  );

  const normalizedUserId = useMemo(
    () => resolveResidentId(identitySources),
    [identitySources],
  );

  const storageKey = useMemo(
    () => getMessageStorageKey(normalizedUserCpf, normalizedUserId),
    [normalizedUserCpf, normalizedUserId],
  );

  const displayedMessages = useMemo(() => {
    const total = messages.length;
    const startIndex = Math.max(0, total - visibleCount);
    return {
      items: messages.slice(startIndex),
      hasMore: startIndex > 0,
    };
  }, [messages, visibleCount]);

  const isCurrentUser = useCallback(
    (value) => {
      if (!value) return false;
      const normalized = normalizeActor(value);
      return [currentUser?.name, currentUser?.email, currentUser?.username]
        .filter(Boolean)
        .some((candidate) => normalizeActor(candidate) === normalized);
    },
    [currentUser?.email, currentUser?.name, currentUser?.username],
  );

  const caregiverInitials = useMemo(() => {
    if (!caregiver?.nome) return "ES";
    return caregiver.nome
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }, [caregiver?.nome]);

  const determineSenderRole = useCallback(
    ({ remetente, destinatario, fromCpf, toCpf, fromId, toId }) => {
      const normalizedSender = normalizeActor(remetente);
      const normalizedRecipient = normalizeActor(destinatario);
      const senderCpf = normalizeIdentifier(fromCpf);
      const recipientCpf = normalizeIdentifier(toCpf);
      const senderId = fromId !== undefined && fromId !== null ? String(fromId) : null;
      const recipientId = toId !== undefined && toId !== null ? String(toId) : null;

      if (["elderly", "idoso", "idosa", "resident"].includes(normalizedSender)) {
        return "elderly";
      }

      if (["caregiver", "cuidador", "cuidadora", "familia", "family", "instituicao", "instituição"].includes(normalizedSender)) {
        return "caregiver";
      }

      if (["elderly", "idoso", "idosa"].includes(normalizedRecipient)) {
        return "caregiver";
      }

      if (normalizedUserCpf && senderCpf && senderCpf === normalizedUserCpf) {
        return "elderly";
      }

      if (normalizedUserId && senderId && senderId === normalizedUserId) {
        return "elderly";
      }

      if (normalizedUserCpf && recipientCpf && recipientCpf === normalizedUserCpf) {
        return "caregiver";
      }

      if (normalizedUserId && recipientId && recipientId === normalizedUserId) {
        return "caregiver";
      }

      if (isCurrentUser(remetente)) {
        return "elderly";
      }

      if (isCurrentUser(destinatario)) {
        return "caregiver";
      }

      return "caregiver";
    },
    [isCurrentUser, normalizedUserCpf, normalizedUserId],
  );

  

  useEffect(() => {
    if (!storageKey) return;

    try {
      const raw = localStorage.getItem(`familyChat_${storageKey}`);
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (Array.isArray(cached) && cached.length > 0) {
        const sorted = [...cached].sort(compareByTimestamp);
        setMessages(sorted);
        setVisibleCount((prev) => Math.max(prev, Math.min(sorted.length, MIN_VISIBLE_MESSAGES)));
      }
    } catch (storageError) {
      console.warn("Falha ao carregar histórico do chat local", storageError);
    }
  }, [storageKey]);

  const mapMessageFromBackend = useCallback(
    (raw) => {
      const fromId = raw?.fromId !== undefined && raw?.fromId !== null ? String(raw.fromId) : null;
      const toId = raw?.toId !== undefined && raw?.toId !== null ? String(raw.toId) : null;
      const fromCpfNormalized = normalizeIdentifier(raw?.remetenteCpf || raw?.fromCpf);
      const toCpfNormalized = normalizeIdentifier(raw?.destinatarioCpf || raw?.toCpf);
      const idosoCpfNormalized = normalizeIdentifier(raw?.idosoCpf || raw?.idoso?.cpf);
      const idosoIdValue =
        raw?.idosoId ??
        raw?.idoso_id ??
        raw?.idoso?.id ??
        raw?.elderlyId ??
        raw?.residentId ??
        null;
      const idosoId =
        idosoIdValue !== undefined && idosoIdValue !== null && idosoIdValue !== ""
          ? String(idosoIdValue)
          : null;
      const timestampSource =
        raw?.dataHora ||
        raw?.datahora ||
        raw?.timestamp ||
        raw?.createdAt ||
        raw?.created_at ||
        raw?.dataCriacao ||
        raw?.data_criacao;
      const timestamp = ensureIsoTimestamp(timestampSource);

      const senderName = raw?.remetente || raw?.senderName || raw?.remetenteNome || "";
      const recipientName = raw?.destinatario || raw?.recipientName || raw?.destinatarioNome || "";

      const mapped = {
        id: raw?.id ?? `srv_${Date.now()}_${Math.random()}`,
        fromId,
        toId,
        fromCpf: fromCpfNormalized || raw?.remetenteCpf || raw?.fromCpf || null,
        toCpf: toCpfNormalized || raw?.destinatarioCpf || raw?.toCpf || null,
        idosoCpf:
          idosoCpfNormalized ||
          (raw?.idoso && normalizeIdentifier(raw.idoso.cpf)) ||
          null,
        idosoId,
        senderName,
        recipientName,
        message: raw?.conteudo || raw?.message || "",
        timestamp,
        read: raw?.lida || raw?.read || false,
      };

      return {
        ...mapped,
        senderRole: determineSenderRole({
          remetente: senderName,
          destinatario: recipientName,
          fromCpf: mapped.fromCpf,
          toCpf: mapped.toCpf,
          fromId: mapped.fromId,
          toId: mapped.toId,
        }),
      };
    },
    [determineSenderRole, normalizedUserCpf, normalizedUserId],
  );

  const fetchMessages = useCallback(
    async ({ silent = false } = {}) => {
      if (isFetchingRef.current) return false;

      const userCpf = normalizedUserCpf || null;
      const userId = normalizedUserId || null;
      if (!userCpf && !userId) {
        setIsLoading(false);
        setIsSyncing(false);
        return false;
      }

      isFetchingRef.current = true;
      setIsSyncing(true);
      if (!silent && initialLoadRef.current) {
        setIsLoading(true);
      }

      try {
        const data = await api.getMensagensDoIdoso({ cpf: userCpf, id: userId });
        const mapped = Array.isArray(data) ? data.map((item) => mapMessageFromBackend(item)) : [];
        const sorted = mapped.sort(compareByTimestamp);

        setMessages((prev) => {
          const byId = new Map(sorted.map((msg) => [String(msg.id), msg]));
          prev.forEach((existing) => {
            const key = String(existing.id || "");
            if (!key) return;
            if (!byId.has(key) && key.startsWith("tmp_")) {
              byId.set(key, existing);
            }
          });
          const merged = Array.from(byId.values()).sort(compareByTimestamp);
          const storageKey = getMessageStorageKey(userCpf, userId);
          if (storageKey) {
            try {
              localStorage.setItem(`familyChat_${storageKey}`, JSON.stringify(merged));
            } catch (persistError) {
              console.warn("Não foi possível persistir o histórico do chat", persistError);
            }
          }
          return merged;
        });

        setError(null);
        setVisibleCount((prev) => Math.max(prev, MIN_VISIBLE_MESSAGES));
        return true;
      } catch (requestError) {
        console.error("Erro ao carregar mensagens:", requestError);
        setError(requestError?.message || "Não foi possível carregar as mensagens agora.");
        return false;
      } finally {
        if (initialLoadRef.current) {
          setIsLoading(false);
          initialLoadRef.current = false;
        }
        isFetchingRef.current = false;
        setIsSyncing(false);
      }
    },
    [mapMessageFromBackend, normalizedUserCpf, normalizedUserId],
  );

  useEffect(() => {
    if (!normalizedUserCpf && !normalizedUserId) return undefined;

    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages({ silent: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchMessages, normalizedUserCpf, normalizedUserId]);

  useEffect(() => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 120;
    if (isNearBottom) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const userCpf = normalizedUserCpf || null;
    const userId = normalizedUserId || null;
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || (!userCpf && !userId)) return;

    showComposerStatus(null);
    setIsSending(true);

    const remetente = currentUser?.name || currentUser?.email || "Idoso";
    const destinatario = "Cuidador";

    const mensagemPayload = {
      conteudo: trimmedMessage,
      remetente,
      destinatario,
      idoso: currentUser?.id ? { id: currentUser.id } : userId ? { id: userId } : undefined,
      idosoCpf: userCpf || undefined,
      idosoId: userId || undefined,
    };

    const optimisticMessage = {
      id: `tmp_${Date.now()}`,
      fromId: currentUser?.id || null,
      toId: userId || null,
      fromCpf: userCpf || null,
      toCpf: null,
      idosoCpf: userCpf || null,
      idosoId: userId || null,
      senderName: remetente,
      recipientName: destinatario,
      senderRole: determineSenderRole({
        remetente,
        destinatario,
        fromCpf: userCpf || null,
        toCpf: null,
        fromId: currentUser?.id || null,
        toId: userId || null,
      }),
      message: trimmedMessage,
      timestamp: ensureIsoTimestamp(Date.now()),
      read: false,
    };

    setMessages((prev) => {
      const next = [...prev, optimisticMessage];
      const storageKey = getMessageStorageKey(userCpf, userId);
      if (storageKey) {
        try {
          localStorage.setItem(`familyChat_${storageKey}`, JSON.stringify(next));
        } catch (_) {
          // ignore localStorage failures
        }
      }
      return next;
    });

    try {
      const response = await api.enviarMensagem({ cpf: userCpf, id: userId }, mensagemPayload);
      const mappedResponse = mapMessageFromBackend(response);

      setMessages((prev) => {
        const next = prev.map((message) => (message.id === optimisticMessage.id ? mappedResponse : message));
        const storageKey = getMessageStorageKey(userCpf, userId);
        if (storageKey) {
          try {
            localStorage.setItem(`familyChat_${storageKey}`, JSON.stringify(next));
          } catch (_) {
            // ignore localStorage failures
          }
        }
        return next;
      });

      setNewMessage("");
      setShowEmojiPicker(false);
      inputRef.current?.focus();
      showComposerStatus("success", "Mensagem entregue.");
      try {
        window.dispatchEvent(new CustomEvent("message:received", { detail: mappedResponse }));
      } catch (_) {
        // ignore custom event issues
      }
      fetchMessages({ silent: true });
    } catch (sendError) {
      console.error("Erro ao enviar mensagem:", sendError);
      showComposerStatus("error", "Não foi possível enviar agora. Tente novamente.");
      setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!storageKey) return undefined;
    const handleRemoteMessage = (event) => {
      const incoming = event.detail;
      if (!incoming || !incoming.id) return;

      const candidateCpfs = [incoming.idosoCpf, incoming.toCpf, incoming.fromCpf]
        .map(normalizeIdentifier)
        .filter(Boolean);
      const candidateIds = [incoming.idosoId, incoming.toId, incoming.fromId]
        .map((value) => (value !== undefined && value !== null ? String(value) : null))
        .filter(Boolean);

      const matchesCurrentElderly = () => {
        if (normalizedUserCpf && candidateCpfs.includes(normalizedUserCpf)) {
          return true;
        }
        if (normalizedUserId && candidateIds.includes(normalizedUserId)) {
          return true;
        }
        return false;
      };

      if (!matchesCurrentElderly()) {
        return;
      }

      const mapped = mapMessageFromBackend(incoming);

      setMessages((prev) => {
        if (prev.some((message) => message.id === mapped.id)) {
          return prev;
        }
        const next = [...prev, mapped].sort(compareByTimestamp);
        try {
          localStorage.setItem(`familyChat_${storageKey}`, JSON.stringify(next));
        } catch (_) {
          // ignore storage failures
        }
        return next;
      });

      fetchMessages({ silent: true });
    };

    window.addEventListener("message:received", handleRemoteMessage);
    return () => window.removeEventListener("message:received", handleRemoteMessage);
  }, [fetchMessages, mapMessageFromBackend, normalizedUserCpf, normalizedUserId, storageKey]);

  const allowSend = Boolean(newMessage.trim());

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
        inputRef.current?.focus({ preventScroll: true });
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showEmojiPicker]);

  useLayoutEffect(() => {
    setPreferredTimeZone(detectPreferredTimeZone());
  }, []);

  const readableDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: preferredTimeZone,
      }),
    [preferredTimeZone],
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: preferredTimeZone,
      }),
    [preferredTimeZone],
  );

  const getDateKey = useCallback((timestamp) => {
    const date = parseTimestampValue(timestamp);
    if (!date) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }, []);

  const formatDateLabel = useCallback(
    (timestamp) => {
      const date = parseTimestampValue(timestamp);
      if (!date) return "";
      return readableDateFormatter.format(date);
    },
    [readableDateFormatter],
  );

  const formatTimeOnly = useCallback(
    (timestamp) => {
      const date = parseTimestampValue(timestamp);
      if (!date) return "";
      return timeFormatter.format(date);
    },
    [timeFormatter],
  );

  const formatAbsoluteTimestamp = useCallback(
    (timestamp) => {
      const date = parseTimestampValue(timestamp);
      if (!date) return "";
      return `${readableDateFormatter.format(date)} · ${timeFormatter.format(date)}`;
    },
    [readableDateFormatter, timeFormatter],
  );

  const lastMessageTimestamp = useMemo(() => {
    if (!messages.length) return null;
    const latest = messages[messages.length - 1];
    return latest?.timestamp || null;
  }, [messages]);

  const isElderlyMessage = useCallback(
    (message) => {
      if (!message) return false;
      if (message.senderRole === "elderly") return true;
      const fromCpf = normalizeIdentifier(message.fromCpf);
      if (normalizedUserCpf && fromCpf && fromCpf === normalizedUserCpf) return true;
      const fromId = message.fromId !== undefined && message.fromId !== null ? String(message.fromId) : null;
      if (normalizedUserId && fromId && fromId === normalizedUserId) return true;
      const normalizedSender = normalizeActor(message.senderName || message.remetente);
      if (["elderly", "idoso", "idosa", "resident"].includes(normalizedSender)) return true;
      return false;
    },
    [normalizedUserCpf, normalizedUserId],
  );

  const getSenderDisplayName = useCallback(
    (message) => {
      if (isElderlyMessage(message)) {
        return "Você";
      }
      if (message?.senderName) {
        return message.senderName;
      }
      return caregiver?.nome || "Cuidador";
    },
    [caregiver?.nome, isElderlyMessage],
  );

  useEffect(() => {
    if (!storageKey) return undefined;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchMessages({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchMessages, storageKey]);

  return (
    <div className="family-chat-card">
      <div className="family-chat-top">
        <div className="family-chat-contact" aria-live="polite">
          <div className="family-chat-avatar" aria-hidden={!caregiver}>
            {caregiver?.fotoUrl ? (
              <img
                src={caregiver.fotoUrl}
                alt={caregiver?.nome ? `Foto de ${caregiver.nome}` : "Foto do cuidador"}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const fallback = event.currentTarget.parentElement?.querySelector(".family-chat-avatar__initials");
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <span
              className="family-chat-avatar__initials"
              style={{ display: caregiver?.fotoUrl ? "none" : "flex" }}
            >
              {caregiverInitials}
            </span>
          </div>
          <div className="family-chat-contact__text">
            <strong className="contact-name">
              {caregiver?.nome || "Equipe Senior+"}
            </strong>
            {caregiver?.telefone || caregiver?.email ? (
              <div className="contact-chips" role="list">
                {caregiver?.telefone ? (
                  <span className="contact-chip" role="listitem">{caregiver.telefone}</span>
                ) : null}
                {caregiver?.email ? (
                  <span className="contact-chip" role="listitem">{caregiver.email}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="family-chat-body" ref={chatBodyRef}>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : messages.length === 0 ? (
          <div className="family-message empty">
            <span>
              {caregiver?.nome
                ? `Envie uma mensagem para ${caregiver.nome}.`
                : "Inicie uma conversa com o cuidador."}
            </span>
          </div>
        ) : (
          (() => {
            const { items: visibleMessages, hasMore } = displayedMessages;

            return (
              <>
                {hasMore ? (
                  <button
                    type="button"
                    className="load-more-history"
                    onClick={() => setVisibleCount((prev) => prev + MIN_VISIBLE_MESSAGES)}
                    aria-label="Carregar mensagens anteriores"
                  >
                    Carregar mais mensagens
                  </button>
                ) : null}
                {visibleMessages.map((msg, index) => {
                  const key = msg.id || `${msg.timestamp}_${index}`;
                  const dateKey = getDateKey(msg.timestamp);
                  const previous = index > 0 ? visibleMessages[index - 1] : null;
                  const previousDateKey = previous ? getDateKey(previous.timestamp) : null;
                  const showDivider = dateKey && dateKey !== previousDateKey;
                  const classes = [
                    "family-message",
                    isElderlyMessage(msg) ? "own-message" : "incoming-message",
                  ].join(" ");

                  return (
                    <React.Fragment key={key}>
                      {showDivider ? (
                        <div className="message-date-divider" aria-label={`Mensagens de ${formatDateLabel(msg.timestamp)}`}>
                          <span>{formatDateLabel(msg.timestamp)}</span>
                        </div>
                      ) : null}
                      <div className={classes}>
                        <div className="message-text">
                          <p>{msg.message}</p>
                        </div>
                        <div className="message-info">
                          <span className="message-time" title={formatAbsoluteTimestamp(msg.timestamp)}>
                            {formatTimeOnly(msg.timestamp)}
                          </span>
                          {isElderlyMessage(msg) ? (
                            <span className={`message-read${msg.read ? " is-read" : ""}`}>
                              {msg.read ? "Lida" : "Enviada"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </>
            );
          })()
        )}
      </div>

      <div className="family-chat-composer">
        <div className="family-chat-input">
          <button
            type="button"
            className="emoji-button"
            title="Emoji"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <Smile size={20} aria-hidden="true" />
          </button>

          {showEmojiPicker ? (
            <div ref={emojiPickerRef} className="emoji-picker-container">
              <EmojiPicker onEmojiClick={onEmojiClick} autoFocusSearch={false} />
            </div>
          ) : null}

          <input
            ref={inputRef}
            type="text"
            placeholder={
              caregiver?.nome
                ? `Envie uma mensagem para ${caregiver.nome}...`
                : "Envie uma mensagem para o cuidador..."
            }
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSendMessage();
              }
            }}
          />

          <button
            type="button"
            className="send-button"
            onClick={handleSendMessage}
            disabled={isSending || !allowSend}
          >
            {isSending ? <LoadingSpinner size={18} className="sending-spinner" /> : <Send size={18} aria-hidden="true" />}
          </button>
        </div>
        {composerStatus ? (
          <p className={`composer-status composer-status--${composerStatus.type}`} role="status">
            {composerStatus.message}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default FamilyChat;
