import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { prisma } from "../prismaClient.js";
import { authenticate } from "../middleware/authenticate.js";
import { sendWelcomeEmail } from "../lib/mailer.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 Stunden
const INVALID_CREDENTIALS_MESSAGE = "E-Mail oder Passwort ungültig.";
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST_FACTOR = 12;

// Bcrypt-Hash eines nie verwendeten Platzhalter-Passworts. Wird bei
// unbekannter E-Mail als Vergleichsziel genutzt, damit bcrypt.compare()
// immer laeuft - sonst waere die Login-Antwortzeit ein Seitenkanal, ueber
// den sich registrierte E-Mail-Adressen trotz identischer Fehlermeldung
// erraten liessen (schnelle Antwort = unbekannt, langsame = bekannt).
const DUMMY_PASSWORD_HASH =
  "$2b$12$CwTycUXWue0Thq9StjUM0uJ8mv7XPHzcyDodxrp99SePFbSHUdzoS";

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

// Wird bewusst NICHT awaited beim Aufruf (siehe POST /Register), damit der
// Mailversand die HTTP-Antwort nicht blockiert. Der try/catch hier verhindert,
// dass ein Fehler beim Mailversand als unhandled rejection landet.
async function notifyRegistration(user) {
  try {
    await sendWelcomeEmail({ userId: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error("Fehler beim Versand der Registrierungs-Mail:", err);
  }
}

// Registrierung
router.post("/Register", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !email.trim() || !password) {
    return res.status(400).json({ error: "E-Mail und Passwort sind erforderlich" });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      error: `Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben`,
    });
  }
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Diese E-Mail ist bereits vergeben." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
        name: normalizedEmail.split("@")[0],
      },
    });

    // Nicht awaited: der Mailversand darf die Antwort auf die Registrierung
    // nicht verzoegern.
    notifyRegistration(user);

    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ error: "Fehler bei der Registrierung" });
  }
});

// Login
router.post("/Login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
  }
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    // bcrypt.compare laeuft bewusst IMMER (auch bei unbekannter E-Mail, dann
    // gegen den Dummy-Hash) - siehe Kommentar bei DUMMY_PASSWORD_HASH.
    const passwordMatches = await bcrypt.compare(
      password,
      user?.password ?? DUMMY_PASSWORD_HASH
    );

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "24h",
    });
    setAuthCookie(res, token);

    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Login" });
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
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const sessionToken = jwt.sign(
      { userId: payload.userId, email: payload.email },
      JWT_SECRET,
      { algorithm: "HS256", expiresIn: "24h" }
    );
    setAuthCookie(res, sessionToken);
    res.redirect(FRONTEND_URL);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/login`);
  }
});

// "Wer bin ich": liefert die Daten des anhand des Tokens erkannten Nutzers.
router.get("/Me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return res.status(404).json({ error: "Nutzer nicht gefunden" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden des Nutzers" });
  }
});

export default router;