"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, deleteAccount } from "@/lib/api";
import ConfirmDialog from "./ConfirmDialog";

export default function UserMenu({ apiUrl }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount(apiUrl);
    } finally {
      // Egal ob Erfolg oder Fehler: Dialog schliessen und zur oeffentlichen
      // Landingpage - es gibt danach entweder kein Konto mehr oder die
      // Session ist ohnehin ungueltig geworden.
      setConfirmingDelete(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="relative mb-6 flex justify-end text-base">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        data-cy="account-menu-button"
        className="rounded-md border border-primary/20 px-3 py-1.5 font-medium text-primary hover:bg-highlight"
      >
        Mein Konto
      </button>

      {open && (
        <>
          {/* Unsichtbarer Hintergrund, der das Menue beim Klick daneben schliesst. */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute max-w-xl right-0 top-full z-20 mt-2  rounded-md border border-primary/10 bg-highlight p-3 shadow-lg">
            {user && (
              <p className="truncate text-primary/70">
                E-Mail
                <br />
                <span className="font-medium text-primary">{user.email}</span>
              </p>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              data-cy="logout-button"
              className="mt-3 w-full rounded-md text-xs border border-primary/20 px-3 py-1.5 text-left font-medium text-primary hover:bg-highlight-light disabled:opacity-60"
            >
              {loggingOut ? "Wird abgemeldet…" : "Logout"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              data-cy="delete-account-button"
              className="mt-2 w-full rounded-md text-xs border border-secondary/40 px-3 py-1.5 text-left font-medium text-secondary hover:bg-secondary/10"
            >
              Konto löschen
            </button>
          </div>
        </>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Konto wirklich löschen?"
          message="Dein Konto sowie alle deine Events und Projekte werden dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden."
          confirmLabel={deleting ? "Wird gelöscht…" : "Konto löschen"}
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}