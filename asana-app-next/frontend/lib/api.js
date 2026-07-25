async function request(apiUrl, path, options) {
  const res = await fetch(`${apiUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Anfrage fehlgeschlagen");
  }
  if (res.status === 204) return null;
  return res.json();
}

// --- Events ---

export function createEvent(apiUrl, { name, description, date }) {
  return request(apiUrl, "/api/events", {
    method: "POST",
    body: JSON.stringify({ name, description, date }),
  });
}

export function updateEvent(apiUrl, eventId, { name, description, date }) {
  return request(apiUrl, `/api/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify({ name, description, date }),
  });
}

export function deleteEvent(apiUrl, eventId) {
  return request(apiUrl, `/api/events/${eventId}`, { method: "DELETE" });
}

// --- Projekte ---

export function createProject(apiUrl, eventId, { name, description }) {
  return request(apiUrl, `/api/events/${eventId}/projects`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export function updateProject(apiUrl, eventId, projectId, { name, description }) {
  return request(apiUrl, `/api/events/${eventId}/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({ name, description }),
  });
}

export function deleteProject(apiUrl, eventId, projectId) {
  return request(apiUrl, `/api/events/${eventId}/projects/${projectId}`, {
    method: "DELETE",
  });
}
