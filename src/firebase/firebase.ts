// import * as admin from "firebase-admin";

// const serviceAccount = require("./subtracker-f7bbb-c3778b875919.json");

// if (!admin.apps.length) {
//   try {
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount)
//     });
//     console.log('Firebase Admin initialized successfully');
//   } catch (error) {
//     console.error('Firebase admin initialization error:', error);
//   }
// }

// export default admin;

import * as admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  try {
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
    
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
    console.log('Firebase Admin initialized  successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export default admin;