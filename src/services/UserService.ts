import { Profile, User } from "@prisma/client";
import { prisma } from "../index";
import { LEVEL_ONE_EXPERIENCE, MULTIPLIER } from "./TaskService";

export const updateUserExperience = async (
    experience: number,
    user: User & {
        profile: Profile | null;
    }
): Promise<void> => {
    await prisma.$executeRaw`update "Profile" set experience = experience + ${experience}
                where "userId" = ${user.id}`;

    if (user?.partner1Id) {
        await prisma.$executeRaw`update "Profile" set experience = experience + ${experience}
                where "userId" = ${user.partner1Id}`;
    }
    await checkLevel(
        (user.profile?.experience || 0) + experience,
        user.id,
        user.partner1Id,
        user.profile?.experienceLevel || 1
    );

    return Promise.resolve();
};

export const checkLevel = async (
    totalExperience: number,
    userId: number,
    partnerId: number | null,
    experienceLevel: number
): Promise<void> => {
    const currentExp =
        (LEVEL_ONE_EXPERIENCE * (1 - MULTIPLIER ** (experienceLevel - 1))) /
            (1 - MULTIPLIER) +
        totalExperience;

    const level =
        Math.floor(
            Math.log(
                -(currentExp / LEVEL_ONE_EXPERIENCE) * (1 - MULTIPLIER) + 1
            ) / Math.log(MULTIPLIER)
        ) + 1;

    const remainder = Math.floor(
        currentExp -
            LEVEL_ONE_EXPERIENCE *
                ((1 - MULTIPLIER ** (level - 1)) / (1 - MULTIPLIER))
    );

    if (experienceLevel !== level) {
        await prisma.$executeRaw`update "Profile" set "experienceLevel" = ${level}, experience = ${remainder} where "userId" = ${userId}`;
        if (partnerId) {
            await prisma.$executeRaw`update "Profile" set "experienceLevel" = ${level}, experience = ${remainder} where "userId" = ${partnerId}`;
        }
    }

    Promise.resolve();
};
