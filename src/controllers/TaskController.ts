import { Request, Response } from "express";
import { prisma } from "../index";
import { calculateExperienceForTask } from "../services/TaskService";
import { updateUserExperience } from "../services/UserService";
import { TasksQuery } from "../types/TasksQuery";
import { TaskType } from "../types/TaskType";
import { UserInfo } from "../types/UserInfo";

export const getAllUserTasks = async (
    req: Request<any, any, any, TasksQuery>,
    res: Response
) => {
    const { from, to, status } = req.query;
    const user = req.user as UserInfo;

    let query: Object = {
        OR: [
            {
                userId: user.id,
            },
            {
                userId: user.partner1Id!,
            },
        ],
    };
    if (from && to) {
        try {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            query = {
                ...query,
                date: {
                    gte: fromDate,
                    lte: toDate,
                },
            };
        } catch (e) {}
    }
    if (status) {
        switch (status) {
            case "completed":
                query = {
                    ...query,
                    completionTime: {
                        not: null,
                    },
                };
                break;
            case "todo":
                query = {
                    ...query,
                    completionTime: null,
                };
        }
    }
    try {
        const allUserTasks = await prisma.task.findMany({
            where: query,
            select: {
                id: true,
                name: true,
                userId: true,
                date: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.status(200).send(
            allUserTasks.map((task) => ({
                ...task,
                date: task.date.toISOString().split("T")[0],
            }))
        );
    } catch (err) {
        res.status(500).send(err);
    }
};

export const createNewTask = async (
    req: Request<any, any, TaskType>,
    res: Response
) => {
    const { name, date, categoryId } = req.body;
    const user = req.user as UserInfo;
    const createTask = await prisma.task.create({
        data: {
            name,
            date: new Date(date),
            categoryId,
            userId: user.id,
        },
    });
    res.status(201).send(createTask);
};

export const deleteTask = async (req: Request, res: Response) => {
    const taskId = req.params.id;
    await prisma.task.deleteMany({
        where: {
            id: Number(taskId),
        },
    });
    res.send(200);
};

// in the future validation could be added maybe please
export const modifyTask = async (req: Request, res: Response) => {
    const taskId = req.params.id;
    const { name, date, categoryId } = req.body;
    const updatedTask = await prisma.task.update({
        where: {
            id: Number(taskId),
        },
        data: {
            name,
            date,
            categoryId,
        },
    });
    res.status(200).send(updatedTask);
};

export const markTaskAsComplete = async (
    req: Request<any, any, { duration: number }>,
    res: Response
) => {
    const taskId = req.params.id;
    const userId = (req.user as UserInfo).id;
    const { duration } = req.body;
    const checkIfCompleted = await prisma.task.findFirst({
        where: {
            id: Number(taskId),
        },
    });
    if (checkIfCompleted) {
        res.status(400).send({
            message: "This task has already been completed",
        });
        return;
    }
    const updatedTask = await prisma.task.update({
        where: {
            id: Number(taskId),
        },
        data: {
            completionTime: new Date(),
            duration,
        },
    });

    const taskExperience = await calculateExperienceForTask(updatedTask);
    await updateUserExperience(taskExperience.experience, Number(userId));
    res.status(200).send(taskExperience);
};
