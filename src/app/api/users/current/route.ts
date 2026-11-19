import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, USER_COOKIE_NAME } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return NextResponse.json({ error: "Failed to fetch current user" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { skills: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, user });
    response.cookies.set(USER_COOKIE_NAME, user.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Failed to set current user:", error);
    return NextResponse.json({ error: "Failed to update current user" }, { status: 500 });
  }
}
