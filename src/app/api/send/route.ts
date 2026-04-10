import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, cards } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// POST /api/send — send money (BIT or Interac)
export async function POST(request: Request) {
  const body = await request.json();
  const { cardId, amount, currency, recipientEmail, type, message } = body;

  if (!cardId || !amount || !currency || !recipientEmail || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const numAmount = parseFloat(amount);
  if (numAmount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }

  // Check balance
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  if (parseFloat(card.balance) < numAmount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Deduct balance
  await db
    .update(cards)
    .set({ balance: sql`${cards.balance}::numeric - ${numAmount}` })
    .where(eq(cards.id, cardId));

  // Determine description
  const network = type === "bit_send" ? "BIT Transfer" : "Interac e-Transfer";
  const description = `${network} → ${recipientEmail}`;

  // Create transaction
  const [tx] = await db
    .insert(transactions)
    .values({
      cardId,
      type,
      amount: `-${numAmount.toFixed(2)}`,
      currency,
      description,
      recipientEmail,
      status: "settled",
      metadata: message || null,
    })
    .returning();

  return NextResponse.json(tx);
}
