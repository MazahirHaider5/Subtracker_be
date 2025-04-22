import admin from "./firebase";

async function verifyFirebaseSetup() {
  try {
    const message = {
      notification: {
        title: "Test Notification",
        body: "This is a test notification"
      },
      token: "cugDdkOBQjuSOZqK4jJrgK:APA91bE55oIv_kmaL4bf55i8q0cim0ccexcGaQf0KhM3f-a5c1n_3RT68k6MZH_N8wFtf8cB4b2dnGsWEqe3ph4XFIHPpEgthqY2ql7YZI5wnvx9aGElXlw"
    };

    const response = await admin.messaging().send(message);
    console.log("Test notification sent successfully:", response);
  } catch (error) {
    console.error("Firebase setup verification failed:", error);
  }
}

verifyFirebaseSetup();