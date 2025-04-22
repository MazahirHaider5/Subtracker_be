// import { app } from 'firebase-admin';

// declare const admin: app.App;
// export = admin;

import { ServiceAccount } from "firebase-admin";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FIREBASE_CONFIG: string;
    }
  }
}

export {};