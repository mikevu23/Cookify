import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import {
  CULINARY_SKILLS,
  calculateSkillLevel,
  calculateChefRank,
} from "@/lib/skills/skills-config";
import {
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Star,
  TrendingUp,
  MessageSquare,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No active chef selected</h2>
        <p className="text-neutral-400 text-sm">
          Please select a demo profile using the switcher in the navigation bar.
        </p>
      </div>
    );
  }

  // Load detailed profile relations
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      skills: true,
      recipes: {
        include: {
          _count: {
            select: { mods: true, completions: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      mods: {
        include: {
          recipe: {
            select: { id: true, title: true },
          },
        },
        orderBy: { votesCount: "desc" },
      },
      completions: {
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              cookTime: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return null;

  const chefRank = calculateChefRank(user.totalXp);
  const totalModVotesReceived = user.mods.reduce((acc, m) => acc + m.votesCount, 0);

  // Skill calculations for the 5 disciplines
  const skillProgressList = Object.values(CULINARY_SKILLS).map((def) => {
    const userSkill = user.skills.find((s) => s.skillKey === def.key);
    const xp = userSkill ? userSkill.xp : 0;
    const progress = calculateSkillLevel(def.key, xp);
    return {
      def,
      xp,
      progress,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
      {/* Chef Dossier Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-neutral-950 border border-neutral-700/80 flex items-center justify-center text-4xl shadow-inner">
              {user.avatar}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {user.name}
                </h1>
                <span className="text-xs bg-amber-500/20 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40">
                  Lvl {user.level}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                @{user.handle}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{chefRank.rank}</span>
                </span>
                <span className="text-xs text-neutral-500">•</span>
                <span className="text-xs font-mono font-semibold text-neutral-300">
                  {user.totalXp} Total XP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center min-w-[90px]">
              <span className="text-xl font-bold font-mono text-white block">
                {user.completions.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Cooked
              </span>
            </div>
            <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center min-w-[90px]">
              <span className="text-xl font-bold font-mono text-sky-400 block">
                {user.mods.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Mods Created
              </span>
            </div>
            <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center min-w-[90px]">
              <span className="text-xl font-bold font-mono text-amber-400 block">
                {totalModVotesReceived}
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Mod Upvotes
              </span>
            </div>
          </div>
        </div>

        {/* Global XP Progression Bar */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Chef Rank Journey: {chefRank.rank}</span>
            </span>
            <span className="text-neutral-400 font-mono">
              {user.totalXp} XP / Next Rank at {user.totalXp < 100 ? 100 : user.totalXp < 250 ? 250 : user.totalXp < 600 ? 600 : user.totalXp < 1200 ? 1200 : 2000} XP
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((user.totalXp / 1200) * 100))}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* The 5 Culinary Skill Trees */}
      <section className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Culinary Skill Trees
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Master the core techniques of high-end cooking. Cook targeted recipes to level up each tree.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillProgressList.map(({ def, xp, progress }) => (
            <div
              key={def.key}
              className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-neutral-700 transition-colors shadow-lg"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${def.color.bg} ${def.color.text} border ${def.color.border}`}
                  >
                    {def.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-neutral-950 px-2.5 py-0.5 rounded-full border border-neutral-800">
                    Level {progress.level} / 5
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-white">{def.name}</h3>
                  <span className="text-xs font-semibold text-neutral-300 block mt-0.5">
                    Current Rank: <span className="text-amber-400">{progress.title}</span>
                  </span>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    {def.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Level Tiers */}
              <div className="space-y-4 pt-3 border-t border-neutral-800/80">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] text-neutral-400 font-mono">
                    <span>{xp} XP Earned</span>
                    <span>
                      {progress.isMaxLevel ? "MAX RANK" : `${progress.nextLevelMin} XP for next rank`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full ${def.color.progress} transition-all duration-500`}
                      style={{ width: `${progress.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Level Tier ladder */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Rank Progression:
                  </span>
                  <div className="space-y-1">
                    {def.levels.map((lvl) => {
                      const isUnlocked = progress.level >= lvl.level;
                      const isCurrent = progress.level === lvl.level;
                      return (
                        <div
                          key={lvl.level}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            isCurrent
                              ? "bg-amber-500/15 border border-amber-500/40 text-amber-200"
                              : isUnlocked
                              ? "bg-neutral-950/60 text-neutral-300"
                              : "text-neutral-500 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px]">
                              Lvl {lvl.level}
                            </span>
                            <span className="font-medium">{lvl.title}</span>
                          </div>
                          {isUnlocked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="text-[10px] font-mono">{lvl.minXp} XP</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dishes Cooked by this Chef */}
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span>Dishes Cooked & Proven ({user.completions.length})</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Culinary creations verified and logged by {user.name}.
            </p>
          </div>
          <Link
            href="/generate"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            Cook Another Dish &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {user.completions.map((comp) => (
            <Link
              key={comp.id}
              href={`/recipes/${comp.recipe.id}`}
              className="group bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              {comp.photoUrl && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={comp.photoUrl}
                    alt={comp.recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {comp.recipe.difficulty}
                    </span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: comp.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-neutral-100 group-hover:text-amber-400 transition-colors">
                    {comp.recipe.title}
                  </h4>
                  {comp.notes && (
                    <p className="text-xs text-neutral-400 italic mt-1 line-clamp-2">
                      &quot;{comp.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span className="text-emerald-400">+{comp.xpEarned} XP</span>
                  <span>{new Date(comp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}

          {user.completions.length === 0 && (
            <div className="col-span-3 py-10 text-center space-y-3">
              <p className="text-xs text-neutral-500 italic">
                {user.name} has not logged any completed recipes yet.
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cook Your First Dish</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Community Mods Submitted */}
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Community Mods Contributed ({user.mods.length})
          </h2>
        </div>
        <p className="text-xs text-neutral-400">
          Technique suggestions, tweaks, and substitutions contributed by this chef.
        </p>

        <div className="space-y-3 pt-2">
          {user.mods.map((mod) => (
            <div
              key={mod.id}
              className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    {mod.category}
                  </span>
                  <Link
                    href={`/recipes/${mod.recipe.id}`}
                    className="text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    on {mod.recipe.title} &rarr;
                  </Link>
                </div>
                <h4 className="font-bold text-sm text-neutral-200">{mod.title}</h4>
                <p className="text-xs text-neutral-400 mt-0.5">{mod.instruction}</p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700/60 text-xs font-mono text-amber-300">
                <span>{mod.votesCount} Upvotes</span>
              </div>
            </div>
          ))}

          {user.mods.length === 0 && (
            <p className="text-xs text-neutral-500 italic py-4">
              No modifications submitted yet. Visit any recipe to submit a technique tweak!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
