import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate.js";
import {
  registerUser,
  loginUser,
  exchangeSessionToken,
  getUserById,
  ValidationError,
  ConflictError,
  InvalidCredentialsError,
} from "./auth.service.js";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 Stunden

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele Versuche. Bitte später erneut versuchen." },
});

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

export function setAuthCookie(res, token) {
  res.cookie("token", token, { ...COOKIE_OPTIONS, maxAge: TOKEN_TTL_MS });
}

// Uebersetzt einen Service-Fehler in den passenden HTTP-Status, sonst 500
// fuer alles Unerwartete.
function sendServiceError(res, err, fallbackMessage) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
  if (err instanceof InvalidCredentialsError) return res.status(401).json({ error: err.message });
  res.status(500).json({ error: fallbackMessage });
}

// Registrierung
router.post("/Register", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await registerUser({ email, password });
    res.status(201).json(user);
  } catch (err) {
    sendServiceError(res, err, "Fehler bei der Registrierung");
  }
});

// Login
router.post("/Login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const { user, token } = await loginUser({ email, password });
    setAuthCookie(res, token);
    res.json(user);
  } catch (err) {
    sendServiceError(res, err, "Fehler beim Login");
  }
});

// Logout: loescht den HttpOnly-Cookie serverseitig (Frontend-JS kann das nicht selbst).
router.post("/Logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(204).send();
});

// Tauscht das kurzlebige Token aus dem Mail-Link gegen ein normales
// Session-Cookie und leitet auf die Startseite weiter - dort ist der Nutzer
// dann bereits eingeloggt (siehe lib/mailer.js fuer die Token-Erzeugung).
router.get("/session", (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.redirect(`${FRONTEND_URL}/login`);
  }

  try {
    const sessionToken = exchangeSessionToken(token);
    setAuthCookie(res, sessionToken);
    res.redirect(FRONTEND_URL);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/login`);
  }
});

// "Wer bin ich": liefert die Daten des anhand des Tokens erkannten Nutzers.
router.get("/Me", authenticate, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: "Nutzer nicht gefunden" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden des Nutzers" });
  }
});

export default router;