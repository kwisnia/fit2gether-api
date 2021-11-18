import { Request, Response } from "express";
import { prisma } from "../index";
import { updateUserExperience } from "../services/UserService";
import { TaskType } from "../types/TaskType";
import { UserInfo } from "../types/UserInfo";


export const getAllUserTasks = async (req: Request, res: Response) => {
    const user = req.user as UserInfo;
    try {
        const allUserTasks = await prisma.task.findMany({
            where: {
                OR: [
                    {
                        id: user.id,
                    },
                    {
                        id: user.partner1Id!
                    },
                ]
            },
        });
        res.status(200).send(allUserTasks);
    } catch (err) {
        res.status(500).send(err);
    }
};

export const createNewTask = async (
    req: Request<any, any, TaskType>, res: Response
) => {
    const { name, date, categoryId } = req.body
    const user = req.user as UserInfo; 
    const createTask = await prisma.task.create({
        data: {
          name,
          date,
          categoryId,
          userId: user.id,
          experience: 420,
        },
    })
    res.status(201).send(createTask)
}

export const deleteTask = async (
    req: Request, res: Response
) => {
    const taskId = req.params.id;
    await prisma.task.deleteMany({
        where: {
            id: Number(taskId)
        }
    })
    res.send(200);
}

// in the future validation could be added maybe please
export const modifyTask = async (
    req: Request, res: Response
) => {
    const taskId = req.params.id;
    const { name, date, categoryId } = req.body
    const updateTask = await prisma.task.update({
        where: {
          id: Number(taskId),
        },
        data: {
          name,
          date,
          categoryId
        },
      })
    res.status(200)
}

export const markTaskAsComplete = async (
    req: Request, res: Response
) => {
    const taskId = req.params.id;
    const userId = req.params.userId
    const taskExperience = req.params.experience;
    const completedTask = await prisma.task.update({
        where: {
            id: Number(taskId),
        },
        data: {
            completionTime: new Date()
        }
    });

    await updateUserExperience(Number(taskExperience), Number(userId))
    res.status(200)

    
}