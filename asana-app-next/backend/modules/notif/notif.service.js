import { prisma } from "../../prismaClient.js";

// Die Route entscheidet anhand des Typs, welcher HTTP-Status daraus wird -
// dieser Service weiss nichts von req/res.
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function assertValidSubscription({ endpoint, keys }) {
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new ValidationError("Ungültige Push-Subscription");
  }
}

// Liefert den VAPID-Public-Key, damit das Frontend applicationServerKey
// nicht dupliziert in einer eigenen .env pflegen muss.
export function getPushPublicKey() {
  return process.env.PUSH_PUBLIC_KEY;
}

// Liefert alle Push-Subscriptions eines Nutzers. Kapselt den Zugriff auf die
// PushSubscription-Tabelle, damit andere Module (z.B. der Event-Reminder-Job)
// nicht selbst per Prisma-Include in diese Notif-eigene Tabelle greifen.
export async function getPushSubscriptionsForUser(userId) {
  return prisma.pushSubscription.findMany({ where: { userId } });
}

// Speichert (bzw. aktualisiert) die Push-Subscription eines Nutzers.
export async function subscribeToPush(userId, { endpoint, keys }) {
  assertValidSubscription({ endpoint, keys });

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
    },
  });
}