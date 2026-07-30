import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Der Router wird isoliert getestet: die komplette Geschaeftslogik aus
// events.service.js wird gemockt, damit hier nur die HTTP-Schicht
// (Request parsen, Service aufrufen, Status-Code mappen) geprueft wird.
vi.mock("./events.service.js", () => ({
  listEvents: vi.fn(),
  getOwnedEvent: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  replaceEvent: vi.fn(),
  deleteEvent: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  setEventDone: vi.fn(),
  setProjectDone: vi.fn(),
  ValidationError: class ValidationError extends Error {},
}));

import * as eventsService from "./events.service.js";
import eventsRouter from "./events.routes.js";

const USER_ID = 42;

function buildApp() {
  const app = express();
  app.use(express.json());
  // Ersetzt die "authenticate"-Middleware, die im echten Server vor diesem
  // Router haengt - hier reicht ein fester req.user fuer die Tests.
  app.use((req, _res, next) => {
    (req as unknown as { user: { userId: number } }).user = { userId: USER_ID };
    next();
  });
  app.use("/api/events", eventsRouter);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/events", () => {
  it("Normalfall: liefert die Events des angemeldeten Nutzers", async () => {
    vi.mocked(eventsService.listEvents).mockResolvedValue([{ id: 1 }] as never);

    const res = await request(buildApp()).get("/api/events");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
    expect(eventsService.listEvents).toHaveBeenCalledWith(USER_ID);
  });

  it("Fehlerfall: unerwarteter Service-Fehler liefert 500", async () => {
    vi.mocked(eventsService.listEvents).mockRejectedValue(new Error("db down"));

    const res = await request(buildApp()).get("/api/events");

    expect(res.status).toBe(500);
  });
});

