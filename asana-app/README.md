# asana-app

Eine einfache Projekt- und Aufgaben-Übersicht.

**User Story:** Als Nutzer möchte ich eine Übersicht über meine Projekte und deren Unteraufgaben haben, damit ich den Überblick behalten kann.

## Tech-Stack

- **Frontend:** React + Vite, läuft auf Port `5173`
- **Backend:** Express (Node.js), läuft auf Port `3000`

## Projektstruktur

```
asana-app/
├── backend/          Express API (Port 3000)
│   ├── server.js
│   ├── data.js       In-Memory Datenspeicher (Beispieldaten)
│   └── package.json
├── frontend/          React + Vite App (Port 5173)
│   ├── src/
│   └── package.json
└── .vscode/          VS Code Tasks zum bequemen Starten
```

## Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 18 oder neuer empfohlen)
- Visual Studio Code

## Installation

Frontend und Backend haben jeweils ein eigenes `package.json` und müssen **separat** installiert werden.

Im Terminal von VS Code (Menü *Terminal → New Terminal*):

```bash
# Backend-Abhängigkeiten installieren
cd backend
npm install

# In einem zweiten Terminal: Frontend-Abhängigkeiten installieren
cd frontend
npm install
```

## Starten des Projekts

Frontend und Backend werden **unabhängig voneinander** gestartet – dafür werden zwei Terminals benötigt.

### Option A: Über zwei Terminals in VS Code

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
```
→ Backend läuft nun auf `http://localhost:3000`

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```
→ Frontend läuft nun auf `http://localhost:5173`

Öffne anschließend `http://localhost:5173` im Browser.

### Option B: Über die VS Code Tasks (bequemer)

Dieses Projekt bringt vorgefertigte VS Code Tasks mit (`.vscode/tasks.json`):

1. `Strg/Cmd + Shift + P` → „Run Task" auswählen
2. Task **„Beide starten (Backend + Frontend)"** wählen

Dadurch werden Backend und Frontend automatisch in zwei separaten Terminal-Panels gestartet.

## API-Endpunkte (Backend)

| Methode | Endpunkt                              | Beschreibung                          |
|---------|----------------------------------------|----------------------------------------|
| GET     | `/api/projects`                        | Alle Projekte inkl. Unteraufgaben      |
| GET     | `/api/projects/:id`                    | Einzelnes Projekt                      |
| POST    | `/api/projects`                        | Neues Projekt anlegen                  |
| DELETE  | `/api/projects/:id`                    | Projekt löschen                        |
| POST    | `/api/projects/:id/tasks`              | Unteraufgabe hinzufügen                |
| PATCH   | `/api/projects/:id/tasks/:taskId`      | Erledigt-Status umschalten             |
| DELETE  | `/api/projects/:id/tasks/:taskId`      | Unteraufgabe löschen                   |

## Design

Das Farbschema basiert auf:

- **Primary:** `#213745` (Header, Text)
- **Secondary:** `#ff5b8e` (Akzente, Buttons, Fortschrittsbalken)
- **Highlight:** `#ead9c9` (Rahmen, dezente Flächen)

Die Farben sind als CSS-Variablen in `frontend/src/index.css` hinterlegt (`--color-primary`, `--color-secondary`, `--color-highlight`) und können dort zentral angepasst werden.

## Hinweis zu den Daten

Das Backend speichert die Daten aktuell **nur im Arbeitsspeicher** (`backend/data.js`). Nach einem Neustart des Backends sind alle Änderungen zurückgesetzt und die Beispielprojekte werden neu geladen. Für eine dauerhafte Speicherung könnte hier später z.B. SQLite oder eine andere Datenbank angebunden werden.
