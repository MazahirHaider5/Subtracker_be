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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
// import { rateLimit } from "./middleware/rateLimiter";
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
require("./utils/subscriptionReminderJob");
const PORT = process.env.PORT;
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(passport_1.default.initialize());
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Security headers
app.use((0, helmet_1.default)());
// CORS configuration
const allowedOrigins = [
    "https://subtracker-be.onrender.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4000",
    "https://subtracker-react-hdr.vercel.app",
    "https://subtracker-dashboard-hdr.vercel.app",
];
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// app.use(rateLimit);
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
//
app.get("/test", (req, res) => {
    res.status(200).json({ message: "server working" });
});
app.use("/", routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});
// Database connection and server start
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // MongoDB connection
        yield mongoose_1.default.connect((_a = process.env.DB_CONNECTION_STRING) !== null && _a !== void 0 ? _a : "");
        console.log("Connected to MongoDB.");
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
        // Graceful shutdown
        process.on("SIGTERM", () => gracefulShutdown(server));
        process.on("SIGINT", () => gracefulShutdown(server));
    }
    catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
});
// Graceful shutdown function
const gracefulShutdown = (server) => {
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
