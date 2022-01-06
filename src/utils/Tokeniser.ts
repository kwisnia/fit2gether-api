import { JWTPair } from "../types/AuthTypes";
import { UserInfo } from "../types/UserInfo";
import * as jwt from "jsonwebtoken";
import randomString from "randomstring";

export const getTokenPair = (payload: UserInfo): JWTPair => {
    return {
        accessToken: jwt.sign(payload, `${process.env.JWT_PASSWORD!}`, {
            algorithm: "HS256",
            expiresIn: 1000,
        }),
        refreshToken: randomString.generate(128),
    };
};
