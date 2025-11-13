import "../styles/ConfirmDialog.css"

function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger",
}) {
  if (!isOpen) return null

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className={`confirm-header confirm-${type}`}>
          <h3>{title}</h3>
        </div>
        <div className="confirm-content">
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`confirm-button confirm-${type}-button`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
