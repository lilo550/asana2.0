"use client";

import { useState } from "react";
import DatePicker from "react-date-picker";
import { pickerDateToIsoDateString } from "@/lib/dateUtils";

export default function NewEventForm({ onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), pickerDateToIsoDateString(date));
    setName("");
    setDescription("");
    setDate(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-cy="new-event-open-button"
        className="mb-6 w-full rounded-lg border-2 border-dashed border-primary/30 py-3 text-base font-medium text-primary hover:border-secondary hover:text-secondary"
      >
        + Neues Event anlegen
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-3 rounded-lg border border-primary/10 bg-white-dark p-4 shadow-sm"
    >
      <div>
        <label className="block text-base font-medium text-primary">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Eventname"
          autoFocus
          data-cy="new-event-name-input"
          className="mt-1 w-full bg-white rounded-md border border-primary/20 px-3 py-2 text-xs focus:border-secondary focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-primary">Beschreibung</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung des Events"
          rows={2}
          data-cy="new-event-description-input"
          className="mt-1 w-full bg-white rounded-md border border-primary/20 px-3 py-2 text-xs focus:border-secondary focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-base font-medium text-primary">Datum</label>
        <DatePicker
          value={date}
          onChange={setDate}
          format="dd.MM.y"
          clearIcon={null}
          className="mt-1 w-full"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          data-cy="new-event-cancel-button"
          className="rounded-md border border-primary/20 px-4 py-2 text-base font-medium text-primary hover:bg-white"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          data-cy="new-event-submit-button"
          className="rounded-md bg-primary px-4 py-2 text-base font-medium text-white hover:bg-primary-light"
        >
          Event anlegen
        </button>
      </div>
    </form>
  );
}
