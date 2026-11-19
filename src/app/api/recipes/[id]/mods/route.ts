import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

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
    const { title, category, stepNumber, instruction } = body;

    if (!title || !instruction) {
      return NextResponse.json(
        { error: "Title and instruction are required" },
        { status: 400 }
      );
    }

    // Create the mod and automatically grant the author's upvote
    const newMod = await prisma.recipeMod.create({
      data: {
        recipeId,
        authorId: user.id,
        title,
        category: category || "Technique",
        stepNumber: stepNumber ? Number(stepNumber) : null,
        instruction,
        votesCount: 1,
        votes: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        author: {
          select: { id: true, name: true, handle: true, avatar: true, title: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      mod: {
        ...newMod,
        hasVoted: true,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating recipe mod:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to submit modification" },
      { status: 500 }
    );
  }
}
