import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import {
  getAllComplaints,
  getAllSubscriptions,
  promoteToAdmin,
  sendAdminPromotionLink,
  SendSetPasswordLink
} from "../controllers/admin.controller";

const router = Router();

router.get("/getAllSubscriptions", getAllSubscriptions);

router.post("/sendAdminPromotionLink", sendAdminPromotionLink);
router.get("/promoteToAdmin", promoteToAdmin);
router.get("/getAllComplaints", getAllComplaints);
router.post("/setPasswordLink", SendSetPasswordLink);

export default router;
