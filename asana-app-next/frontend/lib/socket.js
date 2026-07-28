import { io } from "socket.io-client";

// NICHT produktiv notwendig - reine Lern-/Demo-Integration (siehe
// documentation.md, Session 7). Laut eigener Analyse dort braucht diese App
// keine Echtzeit-Kommunikation zwischen Nutzern ("keine Echtzeit notwendig,
// da zwischen den Nutzern keine Kommunikation besteht"). Es gibt aktuell
// keine echte "Nachricht senden"-Funktion im UI - dieses Modul demonstriert
// nur das Muster, wie man zusaetzlich zu einem bestehenden API-Call ein
// socket-Event abfeuern wuerde, damit andere offene Clients sofort (ohne
// Reload) aktualisieren wuerden. Es wird bewusst nirgends im echten UI
// aufgerufen.
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

let socket;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true });
  }
  return socket;
}

// Theoretisches Beispiel, wie ein Aufruf aussehen wuerde (nicht real verdrahtet):
//
//   await createEvent(apiUrl, data); // bestehender API-Call
//   emitNewMessage(data);            // zusaetzliches socket-Event fuer andere Clients
//
export function emitNewMessage(message) {
  getSocket().emit("new-message", message);
}

export function onNewMessage(callback) {
  getSocket().on("new-message", callback);
}