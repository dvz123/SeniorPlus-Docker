"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { api } from '../services/api'

const AuthContext = createContext()

const normalizeRole = (role) => {
  if (!role) return undefined

  const value = Array.isArray(role) ? role[0] : role
  const normalized = String(value).toUpperCase()

  if (normalized.includes('CUIDADOR')) return 'caregiver'
  if (normalized.includes('IDOSO')) return 'elderly'
  if (normalized.includes('ADMIN')) return 'admin'
  if (normalized.includes('USER')) return 'user'

  return normalized.toLowerCase()
}

const normalizeUser = (user) => {
  if (!user) return null

  const role = normalizeRole(user.role)
  const name = user.nome || user.name || user.fullName || user.username || user.email

  return {
    ...user,
    role,
    name,
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verificar se há usuário logado no localStorage ao inicializar
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const storedUser = localStorage.getItem("currentUser")
        const isLoggedIn = localStorage.getItem("isLoggedIn")

        if (storedUser && isLoggedIn === "true") {
          const parsed = JSON.parse(storedUser)
          const normalized = normalizeUser(parsed)
          setCurrentUser(normalized)
          if (normalized !== parsed) {
            localStorage.setItem("currentUser", JSON.stringify(normalized))
          }
          // Certificar que o token persistido é reidratado no wrapper da API
          const token = localStorage.getItem('authToken')
          if (token) {
            api.setAuthToken(token)
          }
        } else {
          api.setAuthToken(null)
        }
      } catch (error) {
        console.error("Erro ao verificar estado de autenticação:", error)
        // Limpar dados corrompidos
        localStorage.removeItem("currentUser")
        localStorage.removeItem("isLoggedIn")
      } finally {
        setLoading(false)
      }
    }

    checkAuthState()
  }, [])
  const login = async (email, password, rememberMe = false) => {
    setLoading(true)
    try {
      const data = await api.post('/api/v1/auth/login', { email, senha: password })

      if (data && data.token) {
        const token = data.token

        // salvar token no localStorage e setar no wrapper
        localStorage.setItem('authToken', token)
        api.setAuthToken(token)

        // buscar dados do usuário
        const userResponse = await api.get('/api/v1/auth/conta')
        const userData = normalizeUser(userResponse)

        setCurrentUser(userData)
        localStorage.setItem('currentUser', JSON.stringify(userData))
        localStorage.setItem('isLoggedIn', 'true')

        if (rememberMe) localStorage.setItem('rememberMe', 'true')

        return userData
      }
      const e = new Error('Credenciais inválidas')
      e.status = 401
      throw e
    } catch (error) {
      console.error('Erro no login:', error)
      // Repassa o erro padronizado, preservando status e detalhes quando existirem
      const e = new Error(error?.message || 'Falha ao fazer login')
      if (error?.status) e.status = error.status
      if (error?.details) e.details = error.details
      throw e
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      // Tenta registrar diretamente pelo wrapper api
      const payload = await api.post('/api/v1/auth/register', userData)

      // Backend pode retornar o token direto; se não, fazemos login
      let token = payload?.token
      if (!token) {
        const loginResp = await api.post('/api/v1/auth/login', { email: userData.email, senha: userData.senha })
        token = loginResp?.token
      }

      if (!token) throw new Error('Token não recebido após registro')

      // Persistir token e configurar wrapper
      localStorage.setItem('authToken', token)
      api.setAuthToken(token)

      // Buscar dados completos do usuário
      const userInfoResponse = await api.get('/api/v1/auth/conta')
      const userInfo = normalizeUser(userInfoResponse)
      setCurrentUser(userInfo)
      localStorage.setItem('currentUser', JSON.stringify(userInfo))
      localStorage.setItem('isLoggedIn', 'true')

      return userInfo
    } catch (error) {
      console.error('Erro no registro:', error)
      // Preserva status e detalhes do erro de API padronizado
      const e = new Error(error?.message || 'Erro ao realizar cadastro. Tente novamente.')
      if (error?.status) e.status = error.status
      if (error?.details) e.details = error.details
      throw e
    } finally {
      setLoading(false)
    }
  }

  // Solicitar redefinição de senha por e-mail
  const requestPasswordReset = async (email) => {
    try {
      await api.post('/api/v1/reset-senha/solicitar', { email })
      return true
    } catch (error) {
      const e = new Error(error?.message || 'Falha ao solicitar redefinição de senha.')
      if (error?.status) e.status = error.status
      if (error?.details) e.details = error.details
      throw e
    }
  }

  // Confirmar redefinição de senha com token e nova senha
  const confirmPasswordReset = async (token, senha) => {
    try {
      await api.post('/api/v1/reset-senha/confirmar', { token, senha })
      return true
    } catch (error) {
      const e = new Error(error?.message || 'Falha ao redefinir senha.')
      if (error?.status) e.status = error.status
      if (error?.details) e.details = error.details
      throw e
    }
  }

  const logout = async () => {
    try {
      const notificationKey = currentUser ? `notifications:${currentUser.id || currentUser.email || "default"}` : null
      setCurrentUser(null)
      localStorage.removeItem('currentUser')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('authToken')
      localStorage.removeItem('elderlyData')
      localStorage.removeItem('events')
      localStorage.removeItem('medications')
      localStorage.removeItem('medicationHistory')
      localStorage.removeItem('notifications')
      if (notificationKey) {
        localStorage.removeItem(notificationKey)
      }
      localStorage.removeItem('idosoEmergencyNumbers')
      sessionStorage.removeItem('authToken')
      api.setAuthToken(null)
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  const value = {
    currentUser,
    user: currentUser,
    loading,
    login,
    register,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

