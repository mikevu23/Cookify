"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChefHat,
  Plus,
  Trash2,
  Award,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { CULINARY_SKILLS } from "@/lib/skills/skills-config";

interface IngredientRow {
  name: string;
  amount: string;
  unit: string;
  isPantryItem: boolean;
}

interface StepRow {
  title: string;
  instruction: string;
  techniqueTip: string;
}

export default function NewRecipePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; isAdmin: boolean } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [prepTime, setPrepTime] = useState("15 mins");
  const [cookTime, setCookTime] = useState("20 mins");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [servings, setServings] = useState(2);
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&auto=format&fit=crop&q=80"
  );

  // Dynamic ingredients
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: "Prime Sirloin Steak", amount: "2", unit: "steaks (8 oz)", isPantryItem: false },
    { name: "Garlic Cloves, crushed", amount: "4", unit: "cloves", isPantryItem: true },
    { name: "Unsalted Butter", amount: "2", unit: "tbsp", isPantryItem: true },
    { name: "Fresh Rosemary", amount: "2", unit: "sprigs", isPantryItem: true },
  ]);

  // Dynamic steps
  const [steps, setSteps] = useState<StepRow[]>([
    {
      title: "Temper & Dry Meat",
      instruction:
        "Bring the steaks to room temperature for 30 minutes. Thoroughly pat dry with paper towels and season generously with coarse kosher salt.",
      techniqueTip: "Culinary Tip: Dry surface guarantees maximum Maillard reaction browning rather than steaming.",
    },
    {
      title: "Hard Pan Sear & Baste",
      instruction:
        "Heat a cast iron skillet until smoking hot. Sear steaks undisturbed for 2-3 minutes. Flip, add crushed garlic, rosemary, and cold butter, spooning foaming butter over the steaks.",
      techniqueTip: "Culinary Tip: Butter basting (arroser) delivers even heat and rich nutty notes without burning the meat.",
    },
  ]);

  // Skill XP rewards
  const [skillXp, setSkillXp] = useState<Record<string, number>>({
    heat_searing: 50,
    flavor_balancing: 30,
    sauces_emulsion: 20,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/users/current");
        if (res.ok) {
          const u = await res.json();
          setCurrentUser(u);
        }
      } catch (err) {
        console.error("Failed to load active user:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    checkUser();
  }, []);

  async function handleSwitchToAdmin() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const users = await res.json();
        const adminUser = users.find((u: { isAdmin: boolean; id: string }) => u.isAdmin);
        if (adminUser) {
          await fetch("/api/users/current", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: adminUser.id }),
          });
          setCurrentUser(adminUser);
          router.refresh();
        }
      }
    } catch (e) {
      console.error("Failed to switch to admin:", e);
    }
  }

  function addIngredientRow() {
    setIngredients([
      ...ingredients,
      { name: "", amount: "1", unit: "unit", isPantryItem: false },
    ]);
  }

  function updateIngredient(index: number, field: keyof IngredientRow, value: string | boolean) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  function removeIngredientRow(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addStepRow() {
    setSteps([
      ...steps,
      {
        title: "",
        instruction: "",
        techniqueTip: "",
      },
    ]);
  }

  function updateStep(index: number, field: keyof StepRow, value: string) {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  }

  function removeStepRow(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a recipe title");
      return;
    }

    if (ingredients.length === 0 || !ingredients.some((i) => i.name.trim())) {
      setError("Please add at least one ingredient with a name");
      return;
    }

    if (steps.length === 0 || !steps.some((s) => s.instruction.trim())) {
      setError("Please add at least one step instruction");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // Format skills awarded
      const skillsAwarded = Object.entries(skillXp)
        .filter(([, xp]) => Number(xp) > 0)
        .map(([key, xp]) => ({
          skillKey: key,
          skillName: CULINARY_SKILLS[key]?.name || key,
          xp: Number(xp),
        }));

      // Format instructions
      const formattedInstructions = steps
        .filter((s) => s.instruction.trim())
        .map((s, idx) => ({
          stepNumber: idx + 1,
          title: s.title.trim() || `Step ${idx + 1}`,
          instruction: s.instruction.trim(),
          techniqueTip: s.techniqueTip.trim() || undefined,
        }));

      // Format ingredients
      const formattedIngredients = ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          amount: i.amount.trim() || "1",
          unit: i.unit.trim() || "unit",
          isPantryItem: Boolean(i.isPantryItem),
        }));

      const pantryMatched = formattedIngredients
        .filter((i) => i.isPantryItem)
        .map((i) => i.name.toLowerCase());

      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          prepTime,
          cookTime,
          difficulty,
          servings,
          imageUrl,
          pantryMatched,
          ingredients: formattedIngredients,
          instructions: formattedInstructions,
          skillsAwarded,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish recipe");
      }

      const result = await res.json();
      router.push(`/recipes/${result.recipeId}`);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to publish curated recipe");
      setSubmitting(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-neutral-400">Verifying Chef Permissions...</p>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Admin Access Required</h2>
          <p className="text-xs text-neutral-400">
            Curated recipes can only be authored and added by Admin Chefs. Currently, you are browsing as{" "}
            <span className="font-bold text-neutral-200">{currentUser?.name || "a guest"}</span>.
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
          >
            Back to Home
          </Link>
          <button
            onClick={handleSwitchToAdmin}
            className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-neutral-950 font-bold text-xs shadow-lg shadow-red-500/20"
          >
            Switch to Chef Alex (Admin)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explore</span>
        </Link>
        <span className="text-xs bg-red-500/20 text-red-300 font-mono font-bold px-2.5 py-0.5 rounded border border-red-500/30">
          Admin Recipe Studio
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Author a Curated Recipe
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Publish an official recipe with measured ingredients, technique tips, and assignable culinary skill XP rewards.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Recipe Information */}
        <section className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            <span>Recipe Metadata</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Recipe Title
              </label>
              <input
                type="text"
                placeholder="e.g. Cast Iron Pan-Seared Sirloin with Garlic Herb Butter"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Summary / Technique Focus
              </label>
              <textarea
                rows={2}
                placeholder="Explain the culinary concept and why this technique elevates the dish..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Prep Time
                </label>
                <input
                  type="text"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Cook Time
                </label>
                <input
                  type="text"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Servings
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Cover Photo URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-200"
              />
            </div>
          </div>
        </section>

        {/* Dynamic Ingredients */}
        <section className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                Ingredients & Pantry Items ({ingredients.length})
              </h2>
              <p className="text-xs text-neutral-400">
                Specify quantities and mark items commonly found in a home pantry.
              </p>
            </div>
            <button
              type="button"
              onClick={addIngredientRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ingredient</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {ingredients.map((ing, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs"
              >
                <input
                  type="text"
                  placeholder="Ingredient name (e.g. Garlic, Butter)"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100"
                  required
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Amount (e.g. 2, 1/2)"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                    className="w-24 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Unit (tbsp, cups)"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                    className="w-24 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-100"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 text-[11px] whitespace-nowrap pl-1">
                    <input
                      type="checkbox"
                      checked={ing.isPantryItem}
                      onChange={(e) => updateIngredient(idx, "isPantryItem", e.target.checked)}
                      className="rounded bg-neutral-800 border-neutral-700 text-amber-500"
                    />
                    <span>Pantry Staple</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(idx)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic Instructions */}
        <section className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                Step-by-Step Culinary Instructions ({steps.length})
              </h2>
              <p className="text-xs text-neutral-400">
                Add structured steps along with optional technique tips for home cooks.
              </p>
            </div>
            <button
              type="button"
              onClick={addStepRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    Step {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStepRow(idx)}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Step Title (e.g. High Heat Sear & Crust)"
                  value={st.title}
                  onChange={(e) => updateStep(idx, "title", e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-100 font-semibold"
                />

                <textarea
                  rows={2}
                  placeholder="Detailed cooking direction..."
                  value={st.instruction}
                  onChange={(e) => updateStep(idx, "instruction", e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                  required
                />

                <input
                  type="text"
                  placeholder="💡 Culinary Technique Tip (optional, e.g. Why cold butter creates a shiny emulsion)"
                  value={st.techniqueTip}
                  onChange={(e) => updateStep(idx, "techniqueTip", e.target.value)}
                  className="w-full bg-amber-950/20 border border-amber-500/30 rounded-lg px-3 py-1.5 text-amber-300 placeholder:text-amber-500/50"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Skill Tree Rewards Assignment */}
        <section className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Skill Tree XP Allocation</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Set how much culinary experience cooks receive in each technique upon completing this recipe.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(CULINARY_SKILLS).map((sk) => (
              <div
                key={sk.key}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-neutral-200 block">
                    {sk.name}
                  </span>
                  <span className="text-[10px] text-neutral-400">{sk.category}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={200}
                    step={5}
                    value={skillXp[sk.key] || 0}
                    onChange={(e) =>
                      setSkillXp({ ...skillXp, [sk.key]: Number(e.target.value) })
                    }
                    className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs font-mono text-amber-300 text-center"
                  />
                  <span className="text-xs text-neutral-500">XP</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
          >
            {submitting ? "Publishing Recipe..." : "Publish to Curated Catalog"}
          </button>
        </div>
      </form>
    </div>
  );
}
