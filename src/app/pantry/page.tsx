"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  UtensilsCrossed,
  Plus,
  X,
  Flame,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface ScoredRecipe {
  id: string;
  title: string;
  summary: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  servings: number;
  imageUrl: string | null;
  matchedCount: number;
  totalCount: number;
  matchPercentage: number;
  matchedList: string[];
  missingList: string[];
  isCookableNow: boolean;
  skillsAwarded: Array<{
    skillKey: string;
    skillName: string;
    xp: number;
  }>;
  author: {
    name: string;
    avatar: string;
    title: string;
  };
}

const COMMON_PANTRY_STAPLES = [
  "Chicken Thighs",
  "Garlic",
  "Lemon",
  "Butter",
  "Olive Oil",
  "Pasta",
  "Parmesan",
  "Eggs",
  "Shallots",
  "Rosemary",
  "Tomatoes",
  "Mushrooms",
];

function PantryMatcherContent() {
  const searchParams = useSearchParams();

  const [pantry, setPantry] = useState<string[]>([
    "Chicken Thighs",
    "Garlic",
    "Lemon",
    "Butter",
  ]);
  const [inputValue, setInputValue] = useState("");
  const [recipes, setRecipes] = useState<ScoredRecipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ingParam = searchParams.get("ingredient");
    if (ingParam) {
      setPantry((prev) => (prev.includes(ingParam) ? prev : [...prev, ingParam]));
    }
  }, [searchParams]);

  const fetchMatches = useCallback(async (currentPantry: string[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/recipes/pantry-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: currentPantry }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes || []);
      }
    } catch (e) {
      console.error("Failed to fetch pantry matches:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches(pantry);
  }, [pantry, fetchMatches]);

  function addPantryItem(item: string) {
    const trimmed = item.trim();
    if (trimmed && !pantry.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setPantry([...pantry, trimmed]);
      setInputValue("");
    }
  }

  function removePantryItem(idx: number) {
    setPantry(pantry.filter((_, i) => i !== idx));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Deterministic Kitchen Matcher</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          What is in your pantry right now?
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Select what you have in your kitchen. Cookify scans your curated chef recipes and calculates instant match scores.
        </p>
      </div>

      {/* Pantry Selector Panel */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Active Pantry Items ({pantry.length})
            </span>
            <p className="text-xs text-neutral-400">
              Add or remove ingredients to see recipes re-score in real time.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPantryItem(inputValue);
            }}
            className="flex gap-2 w-full sm:w-auto"
          >
            <input
              type="text"
              placeholder="Add ingredient..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Selected Chips */}
        <div className="flex flex-wrap gap-2">
          {pantry.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removePantryItem(idx)}
                className="text-neutral-400 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {pantry.length === 0 && (
            <p className="text-xs text-neutral-500 italic py-2">
              Your pantry is empty. Tap any of the staple chips below to add them!
            </p>
          )}
        </div>

        {/* Quick Add Staples */}
        <div className="pt-4 border-t border-neutral-800/80 space-y-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
            Common Staples Quick Add:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_PANTRY_STAPLES.map((staple) => {
              const isSelected = pantry.some(
                (i) => i.toLowerCase() === staple.toLowerCase()
              );
              return (
                <button
                  key={staple}
                  type="button"
                  onClick={() =>
                    isSelected
                      ? setPantry(
                          pantry.filter(
                            (i) => i.toLowerCase() !== staple.toLowerCase()
                          )
                        )
                      : addPantryItem(staple)
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border-neutral-800"
                  }`}
                >
                  {isSelected ? "✓" : "+"} {staple}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Matched Recipe Results */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Curated Recipe Matches</span>
              {loading && <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />}
            </h2>
            <p className="text-xs text-neutral-400">
              Ranked by compatibility with your current ingredients
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {recipes.length} recipes scored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-neutral-700 transition-all shadow-xl"
            >
              <div className="space-y-4">
                {/* Top Badge & Match Rate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black font-mono px-3 py-1 rounded-full border ${
                        r.isCookableNow
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : r.matchPercentage >= 60
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}
                    >
                      {r.isCookableNow ? "100% READY TO COOK" : `${r.matchPercentage}% MATCH`}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {r.matchedCount}/{r.totalCount} items
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {r.cookTime}
                    </span>
                    <span>•</span>
                    <span className="text-neutral-300">{r.difficulty}</span>
                  </div>
                </div>

                {/* Match Progress Bar */}
                <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      r.isCookableNow ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${r.matchPercentage}%` }}
                  />
                </div>

                {/* Title & Summary */}
                <div>
                  <h3 className="text-xl font-bold text-white leading-snug">
                    {r.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                    {r.summary}
                  </p>
                </div>

                {/* Missing vs Matched Ingredients */}
                <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                  {r.missingList.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span>Missing ({r.missingList.length}):</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {r.missingList.map((m, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.matchedList.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>You Have ({r.matchedList.length}):</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {r.matchedList.map((m, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Earnable Skill badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.skillsAwarded.map((sk, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-300 font-medium flex items-center gap-1"
                    >
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>{sk.skillName}</span>
                      <span className="text-neutral-500 font-mono">+{sk.xp}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>{r.author.avatar}</span>
                  <span>{r.author.name}</span>
                </div>

                <Link
                  href={`/recipes/${r.id}`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
                >
                  <span>Start Cooking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {recipes.length === 0 && !loading && (
            <div className="col-span-2 py-12 text-center text-xs text-neutral-500 italic">
              No recipes found in the database.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function PantryMatcherPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-400">Loading Pantry Matcher...</p>
        </div>
      }
    >
      <PantryMatcherContent />
    </Suspense>
  );
}
