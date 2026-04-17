import { NextResponse } from "next/server";

// GET /api/config — returns UI config flags (server-side env vars)
export async function GET() {
  return NextResponse.json({
    allVisaLogo: process.env.CARD_LOGO_ALL_VISA === "true",
  });
}
