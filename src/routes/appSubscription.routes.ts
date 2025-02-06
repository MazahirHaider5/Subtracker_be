import express from "express";
import {
  createPlan,
  updatePlan,
  deletePlan,
  getAllPlans,
  createCheckoutSession,
  // fetchCheckoutSessionDetails,
  getUserSubscriptionDetails
} from "../controllers/appSubscription.controller";
import { verifyToken } from "../middleware/authenticate";
const router = express.Router();

router.post("/create", verifyToken, createPlan);
router.put("/update", verifyToken, updatePlan);
router.delete("/delete", verifyToken, deletePlan);
router.get("/get", verifyToken, getAllPlans);
router.get("/getPlans", getAllPlans);
router.post("/checkout", verifyToken, createCheckoutSession);
router.get("/myPlanDetails", verifyToken, getUserSubscriptionDetails);
// router.get("/updateDetails", verifyToken, fetchCheckoutSessionDetails);
export default router;
