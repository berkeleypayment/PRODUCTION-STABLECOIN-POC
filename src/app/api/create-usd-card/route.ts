import { NextResponse } from "next/server";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if user already has a USD card
  const existing = await db
    .select()
    .from(cards)
    .where(and(eq(cards.userId, session.userId), eq(cards.currency, "USD")));

  if (existing.length > 0) {
    return NextResponse.json({ error: "USD card already exists" }, { status: 409 });
  }

  const baseUrl = process.env.BERKELEY_BASE_URL;
  const token = process.env.BERKELEY_PRIVATE_TOKEN;
  const programId = process.env.BERKELEY_PROGRAM_ID_US;

  // Step 1: Create cardholder on Berkeley
  const createRes = await fetch(`${baseUrl}/api/v1/card_issuing/cardholders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      program_id: Number(programId),
      first_name: "Fake",
      last_name: "Name",
      date_of_birth: "01-01-1980",
      email: "user@fakedomain.com",
      phone: "1231231234",
      postal_code: "11111",
      city: "Moonbase One",
      state: "AL",
      address1: "123 Fake Street",
      address2: "apartment 2",
      country: "840",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    return NextResponse.json({ error: "Failed to create cardholder", detail: err }, { status: 502 });
  }

  const createData = await createRes.json();
  const cardholderId = String(createData.data.id);

  // Step 2: Get cardholder details to extract account/card info
  await new Promise((r) => setTimeout(r, 1000));

  const detailRes = await fetch(`${baseUrl}/api/v1/card_issuing/cardholders/${cardholderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!detailRes.ok) {
    return NextResponse.json({ error: "Failed to get cardholder details" }, { status: 502 });
  }

  const detailData = await detailRes.json();
  const account = detailData.data.accounts[0];
  const accountId = String(account.id);
  const card = account.cards[0];
  const lastFour = card.last_four_digits;
  const expiryDate = card.expiry_date; // "2027-04-30T00:00:00Z"
  const expiryYear = expiryDate.substring(0, 4);
  const expiryMonth = expiryDate.substring(5, 7);
  const expiryShort = `${expiryMonth}/${expiryYear.slice(2)}`;

  // Step 3: Activate card only if not already active
  if (card.status !== "active") {
    const activateRes = await fetch(`${baseUrl}/api/v1/card_issuing/accounts/${accountId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: "mark_card_active",
        last_four_digits: lastFour,
      }),
    });

    if (!activateRes.ok && activateRes.status !== 201) {
      return NextResponse.json({ error: "Failed to activate card" }, { status: 502 });
    }
  }

  // Step 4: Insert into DB
  const [newCard] = await db
    .insert(cards)
    .values({
      userId: session.userId,
      cardholderId,
      accountId,
      currency: "USD",
      panLast4: lastFour,
      expiry: expiryShort,
      color: "card-color-purple",
      active: "true",
    })
    .returning();

  return NextResponse.json(newCard, { status: 201 });
}
