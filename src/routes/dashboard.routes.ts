import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import { getDashboardData } from "../controllers/dashboard.controller";

const router = Router();

router.get("/dashboardData",verifyToken, getDashboardData );

export default router;