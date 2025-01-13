import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { rateLimit } from "./middleware/rateLimiter";
import passport from "passport";


dotenv.config();
const app = express();

app.use(passport.initialize());

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "https://sub-tracker-8ykfn9rgp-mazahir-haiders-projects.vercel.app",
  "https://subtracker-be.onrender.com/"

];

const PORT = process.env.PORT;


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
    allowedHeaders: "Content-Type,Authorization"
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit);
app.get("/test", (req, res)=> {
  res.status(200).json({message: "server working"})
})
app.use("/", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found."
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    // MongoDB connection
    await mongoose.connect(process.env.DB_CONNECTION_STRING ?? "");
    console.log("Connected to MongoDB.");

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => gracefulShutdown(server));
    process.on("SIGINT", () => gracefulShutdown(server));
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};


// Graceful shutdown function
const gracefulShutdown = (server: ReturnType<typeof app.listen>) => {
  return () => {
    server.close(() => {
      console.log("Server shutting down...");
      process.exit(0);
    });
  };
};

// Handle unhandled errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});


startServer();
