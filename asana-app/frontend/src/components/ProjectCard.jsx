import { useState } from "react";
import ProgressBar from "./ProgressBar.jsx";
import TaskItem from "./TaskItem.jsx";

export default function ProjectCard({
  project,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onUpdateTask,
  onDeleteProject,
  onUpdateProject,
}) {
  const [expanded, setExpanded] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(
    project.description || ""
  );

  const doneCount = project.tasks.filter((t) => t.done).length;

  function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(project.id, newTaskTitle.trim(), newTaskDescription.trim());
    setNewTaskTitle("");
    setNewTaskDescription("");
  }

  function startEditing() {
    setEditName(project.name);
    setEditDescription(project.description || "");
    setIsEditing(true);
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdateProject(project.id, editName.trim(), editDescription.trim());
    setIsEditing(false);
  }

  return (
    <div className="project-card">
      <div className="project-card-header">
        <button
          className="project-card-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Einklappen" : "Ausklappen"}
        >
          {expanded ? "▾" : "▸"}
        </button>

        {isEditing ? (
          <form className="project-card-edit-form" onSubmit={handleSaveEdit}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="Beschreibung (optional)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
            />
            <div className="project-card-edit-actions">
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
        ) : (
          <div className="project-card-title-group">
            <h3>{project.name}</h3>
            {project.description && (
              <p className="project-card-description">
                {project.description}
              </p>
            )}
          </div>
        )}

        {!isEditing && (
          <div className="project-card-actions">
            <button
              className="project-card-edit"
              onClick={startEditing}
              title="Projekt bearbeiten"
            >
              Bearbeiten
            </button>
            <button
              className="project-card-delete"
              onClick={() => onDeleteProject(project.id)}
              title="Projekt löschen"
            >
              Löschen
            </button>
          </div>
        )}
      </div>

      <ProgressBar done={doneCount} total={project.tasks.length} />

      {expanded && (
        <>
          <ul className="task-list">
            {project.tasks.length === 0 && (
              <li className="task-list-empty">Noch keine Unteraufgaben.</li>
            )}
            {project.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => onToggleTask(project.id, task.id)}
                onDelete={() => onDeleteTask(project.id, task.id)}
                onUpdate={(title, description) =>
                  onUpdateTask(project.id, task.id, title, description)
                }
              />
            ))}
          </ul>

          <form className="task-add-form" onSubmit={handleAddTask}>
            <input
              type="text"
              placeholder="Neue Unteraufgabe hinzufügen…"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <textarea
              placeholder="Beschreibung (optional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              rows={1}
            />
            <button type="submit">+ Hinzufügen</button>
          </form>
        </>
      )}
    </div>
  );
}
