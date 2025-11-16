import { useEffect, useState } from "react";
import "../styles/ProfileCard.css";
import { api } from "../../../tela-auth/src/services/api";
import { useUser } from "../contexts/UserContext";

const formatCpf = (valor) => {
  if (!valor) {
    return "--";
  }
  const digits = String(valor).replace(/\D/g, "");
  if (digits.length !== 11) {
    return valor;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const maskCpf = (valor) => {
  const digits = String(valor || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.***-**`;
  }
  return "***.***.***-**";
};

const formatPhone = (valor) => {
  if (!valor) {
    return "";
  }
  const digits = String(valor).replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return valor;
};

function ProfileCard() {
  const [elderlyData, setElderlyData] = useState(null);
  const { updateElderlyData } = useUser();
  const [loading, setLoading] = useState(true);
  const [cpfVisible, setCpfVisible] = useState(false);

  useEffect(() => {
    async function fetchElderlyData() {
      try {
        const data = await api.get("/api/v1/idoso/informacoesIdoso");
        

        const finalAge = (() => {
          if (!data?.dataNascimento) {
            return null;
          }

          const birthDate = new Date(data.dataNascimento);
          if (Number.isNaN(birthDate.getTime())) {
            return null;
          }

          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();

          const hasHadBirthday =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

          if (!hasHadBirthday) {
            age -= 1;
          }

          return age >= 0 && Number.isFinite(age) ? age : null;
        })();

        const mapped = {
          id: data.cpf || "000",
          cpf: data.cpf || "00000000000",
          name: data.nome || "Sem nome",
          email: data.email,
          phone: data.telefone,
          photoUrl: data.fotoUrl || "",
          bloodType: data.tipoSanguineo,
          maritalStatus: data.estadoCivil || "Não informado",
          gender: data.genero || "",
          weight: data.peso,
          height: data.altura,
          birthDate: data.dataNascimento,
          observation: data.observacao,
          imc: data.imc,
          age: data.idade != null ? data.idade : finalAge,
          allergies: data.alergias || "",
          emergencyContact: data.contatoEmergencia || "",
          emergencyContactName: data.nomeContatoEmergencia || "",
        }

        setElderlyData(mapped);
        try {
          updateElderlyData(mapped)
        } catch (e) {
          // provider pode não estar presente em testes isolados
        }
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchElderlyData();
  }, []);

  if (loading) {
    return (
      <div className="profile-card loading">
        <div className="profile-header">
          <p>Carregando dados do idoso...</p>
        </div>
      </div>
    );
  }

  if (!elderlyData) {
    return (
      <div className="profile-card error">
        <div className="profile-header">
          <p>Cadastre os dados do idoso.</p>
        </div>
      </div>
    );
  }

  const allergiesRaw = Array.isArray(elderlyData.allergies)
    ? elderlyData.allergies
    : elderlyData.allergies?.split(",").map((item) => item.trim()) || [];
  const allergiesList = Array.isArray(allergiesRaw)
    ? allergiesRaw.filter((item) => Boolean(item && item !== "-"))
    : [];

  const formattedPhone = formatPhone(elderlyData.phone);
  const displayedCpf = cpfVisible
    ? formatCpf(elderlyData.cpf || elderlyData.id)
    : maskCpf(elderlyData.cpf || elderlyData.id);
  const genderLabel = elderlyData.gender || "Não informado";

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {elderlyData.photoUrl ? (
            <img
              src={elderlyData.photoUrl}
              alt="Foto do idoso"
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.parentNode.querySelector(".profile-avatar-fallback");
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}

          <div
            className="profile-avatar-fallback"
            style={{ display: elderlyData.photoUrl ? "none" : "flex" }}
          >
            {elderlyData.name
              ? elderlyData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
              : "ID"}
          </div>
        </div>

        <div>
          <h2 className="profile-name">{elderlyData.name || "Nome não informado"}</h2>
          <div className="profile-id-row">
            <span className="profile-id" aria-label={cpfVisible ? "CPF completo" : "CPF oculto"}>
              CPF: {displayedCpf}
            </span>
            <button
              type="button"
              className="profile-id-toggle"
              onClick={() => setCpfVisible((prev) => !prev)}
              aria-pressed={cpfVisible}
              aria-label={cpfVisible ? "Ocultar CPF" : "Mostrar CPF"}
            >
              {cpfVisible ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 4.12-5.94m3.53-2.15A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.66 18.66 0 0 1-2.06 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.75 0 1.47-.24 2.05-.69" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-grid">
          <div className="profile-item">
            <span className="profile-label">Idade:</span>
            <span className="profile-value">
              {elderlyData.age != null ? `${elderlyData.age} anos` : "Não informada"}
            </span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Tipo sanguíneo:</span>
            <span className="profile-value">{elderlyData.bloodType || "Não informado"}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Estado civil:</span>
            <span className="profile-value">{elderlyData.maritalStatus || "Não informado"}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Gênero:</span>
            <span className="profile-value">{genderLabel}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Telefone:</span>
            <span className="profile-value">{formattedPhone || "Não informado"}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">E-mail:</span>
            <span className="profile-value">{elderlyData.email || "Não informado"}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Alergias:</span>
            {allergiesList && allergiesList.length > 0 ? (
              allergiesList.map((allergy, index) => (
                <span key={index} className="allergy-badge">
                  {allergy}
                </span>
              ))
            ) : (
              <span className="profile-value">Nenhuma</span>
            )}
          </div>
          <div className="profile-item">
            <span className="profile-label">IMC:</span>
            <span className="profile-value">{elderlyData.imc || "Não calculado"}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Observações:</span>
            <span className="profile-value">{elderlyData.observation || "Nenhuma"}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProfileCard;
