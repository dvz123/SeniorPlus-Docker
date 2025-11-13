"use client"

import { useState } from "react"
import { FaGoogle, FaFacebookF } from "react-icons/fa"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../../../contexts/ToastContext"
import "../styles/Auth.css"
import useAuthPageClass from "../hooks/useAuthPageClass"

function Login() {
  // Add body class so auth CSS overrides any global layout spacing
  useAuthPageClass()
  const { login } = useAuth()
  const { showSuccess, showError } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const navigate = useNavigate()
  const location = useLocation()

  // Rota para redirecionar após login; padrão é "/"
  // Ajuste: se não houver rota anterior, redirecionar para uma rota protegida padrão coerente
  // O app não define explicitamente /dashboard; usar /tela-cuidador como fallback principal
  const from = location.state?.from?.pathname || "/tela-cuidador"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.")
      return
    }

    setIsLoading(true)

    try {
      const user = await login(email, password, rememberMe)
      try {
        const displayName = user?.name || user?.nome || user?.email || "usuário";
        showSuccess(`Bem-vindo, ${displayName}!`)
      } catch (_) {}
      
      // Redirecionar com base na role do usuário
      const role = user.role || user?.role
      if (role === "ROLE_CUIDADOR" || role === "caregiver") {
  navigate("/tela-cuidador", { replace: true })
      } else if (role === "ROLE_IDOSO" || role === "elderly") {
  navigate("/tela-idoso", { replace: true })
      } else {
        // fallback para a rota anterior ou cuidador
        navigate(from || "/tela-cuidador", { replace: true })
      }
    } catch (error) {
      let message = error?.message || "Falha ao fazer login";
      if (error?.status === 401) {
        message = "Usuário ou senha inválidos";
      } else if (error?.status === 403) {
        message = "Acesso negado. Você não tem permissão ou sua conta ainda não está habilitada.";
      }
      setError(message);
      showError(message);
      setIsLoading(false);
    }
  }

  return (
  <div className="auth-container" role="main" aria-label="Área de autenticação">
      <div className="auth-card">
        <div className="auth-logo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="auth-logo-icon"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <h1 className="auth-logo-text">Senior+</h1>
        </div>

  <h2 className="auth-title">Bem-vindo de volta</h2>
  <p className="auth-subtitle">Faça login para continuar</p>

        {error && (
          <div className="auth-error" role="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="email">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Email
            </label>
            <div className="auth-input-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="auth-input-icon"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                type="email"
                id="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Senha
            </label>
            <div className="auth-input-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="auth-input-icon"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <div className="auth-remember-me">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me">Lembrar-me</label>
            </div>
            <Link to="/esqueci" className="auth-forgot-password">
              Esqueci a senha
            </Link>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <div className="auth-loading">
                <svg
                  className="auth-spinner"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <div className="auth-social-login">
          <div className="auth-social-text">ou continue com</div>
          <div className="auth-social-buttons">
            <button className="auth-social-button google" type="button">
              <FaGoogle size={20} />
              Google
            </button>
            <button className="auth-social-button facebook" type="button">
              <FaFacebookF size={20} />
              Facebook
            </button>
          </div>
        </div>

        <p className="auth-register-text">
          Ainda não tem uma conta?{" "}
          <Link to="/registrar" className="auth-link">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
