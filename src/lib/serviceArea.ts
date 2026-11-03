export const serviceAreas = [
  { city: "Kolkata", prefix: "700" },
  { city: "Howrah", prefix: "711" },
] as const;

export function cityForServicePincode(pincode: string) {
  return serviceAreas.find((area) => pincode.startsWith(area.prefix))?.city ?? "";
}

export const supportConfig = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@medisaarthi.demo",
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "919000000000",
};
