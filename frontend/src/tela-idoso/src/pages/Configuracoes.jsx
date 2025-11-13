import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAccessibility } from "../../../contexts/AccessibilityContext";
import { useToast } from "../../../contexts/ToastContext";
import "../styles/Configuracoes.css";

function ConfiguracoesIdoso() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const {
    prefs,
    setFontScale,
    increaseFontScale,
    decreaseFontScale,
    toggleHighContrast,
    toggleReducedMotion,
    toggleReadingMode,
  } = useAccessibility();
  const { showSuccess } = useToast();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("30");
  const [fontSizeOption, setFontSizeOption] = useState("medium");

  useEffect(() => {
    const scale = prefs.fontScale;
    if (scale <= 0.9) setFontSizeOption("small");
    else if (scale < 1.2) setFontSizeOption("medium");
    else if (scale < 1.4) setFontSizeOption("large");
    else setFontSizeOption("x-large");
  }, [prefs.fontScale]);

  const handleFontPresetChange = (event) => {
    const value = event.target.value;
    setFontSizeOption(value);
    const presets = { small: 0.9, medium: 1, large: 1.3, "x-large": 1.5 };
    setFontScale(presets[value] ?? 1);
  };

  const handleSave = () => {
    if (showSuccess) {
      showSuccess("Preferências salvas com sucesso!");
    }
  };

  return (
    <div className="idoso-page">
      <header className="idoso-page__header">
        <div>
          <h1>Configurações</h1>
          <p>Personalize como as informações aparecem para você.</p>
        </div>
        <button type="button" className="idoso-page__back" onClick={() => navigate("/tela-idoso")}>Voltar ao painel</button>
      </header>

      <section className="idoso-settings">
        <article className="settings-card">
          <h2>Aparência</h2>

          <div className="settings-row">
            <div>
              <p className="settings-label">Modo escuro</p>
              <span className="settings-description">Reduz o brilho da tela em ambientes com pouca luz.</span>
            </div>
            <button type="button" className={`toggle-switch ${darkMode ? "active" : ""}`} onClick={toggleDarkMode}>
              <span className="toggle-switch__slider" />
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Tamanho da fonte</p>
              <span className="settings-description">Escolha o tamanho ou use A− / A+ para ajustes finos.</span>
            </div>
            <div className="settings-control">
              <button type="button" className="action-button secondary" onClick={decreaseFontScale} disabled={prefs.fontScale <= 0.8}>
                A−
              </button>
              <select value={fontSizeOption} onChange={handleFontPresetChange} className="settings-select" aria-label="Selecionar tamanho da fonte">
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
                <option value="x-large">Extra grande</option>
              </select>
              <button type="button" className="action-button secondary" onClick={increaseFontScale} disabled={prefs.fontScale >= 1.8}>
                A+
              </button>
              <span className="settings-scale">Escala {prefs.fontScale.toFixed(2)}</span>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Alto contraste</p>
              <span className="settings-description">Melhora a leitura para baixa visão.</span>
            </div>
            <button type="button" className={`toggle-switch ${prefs.highContrast ? "active" : ""}`} onClick={toggleHighContrast}>
              <span className="toggle-switch__slider" />
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Reduzir animações</p>
              <span className="settings-description">Minimiza movimentos e transições.</span>
            </div>
            <button type="button" className={`toggle-switch ${prefs.reducedMotion ? "active" : ""}`} onClick={toggleReducedMotion}>
              <span className="toggle-switch__slider" />
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Modo leitura</p>
              <span className="settings-description">Aumenta espaçamento entre linhas e letras.</span>
            </div>
            <button type="button" className={`toggle-switch ${prefs.readingMode ? "active" : ""}`} onClick={toggleReadingMode}>
              <span className="toggle-switch__slider" />
            </button>
          </div>
        </article>

        <article className="settings-card">
          <h2>Lembretes</h2>

          <div className="settings-row">
            <div>
              <p className="settings-label">Notificações</p>
              <span className="settings-description">Receber alertas sobre medicamentos e eventos.</span>
            </div>
            <button
              type="button"
              className={`toggle-switch ${notificationsEnabled ? "active" : ""}`}
              onClick={() => setNotificationsEnabled((prev) => !prev)}
            >
              <span className="toggle-switch__slider" />
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Alertas sonoros</p>
              <span className="settings-description">Ative sons junto com a notificação.</span>
            </div>
            <button
              type="button"
              className={`toggle-switch ${soundEnabled ? "active" : ""}`}
              onClick={() => setSoundEnabled((prev) => !prev)}
            >
              <span className="toggle-switch__slider" />
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Tempo de antecedência</p>
              <span className="settings-description">Quando você prefere ser avisado.</span>
            </div>
            <select className="settings-select" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}>
              <option value="15">15 minutos antes</option>
              <option value="30">30 minutos antes</option>
              <option value="60">1 hora antes</option>
              <option value="120">2 horas antes</option>
              <option value="1440">1 dia antes</option>
            </select>
          </div>
        </article>

        <article className="settings-card">
          <h2>Privacidade</h2>
          <p className="settings-description">Gerencie quem pode visualizar e atualizar seus dados.</p>
          <ul className="settings-list">
            <li>• Você decide quais cuidadores podem acessar suas informações.</li>
            <li>• Desvincule cuidadores quando desejar na opção "Solicitações".</li>
            <li>• Em caso de dúvidas, peça ajuda a alguém de confiança.</li>
          </ul>
        </article>
      </section>

      <footer className="idoso-settings__footer">
        <button type="button" className="action-button" onClick={handleSave}>
          Salvar preferências
        </button>
      </footer>
    </div>
  );
}

export default ConfiguracoesIdoso;
