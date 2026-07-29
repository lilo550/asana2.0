import { NextResponse } from "next/server";

// /session ist der Auto-Login-Link aus der Willkommens-Mail: der Besuch
// passiert per Definition VOR jeder Session, muss also oeffentlich sein.
const PUBLIC_PATHS = ["/login", "/register", "/session"];

function isPublicPath(pathname) {
  // "/" (Landingpage) exakt matchen statt mit startsWith, sonst waere
  // ploetzlich jeder Pfad "oeffentlich", weil jeder Pfad mit "/" beginnt.
  return pathname === "/" || PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.has("token");

  if (!isLoggedIn && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Eingeloggte Nutzer:innen muessen die Landingpage/Login/Register nicht
  // mehr sehen - sie landen direkt in der eigentlichen App.
  if (isLoggedIn && isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};