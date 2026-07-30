"use client";

import { useState } from "react";

export default function ProjectItem({ project, onUpdate, onDelete, onToggleDone }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);

  function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdate(name.trim(), description.trim());
    setEditing(false);
  }

  function handleCancel() {
    setName(project.name);
    setDescription(project.description);
    setEditing(false);
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        data-cy="project-item"
        className="space-y-2 rounded-md border border-secondary/40 bg-primary p-3"
      >
        <div>
          <label className="block text-base font-medium text-white">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Projektname"
            data-cy="edit-project-name-input"
            className="w-full rounded-md border border-primary/20 px-2 py-1.5 text-xs focus:border-secondary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-base font-medium text-white">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung"
            rows={2}
            data-cy="edit-project-description-input"
            className="w-full rounded-md border border-primary/20 px-2 py-1.5 text-xs focus:border-secondary focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            data-cy="edit-project-cancel-button"
            className="rounded-md border border-primary/20 px-3 py-1.5 text-base font-medium text-white hover:bg-primary-light"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            data-cy="edit-project-save-button"
            className="rounded-md bg-primary-light px-3 py-1.5 text-base font-medium text-white hover:bg-primary-dark"
          >
            Speichern
          </button>
        </div>
      </form>
    );
  }

  return (
    <div data-cy="project-item" className="flex items-start justify-between gap-3 rounded-md border border-primary/10 bg-primary p-3">
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => onToggleDone(!project.done)}
          data-cy="toggle-project-done"
          className={
            project.done
              ? "rounded-md bg-highlight px-2 py-1 text-xs font-medium text-success bg-success-light hover:bg-success hover:text-success-light"
              : "rounded-md px-2 py-1 text-xs font-medium text-danger bg-danger-light hover:bg-danger hover:text-danger-light"
          }
        >
          {project.done ? "Erledigt" : "Offen"}
        </button>
        <p data-cy="project-name" className="font-medium text-white">
          {project.name}
        </p>
        {project.description && (
          <p className="mt-0.5 text-xs text-white">{project.description}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          data-cy="edit-project-button"
          className="rounded-md px-2 py-1 text-xs font-medium text-white hover:bg-primary-light"
        >
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={onDelete}
          data-cy="delete-project-button"
          className="rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary-light/30"
        >
          Löschen
        </button>
      </div>
    </div>
  );
}
