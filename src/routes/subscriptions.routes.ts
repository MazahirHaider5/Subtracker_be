import {Router} from "express";
import { verifyToken } from "../middleware/authenticate";
import { createSubscription, deleteSubscription, getUserSubscription } from "../controllers/subscription.controller";

const router = Router();

router.post("/createSubscription", verifyToken, createSubscription);

router.get("/mySubscriptions", verifyToken, getUserSubscription);

router.delete("/deleteSubscription/:id", verifyToken, deleteSubscription);

export default router;
