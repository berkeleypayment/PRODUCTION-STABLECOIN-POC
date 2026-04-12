import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET /api/balance?cardId=xxx — fetch live balance from Pungle
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cardId = request.nextUrl.searchParams.get("cardId");
  if (!cardId) {
    return NextResponse.json({ error: "cardId query param required" }, { status: 400 });
  }

  // Verify card ownership and get account_id
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card || card.userId !== session.userId) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Fetch balance from Pungle
  const res = await fetch(
    `${process.env.BERKELEY_BASE_URL}/api/v1/card_issuing/accounts/${card.accountId}/balance`,
    {
      headers: {
        Authorization: `Bearer ${process.env.BERKELEY_PRIVATE_TOKEN}`,
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 502 });
  }

  const data = await res.json();

  return NextResponse.json({
    cardId: card.id,
    availableBalance: data.data.available_balance,
    currency: card.currency,
  });
}
