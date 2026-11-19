import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with demo chefs, recipes, mods, and skill progression...");

  // Clear existing data
  await prisma.recipeModVote.deleteMany();
  await prisma.recipeCompletion.deleteMany();
  await prisma.recipeMod.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.userSkillXP.deleteMany();
  await prisma.user.deleteMany();

  // Create Demo Users
  const alex = await prisma.user.create({
    data: {
      name: "Chef Alex",
      handle: "chef-alex",
      avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80",
      title: "Sous Chef",
      totalXp: 720,
      level: 4,
      isAdmin: true,
      skills: {
        create: [
          { skillKey: "heat_searing", xp: 320, level: 3 },
          { skillKey: "knife_work", xp: 220, level: 3 },
          { skillKey: "sauces_emulsion", xp: 180, level: 2 },
        ],
      },
    },
  });

  const jordan = await prisma.user.create({
    data: {
      name: "Chef Jordan",
      handle: "chef-jordan",
      avatar: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80",
      title: "Chef de Partie",
      totalXp: 380,
      level: 3,
      skills: {
        create: [
          { skillKey: "flavor_balancing", xp: 210, level: 3 },
          { skillKey: "sauces_emulsion", xp: 120, level: 2 },
          { skillKey: "knife_work", xp: 50, level: 1 },
        ],
      },
    },
  });

  const taylor = await prisma.user.create({
    data: {
      name: "Chef Taylor",
      handle: "chef-taylor",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      title: "Kitchen Apprentice",
      totalXp: 95,
      level: 1,
      skills: {
        create: [
          { skillKey: "knife_work", xp: 55, level: 1 },
          { skillKey: "flavor_balancing", xp: 40, level: 1 },
        ],
      },
    },
  });

  // Seed Recipes
  const recipe1 = await prisma.recipe.create({
    data: {
      title: "Crispy Cast-Iron Lemon-Herb Skillet Chicken",
      summary:
        "Golden blistered skin with an emulsified white wine and lemon pan sauce, designed to master sear timing and fond reduction.",
      prepTime: "15 mins",
      cookTime: "22 mins",
      difficulty: "Intermediate",
      servings: 2,
      authorId: alex.id,
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80",
      pantryMatched: JSON.stringify(["chicken thighs", "garlic", "lemon", "rosemary", "butter"]),
      ingredients: JSON.stringify([
        { name: "Bone-in Chicken Thighs", amount: "4", unit: "pieces", isPantryItem: true },
        { name: "Fresh Garlic, minced", amount: "4", unit: "cloves", isPantryItem: true },
        { name: "Fresh Lemon, halved", amount: "1", unit: "whole", isPantryItem: true },
        { name: "Fresh Rosemary or Thyme", amount: "3", unit: "sprigs", isPantryItem: true },
        { name: "Cold Unsalted Butter", amount: "2", unit: "tbsp", isPantryItem: true },
        { name: "Extra Virgin Olive Oil", amount: "1", unit: "tbsp", isPantryItem: false },
        { name: "Flaky Sea Salt & Black Pepper", amount: "to taste", unit: "pinch", isPantryItem: false },
      ]),
      instructions: JSON.stringify([
        {
          stepNumber: 1,
          title: "Surface Moisture Removal",
          instruction:
            "Pat the chicken thighs thoroughly dry with paper towels. Season liberally with kosher salt and pepper on both sides.",
          techniqueTip: "Culinary Tip: Water creates steam; absolute dryness is essential to achieving shattered-glass crisp skin.",
        },
        {
          stepNumber: 2,
          title: "Cold Pan Start Sear",
          instruction:
            "Place chicken skin-side down in a cold cast-iron skillet. Turn heat to medium-low. Let fat render slowly for 12-14 minutes until skin is deeply golden.",
          techniqueTip: "Culinary Tip: Slow rendering melts subcutaneous fat without burning the skin surface.",
        },
        {
          stepNumber: 3,
          title: "Flip & Aromatic Basting",
          instruction:
            "Flip thighs. Toss in crushed garlic cloves and herb sprigs. Baste the hot pan juices over the meat for 5-6 minutes until internal temp reaches 165°F (74°C). Transfer chicken to rest.",
          techniqueTip: "Culinary Tip: Resting allows juices to redistribute instead of leaking out.",
        },
        {
          stepNumber: 4,
          title: "Deglaze & Mount Sauce",
          instruction:
            "Pour off excess grease, leaving 1 tbsp. Squeeze lemon juice directly into the hot pan, scraping up the browned bits (fond). Turn off heat and whisk in cold butter cubes until glossy.",
          techniqueTip: "Culinary Tip: Cold butter whisked into warm acid creates a silky, suspended emulsion.",
        },
      ]),
      skillsAwarded: JSON.stringify([
        { skillKey: "heat_searing", skillName: "Heat Control & Searing", xp: 50 },
        { skillKey: "sauces_emulsion", skillName: "Sauces & Emulsions", xp: 40 },
        { skillKey: "knife_work", skillName: "Knife Work & Prep", xp: 20 },
      ]),
    },
  });

  const recipe2 = await prisma.recipe.create({
    data: {
      title: "Silky Aglio e Olio with Blistered Cherry Tomatoes",
      summary:
        "The quintessential technique dish: marrying garlic-infused oil and starchy cooking water into an impossibly rich coating.",
      prepTime: "10 mins",
      cookTime: "14 mins",
      difficulty: "Beginner",
      servings: 2,
      authorId: jordan.id,
      imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80",
      pantryMatched: JSON.stringify(["spaghetti", "garlic", "olive oil", "red pepper flakes", "parmesan"]),
      ingredients: JSON.stringify([
        { name: "Spaghetti or Linguine", amount: "250", unit: "grams", isPantryItem: true },
        { name: "Garlic, thinly shaved", amount: "6", unit: "cloves", isPantryItem: true },
        { name: "Extra Virgin Olive Oil", amount: "1/3", unit: "cup", isPantryItem: true },
        { name: "Red Pepper Flakes (Chili Flakes)", amount: "1/2", unit: "tsp", isPantryItem: true },
        { name: "Fresh Flat-Leaf Parsley, chopped", amount: "1/4", unit: "cup", isPantryItem: true },
        { name: "Freshly Grated Parmigiano", amount: "1/2", unit: "cup", isPantryItem: false },
        { name: "Pasta Cooking Water", amount: "1/2", unit: "cup", isPantryItem: false },
      ]),
      instructions: JSON.stringify([
        {
          stepNumber: 1,
          title: "Boil Pasta in Salted Water",
          instruction:
            "Bring water to a rolling boil with generous salt. Drop pasta and cook until 2 minutes shy of al dente.",
          techniqueTip: "Culinary Tip: The pasta finishes cooking inside the sauce to absorb the garlic flavor directly.",
        },
        {
          stepNumber: 2,
          title: "Gentle Garlic Infusion",
          instruction:
            "In a cold wide skillet, combine olive oil and sliced garlic. Warm over gentle low heat. Cook until edges turn pale golden blonde—never brown.",
          techniqueTip: "Culinary Tip: Burnt garlic turns bitter instantly. Watch the pan and pull off heat the moment aroma blooms.",
        },
        {
          stepNumber: 3,
          title: "The Emulsion Toss",
          instruction:
            "Add chili flakes. Ladle 1/2 cup of starchy boiling pasta water into the oil. Vigorously shake and stir the skillet until the water and oil unite into an opaque, creamy sheen.",
          techniqueTip: "Culinary Tip: Starch in the pasta water acts as a surfactant, locking oil and water together.",
        },
        {
          stepNumber: 4,
          title: "Mantecatura (Finishing)",
          instruction:
            "Transfer pasta directly into the sauce. Toss vigorously over heat for 90 seconds. Turn off heat, fold in fresh parsley and cheese, and serve immediately.",
          techniqueTip: "Culinary Tip: Cheese must be folded off-heat to avoid stringy clump formation.",
        },
      ]),
      skillsAwarded: JSON.stringify([
        { skillKey: "sauces_emulsion", skillName: "Sauces & Emulsions", xp: 45 },
        { skillKey: "flavor_balancing", skillName: "Flavor Balancing", xp: 35 },
        { skillKey: "knife_work", skillName: "Knife Work & Prep", xp: 20 },
      ]),
    },
  });

  // Seed Community Mods for Recipe 1
  const mod1 = await prisma.recipeMod.create({
    data: {
      recipeId: recipe1.id,
      authorId: jordan.id,
      title: "Cornstarch Dusting for Shatter-Crisp Skin",
      category: "Technique",
      stepNumber: 1,
      instruction:
        "Lightly dust 1/2 teaspoon of cornstarch onto the chicken skin 10 minutes prior to searing. The starch absorbs any lingering microscopic droplets of water, resulting in an ultra-crispy crackling skin.",
      votesCount: 8,
    },
  });

  const mod2 = await prisma.recipeMod.create({
    data: {
      recipeId: recipe1.id,
      authorId: taylor.id,
      title: "Add Crushed Coriander & Dijon to Pan Sauce",
      category: "Flavor Boost",
      stepNumber: 4,
      instruction:
        "Whisk in 1 teaspoon of coarse Dijon mustard and a pinch of crushed coriander seeds alongside the butter. The acidity cuts through the chicken fat brilliantly.",
      votesCount: 5,
    },
  });

  // Seed Mod Votes
  await prisma.recipeModVote.create({
    data: { modId: mod1.id, userId: alex.id },
  });
  await prisma.recipeModVote.create({
    data: { modId: mod1.id, userId: taylor.id },
  });
  await prisma.recipeModVote.create({
    data: { modId: mod2.id, userId: alex.id },
  });

  // Seed Completions & Photos
  await prisma.recipeCompletion.create({
    data: {
      recipeId: recipe1.id,
      userId: jordan.id,
      rating: 5,
      notes: "The skin came out so crispy! Tried the cornstarch mod and it made a noticeable difference. Great heat control practice.",
      photoUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80",
      xpEarned: 110,
    },
  });

  await prisma.recipeCompletion.create({
    data: {
      recipeId: recipe2.id,
      userId: taylor.id,
      rating: 5,
      notes: "First time successfully creating a real pasta emulsion without cream! My whisking speed leveled up.",
      photoUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&auto=format&fit=crop&q=80",
      xpEarned: 100,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
