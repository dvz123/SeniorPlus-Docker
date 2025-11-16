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

      let storedCaregiverProfile = null;
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("caregiverProfile");
          if (raw) storedCaregiverProfile = JSON.parse(raw);
        } catch (error) {
          storedCaregiverProfile = null;
        }
      }

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
            email: c.email || storedCaregiverProfile?.email || null,
            telefone: c.telefone || storedCaregiverProfile?.phone || null,
            fotoUrl: c.fotoUrl || c.foto || c.avatarUrl || storedCaregiverProfile?.photoUrl || null,
            headline: c.headline || storedCaregiverProfile?.headline || null,
          });
        });

      const deduplicados = listaCuidadores.filter((item, index, self) => {
        if (!item.cpf) {
          return index === self.findIndex((other) => !other.cpf);
        }
        return index === self.findIndex((other) => other.cpf === item.cpf);
      });

      if (deduplicados.length === 0 && storedCaregiverProfile?.displayName) {
        deduplicados.push({
          nome: storedCaregiverProfile.displayName,
          cpf: storedCaregiverProfile.cpf || null,
          email: storedCaregiverProfile.email || null,
          telefone: storedCaregiverProfile.phone || null,
          fotoUrl: storedCaregiverProfile.photoUrl || null,
          headline: storedCaregiverProfile.headline || null,
        });
      }

      const idadeBase =
        fonte.idade ??
        calcularIdade(fonte.dataNascimento || currentUser?.dataNascimento);

      const alergiasBase = (() => {
        if (!fonte.alergias && !fonte.observacao) return null;
        if (Array.isArray(fonte.alergias)) return fonte.alergias;
        if (typeof fonte.alergias === 'string') return fonte.alergias;
        if (typeof fonte.observacao === 'string') return fonte.observacao;
        return null;
      })();

      return {
        nome: fonte.nome || nomeBase || "Usuário",
        cpf: fonte.cpf || currentUser?.cpf || "--",
        idade: idadeBase,
        estadoCivil: fonte.estadoCivil || fonte.observacao || currentUser?.estadoCivil || null,
        tipoSanguineo: fonte.tipoSanguineo || currentUser?.tipoSanguineo || "--",
        alergias: alergiasBase,
        telefone: fonte.telefone || currentUser?.telefone || null,
        email: emailBase || null,
        fotoUrl: fonte.fotoUrl || fonte.foto || currentUser?.fotoUrl || null,
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

  const idadeFormatada = useMemo(() => {
    if (profile?.idade == null) return "--";
    const numero = Number(profile.idade);
    if (!Number.isFinite(numero)) return profile.idade;
    return `${numero} ${numero === 1 ? 'ano' : 'anos'}`;
  }, [profile?.idade]);

  const alergiasNormalizadas = useMemo(() => {
    if (!profile?.alergias) return [];
    if (Array.isArray(profile.alergias)) {
      return profile.alergias
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .filter(Boolean);
    }
    return String(profile.alergias)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [profile?.alergias]);

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar" aria-hidden={!profile?.fotoUrl}>
          {profile?.fotoUrl ? (
            <img
              src={profile.fotoUrl}
              alt={`Foto de ${profile?.nome}`}
              onError={(event) => {
                event.currentTarget.style.display = 'none';
                const fallback = event.currentTarget.parentElement?.querySelector('.avatar-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="avatar-fallback" style={{ display: profile?.fotoUrl ? 'none' : 'flex' }}>
            {avatarInitials}
          </div>
        </div>
        <div className="profile-info">
          <strong>{profile?.nome || "Nome"}</strong>
          <small>CPF: {profile?.cpf || "--"}</small>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="label">Idade:</div>
          <div className="value">{idadeFormatada}</div>

          <div className="label">Telefone:</div>
          <div className="value">{profile?.telefone || "--"}</div>
        </div>

        <div>
          <div className="label">Tipo sanguíneo:</div>
          <div className="value">{profile?.tipoSanguineo || "--"}</div>

          <div className="label">Alergias:</div>
          <div className="value allergy-list">
            {alergiasNormalizadas.length > 0 ? (
              alergiasNormalizadas.map((item, idx) => (
                <span className="allergy-tag" key={`${item}-${idx}`}>
                  {item}
                </span>
              ))
            ) : (
              <span className="no-allergies">--</span>
            )}
          </div>
        </div>
      </div>

      <section className="caregiver-section" aria-live="polite">
        <h3 className="caregiver-title">Cuidadores vinculados</h3>
        {caregivers.length > 0 ? (
          <ul className="caregiver-list">
            {caregivers.map((item, idx) => (
              <li key={item.cpf || idx} className="caregiver-card">
                <div className="caregiver-card-header">
                  <div className="caregiver-avatar" aria-hidden={!item.fotoUrl}>
                    {item.fotoUrl ? (
                      <img
                        src={item.fotoUrl}
                        alt={`Foto de ${item.nome || 'Cuidador'}`}
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                          const fallback = event.currentTarget.parentElement?.querySelector('.caregiver-avatar-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="caregiver-avatar-fallback"
                      style={{ display: item.fotoUrl ? 'none' : 'flex' }}
                    >
                      {(item.nome || 'CU')
                        .split(' ')
                        .filter(Boolean)
                        .map((part) => part[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="caregiver-name">{item.nome || "Cuidador"}</div>
                    {item.headline ? <div className="caregiver-headline">{item.headline}</div> : null}
                  </div>
                </div>
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
