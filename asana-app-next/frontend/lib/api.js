import { authFetch } from "./authFetch";

export async function parseResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Anfrage fehlgeschlagen");
  }
  if (res.status === 204) return null;
  return res.json();
}

// Login/Register bewusst OHNE authFetch: ein 401 hier ist eine normale
// Formular-Fehlermeldung ("falsches Passwort"), keine abgelaufene Session -
// authFetch wuerde in diesem Fall faelschlicherweise den Cookie loeschen und
// mitten im Login-Versuch zur Login-Seite weiterleiten.
async function publicRequest(apiUrl, path, options) {
  const res = await fetch(`${apiUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  return parseResponse(res);
}

// Fuer alle Endpunkte, die ein gueltiges Login voraussetzen.
async function request(apiUrl, path, options) {
  const res = await authFetch(`${apiUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return parseResponse(res);
}

// --- Auth ---

export function registerUser(apiUrl, { email, password }) {
  return publicRequest(apiUrl, "/api/Auth/Register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginUser(apiUrl, { email, password }) {
  return publicRequest(apiUrl, "/api/Auth/Login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logoutUser(apiUrl) {
  return publicRequest(apiUrl, "/api/Auth/Logout", { method: "POST" });
}

// Tauscht das kurzlebige Token aus dem Mail-Login-Link (siehe /session-Seite)
// per POST gegen ein Session-Cookie ein. Bewusst OHNE authFetch, aus dem
// gleichen Grund wie bei Login/Register: ein 401 hier bedeutet "Link ist
// ungueltig/abgelaufen", keine abgelaufene Session.
export function exchangeSessionToken(apiUrl, token) {
  return publicRequest(apiUrl, "/api/Auth/session", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function getCurrentUser(apiUrl) {
  return request(apiUrl, "/api/Auth/Me");
}

// --- Web Push ---

export function getPushPublicKey(apiUrl) {
  return request(apiUrl, "/api/push/public-key");
}

export function subscribeToPush(apiUrl, subscription) {
  return request(apiUrl, "/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });
}

// --- Events ---

export function getEvents(apiUrl) {
  return request(apiUrl, "/api/events");
}

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
