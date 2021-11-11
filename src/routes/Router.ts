import express from "express";
import { getAllCategories } from "../controllers/CategoryController";

const router = express.Router();

router.get("/categories", getAllCategories);

export default router;
