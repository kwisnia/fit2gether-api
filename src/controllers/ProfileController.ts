import type { Request, Response } from "express";
import { prisma } from "..";
import { UserUpdateForm } from "../types/UserUpdateForm";
import { UserInfo } from "../types/UserInfo";

export const editUserProfile = async (
    req: Request<any, any, UserUpdateForm>,
    res: Response
) => {
    const user = req.user as UserInfo;
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: req.body,
    });
    res.sendStatus(200);
};

export const connectToBuddy = async (req: Request, res: Response) => {
    const inviteCode = req.params.code;
    const user = req.user as UserInfo;
    const profile = await prisma.profile.findUnique({
        where: {
            inviteCode,
        },
    });
    if (!profile || profile.id === user.id) {
        res.status(404).send({
            message: "Invite code is not valid",
        });
        return;
    }
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            partner1Id: profile.userId,
        },
    });
    await prisma.user.update({
        where: {
            id: profile.userId,
        },
        data: {
            partner1Id: user.id,
        },
    });
    res.sendStatus(200);
};

export const getPairInfo = async (req: Request, res: Response) => {
    const userToken = req.user as UserInfo;
    const user = await prisma.user.findUnique({
        where: {
            id: userToken.id,
        },
        include: {
            profile: true,
            partner1: {
                include: {
                    profile: true,
                },
            },
        },
    });
    if (!user) {
        res.sendStatus(404);
        return;
    }
    const response = {
        name: user.name,
        experienceLevel: user.profile?.experienceLevel,
        experience: user.profile?.experience,
        strength: user.profile?.strength,
        dexterity: user.profile?.dexterity,
        constitution: user.profile?.constitution,
        buddyStats: {
            strength: user.partner1?.profile?.strength,
            dexterity: user.partner1?.profile?.dexterity,
            constitution: user.partner1?.profile?.constitution,
        },
    };
    res.status(200).send(response);
};
