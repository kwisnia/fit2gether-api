import { prisma } from "../index";

export const updateUserExperience = async (
    experience: number,
    userId: number
): Promise<void> => {
    console.log(experience);
    console.log(userId);
    await prisma.$executeRaw`update "Profile" set experience = experience + ${experience}
                where id = ${userId}`;

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
        },
    });

    if (user?.partner1Id) {
        await prisma.$executeRaw`update "Profile" set experience = experience + ${experience}
                where id = ${user.partner1Id}`;
    }

    return Promise.resolve();
};

export const checkLevel = async (
    userId: number,
    experience: number
): Promise<void> => {
    const experienceCap = 100000; // placeholder

    if (experience > experienceCap) {
        await prisma.$executeRaw`update "Profile" set experienceLevel = experienceLevel + 1
                where id = ${userId}`;
    }

    Promise.resolve();
};
