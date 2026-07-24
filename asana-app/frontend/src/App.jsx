import { useEffect, useState } from "react";
import ProjectCard from "./components/ProjectCard.jsx";
import NewProjectForm from "./components/NewProjectForm.jsx";
import * as api from "./api.js";
import "./App.css";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  async function handleDeleteProject(projectId) {
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddTask(projectId, title) {
    try {
      const task = await api.addTask(projectId, title);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
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

  async function handleDeleteTask(projectId, taskId) {
    try {
      await api.deleteTask(projectId, taskId);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
            : p
        )
      );
    } catch (err) {
      setError(err.message);
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
                    onDeleteTask={handleDeleteTask}
                    onAddTask={handleAddTask}
                    onDeleteProject={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
