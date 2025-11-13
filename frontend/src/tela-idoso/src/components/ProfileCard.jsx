import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/ProfileCard.css";
import { api } from "../../../tela-auth/src/services/api";
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";

function ProfileCard() {
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const showErrorRef = useRef(showError);
  const showSuccessRef = useRef(showSuccess);

  useEffect(() => {
    showErrorRef.current = showError;
    showSuccessRef.current = showSuccess;
  }, [showError, showSuccess]);

  const calcularIdade = useCallback((dataNascimento) => {
    if (!dataNascimento) return null;
    const data = new Date(dataNascimento);
    if (Number.isNaN(data.getTime())) return null;
    const diff = Date.now() - data.getTime();
    const anos = new Date(diff).getUTCFullYear() - 1970;
    return anos >= 0 ? anos : null;
  }, []);

  const normalizarPerfil = useCallback(
    (payload = {}) => {
      const fonte = payload || {};
      const nomeBase = currentUser?.name || currentUser?.nome || currentUser?.fullName || currentUser?.username;
      const emailBase = currentUser?.email || fonte.email;

      const listaCuidadores = [];
      const fontesPossiveis = [];

      if (fonte?.cuidador) {
        fontesPossiveis.push(fonte.cuidador);
      }

      if (Array.isArray(fonte?.cuidadores)) {
        fontesPossiveis.push(...fonte.cuidadores);
      }

      fontesPossiveis
        .filter(Boolean)
        .forEach((c) => {
          const cpfCuidador = c.cpf || c.cuidadorCpf || null;
          listaCuidadores.push({
            nome: c.nome || "Cuidador vinculado",
            cpf: cpfCuidador,
            email: c.email || null,
            telefone: c.telefone || null,
          });
        });

      const deduplicados = listaCuidadores.filter((item, index, self) => {
        if (!item.cpf) {
          return index === self.findIndex((other) => !other.cpf);
        }
        return index === self.findIndex((other) => other.cpf === item.cpf);
      });

      return {
        nome: fonte.nome || nomeBase || "Usuário",
        cpf: fonte.cpf || currentUser?.cpf || "--",
        idade: calcularIdade(fonte.dataNascimento || currentUser?.dataNascimento),
        estadoCivil: fonte.estadoCivil || fonte.observacao || currentUser?.estadoCivil || null,
        tipoSanguineo: fonte.tipoSanguineo || currentUser?.tipoSanguineo || "--",
        alergias: fonte.observacao || fonte.alergia || currentUser?.observacao || null,
        telefone: fonte.telefone || currentUser?.telefone || null,
        email: emailBase || null,
        caregivers: deduplicados,
      };
    },
    [calcularIdade, currentUser]
  );

  const loadProfile = useCallback(
    async ({ silent = false, notify = false } = {}) => {
      setLoading(true);
      try {
        const data = await api.get("/api/v1/idoso/informacoesIdoso");
        const normalizado = normalizarPerfil(data);
        setProfile(normalizado);
        if (notify && normalizado && showSuccessRef.current) {
          showSuccessRef.current("Dados atualizados com sucesso.");
        }
      } catch (error) {
        console.error("Erro ao carregar dados do idoso", error);
        setProfile(normalizarPerfil());
        if (!silent && showErrorRef.current) {
          showErrorRef.current(error?.message || "Não foi possível carregar seus dados agora.");
        }
      } finally {
        setLoading(false);
      }
    },
    [normalizarPerfil]
  );

  useEffect(() => {
    setProfile(normalizarPerfil());
    if (!currentUser) {
      setLoading(false);
      return;
    }
    loadProfile({ silent: true });
  }, [currentUser?.cpf, loadProfile, normalizarPerfil]);

  const avatarInitials = useMemo(() => {
    const fonte = profile?.nome?.trim();
    if (!fonte) return "--";
    const partes = fonte.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }, [profile?.nome]);

  const caregivers = profile?.caregivers || [];
  const formatCpf = useCallback((value) => {
    if (!value) {
      return "--";
    }
    const digits = String(value).replace(/\D/g, "");
    if (digits.length !== 11) {
      return value;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }, []);

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar" aria-hidden="true">{avatarInitials}</div>
        <div className="profile-info">
          <strong>{profile?.nome || "Nome"}</strong>
          <small>CPF: {profile?.cpf || "--"}</small>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="label">Idade:</div>
          <div className="value">{profile?.idade ?? "--"}</div>

          <div className="label">Telefone:</div>
          <div className="value">{profile?.telefone || "--"}</div>
        </div>

        <div>
          <div className="label">Tipo sanguíneo:</div>
          <div className="value">{profile?.tipoSanguineo || "--"}</div>

          <div className="label">Observações:</div>
          <div className="value">
            <span className="allergy-tag">{profile?.alergias || "--"}</span>
          </div>
        </div>
      </div>

      <section className="caregiver-section" aria-live="polite">
        <h3 className="caregiver-title">Cuidadores vinculados</h3>
        {caregivers.length > 0 ? (
          <ul className="caregiver-list">
            {caregivers.map((item, idx) => (
              <li key={item.cpf || idx} className="caregiver-card">
                <div className="caregiver-name">{item.nome || "Cuidador"}</div>
                <dl className="caregiver-meta">
                  <div>
                    <dt>CPF</dt>
                    <dd>{formatCpf(item.cpf)}</dd>
                  </div>
                  <div>
                    <dt>Contato</dt>
                    <dd>{item.telefone || item.email || "—"}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="caregiver-empty">Nenhum cuidador vinculado no momento.</p>
        )}
      </section>

      <button
        type="button"
        className="load-button"
        onClick={() => loadProfile({ notify: true })}
        disabled={loading}
      >
        {loading ? "Buscando..." : "Atualizar dados"}
      </button>
    </div>
  );
}

export default ProfileCard;
