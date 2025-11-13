// Configuração básica para API
// Se REACT_APP_API_URL estiver definido no build/runtime, ele será usado como prefixo.
// Caso contrário, usamos o backend local
// Se definido como '/api', usaremos caminhos relativos para funcionar via proxy do Nginx.
// Caso seja uma URL absoluta, concatenamos normalmente.
const RAW_BASE = process.env.REACT_APP_API_URL || ""; // preferir vazio para usar fetch relativo
const isRelativeProxy = RAW_BASE === "/api" || RAW_BASE === "";
const API_URL = RAW_BASE.endsWith("/") ? RAW_BASE.slice(0, -1) : RAW_BASE; // normalizar sem barra final
const ENABLE_API_MOCKS = process.env.REACT_APP_ENABLE_API_MOCKS === "true";

// Variável interna para armazenar o token em memória
let authToken = null;

// Cria um erro padronizado com status e detalhes da resposta
async function buildApiError(response) {
  let message = `Erro ${response.status}`;
  let details = null;
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      details = body;
      message = body.erro || body.error || body.message || message;
    } else {
      const text = await response.text();
      if (text) message = text;
    }
  } catch (_) {
    // ignora falha ao ler corpo de erro; usa mensagem padrão
  }
  // Fallback amigável por status quando a API não envia mensagem útil
  const fallback = (status) => {
    switch (status) {
      case 400:
        return 'Requisição inválida. Verifique os dados informados.';
      case 401:
        return 'Usuário ou senha inválidos.';
      case 403:
        return 'Acesso negado. Você não tem permissão ou sua conta ainda não está habilitada.';
      case 404:
        return 'Recurso não encontrado.';
      case 409:
        return 'Conflito de dados. Já existe um cadastro com essas informações.';
      case 422:
        return 'Dados inválidos. Corrija os campos e tente novamente.';
      case 429:
        return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
      default:
        return status >= 500
          ? 'Falha no servidor. Tente novamente mais tarde.'
          : 'Não foi possível concluir sua solicitação.';
    }
  };
  if (typeof message === 'string') {
    const trimmed = message.trim().toLowerCase();
    if (trimmed.startsWith('<') || trimmed.includes('<html')) {
      message = fallback(response.status);
    }
  }
  // Se veio só "Erro <status>" ou vazio, aplica fallback amigável
  if (!message || /^Erro\s+\d+$/i.test(String(message))) {
    message = fallback(response.status);
  }
  const err = new Error(message);
  err.status = response.status;
  err.details = details;
  return err;
}

// Função para simular respostas da API em desenvolvimento
function simulateResponse(endpoint, data = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (endpoint.includes("/auth/login")) {
        resolve({
          user: {
            id: "1",
            name: "Usuário Teste",
            email: data.email || "usuario@teste.com",
          },
          token: "mock-jwt-token",
        });
      } else if (endpoint.includes("/auth/register")) {
        resolve({
          user: {
            id: "1",
            name: data.name || "Novo Usuário",
            email: data.email || "novo@usuario.com",
          },
          token: "mock-jwt-token",
        });
      } else if (endpoint.includes("/auth/me")) {
        resolve({
          id: "1",
          name: "Usuário Teste",
          email: "usuario@teste.com",
        });
      } else if (endpoint.includes("/elderly")) {
        resolve({
          id: "1",
          name: "João da Silva",
          birthDate: "1940-05-15",
          address: "Rua das Flores, 123",
          phone: "(11) 99999-8888",
        });
      } else if (endpoint.includes("/mensagens")) {
        // Simula um histórico de mensagens entre cuidador e idoso
        const msgs = [
          {
            id: "m1",
            fromId: "1",
            toId: data?.idosoId || "1",
            sender: "caregiver",
            message: "Olá, tudo bem?",
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            read: true,
          },
          {
            id: "m2",
            fromId: data?.idosoId || "1",
            toId: "1",
            sender: "elderly",
            message: "Sim, obrigado!",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false,
          },
        ]
        // Se for POST (envio), retorna o payload como mensagem salva
        if (endpoint.startsWith("/mensagens") && data && Object.keys(data).length > 0) {
          const newMsg = {
            id: `m_${Date.now()}`,
            ...data,
            read: false,
          }
          resolve(newMsg)
        } else {
          resolve(msgs)
        }
      } else {
        resolve({ success: true });
      }
    }, 500);
  });
}

const shouldAttachAuthHeader = (endpoint = "") => {
  const path = endpoint.split("?")[0].toLowerCase()
  return !(
    path.startsWith("/api/v1/auth/login") ||
    path.startsWith("/api/v1/auth/register") ||
    path.startsWith("/api/v1/auth/refresh") ||
    path.startsWith("/api/v1/reset-senha")
  )
}

