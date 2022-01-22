import type { Request, Response } from "express";
import { prisma } from "..";
import { UserUpdateForm } from "../types/UserUpdateForm";
import { UserInfo } from "../types/UserInfo";
import { getTokenPair } from "../utils/Tokeniser";
import { calculateNextLevelCap } from "../services/TaskService";

export const editUserProfile = async (
    req: Request<any, any, UserUpdateForm>,
    res: Response
) => {
    const { name, email, avatarId } = req.body;
    const user = req.user as UserInfo;
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            name,
            email,
        },
    });
    await prisma.profile.update({
        where: {
            userId: user.id,
        },
        data: {
            avatarId,
        },
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
    const userInfo: UserInfo = {
        email: user.email,
        id: user.id,
        partner1Id: profile.userId,
    };
    const tokenPair = getTokenPair(userInfo);
    res.status(200).send({
        accessToken: tokenPair.accessToken,
        buddyId: profile.userId,
        buddyProfilePicture: profile.avatarId,
    });
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
    if (!user.partner1Id) {
        res.status(400).send({
            message: "You do not have a buddy",
        });
    }
    const lastCompletedTasks = await prisma.task.findMany({
        where: {
            OR: [
                {
                    userId: user.id,
                },
                {
                    userId: user.partner1Id!,
                },
            ],
            completionTime: {
                not: null,
            },
        },
        orderBy: [
            {
                completionTime: "desc",
            },
        ],
        select: {
            name: true,
            userId: true,
            completionTime: true,
        },
        take: 3,
    });
    const response = {
        name: user.name,
        buddyName: user.partner1?.name,
        experienceLevel: user.profile?.experienceLevel,
        experience: user.profile?.experience,
        experienceRequired: calculateNextLevelCap(
            user.profile!.experienceLevel
        ),
        recentActivities: lastCompletedTasks,
    };
    res.status(200).send(response);
};
