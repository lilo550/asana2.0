"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/api";

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
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-primary">Anmelden</h1>
        <p className="mt-1 text-sm text-primary/70">
          Melde dich mit deiner E-Mail-Adresse an.
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
              className="mt-1 w-full rounded-md border border-primary/20 px-3 py-2 text-sm focus:border-secondary focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-md bg-secondary/10 px-3 py-2 text-sm text-secondary-dark">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-60"
          >
            {submitting ? "Wird angemeldet…" : "Anmelden"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-primary/70">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-secondary hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}