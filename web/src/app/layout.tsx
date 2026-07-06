import type { Metadata } from "next";
import { Montserrat, Merriweather, Ubuntu_Mono } from "next/font/google";
import "./globals.css";

const sans = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif",
});

const mono = Ubuntu_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Trader AI",
  description: "AI-powered analytics for Options Trading",
};

import ClientOnly from "@/components/layout/ClientOnly";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { SideNavBar } from "@/components/layout/SideNavBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${sans.variable} ${serif.variable} ${mono.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      >
        <ClientOnly>
          <TopNavBar />
          <div className="flex min-h-screen pt-16">
            <SideNavBar />
            <main className="flex-1 md:pl-64 flex flex-col min-h-[calc(100vh-64px)] overflow-x-hidden">
              {children}
            </main>
          </div>
        </ClientOnly>
      </body>
    </html>
  );
}
