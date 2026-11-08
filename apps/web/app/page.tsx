import Link from "next/link";
import {
  Headphones,
  UploadCloud,
  Mic,
  Download,
  Zap,
  ShieldCheck,
  Languages,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
  FileCheck2,
} from "lucide-react";

export default function HomePage() {
  const steps = [
    {
      step: "01",
      title: "Upload Your PDF",
      description:
        "Upload scanned or digital PDFs up to 500 pages. Our engine validates binary signatures and verifies document integrity.",
      icon: UploadCloud,
    },
    {
      step: "02",
      title: "Select Voice & Language",
      description:
        "Choose from authentic neural voices across 35+ languages. Configure playback speed from 0.5x to 2.0x.",
      icon: Mic,
    },
    {
      step: "03",
      title: "Stream or Download MP3",
      description:
        "Listen instantly in the responsive browser player or download your mastered, ID3-tagged MP3 audio file.",
      icon: Download,
    },
  ];

  const features = [
    {
      title: "PyMuPDF Structure Extraction",
      description:
        "Maintains multi-column reading flow, extracts headings, removes hyphenation artifacts, and preserves document semantics.",
      icon: Layers,
    },
    {
      title: "Tesseract OCR Fallback",
      description:
        "Scanned documents and image-heavy pages are automatically detected, rendered at 300 DPI, and converted to clean text.",
      icon: FileCheck2,
    },
    {
      title: "Sentence-Aware Chunking",
      description:
        "Intelligent clause and punctuation boundary splitting prevents robotic speech clipping and ensures fluent transitions.",
      icon: Zap,
    },
    {
      title: "Multi-Language Neural TTS",
      description:
        "High-definition Edge and Azure neural voices deliver lifelike human speech across dozens of global languages.",
      icon: Languages,
    },
    {
      title: "FFmpeg MP3 Assembly",
      description:
        "Sequential audio stitching, bitrate normalization, and duration validation ensure studio-quality audio playback.",
      icon: Headphones,
    },
    {
      title: "Enterprise Grade Security",
      description:
        "Isolated storage, strict RBAC ownership enforcement, SHA-256 integrity validation, and rate limiting.",
      icon: ShieldCheck,
    },
  ];

  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Ideal for individual readers and students testing the platform.",
      features: [
        "10 Conversions per month",
        "Up to 20 pages per document",
        "15 MB max file size",
        "Standard Neural Voices",
        "Community support",
      ],
      cta: "Get Started Free",
      href: "/register",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      description: "For professionals, researchers, and creators reading daily.",
      features: [
        "150 Conversions per month",
        "Up to 150 pages per document",
        "50 MB max file size",
        "3 Concurrent jobs",
        "Premium HD Neural Voices",
        "Tesseract OCR Processing",
        "Priority Conversion Queue",
      ],
      cta: "Upgrade to Pro",
      href: "/pricing",
      highlight: true,
    },
    {
      name: "Business",
      price: "$79",
      period: "/month",
      description: "For organizations, publishers, and high-volume audio production.",
      features: [
        "1,000 Conversions per month",
        "Up to 500 pages per document",
        "100 MB max file size",
        "10 Concurrent jobs",
        "All Premium & Multilingual Voices",
        "Full OCR Engine Access",
        "Dedicated API & Webhooks",
        "Admin Team Management",
      ],
      cta: "Contact Enterprise",
      href: "/pricing",
      highlight: false,
    },
  ];

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-pink-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="container relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-6 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Commercial-Grade Audio Synthesis Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Turn Any PDF Document into{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Lifelike Neural Audio
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Convert research papers, textbooks, legal briefs, and reports into
            high-fidelity MP3 audiobooks. Built with PyMuPDF, Tesseract OCR, and
            cutting-edge neural text-to-speech.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/convert"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all hover:scale-[1.02]"
            >
              <Zap className="h-4 w-4" />
              <span>Start Converting Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition"
            >
              <span>View Pricing Plans</span>
            </Link>
          </div>

          {/* Social Proof badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-border/40 text-left">
            <div>
              <p className="text-2xl font-bold text-foreground">99.9%</p>
              <p className="text-xs text-muted-foreground">Pipeline Reliability</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">35+</p>
              <p className="text-xs text-muted-foreground">Global Languages</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">500</p>
              <p className="text-xs text-muted-foreground">Max Page Capacity</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">24 kHz</p>
              <p className="text-xs text-muted-foreground">Studio MP3 Fidelity</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            Workflow
          </h2>
          <h3 className="text-3xl font-extrabold text-foreground">
            How AudioDoc Works
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Three simple steps to transform complex written documents into natural voice audiobooks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-extrabold text-muted/50 font-mono">
                      {item.step}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            Architecture & Features
          </h2>
          <h3 className="text-3xl font-extrabold text-foreground">
            Engineered for Commercial Reliability
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Every step of the extraction, OCR, synthesis, and assembly pipeline is built to enterprise standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-base text-foreground mb-2">
                  {feat.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            Simple Transparent Pricing
          </h2>
          <h3 className="text-3xl font-extrabold text-foreground">
            Choose the Perfect Plan for Your Needs
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Start for free and upgrade as your document reading volume expands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl border p-8 shadow-sm flex flex-col justify-between transition-all ${
                tier.highlight
                  ? "border-indigo-600 bg-card ring-2 ring-indigo-600 shadow-indigo-600/10"
                  : "border-border bg-card"
              }`}
            >
              <div>
                {tier.highlight && (
                  <span className="inline-block rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white mb-4">
                    Most Popular
                  </span>
                )}
                <h4 className="text-xl font-bold text-foreground">{tier.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">
                  {tier.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-xs text-muted-foreground font-medium">
                      {tier.period}
                    </span>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  {tier.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs text-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href={tier.href}
                  className={`flex w-full items-center justify-center rounded-xl py-3 text-xs font-bold transition shadow-sm ${
                    tier.highlight
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 px-8 py-14 text-center text-white shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to listen to your first PDF document?
          </h3>
          <p className="mt-3 text-sm text-indigo-200 max-w-lg mx-auto">
            Upload your document now and generate crystal-clear neural audio in seconds. No credit card required.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/convert"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-indigo-900 shadow-md hover:bg-indigo-50 transition hover:scale-105"
            >
              <Headphones className="h-4 w-4" />
              <span>Convert a PDF Now</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

