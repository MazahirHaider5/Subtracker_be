import { Router } from "express";
import { getAllActivities, getLoggedInUserActivities, markActivityAsRead } from "../controllers/activity.controller";
import { verifyToken } from "../middleware/authenticate";

const router = Router();

router.get("/getAllActivities", getAllActivities);
router.get("/getLoggedInUserActivities",verifyToken, getLoggedInUserActivities);
router.post("/markActivityAsRead/:activityId",verifyToken, markActivityAsRead);

export default router;
