"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Headphones,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  History,
  FileAudio,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", authRequired: true },
    { href: "/convert", label: "Convert", authRequired: true },
    { href: "/history", label: "History", authRequired: true },
    { href: "/pricing", label: "Pricing", authRequired: false },
  ];

  if (session?.user?.role === "ADMIN") {
    navLinks.push({ href: "/admin", label: "Admin", authRequired: true });
  }

  const tierColors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    PRO: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    BUSINESS: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-md shadow-indigo-500/20">
            <Headphones className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent font-extrabold text-xl">
            AudioDoc SaaS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks
            .filter((link) => !link.authRequired || status === "authenticated")
            .map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive
                      ? "text-primary font-semibold border-b-2 border-primary py-1"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
        </nav>

        {/* Right Action Area */}
        <div className="hidden md:flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ) : status === "authenticated" ? (
            <div className="relative">
              <div className="flex items-center gap-3">
                <Link
                  href="/convert"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                >
                  <FileAudio className="h-4 w-4" />
                  New Conversion
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-border p-1 pr-3 text-sm hover:bg-accent transition"
                    aria-label="User menu"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                      {session.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="font-medium text-xs max-w-[120px] truncate">
                      {session.user?.name || session.user?.email}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        tierColors[session.user?.subscriptionTier || "FREE"]
                      }`}
                    >
                      {session.user?.subscriptionTier || "FREE"}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg z-50 text-popover-foreground animate-in fade-in slide-in-from-top-2"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-border text-xs">
                        <p className="font-semibold">{session.user?.name || "User"}</p>
                        <p className="text-muted-foreground truncate">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent transition"
                      >
                        <FileAudio className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                      <Link
                        href="/history"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent transition"
                      >
                        <History className="h-4 w-4 text-muted-foreground" />
                        Conversion History
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent transition"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Account Settings
                      </Link>
                      {session.user?.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-accent transition"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks
              .filter((link) => !link.authRequired || status === "authenticated")
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    pathname === link.href ? "bg-accent text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

            <div className="mt-2 border-t border-border pt-3">
              {status === "authenticated" ? (
                <div className="flex flex-col gap-2">
                  <div className="px-3 text-xs text-muted-foreground">
                    Signed in as <span className="font-semibold text-foreground">{session.user?.email}</span>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md px-3 py-2 text-center text-sm font-medium border border-border"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

