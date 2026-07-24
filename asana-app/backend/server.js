import express from "express";
import cors from "cors";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTask,
  toggleTask,
  updateTask,
  deleteTask,
} from "./data.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- Projekte ---

// Alle Projekte inkl. Unteraufgaben abrufen
app.get("/api/projects", (req, res) => {
  res.json(getProjects());
});

// Einzelnes Projekt abrufen
app.get("/api/projects/:id", (req, res) => {
  const project = getProject(Number(req.params.id));
  if (!project) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.json(project);
});

// Neues Projekt anlegen
app.post("/api/projects", (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Projektname ist erforderlich" });
  }
  const project = createProject({ name: name.trim(), description });
  res.status(201).json(project);
});

// Projekt bearbeiten
app.patch("/api/projects/:id", (req, res) => {
  const { name, description } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: "Projektname ist erforderlich" });
  }
  const project = updateProject(Number(req.params.id), {
    name: name !== undefined ? name.trim() : undefined,
    description,
  });
  if (!project) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.json(project);
});

// Projekt loeschen
app.delete("/api/projects/:id", (req, res) => {
  const success = deleteProject(Number(req.params.id));
  if (!success) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.status(204).send();
});

// --- Unteraufgaben (Tasks) ---

// Neue Unteraufgabe zu einem Projekt hinzufuegen
app.post("/api/projects/:id/tasks", (req, res) => {
  const { title, description } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Titel der Aufgabe ist erforderlich" });
  }
  const task = addTask(Number(req.params.id), title.trim(), description);
  if (!task) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.status(201).json(task);
});

// Erledigt-Status einer Unteraufgabe umschalten
app.patch("/api/projects/:id/tasks/:taskId/toggle", (req, res) => {
  const task = toggleTask(Number(req.params.id), Number(req.params.taskId));
  if (!task) return res.status(404).json({ error: "Aufgabe nicht gefunden" });
  res.json(task);
});

// Unteraufgabe bearbeiten (Titel/Beschreibung)
app.patch("/api/projects/:id/tasks/:taskId", (req, res) => {
  const { title, description } = req.body;
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ error: "Titel der Aufgabe ist erforderlich" });
  }
  const task = updateTask(Number(req.params.id), Number(req.params.taskId), {
    title: title !== undefined ? title.trim() : undefined,
    description,
  });
  if (!task) return res.status(404).json({ error: "Aufgabe nicht gefunden" });
  res.json(task);
});

// Unteraufgabe loeschen
app.delete("/api/projects/:id/tasks/:taskId", (req, res) => {
  const success = deleteTask(Number(req.params.id), Number(req.params.taskId));
  if (!success) return res.status(404).json({ error: "Aufgabe nicht gefunden" });
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Backend laeuft auf http://localhost:${PORT}`);
});
