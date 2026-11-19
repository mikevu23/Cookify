import { prisma } from "@/lib/prisma";
import { calculateChefRank, calculateSkillLevel } from "./skills-config";

export interface SkillXpReward {
  skillKey: string;
  skillName: string;
  xp: number;
}

export interface AwardXpResult {
  totalXpGained: number;
  newTotalXp: number;
  oldRank: string;
  newRank: string;
  didRankUp: boolean;
  skillLevelUps: Array<{
    skillKey: string;
    skillName: string;
    oldLevel: number;
    newLevel: number;
    newTitle: string;
  }>;
}

export async function awardRecipeCompletionXp(
  userId: string,
  baseXp: number,
  skillsAwarded: SkillXpReward[]
): Promise<AwardXpResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { skills: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const oldRank = calculateChefRank(user.totalXp).rank;
  let totalBonusSkillXp = 0;
  const skillLevelUps: AwardXpResult["skillLevelUps"] = [];

  for (const reward of skillsAwarded) {
    totalBonusSkillXp += reward.xp;

    const existingSkill = user.skills.find((s) => s.skillKey === reward.skillKey);
    const prevXp = existingSkill ? existingSkill.xp : 0;
    const newSkillXp = prevXp + reward.xp;

    const prevLevelInfo = calculateSkillLevel(reward.skillKey, prevXp);
    const newLevelInfo = calculateSkillLevel(reward.skillKey, newSkillXp);

    if (newLevelInfo.level > prevLevelInfo.level) {
      skillLevelUps.push({
        skillKey: reward.skillKey,
        skillName: reward.skillName,
        oldLevel: prevLevelInfo.level,
        newLevel: newLevelInfo.level,
        newTitle: newLevelInfo.title,
      });
    }

    await prisma.userSkillXP.upsert({
      where: {
        userId_skillKey: {
          userId,
          skillKey: reward.skillKey,
        },
      },
      update: {
        xp: newSkillXp,
        level: newLevelInfo.level,
      },
      create: {
        userId,
        skillKey: reward.skillKey,
        xp: newSkillXp,
        level: newLevelInfo.level,
      },
    });
  }

  const totalGained = baseXp + totalBonusSkillXp;
  const newTotalXp = user.totalXp + totalGained;
  const chefRankInfo = calculateChefRank(newTotalXp);

  await prisma.user.update({
    where: { id: userId },
    data: {
      totalXp: newTotalXp,
      level: chefRankInfo.level,
      title: chefRankInfo.rank,
    },
  });

  return {
    totalXpGained: totalGained,
    newTotalXp,
    oldRank,
    newRank: chefRankInfo.rank,
    didRankUp: chefRankInfo.rank !== oldRank,
    skillLevelUps,
  };
}
