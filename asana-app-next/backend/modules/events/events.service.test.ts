import { describe, expect, it, vi, beforeEach } from "vitest";

// Muss vor dem Import von "./events.service.js" stehen (vitest hebt vi.mock
// ohnehin an den Dateianfang) - events.service.js importiert prisma direkt
// aus dieser Datei.
vi.mock("../../prismaClient.js", () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    project: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from "../../prismaClient.js";
import {
  validateNameAndDescription,
  ValidationError,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  findOwnedEvent,
  findOwnedProject,
  setEventDone,
  setProjectDone,
  listEvents,
  listEventsDueInDays,
  getOwnedEvent,
  createEvent,
  updateEvent,
  replaceEvent,
  deleteEvent,
  addProject,
  updateProject,
  deleteProject,
} from "./events.service.js";

describe("validateNameAndDescription", () => {
  it("Normalfall: gueltiger Name und Beschreibung werden akzeptiert", () => {
    expect(() =>
      validateNameAndDescription({ name: "Firmenfeier", description: "Jaehrliches Sommerfest" }, true)
    ).not.toThrow();
  });

  it("Grenzfall: Name mit genau MAX_NAME_LENGTH Zeichen ist noch gueltig", () => {
    const nameAtLimit = "a".repeat(MAX_NAME_LENGTH);
    const descriptionAtLimit = "a".repeat(MAX_DESCRIPTION_LENGTH);

    expect(() =>
      validateNameAndDescription({ name: nameAtLimit, description: descriptionAtLimit }, true)
    ).not.toThrow();
  });

  it("Fehlerfall: fehlender Pflicht-Name wird mit ValidationError abgelehnt", () => {
    let error: unknown;
    try {
      validateNameAndDescription({ name: "   ", description: "   " }, true);
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(ValidationError);
    expect((error as Error).message).toBe("Name ist erforderlich");
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

describe("setEventDone", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findUnique).mockReset();
    vi.mocked(prisma.event.update).mockReset();
  });

  it("Normalfall: erledigt setzen ist erlaubt, wenn alle Projekte erledigt sind", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({
      id: 1,
      userId: 42,
      projects: [
        { id: 1, done: true },
        { id: 2, done: true },
      ],
    } as never);
    vi.mocked(prisma.event.update).mockResolvedValue({ id: 1, done: true } as never);

    const result = await setEventDone(1, 42, true);

    expect(result).toEqual({ id: 1, done: true });
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { done: true },
      include: { projects: true },
    });
  });

  it("Grenzfall: Event ohne Projekte darf erledigt gesetzt werden (vakuum wahr)", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({
      id: 1,
      userId: 42,
      projects: [],
    } as never);
    vi.mocked(prisma.event.update).mockResolvedValue({ id: 1, done: true } as never);

    await expect(setEventDone(1, 42, true)).resolves.toEqual({ id: 1, done: true });
  });

  it("Fehlerfall: erledigt setzen wird mit ValidationError abgelehnt, solange ein Projekt offen ist", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({
      id: 1,
      userId: 42,
      projects: [
        { id: 1, done: true },
        { id: 2, done: false },
      ],
    } as never);

    await expect(setEventDone(1, 42, true)).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it("Normalfall: Zuruecksetzen auf nicht erledigt ist immer erlaubt, auch bei offenen Projekten", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({
      id: 1,
      userId: 42,
      projects: [{ id: 1, done: false }],
    } as never);
    vi.mocked(prisma.event.update).mockResolvedValue({ id: 1, done: false } as never);

    await expect(setEventDone(1, 42, false)).resolves.toEqual({ id: 1, done: false });
  });

  it("Leerer Input: nicht existierendes/fremdes Event liefert null", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null as never);

    const result = await setEventDone(999, 42, true);

    expect(result).toBeNull();
    expect(prisma.event.update).not.toHaveBeenCalled();
  });
});

