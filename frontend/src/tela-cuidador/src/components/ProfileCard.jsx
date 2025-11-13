import { useEffect, useState } from "react";
import "../styles/ProfileCard.css";
import { api } from '../../../tela-auth/src/services/api';
import { useUser } from '../contexts/UserContext'

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

function ProfileCard() {
  const [elderlyData, setElderlyData] = useState(null);
  const { updateElderlyData } = useUser()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchElderlyData() {
      try {
        const data = await api.get('/api/v1/idoso/informacoesIdoso');
        

        const birthDate = new Date(data.dataNascimento);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthday = today.getMonth() > birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

        const finalAge = hasHadBirthday ? age : age - 1;

        const mapped = {
          id: data.cpf || "000",
          cpf: data.cpf || "00000000000",
          name: data.nome || "Sem nome",
          email: data.email,
          phone: data.telefone,
          photoUrl: "", // Adicione um campo se houver foto
          bloodType: data.tipoSanguineo,
          maritalStatus: data.estadoCivil || "Não informado",
          weight: data.peso,
          height: data.altura,
          birthDate: data.dataNascimento,
          observation: data.observacao,
          imc: data.imc,
          age: finalAge,
          allergies: data.alergias || "",
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

  const allergiesList = Array.isArray(elderlyData.allergies)
    ? elderlyData.allergies
    : elderlyData.allergies?.split(",").map((item) => item.trim());

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
          <p className="profile-id">CPF: {formatCpf(elderlyData.cpf || elderlyData.id)}</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-grid">
          <div className="profile-item">
            <span className="profile-label">Idade:</span>
            <span className="profile-value">{elderlyData.age || "Não informada"}</span>
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
