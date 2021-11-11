import { PrismaClient } from ".prisma/client";
import cors from "cors";
import express, { json } from "express";
import router from "./routes/Router";

export const prisma = new PrismaClient();

const main = () => {
    const app = express();
    app.use(cors());
    app.use(json());
    app.use("/", router);
    app.listen(8080, () => {
        console.log(`Server is listening on port 8080`);
    });
};

main();