describe("setProjectDone", () => {
  beforeEach(() => {
    vi.mocked(prisma.project.findUnique).mockReset();
    vi.mocked(prisma.project.update).mockReset();
    vi.mocked(prisma.event.updateMany).mockReset();
  });

  it("Normalfall: markiert das Projekt als erledigt, ohne das Event anzufassen", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 5,
      eventId: 1,
      event: { userId: 42 },
    } as never);
    vi.mocked(prisma.project.update).mockResolvedValue({ id: 5, done: true } as never);

    const result = await setProjectDone(1, 5, 42, true);

    expect(result).toEqual({ id: 5, done: true });
    expect(prisma.event.updateMany).not.toHaveBeenCalled();
  });

  it("Normalfall: setzt beim Zuruecksetzen auf nicht erledigt auch das uebergeordnete Event zurueck", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 5,
      eventId: 1,
      event: { userId: 42 },
    } as never);
    vi.mocked(prisma.project.update).mockResolvedValue({ id: 5, done: false } as never);

    await setProjectDone(1, 5, 42, false);

    expect(prisma.event.updateMany).toHaveBeenCalledWith({
      where: { id: 1, done: true },
      data: { done: false },
    });
  });

  it("Leerer Input: nicht existierendes/fremdes Projekt liefert null", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null as never);

    const result = await setProjectDone(1, 999, 42, true);

    expect(result).toBeNull();
    expect(prisma.project.update).not.toHaveBeenCalled();
  });
});

describe("listEvents", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findMany).mockReset();
  });

  it("Normalfall: fragt die Events des Nutzers inkl. Projekte, sortiert nach Datum ab", async () => {
    vi.mocked(prisma.event.findMany).mockResolvedValue([{ id: 1 }] as never);

    const result = await listEvents(42);

    expect(result).toEqual([{ id: 1 }]);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { userId: 42 },
      include: { projects: true },
      orderBy: { date: { sort: "asc", nulls: "last" } },
    });
  });
});

describe("listEventsDueInDays", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findMany).mockReset();
  });

  it("Normalfall: fragt Events in einem Datumsbereich ab und liefert das Ergebnis durch", async () => {
    vi.mocked(prisma.event.findMany).mockResolvedValue([{ id: 1 }] as never);

    const result = await listEventsDueInDays(3);

    expect(result).toEqual([{ id: 1 }]);
    const callArgs = vi.mocked(prisma.event.findMany).mock.calls[0][0] as {
      where: { date: { gte: Date; lte: Date } };
    };
    expect(callArgs.where.date.gte).toBeInstanceOf(Date);
    expect(callArgs.where.date.lte).toBeInstanceOf(Date);
    expect(callArgs.where.date.gte.getTime()).toBeLessThanOrEqual(callArgs.where.date.lte.getTime());
  });
});

describe("getOwnedEvent", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findUnique).mockReset();
  });

  it("Normalfall: liefert das Event inkl. Projekte in einer Query", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({
      id: 1,
      userId: 42,
      projects: [],
    } as never);

    const result = await getOwnedEvent(1, 42);

    expect(result).toEqual({ id: 1, userId: 42, projects: [] });
    expect(prisma.event.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { projects: true },
    });
  });

  it("Leerer Input: Event existiert nicht", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null as never);

    expect(await getOwnedEvent(999, 42)).toBeNull();
  });

  it("Fehlerfall: Event gehoert einem anderen Nutzer", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 1, userId: 7, projects: [] } as never);

    expect(await getOwnedEvent(1, 42)).toBeNull();
  });
});

describe("createEvent", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.create).mockReset();
  });

  it("Normalfall: legt ein Event mit getrimmtem Namen und geparstem Datum an", async () => {
    vi.mocked(prisma.event.create).mockResolvedValue({ id: 1, name: "Feier" } as never);

    const result = await createEvent({
      name: "  Feier  ",
      description: "Text",
      date: "2026-09-01",
      userId: 42,
    });

    expect(result).toEqual({ id: 1, name: "Feier" });
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: { name: "Feier", description: "Text", date: new Date("2026-09-01"), userId: 42 },
      include: { projects: true },
    });
  });

  it("Fehlerfall: fehlender Name wird mit ValidationError abgelehnt, bevor Prisma aufgerufen wird", async () => {
    await expect(createEvent({ name: "", description: "", date: null, userId: 42 })).rejects.toBeInstanceOf(
      ValidationError
    );
    expect(prisma.event.create).not.toHaveBeenCalled();
  });
});

describe("updateEvent", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findUnique).mockReset();
    vi.mocked(prisma.event.update).mockReset();
  });

  it("Normalfall: aktualisiert nur die uebergebenen Felder", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 1, userId: 42 } as never);
    vi.mocked(prisma.event.update).mockResolvedValue({ id: 1, name: "Neu" } as never);

    const result = await updateEvent(1, 42, { name: "Neu", description: undefined, date: undefined });

    expect(result).toEqual({ id: 1, name: "Neu" });
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "Neu" },
      include: { projects: true },
    });
  });

  it("Leerer Input: fremdes/nicht existierendes Event liefert null", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null as never);

    expect(
      await updateEvent(999, 42, { name: "Neu", description: undefined, date: undefined })
    ).toBeNull();
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it("Fehlerfall: zu langer Name wird mit ValidationError abgelehnt, ohne die Ownership zu pruefen", async () => {
    const zuLangerName = "a".repeat(MAX_NAME_LENGTH + 1);

    await expect(
      updateEvent(1, 42, { name: zuLangerName, description: undefined, date: undefined })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.event.findUnique).not.toHaveBeenCalled();
  });
});

