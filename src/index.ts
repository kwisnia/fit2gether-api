import { PrismaClient } from ".prisma/client";
import cors from "cors";
import express, { json, NextFunction, Request, Response } from "express";
import router from "./routes/Router";
import jwt from "express-jwt";
import * as dotenv from "dotenv";

export const prisma = new PrismaClient();

const main = () => {
    dotenv.config();
    const app = express();
    app.use(cors());
    app.use(
        jwt({
            secret: `${process.env.JTW_PASSWORD!}`,
            algorithms: ["HS256"],
        }).unless({ path: ["/login", "/register"] })
    );
    app.use(json());
    app.use("/", router);
    app.use((err: Error, req: Request, res: Response, _: NextFunction) => {
        if (err.name === "UnauthorizedError") {
            res.status(401).send({
                message: "Token is missing or invalid",
            });
        }
    });
    app.listen(8080, () => {
        console.log(`Server is listening on port 8080`);
    });
};

main();
