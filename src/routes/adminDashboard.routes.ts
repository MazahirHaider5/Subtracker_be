import {Router} from "express";
import { verifyToken } from "../middleware/authenticate";
import { getAllSubscriptions, promoteToAdmin, sendAdminPromotionLink } from "../controllers/admin.controller";


const router = Router();


router.get("/getAllSubscriptions", getAllSubscriptions);

router.post("/sendAdminPromotionLink", sendAdminPromotionLink);
router.get("/promoteToAdmin", promoteToAdmin);


export default router;
