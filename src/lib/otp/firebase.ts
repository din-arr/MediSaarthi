import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { OtpProvider } from "./provider";

function firebaseAuth() {
  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  return getAuth(app);
}

export class FirebaseOtpProvider implements OtpProvider {
  async sendOtp(): Promise<{ demoCode?: string }> {
    throw new Error("FIREBASE_CLIENT_REQUIRED");
  }

  async verifyOtp(_phone: string, code: string) {
    try {
      const decoded = await firebaseAuth().verifyIdToken(code);
      if (decoded.phone_number?.replace(/\D/g, "") !== _phone) throw new Error("INVALID_CODE");
    } catch {
      throw new Error("INVALID_CODE");
    }
  }
}
