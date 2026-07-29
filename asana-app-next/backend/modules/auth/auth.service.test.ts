import { describe, expect, it, vi, beforeEach } from "vitest";

// Muss vor dem Import von "./auth.service.js" stehen (vitest hebt vi.mock
// ohnehin an den Dateianfang) - auth.service.js importiert prisma und
// sendWelcomeEmail direkt aus diesen Dateien.
vi.mock("../../prismaClient.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("../../lib/mailer.js", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

// auth.service.js liest JWT_SECRET beim Modul-Import aus process.env - da
// "../../prismaClient.js" (das dotenv/config normalerweise mitbringt) hier
// gemockt ist, muss dotenv explizit vor dem Import geladen werden.
import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../prismaClient.js";
import { sendWelcomeEmail } from "../../lib/mailer.js";
import {
  registerUser,
  loginUser,
  exchangeSessionToken,
  createSessionToken,
  getUserById,
  ValidationError,
  ConflictError,
  InvalidCredentialsError,
} from "./auth.service.js";

// Niedriger Cost-Faktor nur zum schnellen Erzeugen von Vergleichs-Hashes in
// den Tests - bcrypt.compare liest den Cost-Faktor aus dem Hash selbst,
// unabhaengig vom BCRYPT_COST_FACTOR, den registerUser beim Hashen benutzt.
const FAST_TEST_HASH_COST = 4;

describe("createSessionToken", () => {
  it("Normalfall: erzeugt ein gueltiges JWT mit userId und email im Payload", () => {
    const token = createSessionToken({ userId: 7, email: "a@b.de" });

    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] }) as Record<
      string,
      unknown
    >;
    expect(payload.userId).toBe(7);
    expect(payload.email).toBe("a@b.de");
  });

  it("Grenzfall: eine explizit uebergebene expiresIn wird statt der 24h-Standardlaufzeit verwendet", () => {
    const token = createSessionToken({ userId: 7, email: "a@b.de" }, { expiresIn: "1h" });

    const payload = jwt.decode(token) as { iat: number; exp: number };
    expect(payload.exp - payload.iat).toBe(60 * 60);
  });
});

describe("exchangeSessionToken", () => {
  it("Normalfall: gueltiges Token liefert ein neues Token mit gleichem Payload", () => {
    const mailToken = createSessionToken({ userId: 3, email: "mail@link.de" }, { expiresIn: "15m" });

    const sessionToken = exchangeSessionToken(mailToken);

    const payload = jwt.verify(sessionToken, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as Record<string, unknown>;
    expect(payload.userId).toBe(3);
    expect(payload.email).toBe("mail@link.de");
  });

  it("Fehlerfall: manipuliertes/ungueltiges Token wirft einen Fehler", () => {
    expect(() => exchangeSessionToken("kein.gueltiges.token")).toThrow();
  });
});

describe("registerUser", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.create).mockReset();
    vi.mocked(sendWelcomeEmail).mockClear();
  });

  it("Fehlerfall: fehlende E-Mail oder fehlendes Passwort wird mit ValidationError abgelehnt", async () => {
    await expect(registerUser({ email: "", password: "irrelevant1" })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("Fehlerfall: zu kurzes Passwort wird mit ValidationError abgelehnt", async () => {
    await expect(registerUser({ email: "neu@example.com", password: "kurz" })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("Fehlerfall: bereits vergebene E-Mail wird mit ConflictError abgelehnt", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, email: "belegt@example.com" } as never);

    await expect(
      registerUser({ email: "belegt@example.com", password: "gueltig123" })
    ).rejects.toBeInstanceOf(ConflictError);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("Normalfall: legt den Nutzer an, liefert nur oeffentliche Felder und stoesst die Willkommens-Mail an", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 9,
      email: "neu@example.com",
      name: "neu",
      password: "sollte-nicht-zurueckgegeben-werden",
    } as never);

    const result = await registerUser({ email: "  Neu@Example.com ", password: "gueltig123" });

    expect(result).toEqual({ id: 9, email: "neu@example.com", name: "neu" });
    expect(result).not.toHaveProperty("password");

    // E-Mail wird normalisiert (getrimmt, lowercase) an Prisma weitergereicht.
    const createArgs = vi.mocked(prisma.user.create).mock.calls[0][0] as {
      data: { email: string; password: string };
    };
    expect(createArgs.data.email).toBe("neu@example.com");
    expect(createArgs.data.password).not.toBe("gueltig123");

    expect(sendWelcomeEmail).toHaveBeenCalledWith({
      userId: 9,
      email: "neu@example.com",
      name: "neu",
    });
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("Fehlerfall: fehlende E-Mail oder fehlendes Passwort wird mit InvalidCredentialsError abgelehnt", async () => {
    await expect(loginUser({ email: "", password: "" })).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("Fehlerfall: unbekannte E-Mail wird mit InvalidCredentialsError abgelehnt", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);

    await expect(loginUser({ email: "unbekannt@example.com", password: "irgendwas" })).rejects.toBeInstanceOf(
      InvalidCredentialsError
    );
  });

  it("Fehlerfall: falsches Passwort wird mit InvalidCredentialsError abgelehnt", async () => {
    const hash = bcrypt.hashSync("richtiges-passwort", FAST_TEST_HASH_COST);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 5,
      email: "nutzer@example.com",
      name: "nutzer",
      password: hash,
    } as never);

    await expect(
      loginUser({ email: "nutzer@example.com", password: "falsches-passwort" })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("Normalfall: korrekte Zugangsdaten liefern Nutzer und ein gueltiges Session-Token", async () => {
    const hash = bcrypt.hashSync("richtiges-passwort", FAST_TEST_HASH_COST);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 5,
      email: "nutzer@example.com",
      name: "nutzer",
      password: hash,
    } as never);

    const { user, token } = await loginUser({
      email: "nutzer@example.com",
      password: "richtiges-passwort",
    });

    expect(user).toEqual({ id: 5, email: "nutzer@example.com", name: "nutzer" });

    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] }) as Record<
      string,
      unknown
    >;
    expect(payload.userId).toBe(5);
    expect(payload.email).toBe("nutzer@example.com");
  });
});

describe("getUserById", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("Normalfall: liefert die oeffentlichen Felder des Nutzers", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 5,
      email: "nutzer@example.com",
      name: "nutzer",
    } as never);

    const result = await getUserById(5);

    expect(result).toEqual({ id: 5, email: "nutzer@example.com", name: "nutzer" });
  });

  it("Leerer Input: Prisma findet keinen Nutzer (null)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);

    const result = await getUserById(999);

    expect(result).toBeNull();
  });
});