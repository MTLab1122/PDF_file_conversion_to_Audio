import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "AudioDoc SaaS - Commercial PDF to Audio Conversion Platform",
  description:
    "Convert your PDF documents, research papers, and ebooks into studio-quality neural audio MP3s with PyMuPDF, Tesseract OCR, and high-fidelity text-to-speech.",
  keywords: [
    "PDF to Audio",
    "Text to Speech",
    "Audiobook generator",
    "OCR PDF",
    "Edge TTS",
    "Neural Audio",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-indigo-500 selection:text-white">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}

