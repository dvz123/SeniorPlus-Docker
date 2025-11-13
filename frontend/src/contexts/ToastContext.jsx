"use client"

import { createContext, useState, useContext } from "react"
import { v4 as uuidv4 } from "uuid"
import Toast from "../components/Toast"

const ToastContext = createContext()

export const useToast = () => useContext(ToastContext)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = "success", duration = 3000) => {
    const id = uuidv4()
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }])
    return id
  }

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  const showSuccess = (message, duration) => addToast(message, "success", duration)
  const showError = (message, duration) => addToast(message, "error", duration)
  const showWarning = (message, duration) => addToast(message, "warning", duration)
  const showInfo = (message, duration) => addToast(message, "info", duration)

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
