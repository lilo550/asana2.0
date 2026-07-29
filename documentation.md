TEST_ACCOUNT
  email: "test@example.com",
  password: "test1234",
  name: "Test User",

Session 2:
Ich habe mich für Next.js entschieden, da der SEO Wert höher ist.

Session 3:
Ressourcen: Events, Projekte, Aufgaben
Hierarchie: Zu einer Veranstaltung gehören mehrere Projekte. Zu einem Projekt gehören mehrere Aufgaben.
Ich habe mich für Pragmatisches Nesting entschieden, da in meinem Projekt eine klare Hierarchie existiert.
Die Bilder von Schnittstellentest liegen im Order Schnittstellentest.

Session 4:
users		events			        projects
------- 	--------------------	---------
id (PK)		id (PK)			        id (PK)
email		name (string)		    name (string)
name		done (bool)		        done (bool)
		    userId 	(FK)		    eventId (FK)
		    description (string)    description (string)
		    date (date)

Beziehungen:
Ein Nutzer hat viele Events (1:n)
Ein Event hat viele Projekte (1:n)

Welche Datenfelder dürfen nicht leer sein?
name und id bei users, events und projects

Persistenz-Test:
Nach dem Anlegen eines neuen Events und neustarten des Servers, habe ich das Event per GET-Request abgefragt. Das Event war auch nach neustart des Servers noch da.

Session 5:
Ein anonymer User kann momentan auf alle Events zugreifen und diese beliebigen existierenden Usern zuordnen.
Ein anonymer User kann jegliche Events löschen.
Ein anonymer User kann jegliche Events bearbeiten und ersetzen.

Middleware: Wenn jemand versuchen würde den JWT-Payload (z.B. userId) manuell zu verändern, dann ist die Verifizierung des Tokes gegenüber dem Secret nicht erfolgreich. Deshalb wird der Datenzugriff abgelehnt. 

OWASP:
Punkt							Status
A01 Broken Access Control		✅ Abgedeckt (kleine Input-Validierung fehlt)
A02 Cryptographic Failures		✅ Abgedeckt, aber Alg-Pinning + Fail-Fast fehlen
A03 Injection (SQLi)			✅ Abgedeckt
A03 XSS							⚠️ Verbesserungswürdig (aktuell nur durch React geschützt)
A07 Einheitliche Fehlermeldung	⚠️ Timing-Leak trotz gleicher Nachricht
A07 Schwache Passwörter			❌ Fehlt (kein Server-seitiges Minimum)
A07 Brute-Force-Schutz			❌ Fehlt (kein Rate-Limiting)

Session 6:
Ebene			Was testen wir bei uns?								Tool
Unit			Validiere den Namen und die Beschreibung von Events	Vitest
				Setze Token mit erwarteten Cookie-Optionen			Vitest
				Finde zum Nutzer gehörendes Event					Vitest
				Finde zum Nutzer gehörendes Projekt					Vitest
Integration		Ein Event anlegen mit POST							Vitest
E2E				Als Benutzer am Client einloggen					Cypress
				Als Benutzer am Client ausloggen					Cypress
				Als Benutzer am Client registrieren					Cypress
Welche zwei Dinge in eurem Projekt würden den meisten Schaden anrichten, wenn sie kaputt gehen bei einer Änderung durch den Agenten?
- Wenn die Authentifizierung nicht mehr funktioniert und die Nutzerdaten kompromittiert oder gelöscht werden.
- Wenn die Schnittstellen nicht mehr funktionieren.
Unit: events.test.ts; auth.test.ts; api.test.ts
E2E: login.cy.js; logout.cy.js; register.cy.js

Session 7:
Gibt es Daten in eurer App, die sich ändern können, während ein anderer Nutzer die Seite offen hat?	 
	Nein.
Müssen Änderungen sofort sichtbar sein – oder reicht ein Reload?	 
	Falls Änderungen vorgenommen werden, reicht ein Reload.
Ist die Kommunikation einseitig (Server → Client) oder bidirektional (beide senden)?	 
	Einseitige Kommunikation.
