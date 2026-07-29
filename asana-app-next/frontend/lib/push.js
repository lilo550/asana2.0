import { getPushPublicKey, subscribeToPush } from "@/lib/api";

// VAPID-Public-Key kommt als base64url-String vom Server, die Push API
// braucht ihn aber als Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Fragt nach Push-Erlaubnis und speichert die Subscription beim Backend.
// Wird bewusst "best effort" aufgerufen (nicht awaited) - ein abgelehntes
// oder nicht unterstuetztes Push-Setup darf den Login-Flow nicht blockieren
// oder unterbrechen.
export async function setupPushNotifications(apiUrl) {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push-Setup übersprungen: Browser unterstützt Service Worker/Push nicht.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    // "denied" oder "default": Browser zeigt den Prompt nur einmal pro
    // Origin - ist bereits eine Entscheidung gespeichert, kommt hier sofort
    // der gecachte Status zurueck, ohne dass ein sichtbares Popup erscheint.
    console.warn(`Push-Erlaubnis nicht erteilt (Status: "${permission}").`);
    return;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const { publicKey } = await getPushPublicKey(apiUrl);

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await subscribeToPush(apiUrl, subscription.toJSON());
}