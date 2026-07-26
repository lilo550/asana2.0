// Einfacher In-Memory-Datenspeicher.
// In einer echten Anwendung wuerde hier eine Datenbank (z.B. SQLite/Postgres) angebunden.

let nextEventId = 3;
let nextProjectId = 5;

export const events = [
  {
    id: 1,
    name: "Firmenkonferenz 2026",
    description: "Jaehrliche Konferenz mit allen Teams und externen Gaesten.",
    date: "2026-09-15",
    projects: [
      {
        id: 1,
        name: "Location & Catering",
        description: "Auswahl der Location sowie Planung von Speisen und Getraenken.",
      },
      {
        id: 2,
        name: "Programm & Speaker",
        description: "Zusammenstellung der Vortraege und Einladung der Referenten.",
      },
    ],
  },
  {
    id: 2,
    name: "Produktlaunch Q3",
    description: "Markteinfuehrung des neuen Produkts inklusive Kampagne.",
    date: "2026-08-01",
    projects: [
      {
        id: 3,
        name: "Marketingkampagne",
        description: "Planung und Umsetzung der Launch-Kampagne ueber alle Kanaele.",
      },
      {
        id: 4,
        name: "Website Relaunch",
        description: "Ueberarbeitung der Produktseite fuer den Launch.",
      },
    ],
  },
];

export function getEvents() {
  return events;
}

export function getEvent(id) {
  return events.find((e) => e.id === id);
}

export function createEvent({ name, description, date }) {
  const event = {
    id: nextEventId++,
    name,
    description: description || "",
    date: date || "",
    projects: [],
  };
  events.push(event);
  return event;
}

export function updateEvent(id, { name, description, date }) {
  const event = getEvent(id);
  if (!event) return null;
  if (name !== undefined) event.name = name;
  if (description !== undefined) event.description = description;
  if (date !== undefined) event.date = date;
  return event;
}

export function replaceEvent(id, { name, description, date }) {
  const event = getEvent(id);
  if (!event) return null;
  event.name = name;
  event.description = description || "";
  event.date = date || "";
  return event;
}

export function deleteEvent(id) {
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return false;
  events.splice(index, 1);
  return true;
}

export function addProject(eventId, name, description) {
  const event = getEvent(eventId);
  if (!event) return null;
  const project = { id: nextProjectId++, name, description: description || "" };
  event.projects.push(project);
  return project;
}

export function updateProject(eventId, projectId, { name, description }) {
  const event = getEvent(eventId);
  if (!event) return null;
  const project = event.projects.find((p) => p.id === projectId);
  if (!project) return null;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  return project;
}

export function deleteProject(eventId, projectId) {
  const event = getEvent(eventId);
  if (!event) return false;
  const index = event.projects.findIndex((p) => p.id === projectId);
  if (index === -1) return false;
  event.projects.splice(index, 1);
  return true;
}
