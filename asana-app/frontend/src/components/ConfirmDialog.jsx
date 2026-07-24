export default function ConfirmDialog({ title, message, confirmLabel = "Löschen", onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        className="dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dialog-title">{title}</h3>
        <p>{message}</p>
        <div className="dialog-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} autoFocus>
            Abbrechen
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
