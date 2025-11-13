import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Chaves de persistência
const STORAGE_KEY = 'accessibilityPrefs';

const defaultPrefs = {
  fontScale: 1,          // 1 = padrão; 1.15; 1.3; 1.5
  highContrast: false,
  reducedMotion: false,
  readingMode: false,    // aumenta line-height, letter-spacing e espaçamento de parágrafos
};

const AccessibilityContext = createContext();

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider = ({ children }) => {
  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultPrefs;
      const parsed = JSON.parse(raw);
      return { ...defaultPrefs, ...parsed };
    } catch (e) {
      return defaultPrefs;
    }
  });

  // Persistir
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      // noop
    }
  }, [prefs]);

  // Aplicar classes/data attributes globais
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accessibility-font-scale', String(prefs.fontScale));
    root.setAttribute('data-font-scale', String(prefs.fontScale));
    if (prefs.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    if (prefs.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    if (prefs.readingMode) {
      root.classList.add('reading-mode');
    } else {
      root.classList.remove('reading-mode');
    }
  }, [prefs.fontScale, prefs.highContrast, prefs.reducedMotion, prefs.readingMode]);

  const setFontScale = useCallback((scale) => {
    const numeric = typeof scale === 'number' ? scale : parseFloat(scale);
    if (Number.isNaN(numeric)) return;
    const clamped = Math.min(Math.max(numeric, 0.8), 1.8);
    setPrefs((p) => ({ ...p, fontScale: clamped }));
  }, []);

  const increaseFontScale = useCallback(() => {
    setPrefs((p) => {
      const next = Math.min(p.fontScale + 0.1, 1.8);
      return { ...p, fontScale: parseFloat(next.toFixed(2)) };
    });
  }, []);

  const decreaseFontScale = useCallback(() => {
    setPrefs((p) => {
      const next = Math.max(p.fontScale - 0.1, 0.8);
      return { ...p, fontScale: parseFloat(next.toFixed(2)) };
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPrefs((p) => ({ ...p, highContrast: !p.highContrast }));
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setPrefs((p) => ({ ...p, reducedMotion: !p.reducedMotion }));
  }, []);

  const toggleReadingMode = useCallback(() => {
    setPrefs((p) => ({ ...p, readingMode: !p.readingMode }));
  }, []);

  const resetAccessibility = useCallback(() => {
    setPrefs(defaultPrefs);
  }, []);

  const value = {
    prefs,
  setFontScale,
  increaseFontScale,
  decreaseFontScale,
    toggleHighContrast,
    toggleReducedMotion,
    toggleReadingMode,
    resetAccessibility,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;