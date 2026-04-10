import { NextResponse } from "next/server";
import { compareSync } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !compareSync(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarInitials: user.avatarInitials,
  });
}
