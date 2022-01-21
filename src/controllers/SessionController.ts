import { Request, Response } from "express";
import { prisma } from "../index";
import { generate } from "randomstring";
import { getTokenPair } from "../utils/Tokeniser";
import { UserInfo } from "../types/UserInfo";

export const logout = async (req: Request, res: Response) => {
    const user = req.user as UserInfo;
    await prisma.session.deleteMany({
        where: {
            userId: user.id,
        },
    });
    res.sendStatus(200);
};

export const refresh = async (
    req: Request<any, any, { refresh: string }>,
    res: Response
) => {
    const user = req.user as UserInfo;
    const session = await prisma.session.findFirst({
        where: {
            refreshToken: req.body.refresh,
            userId: user.id,
        },
    });
    if (!session) {
        res.status(400).send({
            message: "The token is invalid or session has expired",
        });
        return;
    }
    const newTokenPair = getTokenPair({
        id: user.id,
        email: user.email,
        partner1Id: user.partner1Id,
    });
    await prisma.session.update({
        where: {
            refreshToken: session.refreshToken,
        },
        data: {
            refreshToken: newTokenPair.refreshToken,
        },
    });
    res.status(200).send(newTokenPair);
};
