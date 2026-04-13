import { NextResponse } from "next/server";
import { db } from "@/db";
import { bitRegistrations, cards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET /api/register — check if current user has a BIT registration
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [existing] = await db
    .select()
    .from(bitRegistrations)
    .where(eq(bitRegistrations.userId, session.userId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ registered: false });
  }

  return NextResponse.json({ registered: true, email: existing.email, id: existing.id });
}

// POST /api/register — register or replace BIT Network email
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

  // Check if this email is already taken by another user
  const [emailTaken] = await db
    .select()
    .from(bitRegistrations)
    .where(eq(bitRegistrations.email, email))
    .limit(1);

  if (emailTaken && emailTaken.userId !== session.userId) {
    return NextResponse.json({ error: "This email is already registered as a BIT Network address" }, { status: 409 });
  }

  // Verify card ownership
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card || card.userId !== session.userId) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Check if user already has a registration — if so, replace it
  const [existingReg] = await db
    .select()
    .from(bitRegistrations)
    .where(eq(bitRegistrations.userId, session.userId))
    .limit(1);

  if (existingReg) {
    const [updated] = await db
      .update(bitRegistrations)
      .set({ email, cardId, updatedAt: new Date() })
      .where(eq(bitRegistrations.id, existingReg.id))
      .returning();
    return NextResponse.json(updated);
  }

  // Create new registration
  const [reg] = await db
    .insert(bitRegistrations)
    .values({
      userId: session.userId,
      cardId,
      email,
    })
    .returning();

  return NextResponse.json(reg, { status: 201 });
}
