import express from "express";
import cors from "cors";
import eventsRouter from "./routes/events.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- Events (inkl. verschachtelter Projekte) ---
app.use("/api/events", eventsRouter);

app.listen(PORT, () => {
  console.log(`Backend laeuft auf http://localhost:${PORT}`);
});
