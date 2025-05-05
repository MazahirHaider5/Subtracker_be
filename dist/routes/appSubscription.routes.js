"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appSubscription_controller_1 = require("../controllers/appSubscription.controller");
const authenticate_1 = require("../middleware/authenticate");
const router = express_1.default.Router();
router.post("/create", authenticate_1.verifyToken, appSubscription_controller_1.createPlan);
router.put("/update", authenticate_1.verifyToken, appSubscription_controller_1.updatePlan);
router.delete("/delete", authenticate_1.verifyToken, appSubscription_controller_1.deletePlan);
router.get("/get", authenticate_1.verifyToken, appSubscription_controller_1.getAllPlans);
router.get("/getPlans", appSubscription_controller_1.getAllPlans);
router.post("/checkout", authenticate_1.verifyToken, appSubscription_controller_1.createCheckoutSession);
router.get("/myPlanDetails", authenticate_1.verifyToken, appSubscription_controller_1.getUserSubscriptionDetails);
// router.post('/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

router.get('/paymentComplete/:session_id', appSubscription_controller_1.handlePaymentComplete);

// router.get("/updateDetails", verifyToken, fetchCheckoutSessionDetails);
exports.default = router;
