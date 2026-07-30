import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../modules/events/events.service.js", () => ({
  listEventsDueInDays: vi.fn(),
}));

vi.mock("../modules/notif/notif.service.js", () => ({
  getPushSubscriptionsForUser: vi.fn(),
}));

vi.mock("./webPush.js", () => ({
  sendPushNotification: vi.fn(),
}));

import { listEventsDueInDays } from "../modules/events/events.service.js";
import { getPushSubscriptionsForUser } from "../modules/notif/notif.service.js";
import { sendPushNotification } from "./webPush.js";
import { sendDueReminders } from "./eventReminders.js";

describe("sendDueReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Normalfall: schickt eine Erinnerung pro Push-Subscription eines faelligen Events", async () => {
    vi.mocked(listEventsDueInDays).mockResolvedValue([
      { id: 1, userId: 42, name: "Feier", description: "Text" },
    ] as never);
    vi.mocked(getPushSubscriptionsForUser).mockResolvedValue([{ id: 1 }, { id: 2 }] as never);

    const count = await sendDueReminders();

    expect(count).toBe(1);
    expect(listEventsDueInDays).toHaveBeenCalledWith(3);
    expect(getPushSubscriptionsForUser).toHaveBeenCalledWith(42);
    expect(sendPushNotification).toHaveBeenCalledTimes(2);
  });

  it("Leerer Input: Event ohne Push-Subscriptions wird uebersprungen", async () => {
    vi.mocked(listEventsDueInDays).mockResolvedValue([{ id: 1, userId: 42, name: "Feier" }] as never);
    vi.mocked(getPushSubscriptionsForUser).mockResolvedValue([] as never);

    await sendDueReminders();

    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it("Grenzfall: keine faelligen Events liefert 0 und fragt keine Subscriptions ab", async () => {
    vi.mocked(listEventsDueInDays).mockResolvedValue([] as never);

    const count = await sendDueReminders();

    expect(count).toBe(0);
    expect(getPushSubscriptionsForUser).not.toHaveBeenCalled();
  });
});