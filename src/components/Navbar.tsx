"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Award, Flame, UtensilsCrossed, PlusCircle } from "lucide-react";
import { UserSwitcher, UserProfile } from "./UserSwitcher";

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadCurrent() {
      try {
        const res = await fetch("/api/users/current");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (e) {
        console.error("Failed to load user in Navbar:", e);
      }
    }
    loadCurrent();
  }, [pathname]);

  const navLinks = [
    {
      name: "Explore Recipes",
      href: "/",
      icon: BookOpen,
    },
    {
      name: "Pantry Matcher",
      href: "/pantry",
      icon: UtensilsCrossed,
      highlight: true,
    },
    {
      name: "Chef Skill Tree",
      href: "/profile",
      icon: Award,
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-neutral-950 fill-neutral-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">
                Cookify
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Curated
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium">
              Culinary Techniques & Pantry Matcher
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/60 p-1 rounded-xl border border-neutral-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? link.highlight
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 shadow-sm font-bold"
                      : "bg-neutral-800 text-white shadow-sm"
                    : link.highlight
                    ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive && link.highlight ? "text-neutral-950" : ""}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {/* Admin Studio Button (Only visible for Admins) */}
          {currentUser?.isAdmin && (
            <Link
              href="/recipes/new"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                pathname === "/recipes/new"
                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                  : "bg-neutral-950 text-red-400 border-red-500/30 hover:bg-red-500/10"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Recipe</span>
              <span className="text-[9px] bg-red-500/30 text-red-200 px-1 py-0.2 rounded font-mono">
                Admin
              </span>
            </Link>
          )}
        </nav>

        {/* Demo User Switcher */}
        <div className="flex items-center gap-3">
          <UserSwitcher onUserChanged={(user) => setCurrentUser(user)} />
        </div>
      </div>
    </header>
  );
}
