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
Dementsprechen habe ich polling integriert.