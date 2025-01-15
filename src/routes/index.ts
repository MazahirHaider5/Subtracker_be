import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import subscriptionRoutes from "./subscriptions.routes";
import categoryRoutes from "./categories.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/categories", categoryRoutes);
router.use("/dashboard", dashboardRoutes );

export default router;
