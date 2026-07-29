import { describe, expect, it } from "vitest";
import { setAuthCookie, COOKIE_OPTIONS } from "./auth.routes.js";

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