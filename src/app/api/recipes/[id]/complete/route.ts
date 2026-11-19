import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardRecipeCompletionXp, SkillXpReward } from "@/lib/skills/award-xp";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No active user profile" }, { status: 401 });
    }

    const { id: recipeId } = params;
    const body = await req.json();
    const { photoUrl, notes, rating = 5 } = body;

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const skillsAwarded: SkillXpReward[] = JSON.parse(recipe.skillsAwarded || "[]");
    const baseXp = 50;

    // Award culinary XP and check for rank & skill level ups
    const xpResult = await awardRecipeCompletionXp(user.id, baseXp, skillsAwarded);

    // Record the completion
    const completion = await prisma.recipeCompletion.create({
      data: {
        recipeId,
        userId: user.id,
        photoUrl:
          photoUrl ||
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
        notes: notes || "Delicious dish cooked to perfection!",
        rating: Math.max(1, Math.min(5, Number(rating) || 5)),
        xpEarned: xpResult.totalXpGained,
      },
      include: {
        user: {
          select: { id: true, name: true, handle: true, avatar: true, title: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      completion,
      xpResult,
    });
  } catch (error: unknown) {
    console.error("Error completing recipe:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to record cooking completion" },
      { status: 500 }
    );
  }
}
