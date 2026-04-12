import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET /api/card-details?cardId=xxx — fetch full PAN and CVV live from Berkeley
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cardId = request.nextUrl.searchParams.get("cardId");
  if (!cardId) {
    return NextResponse.json({ error: "cardId query param required" }, { status: 400 });
  }

  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card || card.userId !== session.userId) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const baseUrl = process.env.BERKELEY_BASE_URL;
  const privateToken = process.env.BERKELEY_PRIVATE_TOKEN;
  const publicToken = process.env.BERKELEY_PUBLIC_TOKEN;

  // Step 1: Create temporary token (uses private token)
  const tokenRes = await fetch(
    `${baseUrl}/api/v1/card_issuing/accounts/${card.accountId}/sensitive_data`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-office-id": "1",
        Authorization: `Bearer ${privateToken}`,
      },
      body: JSON.stringify({ last_four_digits: card.panLast4 }),
    }
  );

  if (!tokenRes.ok) {
    return NextResponse.json({ error: "Failed to create sensitive data token" }, { status: 502 });
  }

  const tokenData = await tokenRes.json();
  const tempToken = tokenData.data.token;

  // Step 2: Fetch sensitive data (uses public token)
  const detailRes = await fetch(
    `${baseUrl}/api/v1/card_issuing/accounts/sensitive_data`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-office-id": "1",
        Authorization: `Bearer ${publicToken}`,
      },
      body: JSON.stringify({ token: tempToken }),
    }
  );

  if (!detailRes.ok) {
    return NextResponse.json({ error: "Failed to fetch sensitive data" }, { status: 502 });
  }

  const detailData = await detailRes.json();

  return NextResponse.json({
    cardId: card.id,
    cardNumber: detailData.data.card_number,
    cvv: detailData.data.cvv,
    expiryDate: detailData.data.expiry_date,
  });
}
