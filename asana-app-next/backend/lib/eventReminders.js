import { listEventsDueInDays } from "../modules/events/events.service.js";
import { getPushSubscriptionsForUser } from "../modules/notif/notif.service.js";
import { sendPushNotification } from "./webPush.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REMINDER_DAYS_AHEAD = 3;

// Sucht alle Events, deren Datum genau REMINDER_DAYS_AHEAD Tage in der
// Zukunft liegt, und schickt an jeden registrierten Push-Client des
// jeweiligen Besitzers eine Erinnerung. Greift dafuer bewusst nicht selbst
// auf die Event- oder PushSubscription-Tabelle zu, sondern nur ueber die
// exportierten Funktionen der zustaendigen Module (Events bzw. Notif).
export async function sendDueReminders() {
  const dueEvents = await listEventsDueInDays(REMINDER_DAYS_AHEAD);

  for (const event of dueEvents) {
    const subscriptions = await getPushSubscriptionsForUser(event.userId);
    if (subscriptions.length === 0) continue;

    const payload = JSON.stringify({
      title: `Fällig in ${REMINDER_DAYS_AHEAD} Tagen: ${event.name}`,
      body: event.description || "Dein Event steht in Kürze an.",
      url: FRONTEND_URL,
    });

    for (const subscription of subscriptions) {
      await sendPushNotification(subscription, payload);
    }
  }

  return dueEvents.length;
}