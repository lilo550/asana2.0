import { describe, expect, it, vi } from "vitest";
import { parseResponse } from "./api";

function mockRes(overrides: Partial<{ ok: boolean; status: number; json: () => Promise<unknown> }>) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as Response;
}

describe("parseResponse", () => {
  it("Normalfall: res.ok mit JSON-Body gibt das geparste JSON zurueck", async () => {
    const res = mockRes({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ id: 1, name: "Firmenfeier" }),
    });

    await expect(parseResponse(res)).resolves.toEqual({ id: 1, name: "Firmenfeier" });
  });

  it("Leerer Input: Status 204 gibt null zurueck, ohne json() aufzurufen", async () => {
    const jsonSpy = vi.fn();
    const res = mockRes({ ok: true, status: 204, json: jsonSpy });

    await expect(parseResponse(res)).resolves.toBeNull();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it("Fehlerfall: res.ok=false mit JSON-Error-Body wirft Error mit exakt dieser Message", async () => {
    const res = mockRes({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: "Name ist erforderlich" }),
    });

    await expect(parseResponse(res)).rejects.toThrow("Name ist erforderlich");
  });
});