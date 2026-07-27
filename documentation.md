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

Middleware: Wenn jemand versuchen würde den JWT-Payload (z.B. userId) manuell zu verändern, 

OWASP:
Punkt							Status
A01 Broken Access Control		✅ Abgedeckt (kleine Input-Validierung fehlt)
A02 Cryptographic Failures		✅ Abgedeckt, aber Alg-Pinning + Fail-Fast fehlen
A03 Injection (SQLi)			✅ Abgedeckt
A03 XSS							⚠️ Verbesserungswürdig (aktuell nur durch React geschützt)
A07 Einheitliche Fehlermeldung	⚠️ Timing-Leak trotz gleicher Nachricht
A07 Schwache Passwörter			❌ Fehlt (kein Server-seitiges Minimum)
A07 Brute-Force-Schutz			❌ Fehlt (kein Rate-Limiting)