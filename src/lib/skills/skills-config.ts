export interface SkillLevelDef {
  level: number;
  minXp: number;
  title: string;
}

export interface CulinarySkillDef {
  key: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: {
    bg: string;
    text: string;
    border: string;
    progress: string;
  };
  levels: SkillLevelDef[];
}

export const CULINARY_SKILLS: Record<string, CulinarySkillDef> = {
  knife_work: {
    key: "knife_work",
    name: "Knife Work & Prep",
    category: "Preparation",
    description: "Precision cuts, julienne, brunoise, chiffonade, and proper knife ergonomics.",
    icon: "UtensilsCrossed",
    color: {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      border: "border-blue-500/30",
      progress: "bg-blue-500",
    },
    levels: [
      { level: 1, minXp: 0, title: "Chopping Apprentice" },
      { level: 2, minXp: 80, title: "Prep Cook" },
      { level: 3, minXp: 200, title: "Station Line Cook" },
      { level: 4, minXp: 450, title: "Sous Chef" },
      { level: 5, minXp: 800, title: "Master of the Blade" },
    ],
  },
  heat_searing: {
    key: "heat_searing",
    name: "Heat Control & Searing",
    category: "Cooking",
    description: "Maillard browning, pan temperature management, fond deglazing, and crust development.",
    icon: "Flame",
    color: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      border: "border-amber-500/30",
      progress: "bg-amber-500",
    },
    levels: [
      { level: 1, minXp: 0, title: "Pan Warmer" },
      { level: 2, minXp: 80, title: "Sizzle Specialist" },
      { level: 3, minXp: 200, title: "Sear Artisan" },
      { level: 4, minXp: 450, title: "Skillet Maestro" },
      { level: 5, minXp: 800, title: "Grand Rotisseur" },
    ],
  },
  sauces_emulsion: {
    key: "sauces_emulsion",
    name: "Sauces & Emulsions",
    category: "Culinary Technique",
    description: "Stable vinaigrettes, pan sauces, veloutés, reductions, and velvet emulsification.",
    icon: "Sparkles",
    color: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      border: "border-emerald-500/30",
      progress: "bg-emerald-500",
    },
    levels: [
      { level: 1, minXp: 0, title: "Whisk Novice" },
      { level: 2, minXp: 80, title: "Dressing Crafter" },
      { level: 3, minXp: 200, title: "Reductionist" },
      { level: 4, minXp: 450, title: "Sous Saucier" },
      { level: 5, minXp: 800, title: "Grand Saucier" },
    ],
  },
  baking_pastry: {
    key: "baking_pastry",
    name: "Baking & Pastry",
    category: "Baking",
    description: "Dough elasticity, fermentation, oven spring, gluten network, and crumb texture.",
    icon: "Cake",
    color: {
      bg: "bg-pink-500/10",
      text: "text-pink-500",
      border: "border-pink-500/30",
      progress: "bg-pink-500",
    },
    levels: [
      { level: 1, minXp: 0, title: "Dough Kneader" },
      { level: 2, minXp: 80, title: "Crumb Crafter" },
      { level: 3, minXp: 200, title: "Artisan Baker" },
      { level: 4, minXp: 450, title: "Patissier" },
      { level: 5, minXp: 800, title: "Master Boulanger" },
    ],
  },
  flavor_balancing: {
    key: "flavor_balancing",
    name: "Flavor Balancing",
    category: "Taste & Seasoning",
    description: "Harmonizing salt, acid, fat, heat, umami, and sweet to elevate everyday ingredients.",
    icon: "Scale",
    color: {
      bg: "bg-purple-500/10",
      text: "text-purple-500",
      border: "border-purple-500/30",
      progress: "bg-purple-500",
    },
    levels: [
      { level: 1, minXp: 0, title: "Taste Tester" },
      { level: 2, minXp: 80, title: "Palate Explorer" },
      { level: 3, minXp: 200, title: "Seasoning Virtuoso" },
      { level: 4, minXp: 450, title: "Flavor Alchemist" },
      { level: 5, minXp: 800, title: "Sensory Master" },
    ],
  },
};

export function getSkillByKey(key: string): CulinarySkillDef | undefined {
  return CULINARY_SKILLS[key];
}

export function calculateSkillLevel(skillKey: string, xp: number) {
  const skill = CULINARY_SKILLS[skillKey];
  if (!skill) {
    return { level: 1, title: "Explorer", currentLevelMin: 0, nextLevelMin: 100, progressPct: 0 };
  }

  const levels = skill.levels;
  let currentLevel = levels[0];
  let nextLevel = levels[1] || null;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXp) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
      break;
    }
  }

  let progressPct = 100;
  if (nextLevel) {
    const range = nextLevel.minXp - currentLevel.minXp;
    const progress = xp - currentLevel.minXp;
    progressPct = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
  }

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentLevelMin: currentLevel.minXp,
    nextLevelMin: nextLevel ? nextLevel.minXp : currentLevel.minXp,
    progressPct,
    isMaxLevel: !nextLevel,
  };
}

export function calculateChefRank(totalXp: number) {
  if (totalXp >= 2000) return { rank: "Executive Chef", level: 6, icon: "Crown" };
  if (totalXp >= 1200) return { rank: "Chef de Cuisine", level: 5, icon: "Award" };
  if (totalXp >= 600) return { rank: "Sous Chef", level: 4, icon: "ShieldCheck" };
  if (totalXp >= 250) return { rank: "Chef de Partie", level: 3, icon: "Sparkles" };
  if (totalXp >= 100) return { rank: "Commis Chef", level: 2, icon: "ChefHat" };
  return { rank: "Kitchen Apprentice", level: 1, icon: "Utensils" };
}
