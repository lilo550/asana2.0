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
        className="w-full rounded-md border border-dashed border-primary/30 py-2 text-base font-medium text-primary hover:border-secondary hover:text-secondary"
      >
        + Projekt hinzufügen
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-primary/10 bg-primary p-3">
      <div>
        <label className="block text-base font-medium text-white">Projektname</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Projektname"
          autoFocus
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
          className="w-full rounded-md border border-primary/20 px-2 py-1.5 text-xs focus:border-secondary focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-primary/20 px-3 py-1.5 text-base font-medium text-white hover:bg-primary-light"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary-light px-3 py-1.5 text-base font-medium text-white hover:bg-primary-dark"
        >
          Hinzufügen
        </button>
      </div>
    </form>
  );
}
