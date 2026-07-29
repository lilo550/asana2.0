import { Router } from "express";
import { prisma } from "../prismaClient.js";

const router = Router();

// Liefert den VAPID-Public-Key, damit das Frontend applicationServerKey
// nicht dupliziert in einer eigenen .env pflegen muss.
router.get("/public-key", (req, res) => {
  res.json({ publicKey: process.env.PUSH_PUBLIC_KEY });
});

// Speichert (bzw. aktualisiert) die Push-Subscription des angemeldeten Nutzers.
router.post("/subscribe", async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "Ungültige Push-Subscription" });
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.user.userId },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: req.user.userId,
      },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Speichern der Push-Subscription" });
  }
});

export default router;