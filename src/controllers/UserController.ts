import { hash, compare } from "bcrypt";
import { Request, Response } from "express";
import { prisma } from "..";
import { LoginForm } from "../types/LoginForm";
import { RegisterForm } from "../types/RegisterForm";
import * as jwt from 'jsonwebtoken'
import {getTokenPair} from "../utils/Tokeniser";
import {getBuddyStatus} from "../services/BuddyService";
export { Request, Response } from "express";

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
    jwt.sign({newUser}, 'tu-bedzie-sekret', { algorithm: 'HS256', expiresIn: 1000 });
    res.status(201).send(newUser);
};

export const login = async (
    req: Request<any, any, LoginForm>,
    res: Response
) => {
    const { email, password } = req.body;
    const existingUserCheck = await prisma.user.findFirst({
        where: {
            email,
        }, include: {
            profile: true
        }
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
    const userInfo = {
        id: existingUserCheck.id,
        email: existingUserCheck.email,
    }
    const tokenPair = getTokenPair(userInfo);
    /*await prisma.session.create({
        data: {
            refreshToken: tokenPair.refreshToken,
            user: {
                connect: { id: existingUserCheck.id }
            }
        }

    });*/
    const buddyStatus = await getBuddyStatus(existingUserCheck.id, existingUserCheck.partner1Id);
    res.status(200).send({
        id: existingUserCheck.id,
        profilePicture: existingUserCheck.profile?.avatarUrl,
        token: tokenPair
    });
};

const editUserProfile = (req: Request<any, any, RegisterForm>,
                         res: Response) => {
}
