import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dkasu Workspace",
  description: "A private operating workspace for Dkasu services in Italy and Uganda.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
