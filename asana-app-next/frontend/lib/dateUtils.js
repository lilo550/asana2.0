// Das Event-Datum wird serverseitig als DateTime (Mitternacht UTC)
// gespeichert. Alle Helper hier arbeiten bewusst ueber UTC-Getter bzw.
// lokale Kalendertage, damit der angezeigte/gewaehlte Kalendertag
// unabhaengig von der Zeitzone des Browsers immer mit dem gespeicherten
// Tag uebereinstimmt (sonst koennte z.B. "2026-08-01T00:00:00.000Z" in
// einer Zeitzone hinter UTC als 31.07. angezeigt werden).

// ISO-String vom Server -> Date-Objekt fuer den DatePicker.
export function isoToPickerDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Date-Objekt vom DatePicker -> "YYYY-MM-DD"-String fuers Backend.
export function pickerDateToIsoDateString(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ISO-String vom Server -> reine Datumsanzeige ohne Uhrzeit.
export function formatEventDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("de-DE", { timeZone: "UTC" });
}