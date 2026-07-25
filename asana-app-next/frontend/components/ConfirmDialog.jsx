"use client";

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <p className="mt-2 text-sm text-primary/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-primary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-highlight-light"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary-dark"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
