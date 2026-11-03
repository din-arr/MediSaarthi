import { NextResponse } from "next/server";
import { getOtpProvider } from "../../../../lib/otp";

function cleanPhone(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

export async function POST(request: Request) {
  const body = await request.json() as { phone?: string };
  const phone = cleanPhone(body.phone);
  if (!/^\d{10}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  try {
    const result = await getOtpProvider().sendOtp(phone);
    return NextResponse.json({ demoCode: result.demoCode });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT") return NextResponse.json({ error: "Too many OTP requests. Please try again in a few minutes." }, { status: 429 });
    console.error("OTP request failed", error);
    return NextResponse.json({ error: "We could not send an OTP. Please try again." }, { status: 503 });
  }
}
