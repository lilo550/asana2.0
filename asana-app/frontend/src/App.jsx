import { useEffect, useState } from "react";
import ProjectCard from "./components/ProjectCard.jsx";
import NewProjectForm from "./components/NewProjectForm.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import * as api from "./api.js";
import "./App.css";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pendingDelete: { type: "project" | "task", projectId, taskId?, label } | null
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const data = await api.fetchProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(
        "Backend nicht erreichbar. Läuft der Server auf http://localhost:3000?"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(name, description) {
    try {
      const project = await api.createProject(name, description);
      setProjects((prev) => [...prev, project]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateProject(projectId, name, description) {
    try {
      const updated = await api.updateProject(projectId, { name, description });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, ...updated } : p))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddTask(projectId, title, description) {
    try {
      const task = await api.addTask(projectId, title, description);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateTask(projectId, taskId, title, description) {
    try {
      const updatedTask = await api.updateTask(projectId, taskId, {
        title,
        description,
      });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
              }
            : p
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleTask(projectId, taskId) {
    try {
      const updatedTask = await api.toggleTask(projectId, taskId);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
              }
            : p
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Löschen mit Bestätigung ------------------------------------------
  // Statt sofort zu löschen, öffnen diese Funktionen nur noch den
  // Bestätigungsdialog. Die eigentliche API-Anfrage passiert erst in
  // confirmDelete(), nachdem der Nutzer bestätigt hat.

  function requestDeleteProject(projectId) {
    const project = projects.find((p) => p.id === projectId);
    setPendingDelete({
      type: "project",
      projectId,
      label: project ? project.name : "dieses Projekt",
    });
  }

  function requestDeleteTask(projectId, taskId) {
    const project = projects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    setPendingDelete({
      type: "task",
      projectId,
      taskId,
      label: task ? task.title : "diese Aufgabe",
    });
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { type, projectId, taskId } = pendingDelete;

    try {
      if (type === "project") {
        await api.deleteProject(projectId);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } else if (type === "task") {
        await api.deleteTask(projectId, taskId);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
              : p
          )
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingDelete(null);
    }
  }

  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalDone = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.done).length,
    0
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Meine Projekte</h1>
        <p className="app-subtitle">
          Behalte den Überblick über deine Projekte und Unteraufgaben.
        </p>
        {!loading && !error && (
          <div className="app-summary">
            {projects.length} Projekte · {totalDone}/{totalTasks} Aufgaben
            erledigt
          </div>
        )}
      </header>

      <main className="app-main">
        {error && <div className="app-error">{error}</div>}

        {loading ? (
          <p className="app-loading">Lade Projekte…</p>
        ) : (
          <>
            <NewProjectForm onCreate={handleCreateProject} />

            {projects.length === 0 && !error ? (
              <p className="app-empty">
                Noch keine Projekte vorhanden. Lege dein erstes Projekt an!
              </p>
            ) : (
              <div className="project-list">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={requestDeleteTask}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteProject={requestDeleteProject}
                    onUpdateProject={handleUpdateProject}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {pendingDelete && pendingDelete.type === "project" && (
        <ConfirmDialog
          title={`„${pendingDelete.label}" löschen?`}
          message="Das Projekt und alle zugehörigen Unteraufgaben werden dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden."
          confirmLabel="Projekt löschen"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {pendingDelete && pendingDelete.type === "task" && (
        <ConfirmDialog
          title={`„${pendingDelete.label}" löschen?`}
          message="Diese Unteraufgabe wird dauerhaft gelöscht."
          confirmLabel="Aufgabe löschen"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
