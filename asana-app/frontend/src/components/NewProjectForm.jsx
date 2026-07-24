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
      <button className="new-project-cta" onClick={() => setOpen(true)}>
        + Neues Projekt anlegen
      </button>
    );
  }

  return (
    <form className="new-project-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Projektname"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <textarea
        placeholder="Beschreibung (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="new-project-form-actions">
        <button type="submit" className="btn-primary">
          Projekt erstellen
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOpen(false)}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
