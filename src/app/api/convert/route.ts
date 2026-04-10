import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, cards } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// POST /api/convert — convert between CAD and USD
export async function POST(request: Request) {
  const body = await request.json();
  const { fromCardId, toCardId, amount, rate, fromCurrency, toCurrency } = body;

  if (!fromCardId || !toCardId || !amount || !rate || !fromCurrency || !toCurrency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const numAmount = parseFloat(amount);
  const numRate = parseFloat(rate);
  if (numAmount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }

  const convertedAmount = (numAmount * numRate).toFixed(2);

  // Check source balance
  const [fromCard] = await db.select().from(cards).where(eq(cards.id, fromCardId));
  if (!fromCard || parseFloat(fromCard.balance) < numAmount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Deduct from source
  await db
    .update(cards)
    .set({ balance: sql`${cards.balance}::numeric - ${numAmount}` })
    .where(eq(cards.id, fromCardId));

  // Add to destination
  await db
    .update(cards)
    .set({ balance: sql`${cards.balance}::numeric + ${parseFloat(convertedAmount)}` })
    .where(eq(cards.id, toCardId));

  // Create transaction on destination card
  const [tx] = await db
    .insert(transactions)
    .values({
      cardId: toCardId,
      type: "conversion",
      amount: convertedAmount,
      currency: toCurrency,
      description: `${fromCurrency} → ${toCurrency} Conversion`,
      status: "settled",
      metadata: `$${numAmount.toFixed(2)} ${fromCurrency} → $${convertedAmount} ${toCurrency}`,
    })
    .returning();

  return NextResponse.json(tx);
}
