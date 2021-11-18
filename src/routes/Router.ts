import express from "express";
import { getAllCategories } from "../controllers/CategoryController";
import {
    changePassword,
    editUserProfile,
    login,
    logout,
    refresh,
    registerUser,
} from "../controllers/UserController";

const router = express.Router();

router.get("/categories", getAllCategories);
router.post("/register", registerUser);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/editProfile", editUserProfile);
router.post("/changePassword", changePassword);
export default router;
