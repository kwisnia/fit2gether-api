import { hash, compare } from "bcrypt";
import type { Request, Response } from "express";
import { prisma } from "..";
import type { LoginForm } from "../types/LoginForm";
import type { RegisterForm } from "../types/RegisterForm";
import { getTokenPair } from "../utils/Tokeniser";
import { getBuddyStatus } from "../services/BuddyService";
import type { UserInfo } from "../types/UserInfo";
import { UserUpdateForm } from "../types/UserUpdateForm";

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
    const buddyStatus = await getBuddyStatus(
        existingUserCheck.id,
        existingUserCheck.partner1Id
    );
    res.status(200).send({
        id: existingUserCheck.id,
        profilePicture: existingUserCheck.profile?.avatarUrl,
        buddyStatus,
        token: tokenPair,
    });
};

export const logout = async (req: Request, res: Response) => {
    const user = req.user as UserInfo;
    await prisma.session.deleteMany({
        where: {
            userId: user.id,
        },
    });
    res.send(200);
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
    await prisma.session.update({
        where: {
            refreshToken: session.refreshToken,
        },
        data: {
            refreshToken: Randomstring.generate(128),
        },
    });
};

const editUserProfile = async (
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
    res.status(200);
};

 