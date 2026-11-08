"use client";

import React from "react";
import Link from "next/link";
import { Headphones, CheckCircle2, Github, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Headphones className="h-4 w-4" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent font-bold">
                AudioDoc SaaS
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enterprise-grade PDF to neural audio conversion platform with PyMuPDF, Tesseract OCR, and FFmpeg assembly.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Conversion Pipeline Operational</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/convert" className="hover:text-foreground transition">
                  Convert Document
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-foreground transition">
                  Conversion History
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Docs */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Architecture</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-indigo-500" />
                <span>PyMuPDF Text Extraction</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-indigo-500" />
                <span>Tesseract OCR Fallback</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-indigo-500" />
                <span>Neural TTS Generation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-indigo-500" />
                <span>FFmpeg Audio Merging</span>
              </li>
            </ul>
          </div>

          {/* Legal / Enterprise */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Enterprise</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>End-to-End Encryption</li>
              <li>OWASP ASVS Compliant</li>
              <li>Private Storage Isolation</li>
              <li>REST API & Webhooks</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} AudioDoc SaaS Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] bg-muted px-2 py-0.5 rounded border border-border">v1.0.0 Production Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

