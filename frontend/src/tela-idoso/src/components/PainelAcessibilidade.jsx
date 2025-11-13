import React, { useEffect, useRef, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import '../styles/PainelAcessibilidade.css';

const sizes = [
  { label: 'A', scale: 1 },
  { label: 'A+', scale: 1.15 },
  { label: 'A++', scale: 1.3 },
  { label: 'A+++', scale: 1.5 },
];

export default function PainelAcessibilidade() {
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { prefs, setFontScale, toggleHighContrast, toggleReducedMotion, toggleReadingMode, resetAccessibility } =
    useAccessibility();

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target)) return;
      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const firstButton = panelRef.current?.querySelector('button');
    firstButton?.focus({ preventScroll: true });
  }, [open]);

  const togglePanel = () => setOpen((prev) => !prev);
  const closePanel = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const triggerLabel = open ? 'Fechar painel de acessibilidade' : 'Abrir painel de acessibilidade';

  return (
    <div className={`painel-acessibilidade${open ? ' open' : ''}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="painel-acessibilidade__trigger"
        onClick={togglePanel}
        title="Acessibilidade"
        aria-label={triggerLabel}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="painel-acessibilidade-panel"
      >
        <FiSettings aria-hidden="true" size={20} className="painel-acessibilidade__trigger-icon" />
        <span className="painel-acessibilidade__sr-only">Acessibilidade</span>
      </button>

      <div
        id="painel-acessibilidade-panel"
        ref={panelRef}
        className="painel-acessibilidade__panel"
        role="region"
        aria-label="Preferências de acessibilidade"
        data-open={open}
        aria-hidden={!open}
      >
        <div className="painel-acessibilidade__group" role="group" aria-label="Tamanho do texto">
          <span className="painel-acessibilidade__label">Texto</span>
          <div className="painel-acessibilidade__buttons">
            {sizes.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setFontScale(s.scale)}
                className={prefs.fontScale === s.scale ? 'btn-acessivel active' : 'btn-acessivel'}
                aria-pressed={prefs.fontScale === s.scale}
                aria-label={`Definir tamanho de fonte ${s.label}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="painel-acessibilidade__group" role="group" aria-label="Alto contraste">
          <span className="painel-acessibilidade__label">Contraste</span>
          <div className="painel-acessibilidade__buttons">
            <button
              type="button"
              onClick={toggleHighContrast}
              className={prefs.highContrast ? 'btn-acessivel active' : 'btn-acessivel'}
              aria-pressed={prefs.highContrast}
              aria-label="Alternar alto contraste"
            >
              Alto contraste
            </button>
          </div>
        </div>

        <div className="painel-acessibilidade__group" role="group" aria-label="Movimentos e animações">
          <span className="painel-acessibilidade__label">Movimentos</span>
          <div className="painel-acessibilidade__buttons">
            <button
              type="button"
              onClick={toggleReducedMotion}
              className={prefs.reducedMotion ? 'btn-acessivel active' : 'btn-acessivel'}
              aria-pressed={prefs.reducedMotion}
              aria-label="Reduzir animações"
            >
              Reduzir animações
            </button>
          </div>
        </div>

        <div className="painel-acessibilidade__group" role="group" aria-label="Modo leitura">
          <span className="painel-acessibilidade__label">Leitura</span>
          <div className="painel-acessibilidade__buttons">
            <button
              type="button"
              onClick={toggleReadingMode}
              className={prefs.readingMode ? 'btn-acessivel active' : 'btn-acessivel'}
              aria-pressed={prefs.readingMode}
              aria-label="Alternar modo de leitura"
            >
              Modo leitura
            </button>
          </div>
        </div>

        <div className="painel-acessibilidade__actions">
          <button type="button" onClick={resetAccessibility} aria-label="Restaurar acessibilidade" className="btn-acessivel">
            Resetar
          </button>
          <button type="button" onClick={closePanel} className="btn-acessivel secundario" aria-label="Fechar painel">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}