Wie viele Clients könnten gleichzeitig verbunden sein?
	Es können 10 Clients gleichzeitig verbunden sein.
Technologieentscheidung: 
	Es ist keine Echtzeit notwendig, da zwischen den Nutzern keine Kommunikation besteht.

Kriterium							SSE						WebSockets
Richtung							Server → Client			Bidirektional
Komplexität im Code					Gering					Mittel
Reconnect bei Verbindungsabbruch	Automatisch (Browser)	Manuell / socket.io übernimmt
Geeignet für euer Projekt			❌					  ❌
Warum?								In meinem Projekt ist keine Kommunikation zwischen Benutzern vorgesehen.

Was passiert in eurer aktuellen Implementierung, wenn der Server neu startet – verlieren verbundene Clients ihre Verbindung, und wie verhält sich die App dann?
	Da Postgress unabhängig vom Server läuft, gehen keine Daten veroren. Nutzer bleiben nach Neustart weiterhin verbunden, da die Authentifizierung über ein clientseitig gespeichertes JWT läuft.

Meine App würde nicht von Echtzeit-Kommunikation profitieren, da ich mich bewusst dagegen entschieden habe. Theoretisch könnte ein Nutzer davon profitieren, wenn er gleichzeitig auf mehereren Geräten eingeloggt ist und er auf jedem Gerät deb gleichen Stand haben möchte.
Polling wäre für den Fall eines Nutzers mit mehreren Geräten praktisch, ein periodisches GET /api/events alle 5-10 sollte ausreichen.

Ich stimme dieser Einschätzung zu. Sebst hatte ich den Fall eines Nutzers mit mehreren Geräten noch nicht in Erwägung gezogen.
Dementsprechen habe ich polling nachträglich integriert.

Session 8:
Event in eurer App			Notification sinnvoll?	Typ (Transactional/Product/Marketing)	Kanal (E-Mail/Push/keiner)	Begründung
Nutzer hat sich registriert	Ja						Transactional							E-Mail						Nutzer muss zeitnah handeln
Passwort wurde geändert		Ja						Transactional							E-Mail						Sicherheitsrelevant, braucht Persistenz
Wöchentliche Zusammenfassung	Optional			Product									E-Mail						Kein Zeitdruck, viel Inhalt
Ein Event ist in <3 tagen fällig	Ja				--										Push						Nutzer soll erinnert werden

Gibt es Events, bei denen der Nutzer sofort reagieren muss – oder reicht eine Mail, die er später liest?
	Bei einer Passwort änderung muss der Nutzer sofort reagieren.
Habt ihr Marketing-Content geplant, der ein explizites Opt-in braucht?
	Nein
Wie viele verschiedene Events würden pro Stunde realistisch Notifications auslösen?
	0 bis 1, wenn mehrere Projekte gleichzeitig fällig sind, soll nur eine Push-Benachrichtigung rausgehen

Kanalentscheidung: Ich benötige E-Mail und Push. E-Mails für alle Benachrichtigungen, bei denen es wichtig ist eine Historie zu haben und Push zur Erinnerung des Nutzers.

Template prüfen:
Enthält das Template alle Infos, die der Nutzer braucht – ohne sich einloggen zu müssen?
	Ja
Gibt es einen direkten Deep Link zur betroffenen Ansicht (nicht nur zur Startseite)?
	Ja
Ist Betreff / Notification-Titel klar, was das Event war – in unter 50 Zeichen?
	Ja
Ist der Notification-Body unter 120 Zeichen?
	Ja

Session 9:
auth.js
	Verantwortlich für Nutzer Registrierung und Login, Willkommens Mail nach Login.
	Greift auf mailer.js zu, welche Willkommens Mail rendert.
	Greift aus authenticate.js zu, welche den Token überprüft.
events.js
	Verantwortlich für Event oder Projekt anlegen, bearbeiten, löschen.
push.js
	Verantwortlich für Push-Nachricht.
	Greift auf public-key zu.

