import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const currentUser = await getCurrentUser();

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true, title: true, level: true },
        },
        mods: {
          include: {
            author: {
              select: { id: true, name: true, handle: true, avatar: true, title: true },
            },
            votes: {
              select: { userId: true },
            },
          },
          orderBy: { votesCount: "desc" },
        },
        completions: {
          include: {
            user: {
              select: { id: true, name: true, handle: true, avatar: true, title: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Format mods to include `hasVoted` flag for the active user
    const formattedMods = recipe.mods.map((mod) => ({
      id: mod.id,
      title: mod.title,
      category: mod.category,
      stepNumber: mod.stepNumber,
      instruction: mod.instruction,
      votesCount: mod.votesCount,
      createdAt: mod.createdAt,
      author: mod.author,
      hasVoted: currentUser ? mod.votes.some((v) => v.userId === currentUser.id) : false,
    }));

    const responseData = {
      ...recipe,
      pantryMatched: JSON.parse(recipe.pantryMatched || "[]"),
      ingredients: JSON.parse(recipe.ingredients || "[]"),
      instructions: JSON.parse(recipe.instructions || "[]"),
      skillsAwarded: JSON.parse(recipe.skillsAwarded || "[]"),
      mods: formattedMods,
      currentUserId: currentUser?.id || null,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}