// API methods
export const api = {
  // Endpoints para Eventos
  getEventosDeHoje: async (idosoId) => {
    return api.get(`/eventos/hoje?idosoId=${idosoId}`);
  },
  atualizarStatusEvento: async (eventoId, status) => {
    return api.put(`/eventos/${eventoId}/status`, { status });
  },

  // Endpoints para Medicamentos
  getMedicamentosDeHoje: async (idosoId) => {
    return api.get(`/medicamentos/hoje?idosoId=${idosoId}`);
  },

  // Endpoints para Mensagens
  getMensagensDoIdoso: async (idosoId) => {
    // backend expõe /api/mensagens
    return api.get(`/api/mensagens?idosoId=${idosoId}`);
  },
  enviarMensagem: async (mensagem) => {
    return api.post('/api/mensagens', mensagem);
  },

  // Função para fazer requisições GET
  get: async (endpoint) => {
    try {
      // Usa token da memória ou localStorage (chave correta: authToken)
      const token =
        authToken || localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const headers = token && shouldAttachAuthHeader(endpoint)
        ? { Authorization: `Bearer ${token}` }
        : {};

  const url = isRelativeProxy ? `${endpoint}` : `${API_URL}${endpoint}`;
  const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        if (ENABLE_API_MOCKS && (response.status === 401 || response.status === 403)) {
          try {
            const sim = await simulateResponse(endpoint)
            return sim
          } catch (_) {}
        }
        throw await buildApiError(response);
      }

      return await response.json();
    } catch (error) {
      console.warn("Erro na requisição GET", error);
      if (ENABLE_API_MOCKS) {
        try {
          const sim = await simulateResponse(endpoint)
          return sim
        } catch (e) {
          console.error("simulateResponse também falhou:", e)
        }
      }
      throw error
    }
  },

  // Função para fazer requisições POST
  post: async (endpoint, data) => {
    try {
      const token =
        authToken || localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const headers = token && shouldAttachAuthHeader(endpoint)
        ? { Authorization: `Bearer ${token}` }
        : {};

  const url = isRelativeProxy ? `${endpoint}` : `${API_URL}${endpoint}`;
  const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (ENABLE_API_MOCKS && (response.status === 401 || response.status === 403)) {
          try {
            const sim = await simulateResponse(endpoint, data)
            return sim
          } catch (_) {}
        }
        throw await buildApiError(response);
      }

      return await response.json();
    } catch (error) {
      console.warn("Erro na requisição POST", error);
      if (ENABLE_API_MOCKS) {
        try {
          const sim = await simulateResponse(endpoint, data)
          return sim
        } catch (e) {
          console.error("simulateResponse também falhou:", e)
        }
      }
      throw error
    }
  },

  // Função para fazer requisições PUT
  put: async (endpoint, data) => {
    try {
      const token =
        authToken || localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const headers = token && shouldAttachAuthHeader(endpoint)
        ? { Authorization: `Bearer ${token}` }
        : {};

  const url = isRelativeProxy ? `${endpoint}` : `${API_URL}${endpoint}`;
  const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (ENABLE_API_MOCKS && (response.status === 401 || response.status === 403)) {
          try {
            const sim = await simulateResponse(endpoint, data)
            return sim
          } catch (_) {}
        }
        throw await buildApiError(response);
      }

      return await response.json();
    } catch (error) {
      console.warn("Erro na requisição PUT", error);
      if (ENABLE_API_MOCKS) {
        try {
          const sim = await simulateResponse(endpoint, data)
          return sim
        } catch (e) {
          console.error("simulateResponse também falhou:", e)
        }
      }
      throw error
    }
  },

  // Função para fazer requisições DELETE
  delete: async (endpoint, data) => {
    try {
      const token =
        authToken || localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
      const headers = token && shouldAttachAuthHeader(endpoint)
        ? { Authorization: `Bearer ${token}` }
        : {}

  const url = isRelativeProxy ? `${endpoint}` : `${API_URL}${endpoint}`;
  const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        throw await buildApiError(response)
      }

      if (response.status === 204) {
        return null
      }

      const texto = await response.text()
      if (!texto) {
        return null
      }

      try {
        return JSON.parse(texto)
      } catch (e) {
        return texto
      }
    } catch (error) {
      console.warn("Erro na requisição DELETE", error)
      throw error
    }
  },

  setAuthToken: (token) => {
    authToken = token;
  },
};
