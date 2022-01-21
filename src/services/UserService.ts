import { Profile, User } from "@prisma/client";
import { prisma } from "../index";
import { LEVEL_ONE_EXPERIENCE } from "./TaskService";

export const updateUserExperience = async (
    experience: number,
    user: User & {
        profile: Profile | null;
    }
): Promise<void> => {
    await prisma.$executeRaw`update "Profile" set experience = experience + ${experience}
                where id = ${user.id}`;

    if (user?.partner1Id) {
        await prisma.$executeRaw`update "Profile" set experience = experience + ${experience}
                where id = ${user.partner1Id}`;
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
        -2 * LEVEL_ONE_EXPERIENCE * (1 - 1.5 ** experienceLevel) +
        totalExperience;

    const level = Math.floor(Math.log(2521 * currentExp) / Math.log(1.5));

    const remainder =
        currentExp - LEVEL_ONE_EXPERIENCE * ((1 - 1.5 ** level) / -0.5);

    if (experienceLevel !== level) {
        await prisma.$executeRaw`update "Profile" set "experienceLevel" = ${level}, experience = ${remainder} where id = ${userId}`;
        if (partnerId) {
            await prisma.$executeRaw`update "Profile" set "experienceLevel" = ${level}, experience = ${remainder} where id = ${partnerId}`;
        }
    }

    Promise.resolve();
};
