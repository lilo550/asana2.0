export default function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li className={`task-item ${task.done ? "task-item-done" : ""}`}>
      <label className="task-item-label">
        <input
          type="checkbox"
          checked={task.done}
          onChange={onToggle}
        />
        <span>{task.title}</span>
      </label>
      <button
        className="task-item-delete"
        onClick={onDelete}
        aria-label="Aufgabe löschen"
        title="Aufgabe löschen"
      >
        ×
      </button>
    </li>
  );
}
