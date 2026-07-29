import { Router } from "express";
import { getPushPublicKey, subscribeToPush, ValidationError } from "./notif.service.js";

const router = Router();

// Uebersetzt einen Service-Fehler in den passenden HTTP-Status: 400 fuer
// ungueltige Eingaben, sonst 500 fuer alles Unerwartete.
function sendServiceError(res, err, fallbackMessage) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  res.status(500).json({ error: fallbackMessage });
}

// Liefert den VAPID-Public-Key fuer die Push-Registrierung im Frontend.
router.get("/public-key", (req, res) => {
  try {
    res.json({ publicKey: getPushPublicKey() });
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden des Public Keys" });
  }
});

// Speichert (bzw. aktualisiert) die Push-Subscription des angemeldeten Nutzers.
router.post("/subscribe", async (req, res) => {
  const { endpoint, keys } = req.body;

  try {
    await subscribeToPush(req.user.userId, { endpoint, keys });
    res.status(201).json({ ok: true });
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Speichern der Push-Subscription");
  }
});

export default router;