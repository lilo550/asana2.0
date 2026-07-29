import Link from "next/link";

// Oeffentliche Landingpage - der Einstiegspunkt fuer nicht angemeldete
// Besucher:innen, bevor sie zu /login bzw. /register gehen. Reine Server
// Component (keine Interaktivitaet noetig), damit sie so schnell wie moeglich
// laedt. Die eigentliche App liegt jetzt unter /dashboard.
export default function LandingPage() {
  return (
    <main className="bg-highlight-light">
      {/* Above the fold: Nutzen-Headline, Subtext, primaerer CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-20 text-center">
        <h1 className="text-4xl font-bold leading-tight text-primary sm:text-5xl">
          Alle deine Events. Alle deine Projekte.
          <br className="hidden sm:block" /> Ein Blick genügt.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-primary/70">
          Events anlegen, Projekte zuordnen, jederzeit den Überblick behalten – ganz ohne
          Chaos in Tabellen oder Notizen.
        </p>
        <Link
          href="/register"
          data-cy="landing-cta-primary"
          className="mt-8 inline-block rounded-md bg-secondary px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-secondary-dark"
        >
          Jetzt starten
        </Link>
        <p className="mt-3 text-sm text-primary/60">
          Schon dabei?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Anmelden
          </Link>
        </p>
      </section>

      {/* Features als Mini-Vorschau der echten Oberflaeche statt Stockfotos */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            title="Events & Projekte im Blick"
            description="Jedes Event zeigt seine Projekte direkt mit an."
            visual={<EventPreview />}
          />
          <FeatureCard
            title="Beschreibungen & Bearbeiten"
            description="Namen und Beschreibungen jederzeit anpassen."
            visual={<EditPreview />}
          />
          <FeatureCard
            title="Sicheres Löschen"
            description="Vor dem Löschen wird immer nachgefragt."
            visual={<ConfirmPreview />}
          />
          <FeatureCard
            title="Erinnerung per Push"
            description="Benachrichtigung, wenn ein Event bald ansteht."
            visual={<ReminderPreview />}
          />
        </div>
      </section>

      {/* Social Proof */}
      <section className="mx-auto max-w-2xl px-4 pb-20">
        <blockquote className="rounded-xl border border-primary/10 bg-white p-6 text-center shadow-sm">
          <p className="text-primary/80">
            „Ich habe zum ersten Mal wirklich den Überblick über alle laufenden Projekte."
          </p>
          <footer className="mt-3 text-sm font-medium text-primary/60">— Mira, Team-Lead</footer>
        </blockquote>
      </section>

      {/* Zweiter CTA, bewusst im Secondary-Design */}
      <section className="border-t border-primary/10 bg-white px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-primary">Bereit für mehr Überblick?</h2>
        <Link
          href="/register"
          data-cy="landing-cta-secondary"
          className="mt-6 inline-block rounded-md border-2 border-secondary px-8 py-3 text-base font-semibold text-secondary hover:bg-secondary hover:text-white"
        >
          Jetzt starten
        </Link>
      </section>
    </main>
  );
}

function FeatureCard({ title, description, visual }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
      <div className="mb-4">{visual}</div>
      <h3 className="font-semibold text-primary">{title}</h3>
      <p className="mt-1 text-sm text-primary/70">{description}</p>
    </div>
  );
}

function EventPreview() {
  return (
    <div className="rounded-lg border border-primary/10 bg-highlight-light p-3">
      <p className="text-xs font-semibold text-primary">Produktlaunch Q3</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded bg-white px-2 py-0.5 text-[10px] text-primary/70 shadow-sm">
          Marketingkampagne
        </span>
        <span className="rounded bg-white px-2 py-0.5 text-[10px] text-primary/70 shadow-sm">
          Website Relaunch
        </span>
      </div>
    </div>
  );
}

function EditPreview() {
  return (
    <div className="rounded-lg border border-primary/10 bg-highlight-light p-3">
      <div className="h-2 w-3/4 rounded bg-white shadow-sm" />
      <div className="mt-1.5 h-2 w-1/2 rounded bg-white shadow-sm" />
      <span className="mt-2 inline-block rounded bg-primary px-2 py-0.5 text-[10px] text-white">
        Speichern
      </span>
    </div>
  );
}

function ConfirmPreview() {
  return (
    <div className="rounded-lg border border-primary/10 bg-highlight-light p-3 text-center">
      <p className="text-[10px] font-medium text-primary">„Event" löschen?</p>
      <div className="mt-2 flex justify-center gap-1.5">
        <span className="rounded bg-white px-2 py-0.5 text-[10px] text-primary/70 shadow-sm">
          Abbrechen
        </span>
        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] text-white">Löschen</span>
      </div>
    </div>
  );
}

function ReminderPreview() {
  return (
    <div className="rounded-lg border border-primary/10 bg-highlight-light p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs">
          🔔
        </span>
        <p className="text-[10px] text-primary/80">Fällig in 3 Tagen</p>
      </div>
    </div>
  );
}