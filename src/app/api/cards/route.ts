import { NextResponse } from "next/server";
import { db } from "@/db";
import { cards, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET /api/cards — fetch all cards for the authenticated user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userCards = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, session.userId))
    .orderBy(cards.createdAt);

  return NextResponse.json(userCards);
}

// PATCH /api/cards — activate a card (USD unlock)
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { cardId, active } = body;

  if (!cardId) {
    return NextResponse.json({ error: "cardId required" }, { status: 400 });
  }

  // Verify card belongs to user
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card || card.userId !== session.userId) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(cards)
    .set({ active: active ? "true" : "false" })
    .where(eq(cards.id, cardId))
    .returning();

  return NextResponse.json(updated);
}
