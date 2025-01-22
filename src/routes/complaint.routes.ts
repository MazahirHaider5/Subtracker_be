import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import { createComplaint, getUserComplaints } from "../controllers/complaint.controller";

const router = Router();

router.post("/createComplaint",verifyToken, createComplaint );

router.get("/getComplaints", getUserComplaints);

export default router;