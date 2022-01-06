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
    const categoryValidation = await prisma.category.findFirst({
        where: {
            id: categoryId,
        },
    });
    const userValidation = await prisma.user.findFirst({
        where: {
            id: user.id,
        },
    });
    if (!new Date(date)) {
        res.status(400).send({
            message: "Invalid date provided",
        });
        return;
    }
    if (categoryValidation && userValidation) {
        const createTask = await prisma.task.create({
            data: {
                name,
                date: new Date(date),
                categoryId,
                userId: user.id,
            },
        });
        res.status(201).send(createTask);
    } else {
        res.status(400).send({
            message: "Invalid user or category provided",
        });
    }
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

export const modifyTask = async (req: Request, res: Response) => {
    const taskId = req.params.id;
    const { name, date, categoryId } = req.body;
    const categoryValidation = await prisma.category.findFirst({
        where: {
            id: categoryId,
        },
    });
    if (!categoryValidation) {
        res.status(400).send({
            message: "Invalid category provided",
        });
        return;
    }
    if (!new Date(date)) {
        res.status(400).send({
            message: "Invalid date provided",
        });
        return;
    }
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
    const existCheck = await prisma.task.findFirst({
        where: {
            id: Number(taskId),
        },
    });
    if (!existCheck) {
        res.status(404).send({
            message: "This task has not been found",
        });
        return;
    }
    if (existCheck.completionTime) {
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
