"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeSessionToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Landing-Page fuer den Auto-Login-Link aus der Willkommens-Mail. Nimmt das
// Token bewusst nur entgegen, um es sofort per POST (Body statt Query-String)
// gegen ein Session-Cookie einzutauschen - siehe backend/lib/mailer.js und
// backend/modules/auth/auth.routes.js (POST /session) fuer die Begruendung.
function SessionExchange() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get("token");

    // Token sofort aus der sichtbaren URL entfernen, bevor der Austausch
    // laeuft - es soll nicht laenger als noetig in Adressleiste/Verlauf stehen.
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      router.replace("/login");
      return;
    }

    exchangeSessionToken(API_URL, token)
      .then(() => {
        router.replace("/dashboard");
        router.refresh();
      })
      .catch(() => {
        setError("Der Link ist ungültig oder abgelaufen.");
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-primary/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-secondary-dark">{error}</p>
        <a
          href="/login"
          className="mt-3 inline-block text-sm font-medium text-secondary hover:underline"
        >
          Zur Anmeldung
        </a>
      </div>
    );
  }

  return <p className="text-sm text-primary/70">Du wirst angemeldet…</p>;
}

export default function SessionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={null}>
        <SessionExchange />
      </Suspense>
    </main>
  );
}