import EventsView from "@/components/EventsView";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Server Component: laedt die Events direkt beim Rendern vom Backend,
// ganz ohne useEffect/useState im Client.
export default async function HomePage() {
  let events = [];
  let loadError = null;

  try {
    const res = await fetch(`${API_URL}/api/events`, { cache: "no-store" });
    if (!res.ok) throw new Error("Antwort vom Backend war nicht ok");
    events = await res.json();
  } catch (err) {
    loadError = `Backend nicht erreichbar. Läuft der Server auf ${API_URL}?`;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Meine Events</h1>
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
