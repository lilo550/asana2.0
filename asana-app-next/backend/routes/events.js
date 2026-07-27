import { Router } from "express";
import { prisma } from "../prismaClient.js";

const router = Router();

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

// Wandelt einen Route-Param in eine gueltige positive Ganzzahl um, sonst null.
// Verhindert, dass z.B. "/api/events/abc" als NaN bis in die Prisma-Query
// durchsickert und dort in einem generischen 500 statt einem sauberen
// 400 endet.
function parseId(value) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

function validateNameAndDescription(res, { name, description }, nameRequired) {
  if (nameRequired && (!name || !name.trim())) {
    res.status(400).json({ error: "Name ist erforderlich" });
    return false;
  }
  if (name !== undefined && name.length > MAX_NAME_LENGTH) {
    res.status(400).json({ error: `Name darf maximal ${MAX_NAME_LENGTH} Zeichen haben` });
    return false;
  }
  if (description !== undefined && description !== null && description.length > MAX_DESCRIPTION_LENGTH) {
    res
      .status(400)
      .json({ error: `Beschreibung darf maximal ${MAX_DESCRIPTION_LENGTH} Zeichen haben` });
    return false;
  }
  return true;
}

// Liefert das Event nur, wenn es dem angemeldeten Nutzer gehoert.
async function findOwnedEvent(id, userId) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.userId !== userId) return null;
  return event;
}

// Liefert das Projekt nur, wenn es zum angegebenen Event gehoert UND das
// Event wiederum dem angemeldeten Nutzer.
async function findOwnedProject(projectId, eventId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { event: true },
  });
  if (!project || project.eventId !== eventId || project.event.userId !== userId) {
    return null;
  }
  return project;
}

// --- Events ---

// Alle eigenen Events inkl. Projekte abrufen
router.get("/", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { userId: req.user.userId },
      include: { projects: true },
    });
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
    const event = await findOwnedEvent(id, req.user.userId);
    if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
    const withProjects = await prisma.event.findUnique({
      where: { id: event.id },
      include: { projects: true },
    });
    res.json(withProjects);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden des Events" });
  }
});

// Neues Event anlegen
router.post("/", async (req, res) => {
  const { name, description, date } = req.body;
  if (!validateNameAndDescription(res, { name, description }, true)) return;

  try {
    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        description,
        date: date ? new Date(date) : null,
        userId: req.user.userId,
      },
      include: { projects: true },
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Anlegen des Events" });
  }
});

// Eigenes Event bearbeiten
router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  const { name, description, date } = req.body;
  if (!validateNameAndDescription(res, { name, description }, false)) return;

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description;
  if (date !== undefined) data.date = date ? new Date(date) : null;

  try {
    const owned = await findOwnedEvent(id, req.user.userId);
    if (!owned) return res.status(404).json({ error: "Event nicht gefunden" });

    const event = await prisma.event.update({
      where: { id: owned.id },
      data,
      include: { projects: true },
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Aktualisieren des Events" });
  }
});

// Eigenes Event vollstaendig ersetzen
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  const { name, description, date } = req.body;
  if (!validateNameAndDescription(res, { name, description }, true)) return;

  try {
    const owned = await findOwnedEvent(id, req.user.userId);
    if (!owned) return res.status(404).json({ error: "Event nicht gefunden" });

    const event = await prisma.event.update({
      where: { id: owned.id },
      data: {
        name: name.trim(),
        description: description || null,
        date: date ? new Date(date) : null,
      },
      include: { projects: true },
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Ersetzen des Events" });
  }
});

// Eigenes Event loeschen
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  try {
    const owned = await findOwnedEvent(id, req.user.userId);
    if (!owned) return res.status(404).json({ error: "Event nicht gefunden" });

    await prisma.event.delete({ where: { id: owned.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Löschen des Events" });
  }
});

// --- Projekte (gehoeren zu einem Event) ---

// Neues Projekt zu einem eigenen Event hinzufuegen
router.post("/:id/projects", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Ungültige Event-ID" });

  const { name, description } = req.body;
  if (!validateNameAndDescription(res, { name, description }, true)) return;

  try {
    const owned = await findOwnedEvent(id, req.user.userId);
    if (!owned) return res.status(404).json({ error: "Event nicht gefunden" });

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description,
        eventId: owned.id,
      },
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Anlegen des Projekts" });
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
  if (!validateNameAndDescription(res, { name, description }, false)) return;

  try {
    const existing = await findOwnedProject(projectId, id, req.user.userId);
    if (!existing) return res.status(404).json({ error: "Projekt nicht gefunden" });

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description;

    const project = await prisma.project.update({
      where: { id: existing.id },
      data,
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Aktualisieren des Projekts" });
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
    const existing = await findOwnedProject(projectId, id, req.user.userId);
    if (!existing) return res.status(404).json({ error: "Projekt nicht gefunden" });

    await prisma.project.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Löschen des Projekts" });
  }
});

export default router;