
import { ServiceAccount } from "firebase-admin";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FIREBASE_CONFIG: string;
    }
  }
}

export {};