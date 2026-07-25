"use client";

import { useState } from "react";

export default function NewProjectForm({ onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName("");
    setDescription("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-dashed border-primary/30 py-2 text-xs font-medium text-primary hover:border-secondary hover:text-secondary"
      >
        + Projekt hinzufügen
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-primary/10 bg-highlight-light p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Projektname"
        autoFocus
        className="w-full rounded-md border border-primary/20 px-2 py-1.5 text-sm focus:border-secondary focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Beschreibung des Projekts"
        rows={2}
        className="w-full rounded-md border border-primary/20 px-2 py-1.5 text-sm focus:border-secondary focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-white"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light"
        >
          Hinzufügen
        </button>
      </div>
    </form>
  );
}
