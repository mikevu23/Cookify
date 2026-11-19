"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Clock,
  Flame,
  Award,
  ThumbsUp,
  Plus,
  CheckCircle,
  CheckCircle2,
  Camera,
  Star,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface CompletionResultData {
  totalXpGained: number;
  newTotalXp: number;
  oldRank: string;
  newRank: string;
  skillLevelUps: Array<{
    skillKey: string;
    skillName: string;
    oldLevel: number;
    newLevel: number;
    newTitle: string;
  }>;
}

interface IngredientItem {
  name: string;
  amount?: string;
  unit?: string;
  isPantryItem?: boolean;
}

interface InstructionItem {
  stepNumber?: number;
  title?: string;
  instruction: string;
  techniqueTip?: string;
}

function formatIngredient(ing: string | IngredientItem): { text: string; isPantryItem?: boolean } {
  if (typeof ing === "string") return { text: ing };
  if (!ing) return { text: "" };
  const parts: string[] = [];
  if (ing.amount && ing.amount !== "to taste") parts.push(ing.amount);
  if (ing.unit && ing.unit !== "portions") parts.push(ing.unit);
  parts.push(ing.name || "");
  const text = parts.join(" ").trim() || ing.name || "";
  return { text, isPantryItem: ing.isPantryItem };
}

function formatInstruction(step: string | InstructionItem): {
  title?: string;
  instruction: string;
  techniqueTip?: string;
} {
  if (typeof step === "string") return { instruction: step };
  return {
    title: step.title,
    instruction: step.instruction || (step as unknown as { text?: string }).text || "",
    techniqueTip: step.techniqueTip,
  };
}

interface RecipeDetail {
  id: string;
  title: string;
  summary: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  servings: number;
  imageUrl: string | null;
  pantryMatched: string[];
  ingredients: Array<string | IngredientItem>;
  instructions: Array<string | InstructionItem>;
  skillsAwarded: Array<{
    skillKey: string;
    skillName: string;
    xp: number;
  }>;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    title: string;
    level: number;
  };
  mods: Array<{
    id: string;
    title: string;
    category: string;
    stepNumber?: number | null;
    instruction: string;
    votesCount: number;
    hasVoted: boolean;
    author: {
      name: string;
      handle: string;
      avatar: string;
      title: string;
    };
  }>;
  completions: Array<{
    id: string;
    photoUrl: string | null;
    notes: string | null;
    rating: number;
    xpEarned: number;
    createdAt: string;
    user: {
      name: string;
      handle: string;
      avatar: string;
      title: string;
    };
  }>;
  currentUserId: string | null;
}

const SAMPLE_FOOD_PHOTOS = [
  {
    name: "Golden Crust",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Plated Masterpiece",
    url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Rustic Skillet",
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Sizzling Fond",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
  },
];

