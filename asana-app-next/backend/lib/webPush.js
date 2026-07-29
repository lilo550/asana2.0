import "dotenv/config";
import webpush from "web-push";
import { prisma } from "../prismaClient.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

webpush.setVapidDetails(
  `mailto:noreply@${new URL(FRONTEND_URL).hostname}`,
  process.env.PUSH_PUBLIC_KEY,
  process.env.PUSH_PRIVATE_KEY
);

// Sendet eine Push-Notification an eine einzelne Subscription. Antwortet der
// Push-Dienst mit 410 (Gone), ist die Subscription abgelaufen/ungueltig und
// wird aus der DB geloescht, damit kuenftige Versuche sie nicht mehr treffen.
export async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload
    );
  } catch (err) {
    if (err.statusCode === 410) {
      await prisma.pushSubscription
        .delete({ where: { id: subscription.id } })
        .catch(() => {});
    } else {
      console.error("Fehler beim Push-Versand:", err.message || err);
    }
  }
}