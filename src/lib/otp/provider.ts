export type OtpSendResult = { demoCode?: string };

export interface OtpProvider {
  sendOtp(phone: string): Promise<OtpSendResult>;
  verifyOtp(phone: string, code: string): Promise<void>;
}
