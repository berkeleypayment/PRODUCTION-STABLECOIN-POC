import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, cards } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cardId = request.nextUrl.searchParams.get("cardId");
  if (!cardId) {
    return NextResponse.json({ error: "cardId query param required" }, { status: 400 });
  }

  // Verify card belongs to user
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card || card.userId !== session.userId) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.cardId, cardId))
    .orderBy(desc(transactions.createdAt));

  return NextResponse.json(txs);
}
