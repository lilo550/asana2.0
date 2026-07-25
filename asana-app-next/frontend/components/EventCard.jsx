"use client";

import { useState } from "react";
import ProjectItem from "./ProjectItem";
import NewProjectForm from "./NewProjectForm";

export default function EventCard({
  event,
  onUpdateEvent,
  onDeleteEvent,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description);
  const [date, setDate] = useState(event.date);

  function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateEvent(name.trim(), description.trim(), date);
    setEditing(false);
  }

  function handleCancel() {
    setName(event.name);
    setDescription(event.description);
    setDate(event.date);
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-primary/10 bg-white shadow-sm">
      <div className="border-b border-primary/10 bg-highlight-light px-5 py-4 rounded-t-xl">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-primary/20 px-3 py-2 text-sm font-semibold focus:border-secondary focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-primary/20 px-3 py-2 text-sm focus:border-secondary focus:outline-none"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-primary/20 px-3 py-2 text-sm focus:border-secondary focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-primary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-white"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
              >
                Speichern
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-primary">{event.name}</h2>
              {event.date && (
                <p className="text-xs font-medium uppercase tracking-wide text-secondary-dark">
                  {event.date}
                </p>
              )}
              {event.description && (
                <p className="mt-1 text-sm text-primary/70">{event.description}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-white"
              >
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={onDeleteEvent}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/10"
              >
                Löschen
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 px-5 py-4">
        <h3 className="text-sm font-semibold text-primary/80">
          Projekte ({event.projects.length})
        </h3>

        {event.projects.length === 0 ? (
          <p className="text-sm text-primary/50">Noch keine Projekte in diesem Event.</p>
        ) : (
          <div className="space-y-2">
            {event.projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                onUpdate={(name, description) => onUpdateProject(project.id, name, description)}
                onDelete={() => onDeleteProject(project.id)}
              />
            ))}
          </div>
        )}

        <NewProjectForm onCreate={onAddProject} />
      </div>
    </div>
  );
}
