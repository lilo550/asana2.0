import { Router } from "express";
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  replaceEvent,
  deleteEvent,
  addProject,
  updateProject,
  deleteProject,
} from "../data.js";

const router = Router();

// --- Events ---

// Alle Events inkl. Projekte abrufen
router.get("/", (req, res) => {
  res.json(getEvents());
});

// Einzelnes Event abrufen
router.get("/:id", (req, res) => {
  const event = getEvent(Number(req.params.id));
  if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
  res.json(event);
});

// Neues Event anlegen
router.post("/", (req, res) => {
  const { name, description, date } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Eventname ist erforderlich" });
  }
  const event = createEvent({ name: name.trim(), description, date });
  res.status(201).json(event);
});

// Event bearbeiten
router.patch("/:id", (req, res) => {
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

// Event vollstaendig ersetzen
router.put("/:id", (req, res) => {
  const { name, description, date } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Eventname ist erforderlich" });
  }
  const event = replaceEvent(Number(req.params.id), {
    name: name.trim(),
    description,
    date,
  });
  if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
  res.json(event);
});

// Event loeschen
router.delete("/:id", (req, res) => {
  const success = deleteEvent(Number(req.params.id));
  if (!success) return res.status(404).json({ error: "Event nicht gefunden" });
  res.status(204).send();
});

// --- Projekte (gehoeren zu einem Event) ---

// Neues Projekt zu einem Event hinzufuegen
router.post("/:id/projects", (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Projektname ist erforderlich" });
  }
  const project = addProject(Number(req.params.id), name.trim(), description);
  if (!project) return res.status(404).json({ error: "Event nicht gefunden" });
  res.status(201).json(project);
});

// Projekt bearbeiten
router.patch("/:id/projects/:projectId", (req, res) => {
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
router.delete("/:id/projects/:projectId", (req, res) => {
  const success = deleteProject(Number(req.params.id), Number(req.params.projectId));
  if (!success) return res.status(404).json({ error: "Projekt nicht gefunden" });
  res.status(204).send();
});

export default router;
