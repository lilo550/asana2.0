import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";

// Rate-Limiting ist fuer diesen Test irrelevant und wuerde ueber viele
// Requests hinweg (alle drei Routen teilen sich einen Limiter) den Zaehler
// unnoetig belasten - deshalb als No-Op gemockt.
vi.mock("express-rate-limit", () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Ersetzt die echte JWT-Pruefung durch einen festen Nutzer - authenticate.js
// wird separat getestet (middleware/authenticate.test.ts).
vi.mock("../../middleware/authenticate.js", () => ({
  authenticate: (req: { user?: { userId: number } }, _res: unknown, next: () => void) => {
    req.user = { userId: 42 };
    next();
  },
}));

vi.mock("./auth.service.js", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  exchangeSessionToken: vi.fn(),
  getUserById: vi.fn(),
  deleteUser: vi.fn(),
  ValidationError: class ValidationError extends Error {},
  ConflictError: class ConflictError extends Error {},
  InvalidCredentialsError: class InvalidCredentialsError extends Error {},
}));

import * as authService from "./auth.service.js";
import authRouter, { setAuthCookie, COOKIE_OPTIONS } from "./auth.routes.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Minimaler Fake fuer das Express-Response-Objekt: setAuthCookie ruft nur
// res.cookie(name, value, options) auf - der Aufruf wird hier mitgeschnitten.
function createMockRes() {
  const calls: Array<{ name: unknown; value: unknown; options: unknown }> = [];
  const res = {
    calls,
    cookie(name: unknown, value: unknown, options: unknown) {
      calls.push({ name, value, options });
      return res;
    },
  };
  return res;
}

describe("setAuthCookie", () => {
  it("Normalfall: gueltiger Token wird mit den erwarteten Cookie-Optionen gesetzt", () => {
    const res = createMockRes();

    setAuthCookie(res, "gueltiges.jwt.token");

    expect(res.calls).toHaveLength(1);
    expect(res.calls[0]).toEqual({
      name: "token",
      value: "gueltiges.jwt.token",
      options: { ...COOKIE_OPTIONS, maxAge: ONE_DAY_MS },
    });
  });

  it("Leerer Input: leerer Token-String wird dennoch als Cookie-Wert gesetzt", () => {
    const res = createMockRes();

    setAuthCookie(res, "");

    expect(res.calls).toHaveLength(1);
    expect(res.calls[0].value).toBe("");
    // Auch bei leerem Token duerfen die Sicherheits-Flags nicht wegfallen.
    expect(res.calls[0].options).toEqual({ ...COOKIE_OPTIONS, maxAge: ONE_DAY_MS });
  });

  it("Ungueltiger Typ: nicht-stringiger Token wird unveraendert durchgereicht", () => {
    const res = createMockRes();

    // ts-expect-error - bewusst ein falscher Typ, um zu dokumentieren,
    // dass setAuthCookie keine Laufzeit-Typpruefung des Tokens vornimmt.
    setAuthCookie(res, 12345);

    expect(res.calls).toHaveLength(1);
    expect(res.calls[0].value).toBe(12345);
    expect(res.calls[0].options).toEqual({ ...COOKIE_OPTIONS, maxAge: ONE_DAY_MS });
  });
});

// Deckt Empfehlung #12 ab: setAuthCookie (Login) und res.clearCookie (Logout)
// muessen exakt dieselben Basis-Optionen verwenden - sonst matcht der
// Lösch-Aufruf den ursprünglich gesetzten Cookie nicht und der Logout
// entfernt ihn im Browser nicht wirklich.
describe("COOKIE_OPTIONS Konsistenz zwischen Login und Logout", () => {
  it("Normalfall: setAuthCookie verwendet exakt COOKIE_OPTIONS plus maxAge", () => {
    const res = createMockRes();

    setAuthCookie(res, "gueltiges.jwt.token");

    const { maxAge, ...optionsWithoutMaxAge } = res.calls[0].options as Record<string, unknown>;
    expect(optionsWithoutMaxAge).toEqual(COOKIE_OPTIONS);
  });

  it("Leerer Input: COOKIE_OPTIONS bleiben bei leerem Token unveraendert", () => {
    const res = createMockRes();

    setAuthCookie(res, "");

    const { maxAge, ...optionsWithoutMaxAge } = res.calls[0].options as Record<string, unknown>;
    expect(optionsWithoutMaxAge).toEqual(COOKIE_OPTIONS);
  });

  it("Ungueltiger Typ: COOKIE_OPTIONS bleiben auch bei falschem Token-Typ unveraendert", () => {
    const res = createMockRes();

    // ts-expect-error - bewusst falscher Typ, siehe Test oben.
    setAuthCookie(res, null);

    const { maxAge, ...optionsWithoutMaxAge } = res.calls[0].options as Record<string, unknown>;
    expect(optionsWithoutMaxAge).toEqual(COOKIE_OPTIONS);
  });
});

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/Auth", authRouter);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/Auth/Register", () => {
  it("Normalfall: registriert und liefert 201", async () => {
    vi.mocked(authService.registerUser).mockResolvedValue({
      id: 1,
      email: "a@b.de",
      name: "a",
    } as never);

    const res = await request(buildApp())
      .post("/api/Auth/Register")
      .send({ email: "a@b.de", password: "gueltig123" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, email: "a@b.de", name: "a" });
  });

  it("Fehlerfall: ValidationError liefert 400", async () => {
    vi.mocked(authService.registerUser).mockRejectedValue(
      new authService.ValidationError("E-Mail und Passwort sind erforderlich")
    );

    const res = await request(buildApp()).post("/api/Auth/Register").send({});

    expect(res.status).toBe(400);
  });

  it("Fehlerfall: ConflictError liefert 409", async () => {
    vi.mocked(authService.registerUser).mockRejectedValue(
      new authService.ConflictError("Diese E-Mail ist bereits vergeben.")
    );

    const res = await request(buildApp())
      .post("/api/Auth/Register")
      .send({ email: "a@b.de", password: "gueltig123" });

    expect(res.status).toBe(409);
  });

  it("Fehlerfall: unerwarteter Fehler liefert 500", async () => {
    vi.mocked(authService.registerUser).mockRejectedValue(new Error("db down"));

    const res = await request(buildApp())
      .post("/api/Auth/Register")
      .send({ email: "a@b.de", password: "gueltig123" });

    expect(res.status).toBe(500);
  });
});

