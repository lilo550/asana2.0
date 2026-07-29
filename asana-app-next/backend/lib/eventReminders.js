import { prisma } from "../prismaClient.js";
import { sendPushNotification } from "./webPush.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REMINDER_DAYS_AHEAD = 3;

function dayRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

// Sucht alle Events, deren Datum genau REMINDER_DAYS_AHEAD Tage in der
// Zukunft liegt (kalendertag-genau, unabhaengig von der Uhrzeit in
// event.date), und schickt an jeden registrierten Push-Client des
// jeweiligen Besitzers eine Erinnerung.
export async function sendDueReminders() {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + REMINDER_DAYS_AHEAD);
  const { start, end } = dayRange(targetDate);

  const dueEvents = await prisma.event.findMany({
    where: { date: { gte: start, lte: end } },
    include: { user: { include: { pushSubscriptions: true } } },
  });

  for (const event of dueEvents) {
    if (event.user.pushSubscriptions.length === 0) continue;

    const payload = JSON.stringify({
      title: `Fällig in ${REMINDER_DAYS_AHEAD} Tagen: ${event.name}`,
      body: event.description || "Dein Event steht in Kürze an.",
      url: FRONTEND_URL,
    });

    for (const subscription of event.user.pushSubscriptions) {
      await sendPushNotification(subscription, payload);
    }
  }

  return dueEvents.length;
}