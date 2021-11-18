import { Request, Response } from "express";
import { prisma } from "../index";
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
                        id: user.partner1Id,
                    },
                ]
            },
        });
        res.status(200).send(allUserTasks);
    } catch (err) {
        res.status(500).send(err);
    }
};