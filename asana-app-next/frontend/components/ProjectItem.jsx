"use client";

import { useState } from "react";

export default function ProjectItem({ project, onUpdate, onDelete }) {
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
      <form onSubmit={handleSave} className="space-y-2 rounded-md border border-secondary/40 bg-white p-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-primary/20 px-2 py-1.5 text-sm focus:border-secondary focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-primary/20 px-2 py-1.5 text-sm focus:border-secondary focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-highlight-light"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light"
          >
            Speichern
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-primary/10 bg-white p-3">
      <div className="min-w-0">
        <p className="font-medium text-primary">{project.name}</p>
        {project.description && (
          <p className="mt-0.5 text-sm text-primary/70">{project.description}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-highlight-light"
        >
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary/10"
        >
          Löschen
        </button>
      </div>
    </div>
  );
}
