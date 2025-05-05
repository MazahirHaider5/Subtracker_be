"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaymentComplete = exports.getUserSubscriptionDetails = exports.createCheckoutSession = exports.getAllPlans = exports.deletePlan = exports.updatePlan = exports.createPlan = void 0;
const appSubscription_model_1 = __importDefault(require("../models/appSubscription.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const stripe_1 = __importDefault(require("stripe"));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "your-default-secret-key";
const stripe = new stripe_1.default(stripeSecretKey);
const YOUR_DOMAIN = 'http://localhost:5173/checkout';
// Create a new plan
const createPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        console.log(user);
        const { name, heading, description, pricing, discountPercentage = 0, creditsIncluded, membershipPlusFeatures, duration, durationUnit } = req.body;
        if (!name ||
            !heading ||
            !description ||
            pricing == null ||
            !duration ||
            !durationUnit) {
            return res.status(400).json({
                error: "Missing required fields. Ensure 'name', 'heading', 'description', 'pricing', 'duration', 'durationUnit', and 'allowedVideos' are provided."
            });
        }
        if (user.user_type !== "admin") {
            return res.status(403).json({ error: "Not authorized to create plans" });
        }
        const existingPlan = yield appSubscription_model_1.default.findOne({ name });
        if (existingPlan) {
            return res.status(400).json({ error: "Plan already exists." });
        }
        if (discountPercentage < 0 || discountPercentage > 100) {
            return res
                .status(400)
                .json({ error: "Discount percentage must be between 0 and 100." });
        }
        const newCard = new appSubscription_model_1.default({
            name,
            heading,
            description,
            pricing,
            discountPercentage,
            creditsIncluded,
            membershipPlusFeatures,
            duration,
            durationUnit
        });
        yield newCard.save();
        res.status(201).json({
            message: "Card created successfully",
            card: newCard
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Error creating card",
            details: error.message
        });
    }
});
exports.createPlan = createPlan;
// Update an existing plan
const updatePlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { cardId } = req.query;
        const _a = req.body, { discountPercentage, pricing, duration, durationUnit } = _a, updateData = __rest(_a, ["discountPercentage", "pricing", "duration", "durationUnit"]);
        if (!cardId) {
            return res
                .status(400)
                .json({ error: "Card ID is required for updates." });
        }
        if (user.user_type !== "admin") {
            return res.status(403).json({ error: "Not authorized to update plans" });
        }
        const existingCard = yield appSubscription_model_1.default.findById(cardId);
        if (!existingCard) {
            return res.status(404).json({ error: "Card not found." });
        }
        const updatedCard = yield appSubscription_model_1.default.findByIdAndUpdate(cardId, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, updateData), (pricing !== undefined ? { pricing } : {})), (duration !== undefined ? { duration } : {})), (durationUnit !== undefined ? { durationUnit } : {})), (discountPercentage !== undefined ? { discountPercentage } : {})), { new: true, runValidators: true });
        res.status(200).json({
            message: "Card updated successfully",
            card: updatedCard
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Error updating card",
            details: error.message
        });
    }
});
exports.updatePlan = updatePlan;
// Delete a plan
const deletePlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cardId } = req.query;
        if (!cardId) {
            return res
                .status(400)
                .json({ error: "Card ID is required for deletion." });
        }
        const existingCard = yield appSubscription_model_1.default.findById(cardId);
        if (!existingCard) {
            return res.status(404).json({ error: "Card not found." });
        }
        yield appSubscription_model_1.default.findByIdAndDelete(cardId);
        res.status(200).json({
            message: "Card deleted successfully."
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error deleting card", details: error.message });
    }
});
exports.deletePlan = deletePlan;
// Get all plans
const getAllPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plans = yield appSubscription_model_1.default.find();
        if (!plans) {
            return res.status(404).json({ error: "No plans found" });
        }
        res.status(200).json({ plans });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error fetching plans", details: error.message });
    }
});
exports.getAllPlans = getAllPlans;
const createCheckoutSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const buyer = req.user;
        const userId = buyer.id.toString();
        const { price, membershipName } = req.body;
        if (!price || !membershipName) {
            return res.status(400).json({ error: "Missing required fields." });
        }
        const user = yield users_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = yield stripe.customers.create({
                email: user.email,
                metadata: { userId }
            });
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
            user.membershipName = membershipName;
            yield user.save();
        }
        const stripePrice = yield stripe.prices.create({
            unit_amount: Math.round(price * 100), // Price in cents
            currency: "usd",
            product_data: {
                name: `Purchase  ${membershipName}`
            }
        });
        const successUrl = `${process.env.BACKEND_URI}/redirect/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${process.env.BACKEND_URI}/redirect/cancel?session_id={CHECKOUT_SESSION_ID}`;
        const session = yield stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            customer: stripeCustomerId,
            line_items: [
                {
                    price: stripePrice.id,
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId,
                membershipName
            }
        });
        res.status(200).json({ sessionId: session.id, url: session.url, status: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.createCheckoutSession = createCheckoutSession;
// fetch session details
// export const fetchCheckoutSessionDetails = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const buyer = req.user as IUser;
//     const userId = buyer.id;
//     if (!userId) {
//       return res.status(401).json({ error: "User not Authenticated" });
//     }
//     const user: IUser | null = await UserModel.findById(userId);
//     if (!user?.stripeCustomerId) {
//       return res
//         .status(400)
//         .json({ error: "User has not associated Stripe customer ID." });
//     }
//     // Fetch checkout sessions from Stripe
//     const checkoutSessions = await stripe.checkout.sessions.list({
//       customer: user.stripeCustomerId,
//       limit: 1,
//       expand: ["data.payment_intent"]
//     });
//     if (checkoutSessions.data.length === 0) {
//       return res
//         .status(404)
//         .json({ error: "No checkout sessions found for this customer." });
//     }
//     const session = checkoutSessions.data[0];
//     // Get the payment intent ID from the session (handling possible null)
//     const paymentIntentId = session.payment_intent?.id ?? null;
//     // Check if there's no new transaction
//     if (paymentIntentId && user.lastTransactionId === paymentIntentId) {
//       return res.status(200).json({
//         message: "No new transactions. Data is up-to-date."
//       });
//     }
//     // Structure the session details
//     const sessionDetails = {
//       sessionId: session.id,
//       paymentStatus: session.payment_status,
//       status: session.status,
//       mode: session.mode,
//       amountTotal: session.amount_total ? session.amount_total / 100 : 0, // Fallback for null
//       membershipName: session.metadata?.membershipName ?? "Free", // Fallback for null
//       created: new Date(session.created * 1000),
//       transactionId: paymentIntentId // Include the transaction ID
//     };
//     // Check if payment is complete
//     if (session.payment_status === "paid" && session.status === "complete") {
//       // Fetch the membership card details
//       const membershipCard = await CardModel.findOne({
//         name: sessionDetails.membershipName
//       });
//       if (!membershipCard) {
//         return res.status(404).json({
//           error: "Membership card not found.",
//           sessionDetails
//         });
//       }
//       // Update user data in the database
//       const updatedUser = await UserModel.findOneAndUpdate(
//         { _id: userId },
//         {
//           $set: {
//             membershipName: sessionDetails.membershipName,
//             purchaseDate: sessionDetails.created,
//             lastTransactionId: paymentIntentId // Save the transaction ID
//           }
//         },
//         { new: true }
//       );
//       if (!updatedUser) {
//         return res.status(404).json({ error: "Failed to update user data." });
//       }
//       // Calculate subscription end date based on membership duration
//       const currentDate = new Date();
//       const endDate = new Date(currentDate);
//       if (membershipCard.durationUnit === "month") {
//         endDate.setMonth(endDate.getMonth() + Number(membershipCard.duration));
//       } else if (membershipCard.durationUnit === "year") {
//         endDate.setFullYear(
//           endDate.getFullYear() + Number(membershipCard.duration)
//         );
//       }
//       const subscriptionDetails = {
//         startDate: currentDate,
//         endDate: endDate,
//         duration: membershipCard.duration,
//         durationUnit: membershipCard.durationUnit,
//         membershipFeatures: membershipCard.membershipPlusFeatures,
//         creditsIncluded: membershipCard.creditsIncluded,
//         discountPercentage: membershipCard.discountPercentage
//       };
//       return res.status(200).json({
//         message:
//           "Checkout session details fetched and data updated successfully.",
//         sessionDetails,
//         subscriptionDetails,
//         userData: {
//           membershipName: updatedUser.membershipName,
//           credits: updatedUser.credits,
//           email: updatedUser.email,
//           stripeCustomerId: updatedUser.stripeCustomerId,
//           purchaseDate: updatedUser.purchaseDate
//         },
//         membershipCard: {
//           name: membershipCard.name,
//           heading: membershipCard.heading,
//           description: membershipCard.description,
//           pricing: membershipCard.pricing,
//           duration: membershipCard.duration,
//           durationUnit: membershipCard.durationUnit
//         }
//       });
//     }
//     return res.status(200).json({
//       message: "Checkout session details fetched.",
//       sessionDetails,
//       warning: "Payment not completed. No updates made."
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       error: "Internal server error",
//       details: error.message
//     });
//   }
// };
const getUserSubscriptionDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const buyer = req.user;
        const userId = buyer.id;
        const user = yield users_model_1.default.findById(userId).select('membershipName credits stripeCustomerId purchaseDate lastTransactionId');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }
        const data = {
            membershipName: user.membershipName,
            credits: user.credits,
            stripeCustomerId: user.stripeCustomerId,
            purchaseDate: user.purchaseDate,
            lastTransactionId: user.lastTransactionId
        };
        res.status(200).json({
            success: true,
            data
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching subscription details.",
            error: error.message
        });
    }
});
exports.getUserSubscriptionDetails = getUserSubscriptionDetails;
// export const handleStripeWebhook = async (req: Request, res: Response) => {
//   const signature = req.headers['stripe-signature'] as string;
//   try {
//     const event = stripe.webhooks.constructEvent(
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session;
//       const { userId, membershipName } = session.metadata || {};
//       if (userId && membershipName) {
//         // Update user's membership after successful payment
//         await UserModel.findByIdAndUpdate(userId, {
//           membershipName: membershipName,
//           subscribed_plan: membershipName,
//           purchaseDate: new Date().toISOString()
//         });
//         console.log(`Updated membership for user ${userId} to ${membershipName}`);
//       }
//     }
//     res.json({ received: true });
//   } catch (err : any) {
//     console.error('Webhook Error:', err);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }
// };
const handlePaymentComplete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { session_id } = req.params;
    try {
        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }
        // Retrieve session with expanded payment_intent data
        const session = yield stripe.checkout.sessions.retrieve(session_id, {
            expand: ['payment_intent']
        });
        const { userId, membershipName } = session.metadata || {};
        console.log("This is user Id session creating", userId);
        if (!session.payment_intent) {
            return res.status(400).json({
                success: false,
                message: 'No payment intent found for this session'
            });
        }
        // Safely get payment intent ID
        const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent.id;
        if (!userId || !membershipName) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session metadata'
            });
        }
        // Find user and check payment status
        const user = yield users_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // if (user.isPaymentComplete === 'completed') {
        //   return res.status(400).json({ 
        //     success: false, 
        //     message: 'Payment has already been processed' 
        //   });
        // }
        // Update user with payment completion and membership details
        const updatedUser = yield users_model_1.default.findByIdAndUpdate(userId, {
            $set: {
                isPaymentComplete: 'completed',
                membershipName: membershipName,
                purchaseDate: new Date().toISOString(),
                lastTransactionId: paymentIntentId
            }
        }, { new: true });
        if (!updatedUser) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update user payment status'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Payment completed successfully',
            data: {
                status: session.status,
                membershipName: updatedUser.membershipName,
                purchaseDate: updatedUser.purchaseDate,
                transactionId: updatedUser.lastTransactionId
            }
        });
    }
    catch (error) {
        console.error('Error processing payment completion:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment completion',
            error: error.message
        });
    }
});
exports.handlePaymentComplete = handlePaymentComplete;