export default function RecipeDetailPage() {
  const params = useParams();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cooking step tracking
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // Mod submission state
  const [showModForm, setShowModForm] = useState(false);
  const [modTitle, setModTitle] = useState("");
  const [modCategory, setModCategory] = useState("Technique");
  const [modInstruction, setModInstruction] = useState("");
  const [submittingMod, setSubmittingMod] = useState(false);

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_FOOD_PHOTOS[0].url);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(5);
  const [completing, setCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResultData | null>(null);

  const loadRecipe = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/recipes/${recipeId}`);
      if (!res.ok) throw new Error("Recipe not found");
      const data = await res.json();
      setRecipe(data);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to load recipe");
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  async function handleToggleVote(modId: string) {
    if (!recipe) return;

    // Optimistic UI update
    setRecipe((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mods: prev.mods.map((m) => {
          if (m.id === modId) {
            const nextHasVoted = !m.hasVoted;
            return {
              ...m,
              hasVoted: nextHasVoted,
              votesCount: nextHasVoted ? m.votesCount + 1 : m.votesCount - 1,
            };
          }
          return m;
        }),
      };
    });

    try {
      const res = await fetch(`/api/recipes/${recipeId}/mods/${modId}/vote`, {
        method: "POST",
      });
      if (!res.ok) {
        // Rollback on error
        loadRecipe();
      }
    } catch {
      loadRecipe();
    }
  }

  async function handleSubmitMod(e: React.FormEvent) {
    e.preventDefault();
    if (!modTitle.trim() || !modInstruction.trim()) return;

    setSubmittingMod(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/mods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: modTitle,
          category: modCategory,
          instruction: modInstruction,
        }),
      });

      if (res.ok) {
        setModTitle("");
        setModInstruction("");
        setShowModForm(false);
        await loadRecipe();
      }
    } catch (err) {
      console.error("Failed to submit mod:", err);
    } finally {
      setSubmittingMod(false);
    }
  }

  async function handleCompleteRecipe(e: React.FormEvent) {
    e.preventDefault();
    setCompleting(true);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl,
          notes,
          rating,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCompletionResult(data.xpResult);

        // Confetti celebration blast!
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#f97316", "#ef4444", "#3b82f6", "#10b981"],
        });

        // Refresh recipe to show new completion in community gallery
        await loadRecipe();
      }
    } catch (err) {
      console.error("Failed to complete recipe:", err);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-neutral-400">Loading recipe details & community mods...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Recipe Not Found</h2>
        <p className="text-neutral-400 text-sm">{error || "This recipe could not be retrieved."}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-semibold hover:bg-neutral-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recipe Feed</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
      {/* Top Navigation Back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recipes</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-105"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Cooked This! (+XP)</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800">
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-neutral-950">
          <img
            src={recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200"}
            alt={recipe.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-neutral-950 font-bold">
                {recipe.difficulty}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-900/80 backdrop-blur border border-neutral-700 text-neutral-300 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                Prep: {recipe.prepTime}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-900/80 backdrop-blur border border-neutral-700 text-neutral-300 font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                Cook: {recipe.cookTime}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-neutral-900/80 backdrop-blur border border-neutral-700 text-neutral-300 font-medium">
                {recipe.servings} Servings
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {recipe.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              {recipe.summary}
            </p>
          </div>
        </div>

        {/* Author & Matched Pantry Bar */}
        <div className="p-4 sm:px-6 bg-neutral-950 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{recipe.author.avatar}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-200">
                  {recipe.author.name}
                </span>
                <span className="text-[10px] text-neutral-500">
                  @{recipe.author.handle}
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-medium">
                {recipe.author.title}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-neutral-400 text-[11px] font-medium mr-1">
              Pantry Used:
            </span>
            {recipe.pantryMatched.map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-300 text-[11px] border border-neutral-700/60"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Earnable Skill XP Callout */}
      <div className="p-5 rounded-2xl bg-neutral-900/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Award className="w-4 h-4" />
            <span>Earnable Culinary Techniques & Skill XP</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Complete this recipe and upload your finished plate photo to credit your chef profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {recipe.skillsAwarded.map((sk, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs font-semibold text-neutral-200 flex items-center gap-2 shadow-sm"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{sk.skillName}</span>
              <span className="text-amber-400 font-mono font-bold">
                +{sk.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid: Checklist + Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ingredients Checklist */}
        <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Ingredients</span>
              <span className="text-xs font-mono font-normal text-neutral-400">
                ({Object.values(checkedIngredients).filter(Boolean).length}/{recipe.ingredients.length} prepped)
              </span>
            </h2>
            <button
              onClick={() => {
                const all = Object.values(checkedIngredients).filter(Boolean).length === recipe.ingredients.length;
                if (all) {
                  setCheckedIngredients({});
                } else {
                  const filled: Record<number, boolean> = {};
                  recipe.ingredients.forEach((_, i) => (filled[i] = true));
                  setCheckedIngredients(filled);
                }
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
            >
              {Object.values(checkedIngredients).filter(Boolean).length === recipe.ingredients.length
                ? "Reset"
                : "Check All"}
            </button>
          </div>

          <div className="space-y-2">
            {recipe.ingredients.map((ing, idx) => {
              const isChecked = !!checkedIngredients[idx];
              const { text, isPantryItem } = formatIngredient(ing);
              return (
                <div
                  key={idx}
                  onClick={() =>
                    setCheckedIngredients((prev) => ({
                      ...prev,
                      [idx]: !prev[idx],
                    }))
                  }
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? "bg-neutral-950/80 border-neutral-800 text-neutral-400 line-through"
                      : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? "bg-amber-500 border-amber-500 text-neutral-950"
                          : "border-neutral-600 bg-neutral-900"
                      }`}
                    >
                      {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs leading-relaxed truncate">{text}</span>
                  </div>
                  {isPantryItem && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">
                      In Pantry
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step-by-Step Cooking Mode */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Step-by-Step Cooking Mode</span>
            </h2>
            <span className="text-xs text-neutral-400 font-mono">
              {Object.values(checkedSteps).filter(Boolean).length}/{recipe.instructions.length} steps completed
            </span>
          </div>

          <div className="space-y-3">
            {recipe.instructions.map((step, idx) => {
              const isDone = !!checkedSteps[idx];
              const { title, instruction, techniqueTip } = formatInstruction(step);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? "bg-neutral-950/60 border-neutral-800/80 opacity-75"
                      : "bg-neutral-950/90 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                            isDone
                              ? "bg-neutral-800 text-neutral-400"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          Step {idx + 1}
                        </span>
                        {title && (
                          <span className={`text-xs font-bold ${isDone ? "text-neutral-400 line-through" : "text-white"}`}>
                            {title}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs sm:text-sm leading-relaxed pl-1 ${
                          isDone ? "text-neutral-400 line-through" : "text-neutral-200"
                        }`}
                      >
                        {instruction}
                      </p>

                      {techniqueTip && (
                        <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{techniqueTip}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCheckedSteps((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }))
                      }
                      className={`shrink-0 p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        isDone
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {isDone ? "Done" : "Mark Done"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Community Recipe Mods Section */}
      <section className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Community Refinements & Mods ({recipe.mods.length})
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Crowdsourced tweaks, heat adjustments, and ingredient variations suggested by community chefs.
            </p>
          </div>

          <button
            onClick={() => setShowModForm(!showModForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Propose Modification</span>
          </button>
        </div>

        {/* Mod Submission Form */}
        {showModForm && (
          <form
            onSubmit={handleSubmitMod}
            className="p-5 rounded-2xl bg-neutral-950 border border-neutral-700 space-y-4 animate-in fade-in"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Submit a Recipe Mod
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Mod Title (e.g. Add 1 tbsp Cold Butter at the end for glossy shine)"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <select
                  value={modCategory}
                  onChange={(e) => setModCategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Technique">Technique</option>
                  <option value="Substitution">Substitution</option>
                  <option value="Flavor Boost">Flavor Boost</option>
                  <option value="Dietary">Dietary Tweak</option>
                </select>
              </div>
            </div>

            <div>
              <textarea
                placeholder="Explain the technique or tweak: why does this improve the dish? What step does this modify?"
                rows={3}
                value={modInstruction}
                onChange={(e) => setModInstruction(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModForm(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingMod}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
              >
                {submittingMod ? "Submitting..." : "Submit Community Mod"}
              </button>
            </div>
          </form>
        )}

        {/* Mods list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipe.mods.map((mod) => (
            <div
              key={mod.id}
              className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    {mod.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <span>{mod.author.avatar}</span>
                    <span className="text-neutral-300 font-medium">
                      {mod.author.name}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-neutral-100">
                  {mod.title}
                </h3>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                  {mod.instruction}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  {mod.votesCount} {mod.votesCount === 1 ? "chef upvoted" : "chefs upvoted"}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleVote(mod.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mod.hasVoted
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-transparent"
                  }`}
                >
                  <ThumbsUp
                    className={`w-3.5 h-3.5 ${mod.hasVoted ? "fill-amber-400 text-amber-400" : ""}`}
                  />
                  <span>{mod.hasVoted ? "Upvoted" : "Upvote Mod"}</span>
                </button>
              </div>
            </div>
          ))}

          {recipe.mods.length === 0 && (
            <div className="col-span-2 py-8 text-center text-xs text-neutral-500 italic">
              No community mods submitted yet. Be the first to suggest a variation!
            </div>
          )}
        </div>
      </section>

      {/* Community Completions Gallery */}
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              <span>Community Cookings & Proof of Dish ({recipe.completions.length})</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Photos and reviews from home chefs who completed this dish.
            </p>
          </div>
          <button
            onClick={() => setShowCompleteModal(true)}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            Upload Your Plate &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recipe.completions.map((comp) => (
            <div
              key={comp.id}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {comp.photoUrl && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={comp.photoUrl}
                    alt="Cooked dish"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span>{comp.user.avatar}</span>
                      <span className="text-xs font-semibold text-neutral-200">
                        {comp.user.name}
                      </span>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: comp.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-300 italic line-clamp-3">
                    &quot;{comp.notes}&quot;
                  </p>
                </div>
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="text-emerald-400 font-mono font-medium">
                    +{comp.xpEarned} XP Awarded
                  </span>
                  <span>{new Date(comp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}

          {recipe.completions.length === 0 && (
            <div className="col-span-3 py-10 text-center space-y-2">
              <p className="text-xs text-neutral-500 italic">
                No completions logged for this dish yet.
              </p>
              <button
                onClick={() => setShowCompleteModal(true)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
              >
                Be the first to Cook & Earn XP!
              </button>
            </div>
          )}
        </div>
      </section>

      {/* "I Cooked This" Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            {!completionResult ? (
              <form onSubmit={handleCompleteRecipe} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Complete Recipe & Claim XP</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    You cooked &quot;{recipe.title}&quot;!
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Log your result, upload dish proof, and boost your culinary rank.
                  </p>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Your Dish Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Finished Plate Photo
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SAMPLE_FOOD_PHOTOS.map((pic) => (
                      <button
                        key={pic.url}
                        type="button"
                        onClick={() => setPhotoUrl(pic.url)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative ${
                          photoUrl === pic.url
                            ? "border-amber-400 scale-105 shadow-md"
                            : "border-neutral-800 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={pic.url}
                          alt={pic.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    placeholder="Or paste an image URL..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-200 mt-2"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Chef Notes / Review
                  </label>
                  <textarea
                    rows={3}
                    placeholder="How did the searing turn out? What was the flavor balance like?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={completing}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs shadow-lg shadow-orange-500/20"
                  >
                    {completing ? "Awarding XP..." : "Award XP & Record Completion"}
                  </button>
                </div>
              </form>
            ) : (
              /* Success / Level Up state */
              <div className="text-center space-y-5 animate-in zoom-in-95">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 animate-pulse">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Culinary Mastery XP Claimed!
                  </span>
                  <h3 className="text-3xl font-black text-white mt-1">
                    +{completionResult.totalXpGained} XP Earned
                  </h3>
                  <p className="text-xs text-neutral-300 mt-2">
                    Total Chef XP is now{" "}
                    <span className="font-bold text-amber-400">
                      {completionResult.newTotalXp} XP
                    </span>{" "}
                    ({completionResult.newRank})
                  </p>
                </div>

                {completionResult.skillLevelUps && completionResult.skillLevelUps.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Skill Level Up!</span>
                    </span>
                    {completionResult.skillLevelUps.map((up: { oldLevel: number; newLevel: number; skillName: string; newTitle: string }, idx: number) => (
                      <div key={idx} className="text-xs text-neutral-200">
                        Level {up.oldLevel} &rarr;{" "}
                        <span className="font-bold text-amber-300">Level {up.newLevel}</span> in{" "}
                        {up.skillName} (Unlocked: <span className="italic">{up.newTitle}</span>)
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setCompletionResult(null);
                      setShowCompleteModal(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200"
                  >
                    Close
                  </button>
                  <Link
                    href="/profile"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold text-xs"
                  >
                    Inspect Chef Skill Tree &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
