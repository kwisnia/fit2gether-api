import { Task } from ".prisma/client"
import { DateTime } from "luxon"
import { prisma } from "../index"


export const calculateVarietyBonus = async (experience: number, newTask: Task): Promise<number> => {
    const IDLE_TIME: number = 14
    let varietyBonus: number = 1

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
        const lastlyDoneDifference = DateTime.fromJSDate(categoryLastTask[0].completionTime).diffNow('days')
        if (lastlyDoneDifference.get('days') >= IDLE_TIME)
            varietyBonus = (lastlyDoneDifference.get('days') + experience) * 0.25 
    }
    
    return Promise.resolve(varietyBonus)

}

export const calculateExperienceForTask = (newTask: Task) => {
    
}