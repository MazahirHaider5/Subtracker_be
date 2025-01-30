import { Router } from "express";
import { getAllActivities } from "../controllers/activity.controller";

const router = Router();

router.get("/getAllActivities", getAllActivities);

export default router;
