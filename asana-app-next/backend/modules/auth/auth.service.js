import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../prismaClient.js";
import { sendWelcomeEmail } from "../../lib/mailer.js";

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_TOKEN_TTL = "24h";
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST_FACTOR = 12;
const INVALID_CREDENTIALS_MESSAGE = "E-Mail oder Passwort ungültig.";

// Bcrypt-Hash eines nie verwendeten Platzhalter-Passworts. Wird bei
// unbekannter E-Mail als Vergleichsziel genutzt, damit bcrypt.compare()
// immer laeuft - sonst waere die Login-Antwortzeit ein Seitenkanal, ueber
// den sich registrierte E-Mail-Adressen trotz identischer Fehlermeldung
// erraten liessen (schnelle Antwort = unbekannt, langsame = bekannt).
const DUMMY_PASSWORD_HASH =
  "$2b$12$CwTycUXWue0Thq9StjUM0uJ8mv7XPHzcyDodxrp99SePFbSHUdzoS";

// Die Route entscheidet anhand des Typs, welcher HTTP-Status daraus wird -
// dieser Service weiss nichts von req/res.
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Erzeugt ein signiertes Session-JWT mit den einheitlichen Standard-Optionen
// (Algorithmus, Payload-Form). Zentral an einer Stelle, damit Login und der
// Mail-Session-Austausch (exchangeSessionToken) nicht auseinanderlaufen.
export function createSessionToken({ userId, email }, { expiresIn = SESSION_TOKEN_TTL } = {}) {
  return jwt.sign({ userId, email }, JWT_SECRET, { algorithm: "HS256", expiresIn });
}

// Wird bewusst NICHT awaited beim Aufruf (siehe registerUser), damit der
// Mailversand die HTTP-Antwort nicht blockiert. Der try/catch hier verhindert,
// dass ein Fehler beim Mailversand als unhandled rejection landet.
async function notifyRegistration(user) {
  try {
    await sendWelcomeEmail({ userId: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error("Fehler beim Versand der Registrierungs-Mail:", err);
  }
}

// Legt einen neuen Nutzer an und stoesst die Willkommens-Mail an.
export async function registerUser({ email, password }) {
  if (!email || !email.trim() || !password) {
    throw new ValidationError("E-Mail und Passwort sind erforderlich");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben`);
  }

  const normalizedEmail = normalizeEmail(email);

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ConflictError("Diese E-Mail ist bereits vergeben.");
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

  return { id: user.id, email: user.email, name: user.name };
}

// Prueft E-Mail/Passwort und liefert bei Erfolg Nutzer + frisches Session-Token.
// Wirft InvalidCredentialsError bei falschen oder fehlenden Zugangsdaten.
export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE);
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // bcrypt.compare laeuft bewusst IMMER (auch bei unbekannter E-Mail, dann
  // gegen den Dummy-Hash) - siehe Kommentar bei DUMMY_PASSWORD_HASH.
  const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches) {
    throw new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE);
  }

  const token = createSessionToken({ userId: user.id, email: user.email });
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}

// Tauscht das kurzlebige Token aus dem Mail-Link (siehe lib/mailer.js) gegen
// ein neues, regulaeres Session-Token. Wirft bei ungueltigem/abgelaufenem Token.
export function exchangeSessionToken(token) {
  const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  return createSessionToken({ userId: payload.userId, email: payload.email });
}

// Liefert die oeffentlichen Felder eines Nutzers, oder null wenn er nicht existiert.
export async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
}