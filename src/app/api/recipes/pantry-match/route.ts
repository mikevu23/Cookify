import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ingredients = [] } = body;

    const userPantry = (ingredients as string[])
      .map((i) => i.trim().toLowerCase())
      .filter(Boolean);

    const recipes = await prisma.recipe.findMany({
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true, title: true },
        },
        _count: {
          select: { mods: true, completions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const scored = recipes.map((r) => {
      const parsedIngredients = JSON.parse(r.ingredients || "[]") as Array<
        string | { name: string; amount?: string; unit?: string; isPantryItem?: boolean }
      >;
      const parsedInstructions = JSON.parse(r.instructions || "[]");
      const parsedSkills = JSON.parse(r.skillsAwarded || "[]");

      let matchedCount = 0;
      const matchedList: string[] = [];
      const missingList: string[] = [];

      parsedIngredients.forEach((ing) => {
        const ingName = (typeof ing === "string" ? ing : ing.name).toLowerCase();
        // Check if any user pantry item matches or is contained in ingredient name
        const isMatched = userPantry.some(
          (userItem) => ingName.includes(userItem) || userItem.includes(ingName)
        );

        const displayName = typeof ing === "string" ? ing : `${ing.amount || ""} ${ing.unit || ""} ${ing.name}`.trim();

        if (isMatched) {
          matchedCount++;
          matchedList.push(displayName);
        } else {
          missingList.push(displayName);
        }
      });

      const totalCount = parsedIngredients.length || 1;
      const matchPercentage = Math.round((matchedCount / totalCount) * 100);

      return {
        ...r,
        ingredients: parsedIngredients,
        instructions: parsedInstructions,
        skillsAwarded: parsedSkills,
        matchedCount,
        totalCount,
        matchPercentage,
        matchedList,
        missingList,
        isCookableNow: matchPercentage === 100,
      };
    });

    // Sort by match percentage descending, then total matched count
    scored.sort((a, b) => b.matchPercentage - a.matchPercentage || b.matchedCount - a.matchedCount);

    return NextResponse.json({
      recipes: scored,
      totalRecipes: recipes.length,
      pantryItemCount: userPantry.length,
    });
  } catch (error: unknown) {
    console.error("Pantry match error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to match pantry recipes" },
      { status: 500 }
    );
  }
}
