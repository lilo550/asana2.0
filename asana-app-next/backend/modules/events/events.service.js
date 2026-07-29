import { prisma } from "../../prismaClient.js";

export const MAX_NAME_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;

// Signalisiert einen ungueltigen Aufruf (fehlende/zu lange Felder). Die
// Route entscheidet anhand des Typs, welcher HTTP-Status daraus wird -
// dieser Service weiss nichts von req/res.
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// Wirft ValidationError bei ungueltigem Namen/Beschreibung, sonst nichts.
export function validateNameAndDescription({ name, description }, nameRequired) {
  if (nameRequired && (!name || !name.trim())) {
    throw new ValidationError("Name ist erforderlich");
  }
  if (name !== undefined && name.length > MAX_NAME_LENGTH) {
    throw new ValidationError(`Name darf maximal ${MAX_NAME_LENGTH} Zeichen haben`);
  }
  if (description !== undefined && description !== null && description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Beschreibung darf maximal ${MAX_DESCRIPTION_LENGTH} Zeichen haben`);
  }
}

// Liefert das Event nur, wenn es dem angemeldeten Nutzer gehoert, sonst null.
export async function findOwnedEvent(id, userId) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.userId !== userId) return null;
  return event;
}

// Liefert das Projekt nur, wenn es zum angegebenen Event gehoert UND das
// Event wiederum dem angemeldeten Nutzer, sonst null.
export async function findOwnedProject(projectId, eventId, userId) {
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

export async function listEvents(userId) {
  return prisma.event.findMany({
    where: { userId },
    include: { projects: true },
  });
}

function dayRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

// Liefert alle Events, deren Datum genau `daysAhead` Tage in der Zukunft
// liegt (kalendertag-genau, unabhaengig von der Uhrzeit in event.date).
// Absichtlich ohne Nutzer- oder Push-Daten im Ergebnis - wer mit den
// faelligen Events benachrichtigen will, holt sich Empfaenger-Infos ueber
// das jeweils zustaendige Modul (z.B. notif.service.js), nicht ueber einen
// Include hier.
export async function listEventsDueInDays(daysAhead) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  const { start, end } = dayRange(targetDate);

  return prisma.event.findMany({
    where: { date: { gte: start, lte: end } },
  });
}

// Einzelnes eigenes Event inkl. Projekte in einer Query, statt Ownership-Check
// und Nachladen der Projekte getrennt zu machen. Gibt null zurueck, wenn das
// Event nicht existiert oder nicht dem Nutzer gehoert.
export async function getOwnedEvent(id, userId) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { projects: true },
  });
  if (!event || event.userId !== userId) return null;
  return event;
}

export async function createEvent({ name, description, date, userId }) {
  validateNameAndDescription({ name, description }, true);

  return prisma.event.create({
    data: {
      name: name.trim(),
      description,
      date: date ? new Date(date) : null,
      userId,
    },
    include: { projects: true },
  });
}

// Aktualisiert ein eigenes Event teilweise. Gibt null zurueck, wenn das
// Event nicht existiert oder nicht dem Nutzer gehoert.
export async function updateEvent(id, userId, { name, description, date }) {
  validateNameAndDescription({ name, description }, false);

  const owned = await findOwnedEvent(id, userId);
  if (!owned) return null;

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description;
  if (date !== undefined) data.date = date ? new Date(date) : null;

  return prisma.event.update({
    where: { id: owned.id },
    data,
    include: { projects: true },
  });
}

// Ersetzt ein eigenes Event vollstaendig. Gibt null zurueck, wenn das Event
// nicht existiert oder nicht dem Nutzer gehoert.
export async function replaceEvent(id, userId, { name, description, date }) {
  validateNameAndDescription({ name, description }, true);

  const owned = await findOwnedEvent(id, userId);
  if (!owned) return null;

  return prisma.event.update({
    where: { id: owned.id },
    data: {
      name: name.trim(),
      description: description || null,
      date: date ? new Date(date) : null,
    },
    include: { projects: true },
  });
}

// Loescht ein eigenes Event. Gibt false zurueck, wenn es nicht existiert
// oder nicht dem Nutzer gehoert.
export async function deleteEvent(id, userId) {
  const owned = await findOwnedEvent(id, userId);
  if (!owned) return false;

  await prisma.event.delete({ where: { id: owned.id } });
  return true;
}

// --- Projekte (gehoeren zu einem Event) ---

// Legt ein Projekt in einem eigenen Event an. Gibt null zurueck, wenn das
// Event nicht existiert oder nicht dem Nutzer gehoert.
export async function addProject(eventId, userId, { name, description }) {
  validateNameAndDescription({ name, description }, true);

  const owned = await findOwnedEvent(eventId, userId);
  if (!owned) return null;

  return prisma.project.create({
    data: {
      name: name.trim(),
      description,
      eventId: owned.id,
    },
  });
}

// Aktualisiert ein Projekt eines eigenen Events. Gibt null zurueck, wenn es
// nicht existiert oder nicht (ueber das Event) dem Nutzer gehoert.
export async function updateProject(eventId, projectId, userId, { name, description }) {
  validateNameAndDescription({ name, description }, false);

  const existing = await findOwnedProject(projectId, eventId, userId);
  if (!existing) return null;

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description;

  return prisma.project.update({
    where: { id: existing.id },
    data,
  });
}

// Loescht ein Projekt eines eigenen Events. Gibt false zurueck, wenn es
// nicht existiert oder nicht (ueber das Event) dem Nutzer gehoert.
export async function deleteProject(eventId, projectId, userId) {
  const existing = await findOwnedProject(projectId, eventId, userId);
  if (!existing) return false;

  await prisma.project.delete({ where: { id: existing.id } });
  return true;
}