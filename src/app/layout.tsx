import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "getAbstract Agents - Teams Demo",
  description: "Demo of CARA and LENA agents in Microsoft Teams interface",
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
