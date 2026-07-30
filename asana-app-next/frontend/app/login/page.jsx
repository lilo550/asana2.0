"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/api";
import { setupPushNotifications } from "@/lib/push";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginUser(API_URL, { email, password });
      // Bewusst nicht awaited: das Berechtigungs-Prompt darf die
      // Weiterleitung nach dem Login nicht blockieren oder verzoegern.
      setupPushNotifications(API_URL).catch((err) => {
        console.error("Push-Setup fehlgeschlagen:", err);
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-primary">Anmelden</h1>
        <p className="mt-1 text-base text-primary/70">
          Melde dich mit deiner E-Mail-Adresse an.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-base font-medium text-primary">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              data-cy="login-email-input"
              className="mt-1 w-full bg-white-light rounded-md border border-primary/20 px-3 py-2 text-base focus:border-secondary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-primary">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-cy="login-password-input"
              className="mt-1 w-full bg-white-light rounded-md border border-primary/20 px-3 py-2 text-base focus:border-secondary focus:outline-none"
            />
          </div>

          {error && (
            <p
              data-cy="error-message"
              className="rounded-md bg-secondary/10 px-3 py-2 text-base text-secondary"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            data-cy="login-submit-button"
            className="w-full rounded-md bg-primary px-4 py-2 text-base font-medium text-white hover:bg-primary-light disabled:opacity-60"
          >
            {submitting ? "Wird angemeldet…" : "Anmelden"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-primary/70">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-secondary hover:text-secondary-dark">
            Registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}