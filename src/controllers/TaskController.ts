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

    if (!user.partner1Id) {
        res.status(400).send({
            message: "You must be connected to a buddy to get the task list",
        });
        return;
    }

    let query: Object = {
        OR: [
            {
                userId: user.id,
            },
            {
                userId: user.partner1Id,
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
                category: {
                    value: task.category.id,
                    label: task.category.name,
                },
            }))
        );
    } catch (err) {
        res.status(500).send(err);
    }
};

export const getDatesWithTasks = async (
    req: Request<any, any, any, TasksQuery>,
    res: Response
) => {
    const { from, to } = req.query;
    const user = req.user as UserInfo;

    if (!user.partner1Id) {
        res.status(400).send({
            message: "You must be connected to a buddy to get the task list",
        });
        return;
    }
    let query: Object = {};
    if (from && to) {
        try {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            query = {
                date: {
                    gte: fromDate,
                    lte: toDate,
                },
            };
        } catch (e) {}
    } else {
        res.status(400).send({
            message: "Query from and to required",
        });
        return;
    }
    try {
        const allUserDates = await prisma.task.findMany({
            distinct: ["date"],
            where: {
                ...query,
                userId: user.id,
            },
            select: {
                date: true,
            },
        });
        const allBuddyDates = await prisma.task.findMany({
            distinct: ["date"],
            where: {
                ...query,
                userId: user.partner1Id,
            },
            select: {
                date: true,
            },
        });
        res.status(200).send({
            user: allUserDates.map(
                (task) => task.date.toISOString().split("T")[0]
            ),
            buddy: allBuddyDates.map(
                (task) => task.date.toISOString().split("T")[0]
            ),
        });
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
            userId,
        },
    });
    if (!existCheck) {
        res.status(404).send({
            message: "This task was not found",
        });
        return;
    }
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            profile: true,
        },
    });

    if (!user) {
        res.status(400).send({
            message: "Invalid user",
        });
        return;
    }
    // if (existCheck.completionTime) {
    //     res.status(400).send({
    //         message: "This task has already been completed",
    //     });
    //     return;
    // }
    const updatedTask = await prisma.task.update({
        where: {
            id: Number(taskId),
        },
        data: {
            completionTime: new Date(),
            duration,
        },
    });

    const taskExperience = await calculateExperienceForTask(updatedTask, user);
    await updateUserExperience(taskExperience.experience, user);
    res.status(200).send(taskExperience);
};
