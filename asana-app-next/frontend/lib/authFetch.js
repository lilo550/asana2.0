const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Zentraler fetch-Wrapper fuer alle Client-seitigen Aufrufe an geschuetzte
// Endpunkte. Der JWT selbst steckt in einem HttpOnly-Cookie, kann also nicht
// von JS gelesen/angehaengt werden - "credentials: include" sorgt dafuer,
// dass der Browser ihn automatisch mitschickt.
//
// Gibt der Server 401 zurueck (kein/ungueltiger/abgelaufener Token), wird der
// Cookie serverseitig geloescht (JS kann HttpOnly-Cookies nicht selbst
// entfernen) und der Nutzer zur Login-Seite geschickt.
export async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401) {
    try {
      await fetch(`${API_URL}/api/Auth/Logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Logout-Aufruf ist best-effort, der abgelaufene Cookie ist ohnehin ungueltig.
    }
    window.location.href = "/login";
  }

  return res;
}