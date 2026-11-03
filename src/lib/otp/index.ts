import type { OtpProvider } from "./provider";
import { FirebaseOtpProvider } from "./firebase";
import { MockOtpProvider } from "./mock";

export function getOtpProvider(): OtpProvider {
  return process.env.OTP_PROVIDER === "firebase" ? new FirebaseOtpProvider() : new MockOtpProvider();
}

export type { OtpProvider };
