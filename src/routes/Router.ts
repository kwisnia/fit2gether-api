import express from "express";
import { getAllCategories } from "../controllers/CategoryController";
import {
    createNewTask,
    getAllUserTasks,
    markTaskAsComplete,
    modifyTask,
} from "../controllers/TaskController";
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
router.get("/pairInfo", getPairInfo);
router.get("/tasks", getAllUserTasks);
router.post("/task", createNewTask);
router.put("/task/:id", modifyTask);
router.put("/task/:id/complete", markTaskAsComplete);
export default router;
