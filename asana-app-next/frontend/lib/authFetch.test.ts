import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authFetch } from "./authFetch";

// authFetch nutzt globales fetch() und window.location.href. Statt jsdom
// (nicht installiert, fuer diesen schmalen Fall auch nicht noetig) werden
// beide Globals gezielt gestubbt.
function mockResponse(status: number): Response {
  return { status, ok: status >= 200 && status < 300 } as Response;
}

describe("authFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { href: "" } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Normalfall: 200-Antwort wird durchgereicht, kein Logout-Call, kein Redirect", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await authFetch("http://localhost:3000/api/events");

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/events",
      expect.objectContaining({ credentials: "include" })
    );
    expect(window.location.href).toBe("");
  });

  it("401-Fall: loest Logout-Call aus und leitet zu /login weiter", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(401)) // eigentlicher Request
      .mockResolvedValueOnce(mockResponse(204)); // Logout-Request
    vi.stubGlobal("fetch", fetchMock);

    const res = await authFetch("http://localhost:3000/api/events");

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/api/Auth/Logout",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
    expect(window.location.href).toBe("/login");
  });
});