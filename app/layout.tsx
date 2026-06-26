import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InviteGlow — Digital Wedding Invitations",
  description: "Beautiful, customisable digital wedding invitations with RSVP, seating, and guest management — made simple for Sri Lankan weddings.",
  metadataBase: new URL("https://www.inviteglow.com"),
  openGraph: {
    title: "InviteGlow — Digital Wedding Invitations",
    description: "Beautiful, customisable digital wedding invitations with RSVP, seating, and guest management.",
    url: "https://www.inviteglow.com",
    siteName: "InviteGlow",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "InviteGlow — Digital Wedding Invitations",
    description: "Beautiful, customisable digital wedding invitations with RSVP, seating, and guest management.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}