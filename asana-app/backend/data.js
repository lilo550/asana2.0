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
      { id: 1, title: "Wireframes erstellen", done: true },
      { id: 2, title: "Design-System definieren", done: true },
      { id: 3, title: "Frontend umsetzen", done: false },
    ],
  },
  {
    id: 2,
    name: "App-Launch Q3",
    description: "Vorbereitung und Durchfuehrung des App-Launches.",
    tasks: [
      { id: 4, title: "App Store Eintrag vorbereiten", done: false },
      { id: 5, title: "Marketing-Kampagne planen", done: false },
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

export function deleteProject(id) {
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return false;
  projects.splice(index, 1);
  return true;
}

export function addTask(projectId, title) {
  const project = getProject(projectId);
  if (!project) return null;
  const task = { id: nextTaskId++, title, done: false };
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

export function deleteTask(projectId, taskId) {
  const project = getProject(projectId);
  if (!project) return false;
  const index = project.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return false;
  project.tasks.splice(index, 1);
  return true;
}
