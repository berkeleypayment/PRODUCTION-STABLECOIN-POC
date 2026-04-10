import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/user — fetch the demo user
export async function GET() {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, "rahmat@berkeleypayment.com"))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
