import { hash, compare } from "bcrypt";
import type { Request, Response } from "express";
import { prisma } from "..";
import type { LoginForm } from "../types/LoginForm";
import type { RegisterForm } from "../types/RegisterForm";
import { getTokenPair } from "../utils/Tokeniser";
import { getBuddyStatus } from "../services/BuddyService";
import type { UserInfo } from "../types/UserInfo";
import { UserUpdateForm } from "../types/UserUpdateForm";
import { PasswordResetForm } from "../types/PasswordResetForm";
import { generate } from "randomstring";
import { v4 as uuidv4 } from "uuid";

export const registerUser = async (
    req: Request<any, any, RegisterForm>,
    res: Response
) => {
    const { email, username, password, password2 } = req.body;
    if (password !== password2) {
        res.status(400).send("Passwords must be the same");
    }
    const existingUserCheck = await prisma.user.findFirst({
        where: {
            email,
        },
    });
    if (existingUserCheck) {
        res.status(400).send({
            message: "User with this email already exists",
        });
        return;
    }
    const passwordHash = await hash(password, 10);
    const newUser = await prisma.user.create({
        data: {
            email,
            name: username,
            password: passwordHash,
            profile: {
                create: {
                    strength: 5,
                    constitution: 5,
                    dexterity: 5,
                    experience: 0,
                    experienceLevel: 1,
                    inviteCode: uuidv4(),
                },
            },
        },
    });
    res.status(201).send({
        token: getTokenPair({
            email: newUser.email,
            id: newUser.id,
            partner1Id: newUser.partner1Id,
        }),
    });
};

export const login = async (
    req: Request<any, any, LoginForm>,
    res: Response
) => {
    const { email, password } = req.body;
    const existingUserCheck = await prisma.user.findFirst({
        where: {
            email,
        },
        include: {
            profile: true,
        },
    });
    if (!existingUserCheck) {
        res.status(404).send({
            message: "User with this email does not exist",
        });
        return;
    }
    const passwordCheck = await compare(password, existingUserCheck.password);
    if (!passwordCheck) {
        res.status(400).send({
            message: "Credentials are not correct",
        });
        return;
    }
    const userInfo: UserInfo = {
        id: existingUserCheck.id,
        partner1Id: existingUserCheck.partner1Id,
        email: existingUserCheck.email,
    };
    const tokenPair = getTokenPair(userInfo);
    await prisma.session.create({
        data: {
            refreshToken: tokenPair.refreshToken,
            user: {
                connect: { id: existingUserCheck.id },
            },
        },
    });
    let buddyProfilePicture = null;
    if (existingUserCheck.partner1Id) {
        const buddy = await prisma.profile.findFirst({
            where: {
                userId: existingUserCheck.partner1Id,
            },
        });
        buddyProfilePicture = buddy?.avatarUrl;
    }
    const buddyStatus = await getBuddyStatus(
        existingUserCheck.id,
        existingUserCheck.partner1Id
    );
    res.status(200).send({
        id: existingUserCheck.id,
        profilePicture: existingUserCheck.profile?.avatarUrl,
        buddyProfilePicture,
        buddyStatus,
        token: tokenPair,
    });
};

export const logout = async (req: Request, res: Response) => {
    const user = req.user as UserInfo;
    console.log("lol");
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
            refreshToken: generate(128),
        },
    });
    res.status(200).send(newTokenPair);
};

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

export const changePassword = async (
    req: Request<any, any, PasswordResetForm>,
    res: Response
) => {
    const user = req.user as UserInfo;
    const { newPassword, newPassword2, oldPassword } = req.body;
    if (newPassword !== newPassword2) {
        res.status(400).send("Passwords must be the same");
        return;
    }
    const userToModify = await prisma.user.findUnique({
        where: {
            id: user.id,
        },
    });
    if (!userToModify) {
        res.status(400).send({
            message: "This user does not exists",
        });
        return;
    }
    const passwordCheck = await compare(oldPassword, userToModify.password);
    if (!passwordCheck) {
        res.status(400).send({
            message: "Old password is incorrect",
        });
        return;
    }
    const newPasswordHash = await hash(newPassword, 10);
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            password: newPasswordHash,
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
    if (!profile) {
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
