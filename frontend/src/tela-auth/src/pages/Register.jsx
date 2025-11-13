"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from "react-router-dom"
import { useToast } from "../../../contexts/ToastContext"
import "../styles/Auth.css"
import useAuthPageClass from "../hooks/useAuthPageClass"

function Register() {
  // Garantir que estilização de auth remova qualquer espaçamento global
  useAuthPageClass()
  const [name, setName] = useState("")
  const [cpf, setCpf] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  // NOVO ESTADO: Armazena a função (role) selecionada
  const [role, setRole] = useState("") // Pode ser 'ROLE_CUIDADOR' ou 'ROLE_IDOSO'
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const navigate = useNavigate()
  const { register } = useAuth()
  const { showSuccess, showError } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    // Validações
    const nextFieldErrors = {}

    if (!name.trim()) {
      nextFieldErrors.name = "Informe o nome completo."
    }

    if (!cpf.trim()) {
      nextFieldErrors.cpf = "Informe o CPF com 11 dígitos."
    } else if (!/^\d{11}$/.test(cpf.replace(/\D/g, ""))) {
      nextFieldErrors.cpf = "O CPF deve conter 11 dígitos numéricos."
    }

    if (!email.trim()) {
      nextFieldErrors.email = "Informe um e-mail válido."
    }

    if (!role) {
      nextFieldErrors.role = "Selecione o seu perfil de acesso."
    }

    if (password !== confirmPassword) {
      nextFieldErrors.confirmPassword = "As senhas precisam ser iguais."
    }

    if (password.length < 6) {
      nextFieldErrors.password = "A senha deve ter pelo menos 6 caracteres."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError("Por favor, corrija os campos destacados.")
      return
    }

    setIsLoading(true)

    try {
      const userData = {
        nome: name,
        cpf: cpf.replace(/\D/g, ""),
        email,
        senha: password,
        tipoUsuario: role === "ROLE_CUIDADOR" ? "Cuidador" : "Idoso"
      }

      const user = await register(userData)
      try {
        const displayName = user?.name || user?.nome || user?.email || "usuário"
        showSuccess(`Conta criada com sucesso! Bem-vindo, ${displayName}.`)
      } catch (_) {}

      // Redirecionar com base na role
      if (user.role === "ROLE_CUIDADOR") {
        navigate("/tela-cuidador")
      } else if (user.role === "ROLE_IDOSO") {
        navigate("/tela-idoso")
      } else {
        navigate("/dashboard")
      }
    } catch (error) {
      // Mapeia mensagens com base em status e detalhes padronizados
      let message = error.message || "Falha ao registrar. Tente novamente.";
      const apiFieldErrors = {};

      if (error.status === 409) {
        // Conflitos comuns: email ou CPF já cadastrados
        const detailsText = JSON.stringify(error.details || {}).toLowerCase();
        if (detailsText.includes('cpf')) {
          apiFieldErrors.cpf = 'Este CPF já está cadastrado. Faça login ou use outro CPF.';
          message = apiFieldErrors.cpf;
        }
        if (detailsText.includes('email')) {
          apiFieldErrors.email = 'Este e-mail já está cadastrado. Tente acessar com sua senha ou recuperar acesso.';
          message = apiFieldErrors.email;
        }
        // fallback de conflito genérico
        if (!apiFieldErrors.cpf && !apiFieldErrors.email) {
          message = 'Dados já cadastrados. Verifique seu CPF/e-mail.';
        }
      } else if (error.status === 400) {
        // Validações do backend
        const body = error.details || {};
        const lower = JSON.stringify(body).toLowerCase();
        if (lower.includes('nome')) apiFieldErrors.name = 'Informe um nome válido.';
        if (lower.includes('cpf')) apiFieldErrors.cpf = 'O CPF deve conter 11 dígitos.';
        if (lower.includes('email')) apiFieldErrors.email = 'Informe um e-mail válido.';
        if (lower.includes('senha')) apiFieldErrors.password = 'Informe uma senha válida.';
        if (lower.includes('tipo') || lower.includes('perfil')) apiFieldErrors.role = 'Selecione seu perfil de acesso.';
      }

      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      }
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
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

        <h2 className="auth-title">Crie sua conta</h2>
        <p className="auth-subtitle">Registre-se para começar a usar o Senior+</p>

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
          {/* Campos existentes... (Nome, Cpf, Email) */}
          {/* ... (código do campo Nome) */}
          <div className="auth-form-group">
            <label htmlFor="name">
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Nome completo
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                id="name"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`auth-input${fieldErrors.name ? " auth-input-error" : ""}`}
              />
            </div>
            {fieldErrors.name && <span className="auth-field-error">{fieldErrors.name}</span>}
          </div>
          
          {/* ... (código do campo CPF) */}
          <div className="auth-form-group">
            <label htmlFor="cpf">
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              CPF
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                id="cpf"
                placeholder="CPF (apenas números)"
                value={cpf}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                required
                className={`auth-input${fieldErrors.cpf ? " auth-input-error" : ""}`}
                maxLength={14}
                inputMode="numeric"
                pattern="\d*"
              />
            </div>
            {fieldErrors.cpf && <span className="auth-field-error">{fieldErrors.cpf}</span>}
          </div>

          {/* ... (código do campo Email) */}
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
                className={`auth-input${fieldErrors.email ? " auth-input-error" : ""}`}
              />
            </div>
            {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
          </div>


          {/* NOVO CAMPO: Seleção de Função (Role) */}
          <div className="auth-form-group">
            <label htmlFor="role">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Você é um...
            </label>
            <div className="auth-input-wrapper">
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className={`auth-input${fieldErrors.role ? " auth-input-error" : ""}`}
        >
                    <option value="">Selecione sua função</option>
                    <option value="ROLE_CUIDADOR">Cuidador</option>
                    <option value="ROLE_IDOSO">Idoso</option>
                </select>
            </div>
      {fieldErrors.role && <span className="auth-field-error">{fieldErrors.role}</span>}
          </div>
          {/* FIM NOVO CAMPO */}

          {/* Senhas (mantidas no final) */}
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
                className={`auth-input${fieldErrors.password ? " auth-input-error" : ""}`}
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
            {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirm-password">
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
              Confirmar senha
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
                id="confirm-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`auth-input${fieldErrors.confirmPassword ? " auth-input-error" : ""}`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="auth-field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>
          {/* Fim das senhas */}

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
                Registrando...
              </div>
            ) : (
              "Registrar"
            )}
          </button>
        </form>

        <p className="auth-register-text">
          Já tem uma conta?{" "}
          <Link to="/login" className="auth-link">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register