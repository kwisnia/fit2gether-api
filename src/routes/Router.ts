import express from "express";
import { getAllCategories } from "../controllers/CategoryController";
import { login, registerUser } from "../controllers/UserController";

const router = express.Router();

router.get("/categories", getAllCategories);
router.post("/register", registerUser);
router.post("/login", login);

export default router;
