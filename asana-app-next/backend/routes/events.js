import { Router } from "express";
import { prisma, getDefaultUserId } from "../prismaClient.js";

const router = Router();

// --- Events ---

// Alle Events inkl. Projekte abrufen
router.get("/", async (req, res) => {
  try {
    const events = await prisma.event.findMany({ include: { projects: true } });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden der Events" });
  }
});

// Einzelnes Event abrufen
router.get("/:id", async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: Number(req.params.id) },
      include: { projects: true },
    });
    if (!event) return res.status(404).json({ error: "Event nicht gefunden" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden des Events" });
  }
});

// Neues Event anlegen
router.post("/", async (req, res) => {
  const { name, description, date, userId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Eventname ist erforderlich" });
  }
  try {
    const resolvedUserId =
      userId !== undefined ? Number(userId) : await getDefaultUserId();
    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        description,
        date: date ? new Date(date) : null,
        userId: resolvedUserId,
      },
      include: { projects: true },
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Anlegen des Events" });
  }
});

// Event bearbeiten
router.patch("/:id", async (req, res) => {
  const { name, description, date } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: "Eventname ist erforderlich" });
  }
  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description;
  if (date !== undefined) data.date = date ? new Date(date) : null;

  try {
    const event = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data,
      include: { projects: true },
    });
    res.json(event);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Event nicht gefunden" });
    }
    res.status(500).json({ error: "Fehler beim Aktualisieren des Events" });
  }
});

// Event vollstaendig ersetzen
router.put("/:id", async (req, res) => {
  const { name, description, date } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Eventname ist erforderlich" });
  }
  try {
    const event = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name.trim(),
        description: description || null,
        date: date ? new Date(date) : null,
      },
      include: { projects: true },
    });
    res.json(event);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Event nicht gefunden" });
    }
    res.status(500).json({ error: "Fehler beim Ersetzen des Events" });
  }
});

// Event loeschen
router.delete("/:id", async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Event nicht gefunden" });
    }
    res.status(500).json({ error: "Fehler beim Löschen des Events" });
  }
});

// --- Projekte (gehoeren zu einem Event) ---

// Neues Projekt zu einem Event hinzufuegen
router.post("/:id/projects", async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Projektname ist erforderlich" });
  }
  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description,
        eventId: Number(req.params.id),
      },
    });
    res.status(201).json(project);
  } catch (err) {
    if (err.code === "P2003") {
      return res.status(404).json({ error: "Event nicht gefunden" });
    }
    res.status(500).json({ error: "Fehler beim Anlegen des Projekts" });
  }
});

// Projekt bearbeiten
router.patch("/:id/projects/:projectId", async (req, res) => {
  const { name, description } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: "Projektname ist erforderlich" });
  }
  try {
    const existing = await prisma.project.findUnique({
      where: { id: Number(req.params.projectId) },
    });
    if (!existing || existing.eventId !== Number(req.params.id)) {
      return res.status(404).json({ error: "Projekt nicht gefunden" });
    }

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

// Projekt loeschen
router.delete("/:id/projects/:projectId", async (req, res) => {
  try {
    const existing = await prisma.project.findUnique({
      where: { id: Number(req.params.projectId) },
    });
    if (!existing || existing.eventId !== Number(req.params.id)) {
      return res.status(404).json({ error: "Projekt nicht gefunden" });
    }

    await prisma.project.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Löschen des Projekts" });
  }
});

export default router;
