import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CULINARY_SKILLS } from "@/lib/skills/skills-config";
import {
  Flame,
  Clock,
  Award,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  UtensilsCrossed,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recipes = await prisma.recipe.findMany({
    include: {
      author: {
        select: { id: true, name: true, handle: true, avatar: true, title: true },
      },
      _count: {
        select: {
          mods: true,
          completions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const parsedRecipes = recipes.map((r) => ({
    ...r,
    skillsAwarded: JSON.parse(r.skillsAwarded || "[]"),
    pantryMatched: JSON.parse(r.pantryMatched || "[]"),
  }));

  const popularPantryItems = [
    "Chicken Breast",
    "Garlic",
    "Olive Oil",
    "Lemon",
    "Pasta",
    "Butter",
    "Parmesan",
    "Eggs",
    "Shallots",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/40 border border-neutral-800 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Curated Culinary Techniques & Pantry Matcher</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Cook what you have.{" "}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              Level up real chef skills.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-300 max-w-2xl leading-relaxed">
            Discover chef-crafted recipes tailored to your pantry staples, collaborate on
            community modifications, and earn verifiable XP across 5 culinary skill trees.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/pantry"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] text-sm"
            >
              <Flame className="w-4 h-4 fill-neutral-950" />
              <span>Launch Pantry Matcher</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold text-sm transition-colors"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>View Chef Skill Trees</span>
            </Link>
          </div>

          {/* Quick Pantry Quick-Add preview */}
          <div className="pt-4 border-t border-neutral-800/80">
            <p className="text-xs text-neutral-400 font-medium mb-2.5">
              Popular Pantry Staples for Instant Inspiration:
            </p>
            <div className="flex flex-wrap gap-2">
              {popularPantryItems.map((item) => (
                <Link
                  key={item}
                  href={`/pantry?ingredient=${encodeURIComponent(item)}`}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800/60 hover:bg-amber-500/20 hover:text-amber-300 border border-neutral-700/60 text-xs text-neutral-300 transition-colors"
                >
                  + {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Culinary Skills Taxonomy Spotlight */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              <span>The 5 Culinary Skill Trees</span>
            </h2>
            <p className="text-sm text-neutral-400">
              Every dish you cook awards XP in foundational culinary disciplines
            </p>
          </div>
          <Link
            href="/profile"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            Track Your Progress &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.values(CULINARY_SKILLS).map((skill) => (
            <div
              key={skill.key}
              className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${skill.color.bg} ${skill.color.text} border ${skill.color.border}`}
                  >
                    {skill.category}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    5 Ranks
                  </span>
                </div>
                <h3 className="font-bold text-neutral-100 text-sm">{skill.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {skill.description}
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-800/60">
                <span className="text-[11px] text-neutral-400">Top Rank:</span>
                <span className="text-[11px] font-semibold text-neutral-200 block truncate">
                  {skill.levels[skill.levels.length - 1].title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Recipe Gallery */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-400" />
              <span>Featured Community Recipes</span>
            </h2>
            <p className="text-sm text-neutral-400">
              Tested by home chefs, refined through community mods, and packed with skill XP
            </p>
          </div>
          <Link
            href="/pantry"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-xs text-neutral-200 font-medium transition-colors"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            <span>Match with Your Pantry</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parsedRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group flex flex-col bg-neutral-900/70 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
            >
              {/* Recipe Image with difficulty badge */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
                <img
                  src={recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-[11px] font-semibold text-neutral-200 border border-neutral-700/60">
                    {recipe.difficulty}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-neutral-950 text-[11px] font-bold shadow">
                  <Clock className="w-3 h-3" />
                  <span>{recipe.cookTime}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors leading-snug">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {recipe.summary}
                  </p>
                </div>

                {/* Earnable Culinary XP tags */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Earnable Skills & XP:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.skillsAwarded.slice(0, 3).map((sk: { skillName: string; xp: number }, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-neutral-800/80 border border-neutral-700/60 px-2 py-0.5 rounded-md text-amber-300 font-medium flex items-center gap-1"
                      >
                        <Flame className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                        <span>{sk.skillName}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          +{sk.xp}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{recipe.author.avatar}</span>
                    <span className="text-neutral-300 font-medium truncate max-w-[100px]">
                      {recipe.author.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-neutral-400">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                      <span>{recipe._count.mods} mods</span>
                    </span>
                    <span className="flex items-center gap-1 text-neutral-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{recipe._count.completions} cooked</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
