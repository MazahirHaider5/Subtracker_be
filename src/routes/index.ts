import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import subscriptionRoutes from "./subscriptions.routes";
import categoryRoutes from "./categories.routes";
import dashboardRoutes from "./dashboard.routes";
import adminRoutes from "./adminDashboard.routes";
import complaintRoutes from "./complaint.routes";
import activitiesRoutes from "./activties.routes";
import appSubscription from "./appSubscription.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/categories", categoryRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);
router.use("/complain", complaintRoutes);
router.use("/activities", activitiesRoutes);
router.use("/appSubscriptions", appSubscription);

export default router;