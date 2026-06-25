import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAFCU Events & Volunteer Calendar",
  description: "LAFCU employee events and volunteer management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://use.typekit.net/rrq8rkv.css"
        />
      </head>

      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}