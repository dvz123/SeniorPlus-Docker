import { createContext, useState, useContext, useCallback } from "react"
import ConfirmDialog from "../components/ConfirmDialog"

const UIContext = createContext()

export const useUI = () => useContext(UIContext)

export const UIProvider = ({ children }) => {
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Função para mostrar um diálogo de confirmação
  const showConfirmDialog = useCallback(({ title, message, onConfirm, confirmText, cancelText }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        onConfirm: () => {
          setConfirmDialog(null)
          if (onConfirm) onConfirm()
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        },
        confirmText,
        cancelText,
      })
    })
  }, [])

  // Função para fechar o diálogo de confirmação
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(null)
  }, [])

  return (
    <UIContext.Provider
      value={{
        showConfirmDialog,
        closeConfirmDialog,
      }}
    >
      {children}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </UIContext.Provider>
  )
}
