import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jiva Farm Devices OS",
  description: "Internal operating system for Jiva Farm device operations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
