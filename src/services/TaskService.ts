import { Task } from ".prisma/client";
import { Profile, User } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "../index";
import { TaskCompleteDetails } from "../types/TaskCompleteDetails";

const BASE_EXPERIENCE = 420;
export const LEVEL_ONE_EXPERIENCE = 1260;
export const MULTIPLIER = 1.25;
const DAILY_BONUS = 69;

export const calculateNextLevelCap = (experienceLevel: number) => {
    return Math.floor(
        LEVEL_ONE_EXPERIENCE * MULTIPLIER ** (experienceLevel - 1)
    );
};

export const calculateVarietyBonus = async (newTask: Task): Promise<number> => {
    const IDLE_TIME = 14;
    let varietyBonus = 0;

    const categoryLastTask = await prisma.task.findMany({
        where: {
            categoryId: newTask.categoryId,
            NOT: [
                {
                    completionTime: undefined,
                },
            ],
        },
        orderBy: {
            completionTime: "desc",
        },
        take: 1,
    });
    if (categoryLastTask.length) {
        const lastlyDoneDifference = DateTime.fromJSDate(
            categoryLastTask[0].completionTime!
        ).diffNow("days");
        if (lastlyDoneDifference.get("days") >= IDLE_TIME)
            varietyBonus =
                (lastlyDoneDifference.get("days") + BASE_EXPERIENCE) * 0.25;
    }

    return Promise.resolve(varietyBonus);
};

export const calculateExperienceForTask = async (
    newTask: Task,
    user:
        | (User & {
              profile: Profile | null;
          })
        | null
): Promise<TaskCompleteDetails> => {
    const varietyBonus = await calculateVarietyBonus(newTask);
    let dailyBonus = 0;
    let dailyBonusAdded = false;

    const todayTask = await prisma.task.findFirst({
        where: {
            userId: user?.partner1Id!,
            completionTime: {
                not: null,
            },
            date: newTask.completionTime as Date,
        },
    });

    const category = await prisma.category.findFirst({
        where: {
            id: newTask.categoryId,
        },
    });

    if (todayTask) {
        if (user?.profile?.experienceLevel) {
            dailyBonus =
                Math.ceil(user?.profile?.experienceLevel / 10) * DAILY_BONUS;
        } else {
            dailyBonus = DAILY_BONUS;
        }
        dailyBonusAdded = true;
    }

    const experienceForTask =
        BASE_EXPERIENCE +
        newTask.duration! * Number(category!.categoryMultiplier) +
        varietyBonus +
        dailyBonus;

    return Promise.resolve({
        experience: Math.floor(experienceForTask),
        dailyBonus: dailyBonusAdded,
        varietyBonus: varietyBonus !== 0,
    });
};
