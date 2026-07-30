import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../prismaClient.js", () => ({
  prisma: {
    pushSubscription: { findMany: vi.fn(), upsert: vi.fn() },
  },
}));

import { prisma } from "../../prismaClient.js";
import { getPushPublicKey, getPushSubscriptionsForUser, subscribeToPush, ValidationError } from "./notif.service.js";

describe("getPushPublicKey", () => {
  it("Normalfall: liefert den konfigurierten VAPID-Public-Key", () => {
    const original = process.env.PUSH_PUBLIC_KEY;
    process.env.PUSH_PUBLIC_KEY = "test-public-key";

    expect(getPushPublicKey()).toBe("test-public-key");

    process.env.PUSH_PUBLIC_KEY = original;
  });
});

describe("getPushSubscriptionsForUser", () => {
  beforeEach(() => {
    vi.mocked(prisma.pushSubscription.findMany).mockReset();
  });

  it("Normalfall: liefert alle Push-Subscriptions eines Nutzers", async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([{ id: 1 }] as never);

    const result = await getPushSubscriptionsForUser(42);

    expect(result).toEqual([{ id: 1 }]);
    expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({ where: { userId: 42 } });
  });

  it("Leerer Input: Nutzer ohne Subscriptions liefert leeres Array", async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([] as never);

    expect(await getPushSubscriptionsForUser(999)).toEqual([]);
  });
});

describe("subscribeToPush", () => {
  beforeEach(() => {
    vi.mocked(prisma.pushSubscription.upsert).mockReset();
  });

  it("Normalfall: speichert eine gueltige Subscription per Upsert", async () => {
    await subscribeToPush(42, {
      endpoint: "https://push.example.com/abc",
      keys: { p256dh: "key1", auth: "key2" },
    });

    expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
      where: { endpoint: "https://push.example.com/abc" },
      update: { p256dh: "key1", auth: "key2", userId: 42 },
      create: { endpoint: "https://push.example.com/abc", p256dh: "key1", auth: "key2", userId: 42 },
    });
  });

  it("Fehlerfall: fehlender Endpoint wird mit ValidationError abgelehnt", async () => {
    await expect(
      subscribeToPush(42, { endpoint: "", keys: { p256dh: "key1", auth: "key2" } })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled();
  });

  it("Fehlerfall: fehlende Keys werden mit ValidationError abgelehnt", async () => {
    await expect(
      subscribeToPush(42, { endpoint: "https://push.example.com/abc", keys: {} })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled();
  });
});