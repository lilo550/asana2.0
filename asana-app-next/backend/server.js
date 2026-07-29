import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import eventsRouter from "./routes/events.js";
import authRouter from "./routes/auth.js";
import pushRouter from "./routes/push.js";
import { authenticate } from "./middleware/authenticate.js";
import { sendDueReminders } from "./lib/eventReminders.js";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET ist nicht gesetzt. Bitte in der .env-Datei definieren, bevor der Server startet."
  );
}

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- Auth ---
app.use("/api/Auth", authRouter);

// --- Events (inkl. verschachtelter Projekte) ---
app.use("/api/events", authenticate, eventsRouter);

// --- Web Push ---
app.use("/api/push", authenticate, pushRouter);

const httpServer = app.listen(PORT, () => {
  console.log(`Backend laeuft auf http://localhost:${PORT}`);
});

// Prueft periodisch auf Events, die in 3 Tagen faellig sind, und schickt
// Push-Erinnerungen. Einmal sofort beim Start (praktisch zum Testen) und
// danach alle 24 Stunden.
const REMINDER_CHECK_INTERVAL_MS = 1 * 60 * 60 * 1000;

function checkReminders() {
  sendDueReminders().catch((err) => {
    console.error("Fehler beim Pruefen faelliger Events:", err);
  });
}

checkReminders();
setInterval(checkReminders, REMINDER_CHECK_INTERVAL_MS);

// --- socket.io: NICHT produktiv notwendig -------------------------------
// Reine Lern-/Demo-Integration (siehe documentation.md, Session 7). Die
// eigentliche App braucht laut eigener Analyse keine Echtzeit-Kommunikation
// zwischen Nutzern ("keine Echtzeit notwendig, da zwischen den Nutzern
// keine Kommunikation besteht"). Es existiert kein echtes "Message"-Feature
// in der Anwendung - dieser Block demonstriert nur das Broadcast-Muster:
// ein Client sendet "new-message", der Server leitet es an alle ANDEREN
// verbundenen Clients weiter (socket.broadcast.emit), damit deren Ansicht
// live aktualisiert wuerde, ohne dass sie neu laden muessen.
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("new-message", (data) => {
    socket.broadcast.emit("new-message", data);
  });
});