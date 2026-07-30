import { describe, expect, it, vi, beforeEach } from "vitest";

// authenticate.js liest JWT_SECRET beim Modul-Import aus process.env.
import "dotenv/config";
import jwt from "jsonwebtoken";
import { authenticate } from "./authenticate.js";

function createMockRes() {
  const res: { statusCode?: number; body?: unknown; status: (code: number) => typeof res; json: (body: unknown) => typeof res } = {
    statusCode: undefined,
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
  };
  return res;
}

describe("authenticate", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
  });

  it("Normalfall: gueltiges Token setzt req.user und ruft next() auf", () => {
    const token = jwt.sign({ userId: 7, email: "a@b.de" }, process.env.JWT_SECRET as string, {
      algorithm: "HS256",
    });
    const req = { cookies: { token } } as never as { user?: unknown };
    const res = createMockRes();

    authenticate(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as { user: { userId: number } }).user.userId).toBe(7);
    expect(res.statusCode).toBeUndefined();
  });

  it("Leerer Input: fehlendes Cookie liefert 401 und ruft next() nicht auf", () => {
    const req = { cookies: {} };
    const res = createMockRes();

    authenticate(req as never, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Nicht angemeldet" });
  });

  it("Fehlerfall: fehlendes cookies-Objekt (z.B. kein cookie-parser) liefert 401", () => {
    const req = {};
    const res = createMockRes();

    authenticate(req as never, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("Fehlerfall: manipuliertes/ungueltiges Token liefert 401 und ruft next() nicht auf", () => {
    const req = { cookies: { token: "kein.gueltiges.token" } };
    const res = createMockRes();

    authenticate(req as never, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Ungültiger oder abgelaufener Token" });
  });

  it("Fehlerfall: mit falschem Secret signiertes Token liefert 401", () => {
    const token = jwt.sign({ userId: 7 }, "falsches-secret", { algorithm: "HS256" });
    const req = { cookies: { token } };
    const res = createMockRes();

    authenticate(req as never, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});