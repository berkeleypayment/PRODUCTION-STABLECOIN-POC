import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/transactions?cardId=xxx — fetch transactions for a card
export async function GET(request: NextRequest) {
  const cardId = request.nextUrl.searchParams.get("cardId");

  if (!cardId) {
    return NextResponse.json({ error: "cardId query param required" }, { status: 400 });
  }

  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.cardId, cardId))
    .orderBy(desc(transactions.createdAt));

  return NextResponse.json(txs);
}
