import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import eventsRouter from "./routes/events.js";
import authRouter from "./routes/auth.js";
import { authenticate } from "./middleware/authenticate.js";

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

app.listen(PORT, () => {
  console.log(`Backend laeuft auf http://localhost:${PORT}`);
});