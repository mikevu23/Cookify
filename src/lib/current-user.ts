import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const USER_COOKIE_NAME = "cookify_active_user";

export async function getCurrentUser() {
  const cookieStore = cookies();
  const userId = cookieStore.get(USER_COOKIE_NAME)?.value;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
      },
    });
    if (user) return user;
  }

  // Fallback to first user in database
  const firstUser = await prisma.user.findFirst({
    include: {
      skills: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return firstUser;
}
