import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { api } from "../../../tela-auth/src/services/api";
import { useToast } from "../../../contexts/ToastContext";
import { useAccessibility } from "../../../contexts/AccessibilityContext";
import "../styles/Solicitacoes.css";

const STATUS_LABELS = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  REJECTED: "Recusado",
};

const ACTION_LABELS = {
  aceitar: "Solicitação aceita",
  recusar: "Solicitação recusada",
};

function SolicitacoesCuidador() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { prefs } = useAccessibility();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get("/api/v1/vinculos/solicitacoes");
      const normalizado = Array.isArray(data) ? data : [];
      setRequests(normalizado);
    } catch (error) {
      console.error("Erro ao buscar solicitações", error);
      if (showError) {
        showError(error?.message || "Não foi possível carregar as solicitações.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const pendentes = useMemo(
    () => requests.filter((item) => item.status === "PENDING"),
    [requests],
  );

  const respondRequest = useCallback(
    async (id, acao) => {
      setActionLoading(id);
      try {
        const payload = { acao };
        const resposta = await api.post(`/api/v1/vinculos/solicitacoes/${id}/responder`, payload);
        setRequests((prev) =>
          prev.map((item) => (item.id === resposta.id ? resposta : item)),
        );
        await fetchRequests({ silent: true });
        if (showSuccess) {
          showSuccess(ACTION_LABELS[acao] || "Solicitação atualizada.");
        }
      } catch (error) {
        console.error("Erro ao responder solicitação", error);
        if (showError) {
          showError(error?.message || "Não foi possível atualizar a solicitação.");
        }
      } finally {
        setActionLoading(null);
      }
    },
    [fetchRequests, showError, showSuccess],
  );

  const formatDateTime = useCallback((value) => {
    if (!value) return "";
    try {
      const dt = new Date(value);
      return dt.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return value;
    }
  }, []);

  const textoIntro = useMemo(() => {
    if (loading) return "Carregando solicitações...";
    if (!requests.length) {
      return "Nenhum cuidador solicitou vínculo até o momento.";
    }
    if (!pendentes.length) {
      return "Você não possui solicitações pendentes. Confira o histórico abaixo.";
    }
    return `Você possui ${pendentes.length} solicitação${pendentes.length > 1 ? "s" : ""} aguardando aprovação.`;
  }, [loading, pendentes.length, requests.length]);

  return (
    <div className="solicitacoes-page">
      <header className="solicitacoes-header">
        <div>
          <h1>Solicitações de cuidadores</h1>
          <p>{textoIntro}</p>
        </div>
        <div className="solicitacoes-header__actions">
          <button type="button" className="ghost-button" onClick={() => navigate("/tela-idoso")}>Voltar</button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => fetchRequests()}
            disabled={loading}
          >
            <RefreshCw size={18} aria-hidden="true" className={loading ? "spin" : ""} /> Atualizar
          </button>
        </div>
      </header>

      <section className="solicitacoes-content" aria-live={prefs?.readingMode ? "polite" : "off"}>
        {loading ? (
          <div className="solicitacoes-empty">
            <Loader2 size={24} className="spin" aria-hidden="true" />
            <span>Carregando solicitações...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="solicitacoes-empty" role="status">
            <ShieldAlert size={24} aria-hidden="true" />
            <span>Quando um cuidador solicitar vínculo, você visualizará aqui.</span>
          </div>
        ) : (
          <ul className="solicitacoes-list">
            {requests.map((item) => {
              const pendente = item.status === "PENDING";
              return (
                <li key={item.id} className={`solicitacao-card status-${item.status.toLowerCase()}`}>
                  <header className="solicitacao-card__header">
                    <div className="solicitacao-solicitante">
                      <UserRound size={20} aria-hidden="true" />
                      <div>
                        <strong>{item.cuidadorNome || "Cuidador"}</strong>
                        <span>CPF {item.cuidadorCpf}</span>
                      </div>
                    </div>
                    <span className="solicitacao-status" data-status={item.status}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </header>

                  <div className="solicitacao-body">
                    {item.mensagem ? (
                      <p className="solicitacao-mensagem">“{item.mensagem}”</p>
                    ) : (
                      <p className="solicitacao-mensagem" aria-hidden="true">
                        Nenhuma mensagem adicional enviada.
                      </p>
                    )}
                    <p className="solicitacao-infos">
                      Solicitado em <strong>{formatDateTime(item.createdAt)}</strong>
                      {item.respondedAt && (
                        <>
                          ; respondido em <strong>{formatDateTime(item.respondedAt)}</strong>
                        </>
                      )}
                    </p>
                  </div>

                  <footer className="solicitacao-actions">
                    {pendente ? (
                      <>
                        <button
                          type="button"
                          className="action-button danger"
                          onClick={() => respondRequest(item.id, "recusar")}
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="spin" size={18} aria-hidden="true" />
                          ) : (
                            <XCircle size={18} aria-hidden="true" />
                          )}
                          Recusar
                        </button>
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => respondRequest(item.id, "aceitar")}
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="spin" size={18} aria-hidden="true" />
                          ) : (
                            <CheckCircle2 size={18} aria-hidden="true" />
                          )}
                          Aceitar
                        </button>
                      </>
                    ) : (
                      <span className="solicitacao-resposta" role="status">
                        {item.status === "ACCEPTED" ? (
                          <>
                            <CheckCircle2 size={18} aria-hidden="true" /> Vinculado com sucesso
                          </>
                        ) : (
                          <>
                            <XCircle size={18} aria-hidden="true" /> Solicitação recusada
                          </>
                        )}
                      </span>
                    )}
                  </footer>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default SolicitacoesCuidador;
