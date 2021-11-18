import express from "express";
import { getAllCategories } from "../controllers/CategoryController";
import {
    changePassword,
    connectToBuddy,
    editUserProfile,
    getPairInfo,
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
router.post("/connect/:code", connectToBuddy);
router.post("/pairInfo", getPairInfo);
export default router;
