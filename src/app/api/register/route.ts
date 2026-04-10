import { NextResponse } from "next/server";
import { db } from "@/db";
import { bitRegistrations, cards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// POST /api/register — register email on BIT Network
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { email, cardId } = body;

  if (!email || !email.includes("@") || !cardId) {
    return NextResponse.json({ error: "Valid email and cardId required" }, { status: 400 });
  }

  // Check if already registered
  const [existing] = await db
    .select()
    .from(bitRegistrations)
    .where(eq(bitRegistrations.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  // Get card and verify ownership
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card || card.userId !== session.userId) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const accountId = "BIT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const extTag = "XT-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  const [reg] = await db
    .insert(bitRegistrations)
    .values({
      userId: card.userId,
      cardId,
      email,
      accountId,
      extTag,
    })
    .returning();

  return NextResponse.json(reg);
}
