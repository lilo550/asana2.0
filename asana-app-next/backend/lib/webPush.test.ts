import { describe, expect, it, vi, beforeEach } from "vitest";

const { sendNotificationMock } = vi.hoisted(() => ({ sendNotificationMock: vi.fn() }));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: sendNotificationMock,
  },
}));

vi.mock("../prismaClient.js", () => ({
  prisma: { pushSubscription: { delete: vi.fn() } },
}));

import { prisma } from "../prismaClient.js";
import { sendPushNotification } from "./webPush.js";

const subscription = { id: 1, endpoint: "https://push.example.com/x", p256dh: "a", auth: "b" };

describe("sendPushNotification", () => {
  beforeEach(() => {
    sendNotificationMock.mockReset();
    vi.mocked(prisma.pushSubscription.delete).mockReset().mockResolvedValue(undefined as never);
  });

  it("Normalfall: sendet die Notification, ohne die Subscription anzufassen", async () => {
    sendNotificationMock.mockResolvedValue(undefined);

    await sendPushNotification(subscription, "payload");

    expect(sendNotificationMock).toHaveBeenCalledWith(
      { endpoint: subscription.endpoint, keys: { p256dh: "a", auth: "b" } },
      "payload"
    );
    expect(prisma.pushSubscription.delete).not.toHaveBeenCalled();
  });

  it("Fehlerfall: 410 Gone loescht die abgelaufene Subscription", async () => {
    sendNotificationMock.mockRejectedValue({ statusCode: 410 });

    await sendPushNotification(subscription, "payload");

    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({ where: { id: subscription.id } });
  });

  it("Fehlerfall: anderer Fehler loescht die Subscription nicht", async () => {
    sendNotificationMock.mockRejectedValue({ statusCode: 500, message: "server error" });

    await sendPushNotification(subscription, "payload");

    expect(prisma.pushSubscription.delete).not.toHaveBeenCalled();
  });

  it("Grenzfall: Fehler beim Loeschen der abgelaufenen Subscription wird verschluckt", async () => {
    sendNotificationMock.mockRejectedValue({ statusCode: 410 });
    vi.mocked(prisma.pushSubscription.delete).mockRejectedValue(new Error("db down"));

    await expect(sendPushNotification(subscription, "payload")).resolves.toBeUndefined();
  });
});