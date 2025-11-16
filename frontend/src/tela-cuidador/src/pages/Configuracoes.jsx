import { useState, useEffect } from "react"
import { useTheme } from "../../../contexts/ThemeContext"
import { useAccessibility } from "../../../contexts/AccessibilityContext"
import { useToast } from "../../../contexts/ToastContext"
import "../styles/Configuracoes.css"
import BackButton from "../../../components/BackButton"
import { useCaregiverProfile } from "../contexts/CaregiverProfileContext"
import { useAuth } from "../../../tela-auth/src/contexts/AuthContext"

function Configuracoes() {
  const { darkMode, toggleDarkMode } = useTheme()
  const { prefs, setFontScale, increaseFontScale, decreaseFontScale, toggleHighContrast, toggleReducedMotion, toggleReadingMode } = useAccessibility()
  const { showSuccess, showError } = useToast()
  const { caregiverProfile, updateCaregiverProfile, resetCaregiverProfile } = useCaregiverProfile()
  const { currentUser } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState("30")
  const [language, setLanguage] = useState("pt-BR")
  const [fontSize, setFontSize] = useState("medium")
  const [savingProfile, setSavingProfile] = useState(false)

  const [caregiverForm, setCaregiverForm] = useState(() => ({
    displayName:
      caregiverProfile?.displayName ||
      currentUser?.name ||
      currentUser?.nome ||
      currentUser?.fullName ||
      currentUser?.username ||
      "",
    headline: caregiverProfile?.headline || "",
    about: caregiverProfile?.about || "",
    photoUrl: caregiverProfile?.photoUrl || "",
    phone: caregiverProfile?.phone || currentUser?.telefone || currentUser?.phone || "",
    email: caregiverProfile?.email || currentUser?.email || "",
    connectionMessage: caregiverProfile?.connectionMessage || "",
  }))

  // Sincronizar select inicial com prefs.fontScale
  useEffect(() => {
    const scale = prefs.fontScale
    // mapear para uma opção existente
    if (scale <= 0.9) setFontSize('small')
    else if (scale < 1.2) setFontSize('medium')
    else if (scale < 1.4) setFontSize('large')
    else setFontSize('x-large')
  }, [prefs.fontScale])

  useEffect(() => {
    setCaregiverForm({
      displayName:
        caregiverProfile?.displayName ||
        currentUser?.name ||
        currentUser?.nome ||
        currentUser?.fullName ||
        currentUser?.username ||
        "",
      headline: caregiverProfile?.headline || "",
      about: caregiverProfile?.about || "",
      photoUrl: caregiverProfile?.photoUrl || "",
      phone: caregiverProfile?.phone || currentUser?.telefone || currentUser?.phone || "",
      email: caregiverProfile?.email || currentUser?.email || "",
      connectionMessage: caregiverProfile?.connectionMessage || "",
    })
  }, [caregiverProfile, currentUser?.id])

  const [dataBackup, setDataBackup] = useState({
    lastBackup: "Nunca",
    autoBackup: false,
    backupFrequency: "weekly",
  })

  const handleCaregiverInputChange = (event) => {
    const { name, value } = event.target
    setCaregiverForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCaregiverPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      showError?.("Selecione um arquivo de imagem válido")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result?.toString() || ""
      setCaregiverForm((prev) => ({ ...prev, photoUrl: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCaregiverPhoto = () => {
    setCaregiverForm((prev) => ({ ...prev, photoUrl: "" }))
  }

  const handleCaregiverSubmit = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      await updateCaregiverProfile({ ...caregiverForm })
      showSuccess?.("Perfil do cuidador atualizado!")
    } catch (error) {
      console.error("Erro ao salvar perfil do cuidador", error)
      showError?.("Não foi possível salvar o perfil agora.")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleResetCaregiver = () => {
    resetCaregiverProfile()
    setCaregiverForm({
      displayName:
        currentUser?.name ||
        currentUser?.nome ||
        currentUser?.fullName ||
        currentUser?.username ||
        "",
      headline: "",
      about: "",
      photoUrl: "",
      phone: currentUser?.telefone || currentUser?.phone || "",
      email: currentUser?.email || "",
      connectionMessage: "",
    })
    showSuccess?.("Perfil restaurado para o padrão")
  }

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled)
  }

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled)
  }

  const handleReminderTimeChange = (e) => {
    setReminderTime(e.target.value)
  }

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value)
  }

  const handleFontSizeChange = (e) => {
    const value = e.target.value
    setFontSize(value)
    const map = { small: 0.9, medium: 1, large: 1.3, "x-large": 1.5 }
    setFontScale(map[value] ?? 1)
  }

  const handleAutoBackupToggle = () => {
    setDataBackup({
      ...dataBackup,
      autoBackup: !dataBackup.autoBackup,
    })
  }

  const handleBackupFrequencyChange = (e) => {
    setDataBackup({
      ...dataBackup,
      backupFrequency: e.target.value,
    })
  }

  const handleBackupNow = () => {
    const now = new Date()
    const formattedDate = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    setDataBackup({
      ...dataBackup,
      lastBackup: formattedDate,
    })

    showSuccess("Backup realizado com sucesso!")
  }

  const handleExportData = () => {
    // Simulação de exportação de dados
    showSuccess("Dados exportados com sucesso!")
  }

  const handleSaveSettings = () => {
    showSuccess("Configurações salvas com sucesso!")
  }

  const handleClearData = () => {
    // Simulação de limpeza de dados
    showSuccess("Dados limpos com sucesso!")
  }

  return (
    <div className="container">
      <main className="main">
        <BackButton />

        <div className="page-header">
          <h1>Configurações</h1>
          <p>Personalize o sistema de acordo com suas preferências.</p>
        </div>

        <div className="settings-container">
          <div className="settings-section">
            <h2>Perfil do cuidador</h2>
            <form className="settings-card caregiver-profile-card" onSubmit={handleCaregiverSubmit}>
              <div className="caregiver-profile-layout">
                <div className="caregiver-photo-column">
                  <span className="settings-option-label">Foto</span>
                  <p className="settings-option-description">
                    Esta imagem aparece no cabeçalho, na sidebar e na lista de cuidadores para os idosos.
                  </p>
                  <label className="photo-input" aria-label="Enviar foto do cuidador">
                    {caregiverForm.photoUrl ? (
                      <img
                        src={caregiverForm.photoUrl}
                        alt="Pré-visualização da foto do cuidador"
                      />
                    ) : (
                      <span>Adicionar foto</span>
                    )}
                    <input type="file" accept="image/*" onChange={handleCaregiverPhotoChange} />
                  </label>
                  {caregiverForm.photoUrl ? (
                    <button
                      type="button"
                      className="settings-button secondary"
                      onClick={handleRemoveCaregiverPhoto}
                    >
                      Remover foto
                    </button>
                  ) : null}
                </div>

                <div className="caregiver-fields-column">
                  <div className="settings-option compact">
                    <div className="settings-option-info">
                      <label className="settings-option-label" htmlFor="displayName">Nome exibido</label>
                      <div className="settings-option-description">
                        Utilize o nome que será visto pelos idosos em convites e cards.
                      </div>
                    </div>
                    <div className="settings-option-control">
                      <input
                        id="displayName"
                        name="displayName"
                        type="text"
                        className="settings-input"
                        value={caregiverForm.displayName}
                        onChange={handleCaregiverInputChange}
                        placeholder="Nome completo ou apelido"
                      />
                    </div>
                  </div>

                  <div className="settings-option compact">
                    <div className="settings-option-info">
                      <label className="settings-option-label" htmlFor="headline">Área de atuação</label>
                      <div className="settings-option-description">
                        Informe especialidade ou foco do atendimento.
                      </div>
                    </div>
                    <div className="settings-option-control">
                      <input
                        id="headline"
                        name="headline"
                        type="text"
                        className="settings-input"
                        value={caregiverForm.headline}
                        onChange={handleCaregiverInputChange}
                        placeholder="Ex: Cuidador especializado em mobilidade"
                      />
                    </div>
                  </div>

                  <div className="settings-option compact">
                    <div className="settings-option-info">
                      <label className="settings-option-label" htmlFor="connectionMessage">Mensagem de conexão</label>
                      <div className="settings-option-description">
                        Texto exibido ao idoso quando ele receber sua solicitação de vínculo.
                      </div>
                    </div>
                    <div className="settings-option-control">
                      <textarea
                        id="connectionMessage"
                        name="connectionMessage"
                        className="settings-textarea"
                        rows={3}
                        maxLength={240}
                        value={caregiverForm.connectionMessage}
                        onChange={handleCaregiverInputChange}
                        placeholder="Olá! Sou responsável pelos cuidados diários, estarei sempre à disposição."
                      />
                    </div>
                  </div>

                  <div className="settings-option compact">
                    <div className="settings-option-info">
                      <label className="settings-option-label" htmlFor="phone">Telefone de contato</label>
                      <div className="settings-option-description">
                        Inclua um telefone para emergências ou comunicação direta.
                      </div>
                    </div>
                    <div className="settings-option-control">
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="settings-input"
                        value={caregiverForm.phone}
                        onChange={handleCaregiverInputChange}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="settings-option compact">
                    <div className="settings-option-info">
                      <label className="settings-option-label" htmlFor="email">E-mail</label>
                      <div className="settings-option-description">
                        Usado para exibir informações de contato e receber notificações.
                      </div>
                    </div>
                    <div className="settings-option-control">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="settings-input"
                        value={caregiverForm.email}
                        onChange={handleCaregiverInputChange}
                        placeholder="cuidador@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="settings-option compact">
                    <div className="settings-option-info">
                      <label className="settings-option-label" htmlFor="about">Descrição</label>
                      <div className="settings-option-description">
                        Conte um pouco sobre você. Essa informação aparece no card do cuidador.
                      </div>
                    </div>
                    <div className="settings-option-control">
                      <textarea
                        id="about"
                        name="about"
                        className="settings-textarea"
                        rows={3}
                        maxLength={300}
                        value={caregiverForm.about}
                        onChange={handleCaregiverInputChange}
                        placeholder="Experiência, diferenciais ou cuidados oferecidos."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="caregiver-profile-actions">
                <button
                  type="button"
                  className="settings-button secondary"
                  onClick={handleResetCaregiver}
                >
                  Restaurar padrão
                </button>
                <button type="submit" className="settings-button" disabled={savingProfile}>
                  {savingProfile ? "Salvando..." : "Salvar perfil"}
                </button>
              </div>
            </form>
          </div>

          <div className="settings-section">
            <h2>Aparência</h2>

            <div className="settings-card">

              {/* Removido link redundante 'Tela do Paciente' para evitar confusão no painel do cuidador */}

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Modo Escuro</div>
                  <div className="settings-option-description">
                    Ative o modo escuro para reduzir o cansaço visual em ambientes com pouca luz.
                  </div>
                </div>
                <div className="toggle-switch-container">
                  <button
                    className={`toggle-switch ${darkMode ? "active" : ""}`}
                    onClick={toggleDarkMode}
                    aria-label="Alternar modo escuro"
                  >
                    <span className="toggle-switch-slider"></span>
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Tamanho da Fonte</div>
                  <div className="settings-option-description">
                    Ajuste o tamanho ou use os botões A− / A+ para incrementos finos.
                  </div>
                </div>
                <div className="settings-option-control" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button type="button" className="settings-button secondary" aria-label="Diminuir fonte" onClick={decreaseFontScale} disabled={prefs.fontScale <= 0.8}>A−</button>
                  <select
                    className="settings-select"
                    value={fontSize}
                    onChange={handleFontSizeChange}
                    aria-label="Selecionar tamanho da fonte"
                  >
                    <option value="small">Pequeno</option>
                    <option value="medium">Médio</option>
                    <option value="large">Grande</option>
                    <option value="x-large">Extra Grande</option>
                  </select>
                  <button type="button" className="settings-button secondary" aria-label="Aumentar fonte" onClick={increaseFontScale} disabled={prefs.fontScale >= 1.8}>A+</button>
                  <div style={{ minWidth: 60, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }} aria-label={`Escala atual ${prefs.fontScale.toFixed(2)}`}>Escala {prefs.fontScale.toFixed(2)}</div>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Alto Contraste</div>
                  <div className="settings-option-description">
                    Melhora a leitura com contraste elevado, útil para baixa visão.
                  </div>
                </div>
                <div className="toggle-switch-container">
                  <button
                    className={`toggle-switch ${prefs.highContrast ? "active" : ""}`}
                    onClick={toggleHighContrast}
                    aria-label="Alternar alto contraste"
                  >
                    <span className="toggle-switch-slider"></span>
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Reduzir Animações</div>
                  <div className="settings-option-description">
                    Minimiza transições e movimentos para reduzir cansaço visual.
                  </div>
                </div>
                <div className="toggle-switch-container">
                  <button
                    className={`toggle-switch ${prefs.reducedMotion ? "active" : ""}`}
                    onClick={toggleReducedMotion}
                    aria-label="Alternar redução de movimento"
                  >
                    <span className="toggle-switch-slider"></span>
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Modo de Leitura</div>
                  <div className="settings-option-description">
                    Aumenta espaçamento entre linhas e letras para leitura mais confortável.
                  </div>
                </div>
                <div className="toggle-switch-container">
                  <button
                    className={`toggle-switch ${prefs.readingMode ? "active" : ""}`}
                    onClick={toggleReadingMode}
                    aria-label="Alternar modo de leitura"
                  >
                    <span className="toggle-switch-slider"></span>
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Idioma</div>
                  <div className="settings-option-description">Selecione o idioma do sistema.</div>
                </div>
                <div className="settings-option-control">
                  <select
                    className="settings-select"
                    value={language}
                    onChange={handleLanguageChange}
                    aria-label="Selecionar idioma"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2>Notificações</h2>
            <div className="settings-card">
              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Notificações</div>
                  <div className="settings-option-description">
                    Receba notificações sobre medicamentos, eventos e lembretes.
                  </div>
                </div>
                <div className="toggle-switch-container">
                  <button
                    className={`toggle-switch ${notificationsEnabled ? "active" : ""}`}
                    onClick={handleNotificationsToggle}
                    aria-label="Alternar notificações"
                  >
                    <span className="toggle-switch-slider"></span>
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Sons</div>
                  <div className="settings-option-description">Ative sons para alertas e notificações.</div>
                </div>
                <div className="toggle-switch-container">
                  <button
                    className={`toggle-switch ${soundEnabled ? "active" : ""}`}
                    onClick={handleSoundToggle}
                    aria-label="Alternar sons"
                  >
                    <span className="toggle-switch-slider"></span>
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Tempo de Lembrete</div>
                  <div className="settings-option-description">
                    Defina com quanto tempo de antecedência deseja receber lembretes.
                  </div>
                </div>
                <div className="settings-option-control">
                  <select
                    className="settings-select"
                    value={reminderTime}
                    onChange={handleReminderTimeChange}
                    aria-label="Selecionar tempo de lembrete"
                  >
                    <option value="15">15 minutos antes</option>
                    <option value="30">30 minutos antes</option>
                    <option value="60">1 hora antes</option>
                    <option value="120">2 horas antes</option>
                    <option value="1440">1 dia antes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2>Dados e Privacidade</h2>
            <div className="settings-card">
              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Backup Automático</div>
                  <div className="settings-option-description">
                    Realize backups automáticos dos seus dados para evitar perdas.
                  </div>
                </div>
                <div className="toggle-switch-container">
                  <button
                    className={`toggle-switch ${dataBackup.autoBackup ? "active" : ""}`}
                    onClick={handleAutoBackupToggle}
                    aria-label="Alternar backup automático"
                  >
                    <span className="toggle-switch-slider"></span>
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Frequência de Backup</div>
                  <div className="settings-option-description">
                    Defina com que frequência os backups automáticos serão realizados.
                  </div>
                </div>
                <div className="settings-option-control">
                  <select
                    className="settings-select"
                    value={dataBackup.backupFrequency}
                    onChange={handleBackupFrequencyChange}
                    aria-label="Selecionar frequência de backup"
                    disabled={!dataBackup.autoBackup}
                  >
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Último Backup</div>
                  <div className="settings-option-description">
                    {dataBackup.lastBackup === "Nunca"
                      ? "Nenhum backup realizado ainda."
                      : `Último backup realizado em ${dataBackup.lastBackup}.`}
                  </div>
                </div>
                <div className="settings-option-control">
                  <button className="settings-button" onClick={handleBackupNow}>
                    Fazer Backup Agora
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Exportar Dados</div>
                  <div className="settings-option-description">
                    Exporte todos os dados para um arquivo que pode ser importado posteriormente.
                  </div>
                </div>
                <div className="settings-option-control">
                  <button className="settings-button" onClick={handleExportData}>
                    Exportar
                  </button>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Limpar Dados</div>
                  <div className="settings-option-description">
                    Remova todos os dados do sistema. Esta ação não pode ser desfeita.
                  </div>
                </div>
                <div className="settings-option-control">
                  <button className="settings-button danger" onClick={handleClearData}>
                    Limpar Dados
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2>Sobre o Sistema</h2>
            <div className="settings-card">
              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Versão</div>
                  <div className="settings-option-description">Senior+ v1.0.0</div>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Desenvolvido por</div>
                  <div className="settings-option-description">Equipe Senior+</div>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Contato</div>
                  <div className="settings-option-description">suporte@seniorplus.com.br</div>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Termos de Uso</div>
                  <div className="settings-option-description">
                    <a href="none" className="settings-link">
                      Visualizar Termos de Uso
                    </a>
                  </div>
                </div>
              </div>

              <div className="settings-option">
                <div className="settings-option-info">
                  <div className="settings-option-label">Política de Privacidade</div>
                  <div className="settings-option-description">
                    <a href="none" className="settings-link">
                      Visualizar Política de Privacidade
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button className="settings-button" onClick={handleSaveSettings}>
              Salvar Configurações
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Configuracoes
