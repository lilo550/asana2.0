import "dotenv/config";
import { Resend } from "resend";
import { render } from "@react-email/render";
import jwt from "jsonwebtoken";
import { WelcomeEmail } from "../emails/WelcomeEmail.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// Sendet die Registrierungs-Benachrichtigung. Wird vom Aufrufer bewusst
// nicht awaited (siehe modules/auth/auth.service.js), damit der Mailversand
// die HTTP-Antwort auf POST /Register nicht blockiert.
export async function sendWelcomeEmail({ userId, email, name }) {
  // Eigenes, kurzlebiges Token nur fuer den Auto-Login-Link in der Mail -
  // unabhaengig vom regulaeren 24h-Session-Cookie, bewusst kuerzer gueltig
  // (15 Minuten), da es per E-Mail verschickt wird.
  const sessionToken = jwt.sign({ userId, email }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
  });
  // Zeigt bewusst auf eine Frontend-Landing-Page, nicht direkt auf den
  // Backend-Endpoint: die Seite tauscht das Token per POST (Body statt
  // Query-String) gegen das Session-Cookie ein. So landet der Token nicht in
  // Backend-Zugriffslogs, und ein einfacher GET (z.B. durch einen
  // Link-Scanner eines Mail-Providers) verbraucht das Einmal-Token nicht
  // automatisch (siehe modules/auth/auth.routes.js, POST /session).
  const loginUrl = `${FRONTEND_URL}/session?token=${sessionToken}`;

  const html = await render(WelcomeEmail({ name, loginUrl }));

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Willkommen bei Asana-Next!",
    html,
  });
}