describe("POST /api/Auth/Login", () => {
  it("Normalfall: setzt das Session-Cookie und liefert den Nutzer", async () => {
    vi.mocked(authService.loginUser).mockResolvedValue({
      user: { id: 1, email: "a@b.de", name: "a" },
      token: "jwt.token.hier",
    } as never);

    const res = await request(buildApp())
      .post("/api/Auth/Login")
      .send({ email: "a@b.de", password: "richtig" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, email: "a@b.de", name: "a" });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^token=/);
  });

  it("Fehlerfall: InvalidCredentialsError liefert 401", async () => {
    vi.mocked(authService.loginUser).mockRejectedValue(
      new authService.InvalidCredentialsError("E-Mail oder Passwort ungültig.")
    );

    const res = await request(buildApp())
      .post("/api/Auth/Login")
      .send({ email: "a@b.de", password: "falsch" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/Auth/Logout", () => {
  it("Normalfall: loescht das Cookie und liefert 204", async () => {
    const res = await request(buildApp()).post("/api/Auth/Logout");

    expect(res.status).toBe(204);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^token=;/);
  });
});

describe("POST /api/Auth/session", () => {
  it("Fehlerfall: fehlendes Token liefert 400", async () => {
    const res = await request(buildApp()).post("/api/Auth/session").send({});

    expect(res.status).toBe(400);
    expect(authService.exchangeSessionToken).not.toHaveBeenCalled();
  });

  it("Normalfall: gueltiges Token setzt das Session-Cookie", async () => {
    vi.mocked(authService.exchangeSessionToken).mockReturnValue("neues.jwt.token" as never);

    const res = await request(buildApp()).post("/api/Auth/session").send({ token: "mail.token" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^token=/);
  });

  it("Fehlerfall: ungueltiges/abgelaufenes Token liefert 401", async () => {
    vi.mocked(authService.exchangeSessionToken).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const res = await request(buildApp()).post("/api/Auth/session").send({ token: "kaputt" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/Auth/Me", () => {
  it("Normalfall: liefert den angemeldeten Nutzer", async () => {
    vi.mocked(authService.getUserById).mockResolvedValue({
      id: 42,
      email: "a@b.de",
      name: "a",
    } as never);

    const res = await request(buildApp()).get("/api/Auth/Me");

    expect(res.status).toBe(200);
    expect(authService.getUserById).toHaveBeenCalledWith(42);
  });

  it("Leerer Input: Nutzer existiert nicht mehr liefert 404", async () => {
    vi.mocked(authService.getUserById).mockResolvedValue(null as never);

    const res = await request(buildApp()).get("/api/Auth/Me");

    expect(res.status).toBe(404);
  });

  it("Fehlerfall: unerwarteter Fehler liefert 500", async () => {
    vi.mocked(authService.getUserById).mockRejectedValue(new Error("db down"));

    const res = await request(buildApp()).get("/api/Auth/Me");

    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/Auth/Me", () => {
  it("Normalfall: loescht das Konto, loescht das Cookie und liefert 204", async () => {
    vi.mocked(authService.deleteUser).mockResolvedValue(undefined as never);

    const res = await request(buildApp()).delete("/api/Auth/Me");

    expect(res.status).toBe(204);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^token=;/);
  });

  it("Fehlerfall: Nutzer bereits geloescht (P2025) liefert 404 und loescht das Cookie", async () => {
    const notFoundError = Object.assign(new Error("Record not found"), { code: "P2025" });
    vi.mocked(authService.deleteUser).mockRejectedValue(notFoundError as never);

    const res = await request(buildApp()).delete("/api/Auth/Me");

    expect(res.status).toBe(404);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^token=;/);
  });

  it("Fehlerfall: unerwarteter Fehler liefert 500", async () => {
    vi.mocked(authService.deleteUser).mockRejectedValue(new Error("db down"));

    const res = await request(buildApp()).delete("/api/Auth/Me");

    expect(res.status).toBe(500);
  });
});