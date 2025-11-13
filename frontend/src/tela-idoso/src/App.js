import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import IdosoHeader from "./components/IdosoHeader";
import "./App.css";
import Dashboard from "./Dashboard.jsx";
import ConfiguracoesIdoso from "./pages/Configuracoes";
import SolicitacoesCuidador from "./pages/Solicitacoes";
import { useTheme } from "../../contexts/ThemeContext";

function App() {
  const { darkMode } = useTheme();
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  return (
    <div className={darkMode ? "idoso-layout dark-mode" : "idoso-layout"}>
      <IdosoHeader />

      <div className="idoso-content" style={{ marginTop: "var(--header-height)" }}>
        <main className="idoso-main" id="idoso-root" role="main" aria-label="Painel do Idoso">
          <Routes>
            <Route index element={<Dashboard darkMode={darkMode} />} />
            <Route path="dashboard" element={<Dashboard darkMode={darkMode} />} />
            <Route path="configuracoes" element={<ConfiguracoesIdoso />} />
            <Route path="solicitacoes" element={<SolicitacoesCuidador />} />
            <Route path="*" element={<Navigate to="/tela-idoso/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
