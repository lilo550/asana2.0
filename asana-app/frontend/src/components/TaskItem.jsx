import { useState } from "react";

export default function TaskItem({ task, onToggle, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || ""
  );

  function startEditing() {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setIsEditing(true);
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    onUpdate(editTitle.trim(), editDescription.trim());
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="task-item task-item-editing">
        <form className="task-item-edit-form" onSubmit={handleSaveEdit}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
          <textarea
            placeholder="Beschreibung (optional)"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
          />
          <div className="task-item-edit-actions">
            <button type="submit" className="btn-primary">
              Speichern
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditing(false)}
            >
              Abbrechen
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`task-item ${task.done ? "task-item-done" : ""}`}>
      <label className="task-item-label">
        <input type="checkbox" checked={task.done} onChange={onToggle} />
        <span className="task-item-text">
          <span className="task-item-title">{task.title}</span>
          {task.description && (
            <span className="task-item-description">{task.description}</span>
          )}
        </span>
      </label>
      <div className="task-item-actions">
        <button
          className="task-item-edit"
          onClick={startEditing}
          aria-label="Aufgabe bearbeiten"
          title="Aufgabe bearbeiten"
        >
          ✎
        </button>
        <button
          className="task-item-delete"
          onClick={onDelete}
          aria-label="Aufgabe löschen"
          title="Aufgabe löschen"
        >
          ×
        </button>
      </div>
    </li>
  );
}
