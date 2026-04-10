import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, cards, transactions } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(transactions);
  await db.delete(cards);
  await db.delete(users);

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      name: "Rahmat Yousufi",
      email: "rahmat@berkeleypayment.com",
      avatarInitials: "RY",
    })
    .returning();

  console.log("Created user:", user.id);

  // Create CAD card
  const [cadCard] = await db
    .insert(cards)
    .values({
      userId: user.id,
      currency: "CAD",
      balance: "5001.86",
      panLast4: "3854",
      panFull: "4242 4242 4242 3854",
      cvv: "782",
      expiry: "11/27",
      color: "card-color-pink",
      active: "true",
    })
    .returning();

  console.log("Created CAD card:", cadCard.id);

  // Create USD card (inactive until user activates)
  const [usdCard] = await db
    .insert(cards)
    .values({
      userId: user.id,
      currency: "USD",
      balance: "1200.41",
      panLast4: "5888",
      panFull: "4242 4242 4242 5888",
      cvv: "394",
      expiry: "03/29",
      color: "card-color-purple",
      active: "false",
    })
    .returning();

  console.log("Created USD card:", usdCard.id);

  // CAD transactions
  await db.insert(transactions).values([
    {
      cardId: cadCard.id,
      type: "interac_send",
      amount: "-450.00",
      currency: "CAD",
      description: "Interac e-Transfer → john@example.com",
      recipientEmail: "john@example.com",
      status: "settled",
      createdAt: new Date("2026-03-24T09:30:00Z"),
    },
    {
      cardId: cadCard.id,
      type: "interac_receive",
      amount: "1500.00",
      currency: "CAD",
      description: "Interac e-Transfer → My Account",
      status: "settled",
      createdAt: new Date("2026-03-22T14:10:00Z"),
    },
    {
      cardId: cadCard.id,
      type: "interac_send",
      amount: "-200.00",
      currency: "CAD",
      description: "Interac e-Transfer → sara@example.com",
      recipientEmail: "sara@example.com",
      status: "settled",
      createdAt: new Date("2026-03-18T11:45:00Z"),
    },
    {
      cardId: cadCard.id,
      type: "interac_receive",
      amount: "3000.00",
      currency: "CAD",
      description: "Interac e-Transfer → My Account",
      status: "settled",
      createdAt: new Date("2026-03-14T08:00:00Z"),
    },
  ]);

  // USD transactions
  await db.insert(transactions).values([
    {
      cardId: usdCard.id,
      type: "bit_send",
      amount: "-500.00",
      currency: "USD",
      description: "BIT Transfer → emailuser2@berkeley.com",
      recipientEmail: "emailuser2@berkeley.com",
      status: "settled",
      createdAt: new Date("2026-03-24T10:14:00Z"),
    },
    {
      cardId: usdCard.id,
      type: "bit_receive",
      amount: "1700.41",
      currency: "USD",
      description: "BIT Transfer → My Account",
      status: "settled",
      createdAt: new Date("2026-03-23T14:58:00Z"),
    },
    {
      cardId: usdCard.id,
      type: "conversion",
      amount: "353.05",
      currency: "USD",
      description: "CAD → USD Conversion",
      metadata: "$500 CAD → $353.05 USD",
      status: "settled",
      createdAt: new Date("2026-03-21T09:00:00Z"),
    },
    {
      cardId: usdCard.id,
      type: "bit_send",
      amount: "-250.00",
      currency: "USD",
      description: "BIT Transfer → emailuser1@berkeley.com",
      recipientEmail: "emailuser1@berkeley.com",
      status: "settled",
      createdAt: new Date("2026-03-20T16:30:00Z"),
    },
  ]);

  console.log("Seeded 8 transactions");
  console.log("Done!");
}

seed().catch(console.error);
