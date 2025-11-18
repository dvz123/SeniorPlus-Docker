const RESIDENT_STORAGE_KEYS = [
  "residentProfile",
  "elderlyProfile",
  "elderlyData",
  "idosoProfile",
  "caregiverProfile",
];

const CPF_CANDIDATE_KEYS = [
  "cpf",
  "idosoCpf",
  "cpfUsuario",
  "documento",
  "document",
  "cpfIdoso",
  "documentNumber",
  "cpfSelecionado",
  "cpf_responsavel",
  "cpfElderly",
  "cpfPaciente",
];

const ID_CANDIDATE_KEYS = [
  "id",
  "idosoId",
  "idoso_id",
  "codigo",
  "identifier",
  "identificador",
  "elderlyId",
  "residentId",
  "pessoaId",
  "pacienteId",
];

const NESTED_IDENTITY_KEYS = [
  "idoso",
  "elderly",
  "resident",
  "profile",
  "elderlyProfile",
  "assistedPerson",
  "dados",
  "data",
  "info",
  "informacoes",
  "usuario",
  "user",
  "pessoa",
  "paciente",
  "registro",
];

const CAREGIVER_SINGLE_KEYS = [
  "cuidador",
  "caregiver",
  "responsavel",
  "tutor",
  "familiar",
  "principalCaregiver",
  "caregiverProfile",
];

const CAREGIVER_ARRAY_KEYS = [
  "cuidadores",
  "caregivers",
  "responsaveis",
  "familiares",
  "tutores",
  "caregiverList",
  "listaCuidadores",
];

const normalizeIdentifierDigits = (value) => {
  if (value === undefined || value === null) return "";
  return value.toString().replace(/\D/g, "");
};

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
};

const collectStoredResidentEntries = () => {
  if (typeof window === "undefined") return [];
  const entries = [];
  for (const key of RESIDENT_STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    const parsed = safeJsonParse(raw);
    if (!parsed) continue;
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (item && typeof item === "object") {
          entries.push(item);
        }
      });
    } else if (typeof parsed === "object") {
      entries.push(parsed);
    }
  }
  return entries;
};

const collectIdentitySources = (baseSources = []) => {
  const sources = [];
  const seen = new Set();
  const push = (candidate) => {
    if (!candidate || typeof candidate !== "object") return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    sources.push(candidate);
  };

  baseSources.forEach(push);

  baseSources.forEach((source) => {
    if (!source || typeof source !== "object") return;
    NESTED_IDENTITY_KEYS.forEach((key) => {
      const nested = source[key];
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        push(nested);
      }
    });
  });

  return sources;
};

const resolveResidentCpf = (sources = []) => {
  const candidates = [];
  sources.forEach((source) => {
    if (!source || typeof source !== "object") return;
    CPF_CANDIDATE_KEYS.forEach((key) => {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") {
        candidates.push(value);
      }
    });
  });

  for (const value of candidates) {
    const digits = normalizeIdentifierDigits(value);
    if (digits.length === 11) return digits;
  }
  for (const value of candidates) {
    const digits = normalizeIdentifierDigits(value);
    if (digits) return digits;
  }
  for (const value of candidates) {
    const trimmed = value?.toString().trim();
    if (trimmed) return trimmed;
  }
  return null;
};

const resolveResidentId = (sources = []) => {
  const candidates = [];
  sources.forEach((source) => {
    if (!source || typeof source !== "object") return;
    ID_CANDIDATE_KEYS.forEach((key) => {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") {
        candidates.push(value);
      }
    });
  });

  for (const value of candidates) {
    const trimmed = value?.toString().trim();
    if (trimmed) return trimmed;
  }
  return null;
};

const normalizeCaregiverRecord = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  const nome = entry.nome || entry.name || entry.displayName;
  if (!nome || !nome.toString().trim()) return null;
  return {
    nome: nome.toString().trim(),
    cpf: entry.cpf || entry.cuidadorCpf || entry.id || null,
    email: entry.email || entry.mail || entry.contato || null,
    telefone: entry.telefone || entry.phone || entry.celular || null,
    fotoUrl: entry.fotoUrl || entry.photoUrl || entry.avatarUrl || entry.foto || null,
  };
};

const collectCaregiverCandidates = (source) => {
  if (!source || typeof source !== "object") return [];
  const list = [];

  const pushCandidate = (candidate) => {
    const normalized = normalizeCaregiverRecord(candidate);
    if (normalized) list.push(normalized);
  };

  CAREGIVER_SINGLE_KEYS.forEach((key) => {
    const candidate = source[key];
    if (!candidate) return;
    if (Array.isArray(candidate)) {
      candidate.forEach(pushCandidate);
    } else {
      pushCandidate(candidate);
    }
  });

  CAREGIVER_ARRAY_KEYS.forEach((key) => {
    const candidateList = source[key];
    if (!Array.isArray(candidateList)) return;
    candidateList.forEach(pushCandidate);
  });

  return list;
};

const mergeIdentityRecords = (current = [], incoming = []) => {
  const map = new Map();

  const upsert = (record) => {
    if (!record || typeof record !== "object") return;
    const sources = collectIdentitySources([record]);
    const cpf = resolveResidentCpf(sources);
    const id = resolveResidentId(sources);
    const nome = (record.nome || record.name || record.displayName || "").toString().toLowerCase();
    const key = cpf ? `cpf:${cpf}` : id ? `id:${id}` : nome ? `nome:${nome}` : `anon:${map.size}`;
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...record } : record);
  };

  current.forEach(upsert);
  incoming.forEach(upsert);

  return Array.from(map.values());
};

export {
  RESIDENT_STORAGE_KEYS,
  normalizeIdentifierDigits,
  collectStoredResidentEntries,
  collectIdentitySources,
  resolveResidentCpf,
  resolveResidentId,
  collectCaregiverCandidates,
  mergeIdentityRecords,
};
