import express from "express";
import { getAllCategories } from "../controllers/CategoryController";
import {
    connectToBuddy,
    editUserProfile,
    getPairInfo,
} from "../controllers/ProfileController";
import { logout, refresh } from "../controllers/SessionController";
import {
    createNewTask,
    deleteTask,
    getAllUserTasks,
    getDatesWithTasks,
    markTaskAsComplete,
    modifyTask,
} from "../controllers/TaskController";
import {
    changePassword,
    login,
    registerUser,
} from "../controllers/UserController";

const router = express.Router();

router.get("/getAllCategories", getAllCategories);
router.post("/register", registerUser);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/editProfile", editUserProfile);
router.post("/changePassword", changePassword);
router.post("/connect/:code", connectToBuddy);
router.get("/pairInfo", getPairInfo);
router.get("/tasks", getAllUserTasks);
router.get("/getDaysWithTasks", getDatesWithTasks);
router.post("/task", createNewTask);
router.put("/task/:id", modifyTask);
router.put("/task/:id/complete", markTaskAsComplete);
router.delete("/task/:id", deleteTask);

export default router;
