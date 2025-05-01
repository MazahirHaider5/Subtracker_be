import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import {
  createSubscription,
  deleteSubscription,
  getUserSubscription,
  updatePaidStatus,
  updateSubscription
} from "../controllers/subscription.controller";

const router = Router();

router.post("/createSubscription", verifyToken, createSubscription);
router.get("/mySubscriptions", verifyToken, getUserSubscription);
router.delete("/deleteSubscription/:id", verifyToken, deleteSubscription);
router.patch("/updateSubscription/:id", verifyToken, updateSubscription);
router.patch("/updatePaidStatus/:id", verifyToken, updatePaidStatus);

export default router;
