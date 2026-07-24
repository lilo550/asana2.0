import { useState } from "react";
import ProgressBar from "./ProgressBar.jsx";
import TaskItem from "./TaskItem.jsx";

export default function ProjectCard({
  project,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onDeleteProject,
}) {
  const [expanded, setExpanded] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const doneCount = project.tasks.filter((t) => t.done).length;

  function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(project.id, newTaskTitle.trim());
    setNewTaskTitle("");
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
        <div className="project-card-title-group">
          <h3>{project.name}</h3>
          {project.description && (
            <p className="project-card-description">{project.description}</p>
          )}
        </div>
        <button
          className="project-card-delete"
          onClick={() => onDeleteProject(project.id)}
          title="Projekt löschen"
        >
          Löschen
        </button>
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
            <button type="submit">+ Hinzufügen</button>
          </form>
        </>
      )}
    </div>
  );
}
