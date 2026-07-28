import { describe, expect, it, vi, beforeEach } from "vitest";

// Muss vor dem Import von "./events.js" stehen (vitest hebt vi.mock ohnehin
// an den Dateianfang) - events.js importiert prisma direkt aus dieser Datei.
vi.mock("../prismaClient.js", () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    project: { findUnique: vi.fn() },
  },
}));

import { prisma } from "../prismaClient.js";
import {
  validateNameAndDescription,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  findOwnedEvent,
  findOwnedProject,
} from "./events.js";

// Minimaler Fake fuer das Express-Response-Objekt: validateNameAndDescription
// ruft im Fehlerfall res.status(code).json(body) auf - hier wird beides
// mitgeschnitten, um es in den Assertions zu pruefen.
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

describe("validateNameAndDescription", () => {
  it("Normalfall: gueltiger Name und Beschreibung werden akzeptiert", () => {
    const res = createMockRes();

    const result = validateNameAndDescription(
      res,
      { name: "Firmenfeier", description: "Jaehrliches Sommerfest" },
      true
    );

    expect(result).toBe(true);
    expect(res.statusCode).toBeUndefined();
    expect(res.body).toBeUndefined();
  });

  it("Grenzfall: Name mit genau MAX_NAME_LENGTH Zeichen ist noch gueltig", () => {
    const res = createMockRes();
    const nameAtLimit = "a".repeat(MAX_NAME_LENGTH);
    const descriptionAtLimit = "a".repeat(MAX_DESCRIPTION_LENGTH);

    const result = validateNameAndDescription(res, { name: nameAtLimit, description: descriptionAtLimit }, true);

    expect(result).toBe(true);
    expect(res.statusCode).toBeUndefined();
  });

  it("Fehlerfall: fehlender Pflicht-Name wird mit 400 abgelehnt", () => {
    const res = createMockRes();

    const result = validateNameAndDescription(res, { name: "   ", description: "   " }, true);

    expect(result).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Name ist erforderlich" });
  });
});

describe("findOwnedEvent", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findUnique).mockReset();
  });

  it("Normalfall: Event existiert und gehoert dem Nutzer", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({
      id: 1,
      userId: 42,
      name: "Test-Event",
    } as never);

    const result = await findOwnedEvent(1, 42);

    expect(result).toEqual({ id: 1, userId: 42, name: "Test-Event" });
  });

  it("Leerer Input: Prisma findet kein Event (null)", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null as never);

    const result = await findOwnedEvent(999, 42);

    expect(result).toBeNull();
  });

  it("Ungueltiger Typ: userId als String statt Zahl verhindert den Ownership-Match", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({
      id: 1,
      userId: 42,
      name: "Test-Event",
    } as never);

    // Dokumentiert absichtlich, dass die strikte Gleichheit (!==) in
    // findOwnedEvent einen Typ-Mismatch sicher als "nicht Owner" behandelt,
    // statt z.B. per == fälschlich durchzulassen.
    const result = await findOwnedEvent(1, "42" as unknown as number);

    expect(result).toBeNull();
  });
});

describe("findOwnedProject", () => {
  beforeEach(() => {
    vi.mocked(prisma.project.findUnique).mockReset();
  });

  it("Normalfall: Projekt existiert, gehoert zum Event und dessen Besitzer", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 5,
      eventId: 1,
      event: { userId: 42 },
    } as never);

    const result = await findOwnedProject(5, 1, 42);

    expect(result).toEqual({ id: 5, eventId: 1, event: { userId: 42 } });
  });

  it("Leerer Input: Prisma findet kein Projekt (null)", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null as never);

    const result = await findOwnedProject(999, 1, 42);

    expect(result).toBeNull();
  });

  it("Ungueltiger Typ: eventId als String statt Zahl verhindert den Match", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 5,
      eventId: 1,
      event: { userId: 42 },
    } as never);

    const result = await findOwnedProject(5, "1" as unknown as number, 42);

    expect(result).toBeNull();
  });
});