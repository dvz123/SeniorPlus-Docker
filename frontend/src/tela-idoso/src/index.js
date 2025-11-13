import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ToastProvider } from '../../contexts/ToastContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../tela-auth/src/contexts/AuthContext';
import { UserProvider } from '../../tela-cuidador/src/contexts/UserContext';
import { EventsProvider } from '../../tela-cuidador/src/contexts/EventsContext';
import { MedicationProvider } from '../../tela-cuidador/src/contexts/MedicationContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { ChatProvider } from '../../contexts/ChatContext';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ToastProvider>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <EventsProvider>
                <MedicationProvider>
                  <NotificationProvider>
                    <ChatProvider>
                      <BrowserRouter>
                        <App />
                      </BrowserRouter>
                    </ChatProvider>
                  </NotificationProvider>
                </MedicationProvider>
              </EventsProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </React.StrictMode>
  );
}