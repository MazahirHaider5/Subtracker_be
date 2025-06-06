import CardModel from "../models/appSubscription.model";
import UserModel from "../models/users.model";
import Stripe from "stripe";
import { IUser } from "../models/users.model";
import { Request, Response } from "express";
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "your-default-secret-key";
const stripe = new Stripe(stripeSecretKey);

const YOUR_DOMAIN = 'http://localhost:5173/checkout';

// Create a new plan
export const createPlan = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    console.log(user);
    const {
      name,
      heading,
      description,
      pricing,
      discountPercentage = 0,
      creditsIncluded,
      membershipPlusFeatures,
      duration,
      durationUnit
    } = req.body;
    if (
      !name ||
      !heading ||
      !description ||
      pricing == null ||
      !duration ||
      !durationUnit
    ) {
      return res.status(400).json({
        error:
          "Missing required fields. Ensure 'name', 'heading', 'description', 'pricing', 'duration', 'durationUnit', and 'allowedVideos' are provided."
      });
    }
    if (user.user_type !== "admin") {
      return res.status(403).json({ error: "Not authorized to create plans" });
    }
    const existingPlan = await CardModel.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({ error: "Plan already exists." });
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      return res
        .status(400)
        .json({ error: "Discount percentage must be between 0 and 100." });
    }
    const newCard = new CardModel({
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
    await newCard.save();
    res.status(201).json({
      message: "Card created successfully",
      card: newCard
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Error creating card",
      details: error.message
    });
  }
};

// Update an existing plan
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { cardId } = req.query;
    const {
      discountPercentage,
      pricing,
      duration,
      durationUnit,
      ...updateData
    } = req.body;
    if (!cardId) {
      return res
        .status(400)
        .json({ error: "Card ID is required for updates." });
    }
    if (user.user_type !== "admin") {
      return res.status(403).json({ error: "Not authorized to update plans" });
    }
    const existingCard = await CardModel.findById(cardId);
    if (!existingCard) {
      return res.status(404).json({ error: "Card not found." });
    }
    const updatedCard = await CardModel.findByIdAndUpdate(
      cardId,
      {
        ...updateData,
        ...(pricing !== undefined ? { pricing } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(durationUnit !== undefined ? { durationUnit } : {}),
        ...(discountPercentage !== undefined ? { discountPercentage } : {})
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      message: "Card updated successfully",
      card: updatedCard
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Error updating card",
      details: error.message
    });
  }
};

// Delete a plan
export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { cardId } = req.query;
    if (!cardId) {
      return res
        .status(400)
        .json({ error: "Card ID is required for deletion." });
    }
    const existingCard = await CardModel.findById(cardId);
    if (!existingCard) {
      return res.status(404).json({ error: "Card not found." });
    }
    await CardModel.findByIdAndDelete(cardId);
    res.status(200).json({
      message: "Card deleted successfully."
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Error deleting card", details: error.message });
  }
};

// Get all plans
export const getAllPlans = async (req: Request, res: Response) => {
  try {
    const plans = await CardModel.find();
    if (!plans) {
      return res.status(404).json({ error: "No plans found" });
    }
    res.status(200).json({ plans });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Error fetching plans", details: error.message });
  }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const buyer = req.user as IUser;
    const userId = buyer.id.toString();
    const { price, membershipName } = req.body;
    if (!price || !membershipName) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      user.membershipName = membershipName;
      await user.save();
    }
    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(price * 100), // Price in cents
      currency: "usd",
      product_data: {
        name: `Purchase  ${membershipName}`
      }
    });

    const successUrl = `${process.env.BACKEND_URI}/redirect/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.BACKEND_URI}/redirect/cancel?session_id={CHECKOUT_SESSION_ID}`;
    

    const session = await stripe.checkout.sessions.create({
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
    
    res.status(200).json({ sessionId: session.id, url: session.url , status: true});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

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

export const getUserSubscriptionDetails = async (
  req: Request,
  res: Response
) => {
  try {
    const buyer = req.user as IUser;
    const userId = buyer.id;
    const user = await UserModel.findById(userId).select(
      'membershipName credits stripeCustomerId purchaseDate lastTransactionId'
    );
    
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching subscription details.",
      error: error.message
    });
  }
};

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

export const handlePaymentComplete = async (req: Request, res: Response) => {
  const { session_id } = req.params;

  try {
    if (!session_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session ID is required' 
      });
    }

    // Retrieve session with expanded payment_intent data
    const session = await stripe.checkout.sessions.retrieve(
      session_id as string,
      {
        expand: ['payment_intent']
      }
    );

    const { userId, membershipName } = session.metadata || {};
    console.log("This is user Id session creating",userId);
    

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
    const user = await UserModel.findById(userId);

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
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          isPaymentComplete: 'completed',
          membershipName: membershipName,
          purchaseDate: new Date().toISOString(),
          lastTransactionId: paymentIntentId
        }
      },
      { new: true }
    );

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

  } catch (error) {
    console.error('Error processing payment completion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing payment completion',
      error: (error as Error).message 
    });
  }
};