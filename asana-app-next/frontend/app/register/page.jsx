"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function RegisterPage() {
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
      await registerUser(API_URL, { email, password });
      router.push("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-primary">Registrieren</h1>
        <p className="mt-1 text-sm text-primary/70">
          Lege ein neues Konto mit E-Mail und Passwort an.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-primary">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              data-cy="register-email-input"
              className="mt-1 w-full rounded-md border border-primary/20 px-3 py-2 text-sm focus:border-secondary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              data-cy="register-password-input"
              className="mt-1 w-full rounded-md border border-primary/20 px-3 py-2 text-sm focus:border-secondary focus:outline-none"
            />
          </div>

          {error && (
            <p
              data-cy="register-error-message"
              className="rounded-md bg-secondary/10 px-3 py-2 text-sm text-secondary-dark"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            data-cy="register-submit-button"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-60"
          >
            {submitting ? "Wird registriert…" : "Registrieren"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-primary/70">
          Bereits ein Konto?{" "}
          <Link href="/login" className="font-medium text-secondary hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </main>
  );
}