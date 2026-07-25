"use client";

import { useState } from "react";

export default function NewEventForm({ onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), date);
    setName("");
    setDescription("");
    setDate("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 w-full rounded-lg border-2 border-dashed border-primary/30 py-3 text-sm font-medium text-primary hover:border-secondary hover:text-secondary"
      >
        + Neues Event anlegen
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-3 rounded-lg border border-primary/10 bg-white p-4 shadow-sm"
    >
      <div>
        <label className="block text-sm font-medium text-primary">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Eventname"
          autoFocus
          className="mt-1 w-full rounded-md border border-primary/20 px-3 py-2 text-sm focus:border-secondary focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary">Beschreibung</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung des Events"
          rows={2}
          className="mt-1 w-full rounded-md border border-primary/20 px-3 py-2 text-sm focus:border-secondary focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary">Datum</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-primary/20 px-3 py-2 text-sm focus:border-secondary focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-primary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-highlight-light"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          Event anlegen
        </button>
      </div>
    </form>
  );
}