describe("replaceEvent", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findUnique).mockReset();
    vi.mocked(prisma.event.update).mockReset();
  });

  it("Normalfall: ersetzt Name, Beschreibung und Datum vollstaendig", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 1, userId: 42 } as never);
    vi.mocked(prisma.event.update).mockResolvedValue({ id: 1 } as never);

    await replaceEvent(1, 42, { name: "Neu", description: "", date: "2026-01-01" });

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "Neu", description: null, date: new Date("2026-01-01") },
      include: { projects: true },
    });
  });

  it("Fehlerfall: fehlender Pflicht-Name wird mit ValidationError abgelehnt", async () => {
    await expect(replaceEvent(1, 42, { name: "", description: "", date: null })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("Leerer Input: fremdes/nicht existierendes Event liefert null", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null as never);

    expect(await replaceEvent(999, 42, { name: "Neu", description: "", date: null })).toBeNull();
  });
});

describe("deleteEvent", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findUnique).mockReset();
    vi.mocked(prisma.event.delete).mockReset();
  });

  it("Normalfall: loescht ein eigenes Event", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 1, userId: 42 } as never);

    const result = await deleteEvent(1, 42);

    expect(result).toBe(true);
    expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("Leerer Input: fremdes/nicht existierendes Event liefert false", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null as never);

    expect(await deleteEvent(999, 42)).toBe(false);
    expect(prisma.event.delete).not.toHaveBeenCalled();
  });
});

describe("addProject", () => {
  beforeEach(() => {
    vi.mocked(prisma.event.findUnique).mockReset();
    vi.mocked(prisma.project.create).mockReset();
  });

  it("Normalfall: legt ein Projekt im eigenen Event an", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({ id: 1, userId: 42 } as never);
    vi.mocked(prisma.project.create).mockResolvedValue({ id: 5, name: "Teil" } as never);

    const result = await addProject(1, 42, { name: " Teil ", description: "" });

    expect(result).toEqual({ id: 5, name: "Teil" });
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: { name: "Teil", description: "", eventId: 1 },
    });
  });

  it("Fehlerfall: fehlender Name wird mit ValidationError abgelehnt", async () => {
    await expect(addProject(1, 42, { name: "", description: "" })).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.project.create).not.toHaveBeenCalled();
  });

  it("Leerer Input: fremdes/nicht existierendes Event liefert null", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null as never);

    expect(await addProject(999, 42, { name: "Teil", description: "" })).toBeNull();
  });
});

describe("updateProject", () => {
  beforeEach(() => {
    vi.mocked(prisma.project.findUnique).mockReset();
    vi.mocked(prisma.project.update).mockReset();
  });

  it("Normalfall: aktualisiert nur die uebergebenen Felder", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 5,
      eventId: 1,
      event: { userId: 42 },
    } as never);
    vi.mocked(prisma.project.update).mockResolvedValue({ id: 5, name: "Neu" } as never);

    const result = await updateProject(1, 5, 42, { name: "Neu", description: undefined });

    expect(result).toEqual({ id: 5, name: "Neu" });
    expect(prisma.project.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { name: "Neu" } });
  });

  it("Leerer Input: fremdes/nicht existierendes Projekt liefert null", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null as never);

    expect(await updateProject(1, 999, 42, { name: "Neu", description: undefined })).toBeNull();
    expect(prisma.project.update).not.toHaveBeenCalled();
  });
});

describe("deleteProject", () => {
  beforeEach(() => {
    vi.mocked(prisma.project.findUnique).mockReset();
    vi.mocked(prisma.project.delete).mockReset();
  });

  it("Normalfall: loescht ein Projekt eines eigenen Events", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: 5,
      eventId: 1,
      event: { userId: 42 },
    } as never);

    const result = await deleteProject(1, 5, 42);

    expect(result).toBe(true);
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it("Leerer Input: fremdes/nicht existierendes Projekt liefert false", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null as never);

    expect(await deleteProject(1, 999, 42)).toBe(false);
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });
});