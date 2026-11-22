import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vórtex Screen - Graba tu pantalla, sin límites",
  description: "Vórtex Screen, de Vortex Company: grabadora de pantalla para tutoriales en PC y cámara en Android, con pausa, calidad ajustable y descarga en WebM o MP4. Gratis, sin anuncios y 100% local.",
  keywords: ["Vórtex Screen","grabar pantalla","screen recorder","grabadora pantalla PC","tutoriales","grabar pantalla Android","sin anuncios"],
  authors: [{ name: "Vortex Company" }],
  icons: {
    icon:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#161616"/><circle cx="24" cy="24" r="17" fill="none" stroke="#f43f5e" stroke-width="3.5"/><path d="M24 10a14 14 0 1 1-9.9 4.1" fill="none" stroke="#fb7185" stroke-width="3.5" stroke-linecap="round"/><path d="M24 17a7 7 0 1 0 7 7" fill="none" stroke="#fb7185" stroke-width="3.5" stroke-linecap="round"/><circle cx="24" cy="24" r="3" fill="#fb7185"/></svg>`
      ),
  },
  openGraph: {
    title: "Vórtex Screen - Graba tu pantalla, sin límites",
    description: "Vórtex Screen, de Vortex Company: grabadora de pantalla para tutoriales en PC y cámara en Android, con pausa, calidad ajustable y descarga en WebM o MP4. Gratis, sin anuncios y 100% local.",
    siteName: "Vórtex Screen - Graba tu pantalla, sin límites",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#0f0f10] text-[#ececf1]">{children}</body>
    </html>
  );
}
