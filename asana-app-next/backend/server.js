import express from "express";
import cors from "cors";
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addProject,
  updateProject,
  deleteProject,
} from "./data.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- Events ---

// Alle Events inkl. Projekte abrufen
app.get("/api/events", (req, res) => {
  res.json(getEvents());
});

// Einzelnes Event abrufen
app.get("/api/events/:id", (req, res) => {
  const event = getEvent(Number(req.params.id));
  if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
  res.json(event);
});

// Neues Event anlegen
app.post("/api/events", (req, res) => {
  const { name, description, date } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Eventname ist erforderlich" });
  }
  const event = createEvent({ name: name.trim(), description, date });
  res.status(201).json(event);
});

// Event bearbeiten
app.patch("/api/events/:id", (req, res) => {
  const { name, description, date } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: "Eventname ist erforderlich" });
  }
  const event = updateEvent(Number(req.params.id), {
    name: name !== undefined ? name.trim() : undefined,
    description,
    date,
  });
  if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
  res.json(event);
});

// Event loeschen
app.delete("/api/events/:id", (req, res) => {
  const success = deleteEvent(Number(req.params.id));
  if (!success) return res.status(404).json({ error: "Event nicht gefunden" });
  res.status(204).send();
});

// --- Projekte (gehoeren zu einem Event) ---

// Neues Projekt zu einem Event hinzufuegen
app.post("/api/events/:id/projects", (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Projektname ist erforderlich" });
  }
  const project = addProject(Number(req.params.id), name.trim(), description);
  if (!project) return res.status(404).json({ error: "Event nicht gefunden" });
  res.status(201).json(project);
});

// Projekt bearbeiten
app.patch("/api/events/:id/projects/:projectId", (req, res) => {
  const { name, description } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: "Projektname ist erforderlich" });
  }
  const project = updateProject(Number(req.params.id), Number(req.params.projectId), {
    name: name !== undefined ? name.trim() : undefined,
    description,
  });
  if (!project) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.json(project);
});

// Projekt loeschen
app.delete("/api/events/:id/projects/:projectId", (req, res) => {
  const success = deleteProject(Number(req.params.id), Number(req.params.projectId));
  if (!success) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Backend laeuft auf http://localhost:${PORT}`);
});
