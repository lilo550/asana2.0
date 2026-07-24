// Einfacher In-Memory-Datenspeicher.
// In einer echten Anwendung wuerde hier eine Datenbank (z.B. SQLite/Postgres) angebunden.

let nextProjectId = 3;
let nextTaskId = 6;

export const projects = [
  {
    id: 1,
    name: "Website Relaunch",
    description: "Neugestaltung der Firmenwebsite inkl. responsivem Design.",
    tasks: [
      { id: 1, title: "Wireframes erstellen", description: "", done: true },
      { id: 2, title: "Design-System definieren", description: "", done: true },
      { id: 3, title: "Frontend umsetzen", description: "", done: false },
    ],
  },
  {
    id: 2,
    name: "App-Launch Q3",
    description: "Vorbereitung und Durchfuehrung des App-Launches.",
    tasks: [
      { id: 4, title: "App Store Eintrag vorbereiten", description: "", done: false },
      { id: 5, title: "Marketing-Kampagne planen", description: "", done: false },
    ],
  },
];

export function getProjects() {
  return projects;
}

export function getProject(id) {
  return projects.find((p) => p.id === id);
}

export function createProject({ name, description }) {
  const project = {
    id: nextProjectId++,
    name,
    description: description || "",
    tasks: [],
  };
  projects.push(project);
  return project;
}

export function updateProject(id, { name, description }) {
  const project = getProject(id);
  if (!project) return null;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  return project;
}

export function deleteProject(id) {
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return false;
  projects.splice(index, 1);
  return true;
}

export function addTask(projectId, title, description) {
  const project = getProject(projectId);
  if (!project) return null;
  const task = { id: nextTaskId++, title, description: description || "", done: false };
  project.tasks.push(task);
  return task;
}

export function toggleTask(projectId, taskId) {
  const project = getProject(projectId);
  if (!project) return null;
  const task = project.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.done = !task.done;
  return task;
}

export function updateTask(projectId, taskId, { title, description }) {
  const project = getProject(projectId);
  if (!project) return null;
  const task = project.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  return task;
}

export function deleteTask(projectId, taskId) {
  const project = getProject(projectId);
  if (!project) return false;
  const index = project.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return false;
  project.tasks.splice(index, 1);
  return true;
}
