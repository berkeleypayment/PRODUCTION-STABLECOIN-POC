import { NextResponse } from "next/server";
import { db } from "@/db";
import { cards, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/cards — fetch all cards for the demo user
export async function GET() {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, "rahmat@berkeleypayment.com"))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userCards = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, user.id))
    .orderBy(cards.createdAt);

  return NextResponse.json(userCards);
}

// PATCH /api/cards — activate a card (USD unlock)
export async function PATCH(request: Request) {
  const body = await request.json();
  const { cardId, active } = body;

  if (!cardId) {
    return NextResponse.json({ error: "cardId required" }, { status: 400 });
  }

  const [updated] = await db
    .update(cards)
    .set({ active: active ? "true" : "false" })
    .where(eq(cards.id, cardId))
    .returning();

  return NextResponse.json(updated);
}
