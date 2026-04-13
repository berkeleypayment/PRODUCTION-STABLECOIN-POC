import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, cards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// POST /api/convert — convert between CAD and USD via Berkeley
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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

  // Verify ownership of both cards
  const [fromCard] = await db.select().from(cards).where(eq(cards.id, fromCardId));
  if (!fromCard || fromCard.userId !== session.userId) {
    return NextResponse.json({ error: "Source card not found" }, { status: 404 });
  }

  const [toCard] = await db.select().from(cards).where(eq(cards.id, toCardId));
  if (!toCard || toCard.userId !== session.userId) {
    return NextResponse.json({ error: "Destination card not found" }, { status: 404 });
  }

  const baseUrl = process.env.BERKELEY_BASE_URL;
  const token = process.env.BERKELEY_PRIVATE_TOKEN;

  // Step 1: Unload from source card (amount in cents)
  const unloadCents = Math.round(numAmount * 100);
  const unloadRes = await fetch(`${baseUrl}/api/v1/card_issuing/value_loads/unload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      account_id: Number(fromCard.accountId),
      amount: unloadCents,
      message: `Convert ${fromCurrency} to ${toCurrency}`,
    }),
  });

  if (!unloadRes.ok && unloadRes.status !== 201) {
    const err = await unloadRes.text();
    return NextResponse.json({ error: "Failed to unload from source card", detail: err }, { status: 502 });
  }

  // Step 2: Load onto destination card (converted amount in cents)
  const loadCents = Math.round(parseFloat(convertedAmount) * 100);
  const loadRes = await fetch(`${baseUrl}/api/v1/card_issuing/value_loads/load`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      account_id: Number(toCard.accountId),
      amount: loadCents,
      message: `Convert ${fromCurrency} to ${toCurrency}`,
    }),
  });

  if (!loadRes.ok && loadRes.status !== 201) {
    const err = await loadRes.text();
    return NextResponse.json({ error: "Failed to load onto destination card", detail: err }, { status: 502 });
  }

  // Step 3: Create transaction record
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
