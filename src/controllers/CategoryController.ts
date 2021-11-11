import { Request, Response } from "express";
import { prisma } from "../index";

export const getAllCategories = async (_: Request, res: Response) => {
    try {
        const allCategories = await prisma.category.findMany();
        res.status(200).send(allCategories);
    } catch (err) {
        res.status(500).send(err);
    }
};
