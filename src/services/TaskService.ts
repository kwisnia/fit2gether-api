import { Task } from ".prisma/client"
import { DateTime } from "luxon"
import { prisma } from "../index"

const BASE_EXPERIENCE = 420
const LEVEL_ONE_EXPERIENCE = 1260
const DAILY_BONUS = 69

export const calculateNextLevelCap = (experienceLevel: number) => {
    return LEVEL_ONE_EXPERIENCE * (1.5 ** experienceLevel)
}

export const calculateVarietyBonus = async (newTask: Task): Promise<number> => {
    const IDLE_TIME = 14
    let varietyBonus = 1

    const categoryLastTask = await prisma.task.findMany({
        where: {
            categoryId: newTask.categoryId,
            NOT: [{
                completionTime: undefined,
            }]
        },
        orderBy: {
            completionTime: 'desc'
        },
        take: 1
    }
    )
    if (categoryLastTask.length) {
        const lastlyDoneDifference = DateTime.fromJSDate(categoryLastTask[0].completionTime!).diffNow('days')
        if (lastlyDoneDifference.get('days') >= IDLE_TIME)
            varietyBonus = (lastlyDoneDifference.get('days') + BASE_EXPERIENCE) * 0.25 
    }
    
    return Promise.resolve(varietyBonus)

}

export const calculateExperienceForTask = async (newTask: Task): Promise<number> => {
    const varietyBonus = await calculateVarietyBonus(newTask);
    let dailyBonus = 0
    

    const user = await prisma.user.findUnique({
        where: {
            id: newTask.userId,
        },
        include: {
            profile: true,
        }
    })

    const todayTask = await prisma.task.findFirst({
        where: {
            userId: user?.partner1Id!
        }
    })

    if(todayTask) {
        dailyBonus = DAILY_BONUS * (1.5 ** (user?.profile?.experienceLevel || 1))
    }

    let experienceForTask = BASE_EXPERIENCE + newTask.duration + varietyBonus + dailyBonus


    return Promise.resolve(experienceForTask)
}