Geschäftslogik in Route-Handlern:
events.js:
DB zugriff GET - greift zwei mal auf die DB zu um Events und Projekte zu holen, kann in einer Helper-Funktion abgedeckt werden.
Wiederholtes Ownership-Pattern über die ganze Datei - Authorisierung könnte als eigene Middleware funktionieren.
Datenaufbau POT/PATCH/PUT - data-Objekt als toEventData({ name, description, date })-Funktion.

auth.js:
JWT-Erzeugung - jwt.sign({ userId, email }, JWT_SECRET, { algorithm, expiresIn }) steht doppelt, zusammenführen zu createSessionToken(user, { expiresIn }).
Timing-safe Credential-Check - "User laden, bei fehlendem User gegen DUMMY_PASSWORD_HASH vergleichen" auslagern in verifyCredentials(email, password)-Funktion, da es bereits eine routes/auth.test.ts gibt.

Route-Dateien mit Zugriff auf fachfremde Tabellen:
Kein Verstoß in auth.js, push.js und events.js.
Graubereich in lib/eventReminders.js. sendDueReminders() fragt prisma.event.findMany(...) ab, greift dann aber über include: { user: { include: { pushSubscriptions: true } } } zwei Ebenen tief in Push-Domänendaten.

Events Context          Users & Auth Context      Notifications Context
───────────────         ────────────────────      ──────────────────────
Event                    User                      PushSubscription
Project                  Session / JWT             EventReminder (Job)
                                                     WelcomeEmail

Welche Kontexte kommunizieren miteinander – und was genau übergeben sie?
Notifications Context braucht von Events Context die Fälligkeitsdaten und von Users & Auth Context den die Mail Adresse eines neuen Nutzers.

events.service.js:
	öffentlich: validateNameAndDescription(), findOwnedEvent(), findOwnedProject(), listEvents(), listEventsDueInDays(), getOwnedEvent(), createEvent(), updateEvent(), replaceEvent(), deleteEvent(), updateProject(), deleteProject()
	intern: dayRange()

auth.service.js:
	öffentlich: createSessionToken(), registerUser(), loginUser(), exchangeSessionToken(), getUserById()
	intern: normalizeEmail(), notifyRegistration()

notif.service.js:
	öffentlich: getPushPublicKey(), getPushSubscriptionsForUser()
	privat: assertValidSubscription(), subscribeToPush()

Welches Modul wäre am einfachsten zu extrahieren, wenn man es irgendwann als eigenen Service deployen müsste?
	Notification wäre am einfachsten zu extrahieren. Keine andere Route braucht Notif synchron im Request-Pfad. Würde also diese ausfallen, funktioniert der Rest der App unverändert weiter, nur ohne Erinnerungen. Notif hat die kleinste Oberfläche; unteranderem, da sie keine Ownership-Verschachtelungen hat.

Session 12:
Sicherheitsscan:
Sensitive Token Exposure in URL Query Parameter (Magic Link) - mailer.js
	  The application implements a magic link login mechanism where a short-lived JWT (sessionToken) is appended to the URL as a query parameter (?token=...). When the user clicks this link, the browser makes a GET request to the backend, which then redirects them to the frontend. Because the token is in the URL query string, it is highly susceptible to exposure. It will be recorded in server access logs, browser history, and potentially leaked to third-party sites via the Referer header if the destination page loads external assets. Since the JWT is stateless and valid for 15 minutes, any leaked token can be reused by an attacker to hijack the user's session.

bcrypt hash detected - Auth.service.js

Cost Amplification / Denial of Wallet via Unrated-Limited Registration Endpoint Triggering Welcome Emails - server.js
	The /api/Auth/register endpoint is publicly accessible and does not implement any rate limiting or CAPTCHA protection. Upon successful registration, the backend automatically calls sendWelcomeEmail, which utilizes the third-party metered service Resend (as seen in package.json). An attacker can easily automate registration requests with arbitrary email addresses, leading to rapid exhaustion of the Resend API quota and significant financial costs (Denial of Wallet).

Lighthouse:
Performance: 96
Accessibility: 95
Best Practices: 100
SEO: 100