describe("GET /api/events/:id", () => {
  it("Fehlerfall: ungueltige ID liefert 400", async () => {
    const res = await request(buildApp()).get("/api/events/abc");

    expect(res.status).toBe(400);
    expect(eventsService.getOwnedEvent).not.toHaveBeenCalled();
  });

  it("Leerer Input: nicht gefundenes/fremdes Event liefert 404", async () => {
    vi.mocked(eventsService.getOwnedEvent).mockResolvedValue(null as never);

    const res = await request(buildApp()).get("/api/events/1");

    expect(res.status).toBe(404);
  });

  it("Normalfall: liefert das Event", async () => {
    vi.mocked(eventsService.getOwnedEvent).mockResolvedValue({ id: 1, name: "X" } as never);

    const res = await request(buildApp()).get("/api/events/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, name: "X" });
  });
});

describe("POST /api/events", () => {
  it("Normalfall: legt ein Event an", async () => {
    vi.mocked(eventsService.createEvent).mockResolvedValue({ id: 1, name: "Feier" } as never);

    const res = await request(buildApp()).post("/api/events").send({ name: "Feier" });

    expect(res.status).toBe(201);
    expect(eventsService.createEvent).toHaveBeenCalledWith({
      name: "Feier",
      description: undefined,
      date: undefined,
      userId: USER_ID,
    });
  });

  it("Fehlerfall: ValidationError aus dem Service liefert 400", async () => {
    vi.mocked(eventsService.createEvent).mockRejectedValue(
      new eventsService.ValidationError("Name ist erforderlich")
    );

    const res = await request(buildApp()).post("/api/events").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name ist erforderlich");
  });
});

describe("PATCH /api/events/:id", () => {
  it("Fehlerfall: ungueltige ID liefert 400", async () => {
    const res = await request(buildApp()).patch("/api/events/abc").send({ name: "Neu" });

    expect(res.status).toBe(400);
  });

  it("Leerer Input: nicht gefundenes Event liefert 404", async () => {
    vi.mocked(eventsService.updateEvent).mockResolvedValue(null as never);

    const res = await request(buildApp()).patch("/api/events/1").send({ name: "Neu" });

    expect(res.status).toBe(404);
  });

  it("Normalfall: aktualisiert das Event", async () => {
    vi.mocked(eventsService.updateEvent).mockResolvedValue({ id: 1, name: "Neu" } as never);

    const res = await request(buildApp()).patch("/api/events/1").send({ name: "Neu" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, name: "Neu" });
  });
});

describe("PUT /api/events/:id", () => {
  it("Fehlerfall: ungueltige ID liefert 400", async () => {
    const res = await request(buildApp()).put("/api/events/abc").send({ name: "Neu" });

    expect(res.status).toBe(400);
  });

  it("Leerer Input: nicht gefundenes Event liefert 404", async () => {
    vi.mocked(eventsService.replaceEvent).mockResolvedValue(null as never);

    const res = await request(buildApp()).put("/api/events/1").send({ name: "Neu" });

    expect(res.status).toBe(404);
  });

  it("Normalfall: ersetzt das Event", async () => {
    vi.mocked(eventsService.replaceEvent).mockResolvedValue({ id: 1, name: "Neu" } as never);

    const res = await request(buildApp()).put("/api/events/1").send({ name: "Neu" });

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/events/:id", () => {
  it("Fehlerfall: ungueltige ID liefert 400", async () => {
    const res = await request(buildApp()).delete("/api/events/abc");

    expect(res.status).toBe(400);
  });

  it("Leerer Input: nicht gefundenes Event liefert 404", async () => {
    vi.mocked(eventsService.deleteEvent).mockResolvedValue(false as never);

    const res = await request(buildApp()).delete("/api/events/1");

    expect(res.status).toBe(404);
  });

  it("Normalfall: loescht das Event", async () => {
    vi.mocked(eventsService.deleteEvent).mockResolvedValue(true as never);

    const res = await request(buildApp()).delete("/api/events/1");

    expect(res.status).toBe(204);
  });
});

describe("PATCH /api/events/:id/done", () => {
  it("Fehlerfall: fehlendes done liefert 400", async () => {
    const res = await request(buildApp()).patch("/api/events/1/done").send({});

    expect(res.status).toBe(400);
    expect(eventsService.setEventDone).not.toHaveBeenCalled();
  });

  it("Fehlerfall: ValidationError (offene Projekte) liefert 400", async () => {
    vi.mocked(eventsService.setEventDone).mockRejectedValue(
      new eventsService.ValidationError("Alle Projekte müssen erledigt sein")
    );

    const res = await request(buildApp()).patch("/api/events/1/done").send({ done: true });

    expect(res.status).toBe(400);
  });

  it("Leerer Input: nicht gefundenes Event liefert 404", async () => {
    vi.mocked(eventsService.setEventDone).mockResolvedValue(null as never);

    const res = await request(buildApp()).patch("/api/events/1/done").send({ done: true });

    expect(res.status).toBe(404);
  });

  it("Normalfall: setzt den Erledigt-Status", async () => {
    vi.mocked(eventsService.setEventDone).mockResolvedValue({ id: 1, done: true } as never);

    const res = await request(buildApp()).patch("/api/events/1/done").send({ done: true });

    expect(res.status).toBe(200);
    expect(eventsService.setEventDone).toHaveBeenCalledWith(1, USER_ID, true);
  });
});

describe("POST /api/events/:id/projects", () => {
  it("Fehlerfall: ungueltige Event-ID liefert 400", async () => {
    const res = await request(buildApp()).post("/api/events/abc/projects").send({ name: "Teil" });

    expect(res.status).toBe(400);
  });

  it("Leerer Input: nicht gefundenes Event liefert 404", async () => {
    vi.mocked(eventsService.addProject).mockResolvedValue(null as never);

    const res = await request(buildApp()).post("/api/events/1/projects").send({ name: "Teil" });

    expect(res.status).toBe(404);
  });

  it("Normalfall: legt ein Projekt an", async () => {
    vi.mocked(eventsService.addProject).mockResolvedValue({ id: 5, name: "Teil" } as never);

    const res = await request(buildApp()).post("/api/events/1/projects").send({ name: "Teil" });

    expect(res.status).toBe(201);
  });

  it("Fehlerfall: ValidationError liefert 400", async () => {
    vi.mocked(eventsService.addProject).mockRejectedValue(
      new eventsService.ValidationError("Name ist erforderlich")
    );

    const res = await request(buildApp()).post("/api/events/1/projects").send({});

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/events/:id/projects/:projectId", () => {
  it("Fehlerfall: ungueltige ID liefert 400", async () => {
    const res = await request(buildApp())
      .patch("/api/events/1/projects/abc")
      .send({ name: "Neu" });

    expect(res.status).toBe(400);
  });

  it("Leerer Input: nicht gefundenes Projekt liefert 404", async () => {
    vi.mocked(eventsService.updateProject).mockResolvedValue(null as never);

    const res = await request(buildApp())
      .patch("/api/events/1/projects/5")
      .send({ name: "Neu" });

    expect(res.status).toBe(404);
  });

  it("Normalfall: aktualisiert das Projekt", async () => {
    vi.mocked(eventsService.updateProject).mockResolvedValue({ id: 5, name: "Neu" } as never);

    const res = await request(buildApp())
      .patch("/api/events/1/projects/5")
      .send({ name: "Neu" });

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/events/:id/projects/:projectId", () => {
  it("Fehlerfall: ungueltige ID liefert 400", async () => {
    const res = await request(buildApp()).delete("/api/events/1/projects/abc");

    expect(res.status).toBe(400);
  });

  it("Leerer Input: nicht gefundenes Projekt liefert 404", async () => {
    vi.mocked(eventsService.deleteProject).mockResolvedValue(false as never);

    const res = await request(buildApp()).delete("/api/events/1/projects/5");

    expect(res.status).toBe(404);
  });

  it("Normalfall: loescht das Projekt", async () => {
    vi.mocked(eventsService.deleteProject).mockResolvedValue(true as never);

    const res = await request(buildApp()).delete("/api/events/1/projects/5");

    expect(res.status).toBe(204);
  });
});

describe("PATCH /api/events/:id/projects/:projectId/done", () => {
  it("Fehlerfall: fehlendes done liefert 400", async () => {
    const res = await request(buildApp()).patch("/api/events/1/projects/5/done").send({});

    expect(res.status).toBe(400);
  });

  it("Leerer Input: nicht gefundenes Projekt liefert 404", async () => {
    vi.mocked(eventsService.setProjectDone).mockResolvedValue(null as never);

    const res = await request(buildApp())
      .patch("/api/events/1/projects/5/done")
      .send({ done: true });

    expect(res.status).toBe(404);
  });

  it("Normalfall: setzt den Erledigt-Status des Projekts", async () => {
    vi.mocked(eventsService.setProjectDone).mockResolvedValue({ id: 5, done: true } as never);

    const res = await request(buildApp())
      .patch("/api/events/1/projects/5/done")
      .send({ done: true });

    expect(res.status).toBe(200);
    expect(eventsService.setProjectDone).toHaveBeenCalledWith(1, 5, USER_ID, true);
  });
});