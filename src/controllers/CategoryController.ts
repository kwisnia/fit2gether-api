import { Request, Response } from "express";
import { prisma } from "../index";

export const getAllCategories = async (_: Request, res: Response) => {
    try {
        const allCategories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
        });
        res.status(200).send(
            allCategories.map((category) => ({
                value: category.id,
                label: category.name,
            }))
        );
    } catch (err) {
        res.status(500).send(err);
    }
};
