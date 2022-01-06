import { Profile, User } from "@prisma/client";
import { prisma } from "../index";
import { calculateNextLevelCap } from "./TaskService";

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
        experience,
        user.id,
        user.partner1Id,
        user.profile?.experienceLevel || 1
    );

    return Promise.resolve();
};

export const checkLevel = async (
    experience: number,
    userId: number,
    partnerId: number | null,
    experienceLevel: number
): Promise<void> => {
    const experienceCap = calculateNextLevelCap(experienceLevel);

    if (experience > experienceCap) {
        await prisma.$executeRaw`update "Profile" set experienceLevel = experienceLevel + 1
                where id = ${userId} ${
            partnerId ? "and id = " + "partnerId" : ""
        }`;
    }

    Promise.resolve();
};
