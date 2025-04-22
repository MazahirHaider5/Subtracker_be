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
const firebase_1 = __importDefault(require("./firebase"));
function verifyFirebaseSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const message = {
                notification: {
                    title: "Test Notification",
                    body: "This is a test notification"
                },
                token: "cugDdkOBQjuSOZqK4jJrgK:APA91bE55oIv_kmaL4bf55i8q0cim0ccexcGaQf0KhM3f-a5c1n_3RT68k6MZH_N8wFtf8cB4b2dnGsWEqe3ph4XFIHPpEgthqY2ql7YZI5wnvx9aGElXlw"
            };
            const response = yield firebase_1.default.messaging().send(message);
            console.log("Test notification sent successfully:", response);
        }
        catch (error) {
            console.error("Firebase setup verification failed:", error);
        }
    });
}
verifyFirebaseSetup();
