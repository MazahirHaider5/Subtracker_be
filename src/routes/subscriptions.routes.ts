import {Router} from "express";
import { verifyToken } from "../middleware/authenticate";
import { createSubscription, getUserSubscription } from "../controllers/subscription.controller";

const router = Router();

router.post("/createSubscription", verifyToken, createSubscription);

router.get("/mySubscriptions", verifyToken, getUserSubscription)

export default router;
