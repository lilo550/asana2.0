"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/lib/api";

export default function UserMenu({ apiUrl }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser(apiUrl)
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        // authFetch leitet bei 401 bereits selbst zu /login weiter.
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutUser(apiUrl);
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="mb-6 flex items-center justify-end gap-3 text-sm">
      {user && (
        <span className="text-primary/70">
          Angemeldet als <strong className="text-primary">{user.name}</strong>{" "}
          <span className="text-primary/50">({user.email})</span>
        </span>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="rounded-md border border-primary/20 px-3 py-1.5 text-sm font-medium text-primary hover:bg-white disabled:opacity-60"
      >
        {loggingOut ? "Wird abgemeldet…" : "Logout"}
      </button>
    </div>
  );
}