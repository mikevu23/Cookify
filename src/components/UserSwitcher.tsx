"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronDown, Check, ShieldCheck } from "lucide-react";

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  title: string;
  level: number;
  totalXp: number;
  isAdmin: boolean;
}

export function UserSwitcher({
  onUserChanged,
}: {
  onUserChanged?: (user: UserProfile) => void;
}) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadUsers() {
      try {
        const [usersRes, curRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/users/current"),
        ]);
        if (usersRes.ok) {
          const uData = await usersRes.json();
          setUsers(uData);
        }
        if (curRes.ok) {
          const cData = await curRes.json();
          setCurrentUser(cData);
          if (onUserChanged) onUserChanged(cData);
        }
      } catch (err) {
        console.error("Failed to load user switch data:", err);
      }
    }
    loadUsers();
  }, [onUserChanged]);

  async function switchUser(userId: string) {
    if (userId === currentUser?.id) {
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const target = users.find((u) => u.id === userId);
        if (target) {
          setCurrentUser(target);
          if (onUserChanged) onUserChanged(target);
        }
        setIsOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to switch chef:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-300 animate-pulse bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-full">
        <User className="w-3.5 h-3.5" />
        <span>Loading Chef...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 rounded-full transition-all text-sm group shadow-sm"
      >
        <span className="text-lg leading-none">{currentUser.avatar || "🍳"}</span>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-100 text-xs">
              {currentUser.name}
            </span>
            {currentUser.isAdmin ? (
              <span className="text-[10px] bg-red-500/20 text-red-400 font-mono font-bold px-1.5 py-0.2 rounded border border-red-500/30 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Admin
              </span>
            ) : (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono font-medium px-1.5 py-0.2 rounded border border-amber-500/30">
                Lvl {currentUser.level}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 font-medium">
            {currentUser.title}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-2 z-50 text-neutral-200 divide-y divide-neutral-800 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 text-[11px] text-neutral-400 flex items-center justify-between">
              <span className="font-medium tracking-wide uppercase text-neutral-400">
                Switch Chef Persona
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                Instant
              </span>
            </div>
            <div className="py-1 space-y-1">
              {users.map((u) => {
                const isActive = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      isActive
                        ? "bg-amber-500/15 border border-amber-500/40 text-amber-200"
                        : "hover:bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{u.avatar}</span>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          {u.name}
                          {u.isAdmin && (
                            <span className="text-[9px] bg-red-500/20 text-red-300 font-bold px-1 py-0.2 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <span>{u.title}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-medium font-mono">
                            {u.totalXp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-neutral-500 hover:text-neutral-300">
                        Select
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 text-[10px] text-neutral-400">
              💡 Chef Alex is designated as Admin to author curated recipes!
            </div>
          </div>
        </>
      )}
    </div>
  );
}
