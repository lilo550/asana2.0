"use client";

import { useEffect, useState } from "react";
import EventCard from "./EventCard";
import NewEventForm from "./NewEventForm";
import ConfirmDialog from "./ConfirmDialog";
import * as api from "@/lib/api";

const POLL_INTERVAL_MS = 10000;

export default function EventsView({ initialEvents, apiUrl }) {
  // initialEvents kommt bereits fertig geladen von der Server Component.
  const [events, setEvents] = useState(initialEvents);
  const [error, setError] = useState(null);

  // pendingDelete: { type: "event" | "project", eventId, projectId?, label } | null
  const [pendingDelete, setPendingDelete] = useState(null);

  // Multi-Tab/Geraet-Sync: derselbe Nutzer kann mehrere Tabs offen haben
  // (z.B. Handy + Laptop). Damit eine Aenderung in einem Tab in den anderen
  // erscheint, wird die eigene (durch userId gescopte) Event-Liste periodisch
  // neu geholt - bewusst per Polling statt Sockets, siehe Begruendung in
  // documentation.md Session 7 (kein nutzeruebergreifendes Echtzeit-Bedarf,
  // Polling ist hier einfacher und ausreichend).
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const latest = await api.getEvents(apiUrl);
        setEvents(latest);
      } catch (err) {
        // Fehlgeschlagener Poll wird bewusst nicht als Fehlermeldung
        // angezeigt - er soll die Ansicht nicht fuer eine einzelne
        // verpasste Aktualisierung stoeren, der naechste Poll versucht es erneut.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [apiUrl]);

  async function handleCreateEvent(name, description, date) {
    try {
      const event = await api.createEvent(apiUrl, { name, description, date });
      setEvents((prev) => [...prev, event]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateEvent(eventId, name, description, date) {
    try {
      const updated = await api.updateEvent(apiUrl, eventId, { name, description, date });
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...updated } : e)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddProject(eventId, name, description) {
    try {
      const project = await api.createProject(apiUrl, eventId, { name, description });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, projects: [...e.projects, project] } : e))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateProject(eventId, projectId, name, description) {
    try {
      const updated = await api.updateProject(apiUrl, eventId, projectId, { name, description });
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, projects: e.projects.map((p) => (p.id === projectId ? updated : p)) }
            : e
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Löschen mit Bestätigung ---------------------------------------
  // Diese Funktionen öffnen nur den Bestätigungsdialog. Die eigentliche
  // Löschung passiert erst in confirmDelete(), nach Bestätigung durch den Nutzer.

  function requestDeleteEvent(eventId) {
    const event = events.find((e) => e.id === eventId);
    setPendingDelete({ type: "event", eventId, label: event ? event.name : "dieses Event" });
  }

  function requestDeleteProject(eventId, projectId) {
    const event = events.find((e) => e.id === eventId);
    const project = event?.projects.find((p) => p.id === projectId);
    setPendingDelete({
      type: "project",
      eventId,
      projectId,
      label: project ? project.name : "dieses Projekt",
    });
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { type, eventId, projectId } = pendingDelete;

    try {
      if (type === "event") {
        await api.deleteEvent(apiUrl, eventId);
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      } else if (type === "project") {
        await api.deleteProject(apiUrl, eventId, projectId);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, projects: e.projects.filter((p) => p.id !== projectId) }
              : e
          )
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingDelete(null);
    }
  }

  const totalProjects = events.reduce((sum, e) => sum + e.projects.length, 0);

  return (
    <div>
      {!error && (
        <div className="mb-6 text-base text-primary/70">
          {events.length} Events · {totalProjects} Projekte
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-secondary bg-secondary/10 px-4 py-3 text-secondary-dark">
          {error}
        </div>
      )}

      <NewEventForm onCreate={handleCreateEvent} />

      {events.length === 0 ? (
        <p className="text-primary/60">Noch keine Events vorhanden. Lege dein erstes Event an!</p>
      ) : (
        <div className="space-y-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onUpdateEvent={(name, description, date) =>
                handleUpdateEvent(event.id, name, description, date)
              }
              onDeleteEvent={() => requestDeleteEvent(event.id)}
              onAddProject={(name, description) => handleAddProject(event.id, name, description)}
              onUpdateProject={(projectId, name, description) =>
                handleUpdateProject(event.id, projectId, name, description)
              }
              onDeleteProject={(projectId) => requestDeleteProject(event.id, projectId)}
            />
          ))}
        </div>
      )}

      {pendingDelete && pendingDelete.type === "event" && (
        <ConfirmDialog
          title={`„${pendingDelete.label}" löschen?`}
          message="Das Event und alle zugehörigen Projekte werden dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden."
          confirmLabel="Event löschen"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {pendingDelete && pendingDelete.type === "project" && (
        <ConfirmDialog
          title={`„${pendingDelete.label}" löschen?`}
          message="Dieses Projekt wird dauerhaft gelöscht."
          confirmLabel="Projekt löschen"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
