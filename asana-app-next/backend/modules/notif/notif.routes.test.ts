import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("./notif.service.js", () => ({
  getPushPublicKey: vi.fn(),
  subscribeToPush: vi.fn(),
  ValidationError: class ValidationError extends Error {},
}));

import * as notifService from "./notif.service.js";
import notifRouter from "./notif.routes.js";

const USER_ID = 42;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { user: { userId: number } }).user = { userId: USER_ID };
    next();
  });
  app.use("/api/push", notifRouter);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/push/public-key", () => {
  it("Normalfall: liefert den Public-Key", async () => {
    vi.mocked(notifService.getPushPublicKey).mockReturnValue("test-key" as never);

    const res = await request(buildApp()).get("/api/push/public-key");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ publicKey: "test-key" });
  });

  it("Fehlerfall: unerwarteter Fehler liefert 500", async () => {
    vi.mocked(notifService.getPushPublicKey).mockImplementation(() => {
      throw new Error("kaputt");
    });

    const res = await request(buildApp()).get("/api/push/public-key");

    expect(res.status).toBe(500);
  });
});

describe("POST /api/push/subscribe", () => {
  it("Normalfall: speichert die Subscription", async () => {
    vi.mocked(notifService.subscribeToPush).mockResolvedValue(undefined as never);

    const res = await request(buildApp())
      .post("/api/push/subscribe")
      .send({ endpoint: "https://push.example.com/abc", keys: { p256dh: "a", auth: "b" } });

    expect(res.status).toBe(201);
    expect(notifService.subscribeToPush).toHaveBeenCalledWith(USER_ID, {
      endpoint: "https://push.example.com/abc",
      keys: { p256dh: "a", auth: "b" },
    });
  });

  it("Fehlerfall: ValidationError liefert 400", async () => {
    vi.mocked(notifService.subscribeToPush).mockRejectedValue(
      new notifService.ValidationError("Ungültige Push-Subscription")
    );

    const res = await request(buildApp()).post("/api/push/subscribe").send({});

    expect(res.status).toBe(400);
  });

  it("Fehlerfall: unerwarteter Fehler liefert 500", async () => {
    vi.mocked(notifService.subscribeToPush).mockRejectedValue(new Error("db down"));

    const res = await request(buildApp())
      .post("/api/push/subscribe")
      .send({ endpoint: "https://push.example.com/abc", keys: { p256dh: "a", auth: "b" } });

    expect(res.status).toBe(500);
  });
});