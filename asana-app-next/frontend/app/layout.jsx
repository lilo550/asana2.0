import "./globals.css";

export const metadata = {
  title: "Asana App Next – Events & Projekte",
  description: "Übersicht über Events und deren Projekte",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
