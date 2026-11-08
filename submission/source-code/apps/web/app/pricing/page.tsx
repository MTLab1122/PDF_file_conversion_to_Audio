"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Sparkles, Loader2, Zap, Shield, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentTier = session?.user?.subscriptionTier || "FREE";

  const handleSelectTier = async (targetTier: string) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    if (targetTier === currentTier) return;

    setLoadingTier(targetTier);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update subscription tier.");
      } else {
        setSuccessMessage(`Successfully updated subscription plan to ${targetTier}!`);
        await updateSession({ subscriptionTier: targetTier });
      }
    } catch {
      setErrorMessage("Network error during plan update.");
    } finally {
      setLoadingTier(null);
    }
  };

  const plans = [
    {
      tier: "FREE",
      name: "Free Starter",
      price: "$0",
      description: "Ideal for individual readers, students, and light document testing.",
      features: [
        "10 Conversions per month",
        "Up to 20 pages per document",
        "15 MB max PDF upload",
        "1 Concurrent conversion job",
        "Standard Neural Voices",
        "Standard MP3 Audio Quality",
        "Full Web Audio Player & Seeking",
      ],
      highlight: false,
    },
    {
      tier: "PRO",
      name: "Professional",
      price: "$19",
      period: "/month",
      description: "For academics, researchers, and professionals who convert frequently.",
      features: [
        "150 Conversions per month",
        "Up to 150 pages per document",
        "50 MB max PDF upload",
        "3 Concurrent conversion jobs",
        "Premium HD Neural Voices",
        "Full Tesseract OCR on scanned pages",
        "Priority Conversion Queue",
        "Faster speech chunk parallelization",
        "Commercial usage rights",
      ],
      highlight: true,
    },
    {
      tier: "BUSINESS",
      name: "Enterprise",
      price: "$79",
      period: "/month",
      description: "For teams, publishers, libraries, and intensive production pipelines.",
      features: [
        "1,000 Conversions per month",
        "Up to 500 pages per document",
        "100 MB max PDF upload",
        "10 Concurrent conversion jobs",
        "All Neural & Multilingual Voices",
        "Unrestricted OCR Engine Processing",
        "Dedicated High-Throughput Queue",
        "Admin Team Management",
        "Direct REST API Access",
        "24/7 Priority SLA Support",
      ],
      highlight: false,
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Page Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Transparent Commercial Plans</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          Choose the Right Plan for Your Reading Workflow
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Upgrade or downgrade at any time. Scale processing limits as your audio requirements grow.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive text-center">
          {errorMessage}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p) => {
          const isCurrent = currentTier === p.tier;

          return (
            <div
              key={p.tier}
              className={`rounded-3xl border p-8 flex flex-col justify-between transition-all ${
                p.highlight
                  ? "border-indigo-600 bg-card ring-2 ring-indigo-600 shadow-xl shadow-indigo-600/10"
                  : "border-border bg-card shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
                  {p.highlight && (
                    <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
                      Popular
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground min-h-[32px]">
                  {p.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    {p.price}
                  </span>
                  {p.period && (
                    <span className="text-xs text-muted-foreground font-medium">
                      {p.period}
                    </span>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  {p.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-foreground">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border">
                <button
                  type="button"
                  disabled={isCurrent || loadingTier !== null}
                  onClick={() => handleSelectTier(p.tier)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition shadow-sm ${
                    isCurrent
                      ? "bg-muted text-muted-foreground cursor-default"
                      : p.highlight
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  } disabled:opacity-60`}
                >
                  {loadingTier === p.tier ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    <span>Current Plan</span>
                  ) : (
                    <>
                      <span>Upgrade to {p.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Security Note */}
      <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-center gap-2 font-semibold text-foreground">
          <Shield className="h-4 w-4 text-indigo-500" />
          <span>Payment & Billing Infrastructure</span>
        </div>
        <p>
          Configurable payment adapter architecture ready for live Stripe integration. All plan quotas and usage meters update automatically in PostgreSQL.
        </p>
      </div>
    </div>
  );
}

