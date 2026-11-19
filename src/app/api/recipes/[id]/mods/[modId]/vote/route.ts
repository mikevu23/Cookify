import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; modId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No active user profile" }, { status: 401 });
    }

    const { modId } = params;

    const existingVote = await prisma.recipeModVote.findUnique({
      where: {
        modId_userId: {
          modId,
          userId: user.id,
        },
      },
    });

    if (existingVote) {
      // Remove vote (toggle off)
      await prisma.$transaction([
        prisma.recipeModVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.recipeMod.update({
          where: { id: modId },
          data: { votesCount: { decrement: 1 } },
        }),
      ]);

      const updated = await prisma.recipeMod.findUnique({
        where: { id: modId },
        select: { votesCount: true },
      });

      return NextResponse.json({
        hasVoted: false,
        votesCount: updated?.votesCount ?? 0,
      });
    } else {
      // Add vote (toggle on)
      await prisma.$transaction([
        prisma.recipeModVote.create({
          data: {
            modId,
            userId: user.id,
          },
        }),
        prisma.recipeMod.update({
          where: { id: modId },
          data: { votesCount: { increment: 1 } },
        }),
      ]);

      const updated = await prisma.recipeMod.findUnique({
        where: { id: modId },
        select: { votesCount: true },
      });

      return NextResponse.json({
        hasVoted: true,
        votesCount: updated?.votesCount ?? 1,
      });
    }
  } catch (error: unknown) {
    console.error("Error toggling vote:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to toggle vote" },
      { status: 500 }
    );
  }
}
