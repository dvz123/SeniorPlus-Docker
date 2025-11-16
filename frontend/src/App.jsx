"use client";

import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { ThemeProvider } from "./contexts/ThemeContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { CaregiverProfileProvider } from "./tela-cuidador/src/contexts/CaregiverProfileContext";
import { UserProvider } from "./tela-cuidador/src/contexts/UserContext";
import { MedicationProvider } from "./tela-cuidador/src/contexts/MedicationContext";
import { EventsProvider } from "./tela-cuidador/src/contexts/EventsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./tela-auth/src/contexts/AuthContext";
import { NotificationProvider } from "../src/contexts/NotificationContext";
import { ChatProvider } from "./contexts/ChatContext";

import ProtectedRoute from "./tela-auth/src/components/ProtectedRoute";
import CaregiverLayout from "./layouts/CaregiverLayout";

import Login from "./tela-auth/src/pages/Login";
import Register from "./tela-auth/src/pages/Register";
import ForgotPassword from "./tela-auth/src/pages/ForgotPassword";
import ResetPassword from "./tela-auth/src/pages/ResetPassword";
import Home from "./tela-cuidador/src/pages/Home";
import Landing from "./tela-landing/src/App";
import TelaIdosoApp from "./tela-idoso/src/App";
import AtualizarDados from "./tela-cuidador/src/pages/AtualizarDados";
import Medicamentos from "./tela-cuidador/src/pages/Medicamentos";
import RegistrarEventos from "./tela-cuidador/src/pages/RegistrarEventos";
import Relatorios from "./tela-cuidador/src/pages/Relatorios";
import Calendario from "./tela-cuidador/src/pages/Calendario";
import Configuracoes from "./tela-cuidador/src/pages/Configuracoes";
import Emergencia from "./tela-cuidador/src/pages/Emergencia";

import "./global.css";
import RootErrorBoundary from "./components/RootErrorBoundary";

function AppWrapper() {
  return (
    <ToastProvider>
      <AccessibilityProvider>
        <ThemeProvider>
          <RootErrorBoundary>
            <Router>
              <AppContent />
            </Router>
          </RootErrorBoundary>
        </ThemeProvider>
      </AccessibilityProvider>
    </ToastProvider>
  );
}

function AppContent() {
  // location disponível para futuras regras se necessário
  const location = useLocation();

  useEffect(() => {
    const isLanding = location.pathname === "/";
    document.body.classList.toggle("landing-body", isLanding);
    return () => {
      document.body.classList.remove("landing-body");
    };
  }, [location.pathname]);

  return (
    <AuthProvider>
      <CaregiverProfileProvider>
        <UserProvider>
        <EventsProvider>
          <MedicationProvider>
            <NotificationProvider>
              <ChatProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/registrar" element={<Register />} />
                  <Route path="/esqueci" element={<ForgotPassword />} />
                  <Route path="/resetar-senha" element={<ResetPassword />} />
                  <Route path="/" element={<Landing />} />
                  <Route
                    path="/tela-cuidador"
                    element={
                      <ProtectedRoute>
                        <CaregiverLayout>
                          <Home />
                        </CaregiverLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/atualizar-dados"
                    element={
                      <ProtectedRoute>
                        <CaregiverLayout>
                          <AtualizarDados />
                        </CaregiverLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/medicamentos"
                    element={
                      <ProtectedRoute>
                        <CaregiverLayout>
                          <Medicamentos />
                        </CaregiverLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registrar-eventos"
                    element={
                      <ProtectedRoute>
                        <CaregiverLayout>
                          <RegistrarEventos />
                        </CaregiverLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/relatorios"
                    element={
                      <ProtectedRoute>
                        <CaregiverLayout>
                          <Relatorios />
                        </CaregiverLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendario"
                    element={
                      <ProtectedRoute>
                        <CaregiverLayout>
                          <Calendario />
                        </CaregiverLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/configuracoes"
                    element={
                      <ProtectedRoute>
                        <CaregiverLayout>
                          <Configuracoes />
                        </CaregiverLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/emergencia"
                    element={
                      <ProtectedRoute>
                        <CaregiverLayout>
                          <Emergencia />
                        </CaregiverLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tela-idoso/*"
                    element={
                      <ProtectedRoute>
                        <TelaIdosoApp />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ChatProvider>
            </NotificationProvider>
          </MedicationProvider>
        </EventsProvider>
      </UserProvider>
    </CaregiverProfileProvider>
    </AuthProvider>
  );
}

export default AppWrapper;
