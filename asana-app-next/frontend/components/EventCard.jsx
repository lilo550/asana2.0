"use client";

import { useState } from "react";
import DatePicker from "react-date-picker";
import ProjectItem from "./ProjectItem";
import NewProjectForm from "./NewProjectForm";
import { formatEventDate, isoToPickerDate, pickerDateToIsoDateString } from "@/lib/dateUtils";

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
  const [date, setDate] = useState(() => isoToPickerDate(event.date));

  function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateEvent(name.trim(), description.trim(), pickerDateToIsoDateString(date));
    setEditing(false);
  }

  function handleCancel() {
    setName(event.name);
    setDescription(event.description);
    setDate(isoToPickerDate(event.date));
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-primary/10 bg-white-dark shadow-sm">
      <div className="border-b border-primary/10 bg-primary px-5 py-4 rounded-t-xl">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-2">
            <div>
              <label className="block text-base font-medium text-white">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-primary/20 px-3 py-2 text-xs font-semibold focus:border-secondary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-white">Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-primary/20 px-3 py-2 text-xs focus:border-secondary focus:outline-none"
              />
            </div>
            <DatePicker value={date} onChange={setDate} format="dd.MM.y" clearIcon={null} />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-primary/20 px-4 py-2 text-base font-medium text-white hover:bg-primary-light"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary-light px-4 py-2 text-base font-medium text-white hover:bg-primary-dark"
              >
                Speichern
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-white">{event.name}</h2>
              {event.date && (
                <p className="text-base font-medium uppercase tracking-wide text-secondary">
                  {formatEventDate(event.date)}
                </p>
              )}
              {event.description && (
                <p className="mt-1 text-base text-white">{event.description}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light"
              >
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={onDeleteEvent}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary-light/30"
              >
                Löschen
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 px-5 py-4">
        <h3 className="text-xs font-semibold text-primary/80">
          {event.projects.length} Projekte
        </h3>

        {event.projects.length === 0 ? (
          <p className="text-xs text-primary/50">Noch keine Projekte in diesem Event.</p>
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
