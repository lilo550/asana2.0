import { Router } from "express";
import {
  listEvents,
  getOwnedEvent,
  createEvent,
  updateEvent,
  replaceEvent,
  deleteEvent,
  addProject,
  updateProject,
  deleteProject,
  setEventDone,
  setProjectDone,
  ValidationError,
} from "./events.service.js";

const router = Router();

// Wandelt einen Route-Param in eine gueltige positive Ganzzahl um, sonst null.
// Verhindert, dass z.B. "/api/events/abc" als NaN bis in den Service
// durchsickert und dort in einem generischen 500 statt einem sauberen
// 400 endet.
function parseId(value) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

// Uebersetzt einen Service-Fehler in den passenden HTTP-Status: 400 fuer
// ungueltige Eingaben, sonst 500 fuer alles Unerwartete (z.B. DB-Fehler).
function sendServiceError(res, err, fallbackMessage) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: fallbackMessage });
}

// --- Events ---

// Alle eigenen Events inkl. Projekte abrufen
router.get("/", async (req, res) => {
  try {
    const events = await listEvents(req.user.userId);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden der Events" });
  }
});

// Einzelnes eigenes Event abrufen
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  try {
    const event = await getOwnedEvent(id, req.user.userId);
    if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden des Events" });
  }
});

// Neues Event anlegen
router.post("/", async (req, res) => {
  const { name, description, date } = req.body;

  try {
    const event = await createEvent({ name, description, date, userId: req.user.userId });
    res.status(201).json(event);
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Anlegen des Events");
  }
});

// Eigenes Event bearbeiten
router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  const { name, description, date } = req.body;

  try {
    const event = await updateEvent(id, req.user.userId, { name, description, date });
    if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
    res.json(event);
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Aktualisieren des Events");
  }
});

// Eigenes Event vollstaendig ersetzen
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  const { name, description, date } = req.body;

  try {
    const event = await replaceEvent(id, req.user.userId, { name, description, date });
    if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
    res.json(event);
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Ersetzen des Events");
  }
});

// Eigenes Event loeschen
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  try {
    const deleted = await deleteEvent(id, req.user.userId);
    if (!deleted) return res.status(404).json({ error: "Event nicht gefunden" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Löschen des Events" });
  }
});

// Erledigt-Status eines eigenen Events setzen
router.patch("/:id/done", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  const { done } = req.body;
  if (typeof done !== "boolean") {
    return res.status(400).json({ error: "done muss ein boolescher Wert sein" });
  }

  try {
    const event = await setEventDone(id, req.user.userId, done);
    if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
    res.json(event);
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Aktualisieren des Erledigt-Status");
  }
});

// --- Projekte (gehoeren zu einem Event) ---

// Neues Projekt zu einem eigenen Event hinzufuegen
router.post("/:id/projects", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  const { name, description } = req.body;

  try {
    const project = await addProject(id, req.user.userId, { name, description });
    if (!project) return res.status(404).json({ error: "Event nicht gefunden" });
    res.status(201).json(project);
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Anlegen des Projekts");
  }
});

// Projekt eines eigenen Events bearbeiten
router.patch("/:id/projects/:projectId", async (req, res) => {
  const id = parseId(req.params.id);
  const projectId = parseId(req.params.projectId);
  if (id === null || projectId === null) {
    return res.status(400).json({ error: "Ungültige ID" });
  }

  const { name, description } = req.body;

  try {
    const project = await updateProject(id, projectId, req.user.userId, { name, description });
    if (!project) return res.status(404).json({ error: "Projekt nicht gefunden" });
    res.json(project);
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Aktualisieren des Projekts");
  }
});

// Projekt eines eigenen Events loeschen
router.delete("/:id/projects/:projectId", async (req, res) => {
  const id = parseId(req.params.id);
  const projectId = parseId(req.params.projectId);
  if (id === null || projectId === null) {
    return res.status(400).json({ error: "Ungültige ID" });
  }

  try {
    const deleted = await deleteProject(id, projectId, req.user.userId);
    if (!deleted) return res.status(404).json({ error: "Projekt nicht gefunden" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Löschen des Projekts" });
  }
});

// Erledigt-Status eines Projekts setzen
router.patch("/:id/projects/:projectId/done", async (req, res) => {
  const id = parseId(req.params.id);
  const projectId = parseId(req.params.projectId);
  if (id === null || projectId === null) {
    return res.status(400).json({ error: "Ungültige ID" });
  }

  const { done } = req.body;
  if (typeof done !== "boolean") {
    return res.status(400).json({ error: "done muss ein boolescher Wert sein" });
  }

  try {
    const project = await setProjectDone(id, projectId, req.user.userId, done);
    if (!project) return res.status(404).json({ error: "Projekt nicht gefunden" });
    res.json(project);
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Aktualisieren des Erledigt-Status");
  }
});

export default router;