const BASE_URL = "http://localhost:3000/api";

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Ein Fehler ist aufgetreten");
  }
  return data;
}

export async function fetchProjects() {
  const res = await fetch(`${BASE_URL}/projects`);
  return handleResponse(res);
}

export async function createProject(name, description) {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  return handleResponse(res);
}

export async function updateProject(projectId, { name, description }) {
  const res = await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  return handleResponse(res);
}

export async function deleteProject(projectId) {
  const res = await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function addTask(projectId, title, description) {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  return handleResponse(res);
}

export async function toggleTask(projectId, taskId) {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks/${taskId}/toggle`, {
    method: "PATCH",
  });
  return handleResponse(res);
}

export async function updateTask(projectId, taskId, { title, description }) {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  return handleResponse(res);
}

export async function deleteTask(projectId, taskId) {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}
