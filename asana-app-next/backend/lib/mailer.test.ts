import { describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn().mockResolvedValue({ id: "email-1" }) }));

vi.mock("resend", () => ({
  // Muss eine echte "function" sein (keine Arrow-Function), da mailer.js
  // "new Resend(...)" aufruft - eine Arrow-Function kann nicht als
  // Konstruktor verwendet werden.
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: sendMock } };
  }),
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html>mock</html>"),
}));

vi.mock("../emails/WelcomeEmail.js", () => ({
  WelcomeEmail: vi.fn((props: unknown) => props),
}));

import "dotenv/config";
import jwt from "jsonwebtoken";
import { render } from "@react-email/render";
import { WelcomeEmail } from "../emails/WelcomeEmail.js";
import { sendWelcomeEmail } from "./mailer.js";

describe("sendWelcomeEmail", () => {
  it("Normalfall: rendert die Mail mit einem gueltigen Login-Link und verschickt sie", async () => {
    await sendWelcomeEmail({ userId: 7, email: "a@b.de", name: "a" });

    expect(WelcomeEmail).toHaveBeenCalledOnce();
    const { name, loginUrl } = vi.mocked(WelcomeEmail).mock.calls[0][0] as {
      name: string;
      loginUrl: string;
    };
    expect(name).toBe("a");

    const token = new URL(loginUrl).searchParams.get("token");
    const payload = jwt.verify(token as string, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as Record<string, unknown>;
    expect(payload.userId).toBe(7);
    expect(payload.email).toBe("a@b.de");

    expect(render).toHaveBeenCalled();
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.de", subject: "Willkommen bei Asana-Next!" })
    );
  });
});