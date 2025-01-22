import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import { createComplaint } from "../controllers/complaint.controller";

const router = Router();

router.post("/createComplaint",verifyToken, createComplaint );

export default router;