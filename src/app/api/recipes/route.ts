import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
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
    });

    const parsed = recipes.map((r) => ({
      ...r,
      pantryMatched: JSON.parse(r.pantryMatched || "[]"),
      ingredients: JSON.parse(r.ingredients || "[]"),
      instructions: JSON.parse(r.instructions || "[]"),
      skillsAwarded: JSON.parse(r.skillsAwarded || "[]"),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No active user profile" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      summary,
      prepTime,
      cookTime,
      difficulty,
      servings = 2,
      pantryMatched = [],
      ingredients = [],
      instructions = [],
      skillsAwarded = [],
      imageUrl,
      suggestedMods = [],
    } = body;

    if (!title || !ingredients.length || !instructions.length) {
      return NextResponse.json(
        { error: "Title, ingredients, and instructions are required" },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        summary: summary || `A flavorful dish crafted with ${pantryMatched.join(", ")}`,
        prepTime: prepTime || "15 mins",
        cookTime: cookTime || "20 mins",
        difficulty: difficulty || "Intermediate",
        servings: Number(servings) || 2,
        imageUrl:
          imageUrl ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
        pantryMatched: JSON.stringify(pantryMatched),
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(instructions),
        skillsAwarded: JSON.stringify(skillsAwarded),
        authorId: user.id,
      },
    });

    // Optionally save initial suggested mods if provided
    if (Array.isArray(suggestedMods) && suggestedMods.length > 0) {
      for (const mod of suggestedMods) {
        if (!mod.title || !mod.instruction) continue;
        await prisma.recipeMod.create({
          data: {
            recipeId: recipe.id,
            authorId: user.id,
            title: mod.title,
            category: mod.category || "Technique",
            stepNumber: mod.stepNumber ? Number(mod.stepNumber) : null,
            instruction: mod.instruction,
            votesCount: 1,
            votes: {
              create: {
                userId: user.id,
              },
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true, recipeId: recipe.id });
  } catch (error: unknown) {
    console.error("Failed to create recipe:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to create recipe" },
      { status: 500 }
    );
  }
}
