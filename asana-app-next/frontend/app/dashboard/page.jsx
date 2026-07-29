import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EventsView from "@/components/EventsView";
import UserMenu from "@/components/UserMenu";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Server Component: laedt die Events direkt beim Rendern vom Backend,
// ganz ohne useEffect/useState im Client. Server-seitige fetch()-Aufrufe
// bekommen Browser-Cookies nicht automatisch mit - der Token-Cookie wird
// hier deshalb manuell aus der eingehenden Request uebernommen. Bei 401
// (Token fehlt/ungueltig/abgelaufen) uebernimmt redirect() das, was
// authFetch() im Client uebernimmt.
export default async function DashboardPage() {
  const token = cookies().get("token")?.value;
  let events = [];
  let loadError = null;
  let res = null;

  try {
    res = await fetch(`${API_URL}/api/events`, {
      cache: "no-store",
      headers: token ? { Cookie: `token=${token}` } : {},
    });
  } catch (err) {
    loadError = `Backend nicht erreichbar. Läuft der Server auf ${API_URL}?`;
  }

  // redirect() wirft intern eine Kontrollfluss-Exception, die Next.js selbst
  // faengt - das darf nicht in unserem eigenen try/catch landen, deshalb hier
  // ausserhalb davon.
  if (res?.status === 401) {
    redirect("/login");
  }

  if (res && !loadError) {
    if (!res.ok) {
      loadError = `Backend nicht erreichbar. Läuft der Server auf ${API_URL}?`;
    } else {
      events = await res.json();
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <UserMenu apiUrl={API_URL} />

      <header className="mb-8">
        <h1 data-cy="events-heading" className="text-3xl font-bold text-primary">
          Meine Events
        </h1>
        <p className="mt-1 text-primary/70">
          Behalte den Überblick über deine Events und deren Projekte.
        </p>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-secondary bg-secondary/10 px-4 py-3 text-secondary-dark">
          {loadError}
        </div>
      ) : (
        <EventsView initialEvents={events} apiUrl={API_URL} />
      )}
    </main>
  );
}