import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import {
  getAllComplaints,
  getAllSubscriptions,
  promoteToAdmin,
  sendAdminPromotionLink,
  SendSetPasswordLink,
  replyToComplaint
} from "../controllers/admin.controller";

const router = Router();

router.get("/getAllSubscriptions", getAllSubscriptions);

router.post("/sendAdminPromotionLink", sendAdminPromotionLink);
router.get("/promoteToAdmin", promoteToAdmin);
router.get("/getAllComplaints", getAllComplaints);
router.post("/setPasswordLink", SendSetPasswordLink);
router.post("/ticketReply", replyToComplaint);

export default router;
