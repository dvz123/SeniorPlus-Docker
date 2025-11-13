"use client"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../tela-auth/src/contexts/AuthContext"
import "../styles/BackButton.css"

function BackButton() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const handleBack = () => {
    const historyState = window.history.state
    const hasHistory = historyState && typeof historyState.idx === "number" && historyState.idx > 0

    if (hasHistory) {
      navigate(-1)
      return
    }

    if (currentUser) {
      const role = currentUser.role || ""
      const fallbackForRole = role === "ROLE_IDOSO" ? "/tela-idoso" : "/tela-cuidador"
      navigate(fallbackForRole, { replace: true })
      return
    }

    navigate("/", { replace: true })
  }

  return (
    <button className="back-button" onClick={handleBack} aria-label="Voltar">
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
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
      Voltar
    </button>
  )
}

export default BackButton
