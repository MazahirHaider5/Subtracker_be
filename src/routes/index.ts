import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import subscriptionRoutes from "./subscriptions.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/subscriptions", subscriptionRoutes);

export default router;
