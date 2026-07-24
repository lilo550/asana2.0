import express from "express";
import cors from "cors";
import {
  getProjects,
  getProject,
  createProject,
  deleteProject,
  addTask,
  toggleTask,
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

// Projekt loeschen
app.delete("/api/projects/:id", (req, res) => {
  const success = deleteProject(Number(req.params.id));
  if (!success) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.status(204).send();
});

// --- Unteraufgaben (Tasks) ---

// Neue Unteraufgabe zu einem Projekt hinzufuegen
app.post("/api/projects/:id/tasks", (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Titel der Aufgabe ist erforderlich" });
  }
  const task = addTask(Number(req.params.id), title.trim());
  if (!task) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.status(201).json(task);
});

// Erledigt-Status einer Unteraufgabe umschalten
app.patch("/api/projects/:id/tasks/:taskId", (req, res) => {
  const task = toggleTask(Number(req.params.id), Number(req.params.taskId));
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
