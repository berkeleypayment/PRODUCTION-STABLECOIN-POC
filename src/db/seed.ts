import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import { users, cards, transactions, bitRegistrations } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(bitRegistrations);
  await db.delete(transactions);
  await db.delete(cards);
  await db.delete(users);

  // ── User 1: Rahmat ──
  const [user1] = await db
    .insert(users)
    .values({
      name: "Rahmat Yousufi",
      email: "rahmat@berkeleypayment.com",
      passwordHash: hashSync("password123", 10),
      avatarInitials: "RY",
    })
    .returning();
  console.log("Created user 1:", user1.name, user1.id);

  const [cad1] = await db
    .insert(cards)
    .values({
      userId: user1.id,
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

  const [usd1] = await db
    .insert(cards)
    .values({
      userId: user1.id,
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

  await db.insert(transactions).values([
    { cardId: cad1.id, type: "interac_send", amount: "-450.00", currency: "CAD", description: "Interac e-Transfer → john@example.com", recipientEmail: "john@example.com", status: "settled", createdAt: new Date("2026-03-24T09:30:00Z") },
    { cardId: cad1.id, type: "interac_receive", amount: "1500.00", currency: "CAD", description: "Interac e-Transfer → My Account", status: "settled", createdAt: new Date("2026-03-22T14:10:00Z") },
    { cardId: cad1.id, type: "interac_send", amount: "-200.00", currency: "CAD", description: "Interac e-Transfer → sara@example.com", recipientEmail: "sara@example.com", status: "settled", createdAt: new Date("2026-03-18T11:45:00Z") },
    { cardId: cad1.id, type: "interac_receive", amount: "3000.00", currency: "CAD", description: "Interac e-Transfer → My Account", status: "settled", createdAt: new Date("2026-03-14T08:00:00Z") },
  ]);

  await db.insert(transactions).values([
    { cardId: usd1.id, type: "bit_send", amount: "-500.00", currency: "USD", description: "BIT Transfer → emailuser2@berkeley.com", recipientEmail: "emailuser2@berkeley.com", status: "settled", createdAt: new Date("2026-03-24T10:14:00Z") },
    { cardId: usd1.id, type: "bit_receive", amount: "1700.41", currency: "USD", description: "BIT Transfer → My Account", status: "settled", createdAt: new Date("2026-03-23T14:58:00Z") },
    { cardId: usd1.id, type: "conversion", amount: "353.05", currency: "USD", description: "CAD → USD Conversion", metadata: "$500 CAD → $353.05 USD", status: "settled", createdAt: new Date("2026-03-21T09:00:00Z") },
    { cardId: usd1.id, type: "bit_send", amount: "-250.00", currency: "USD", description: "BIT Transfer → emailuser1@berkeley.com", recipientEmail: "emailuser1@berkeley.com", status: "settled", createdAt: new Date("2026-03-20T16:30:00Z") },
  ]);

  // ── User 2: Sarah ──
  const [user2] = await db
    .insert(users)
    .values({
      name: "Sarah Chen",
      email: "sarah@berkeleypayment.com",
      passwordHash: hashSync("password123", 10),
      avatarInitials: "SC",
    })
    .returning();
  console.log("Created user 2:", user2.name, user2.id);

  const [cad2] = await db
    .insert(cards)
    .values({
      userId: user2.id,
      currency: "CAD",
      balance: "8250.00",
      panLast4: "7712",
      panFull: "4242 4242 4242 7712",
      cvv: "501",
      expiry: "06/28",
      color: "card-color-pink",
      active: "true",
    })
    .returning();

  const [usd2] = await db
    .insert(cards)
    .values({
      userId: user2.id,
      currency: "USD",
      balance: "3450.00",
      panLast4: "9301",
      panFull: "4242 4242 4242 9301",
      cvv: "628",
      expiry: "09/28",
      color: "card-color-purple",
      active: "false",
    })
    .returning();

  await db.insert(transactions).values([
    { cardId: cad2.id, type: "interac_send", amount: "-750.00", currency: "CAD", description: "Interac e-Transfer → mike@example.com", recipientEmail: "mike@example.com", status: "settled", createdAt: new Date("2026-03-23T10:15:00Z") },
    { cardId: cad2.id, type: "interac_receive", amount: "5000.00", currency: "CAD", description: "Interac e-Transfer → My Account", status: "settled", createdAt: new Date("2026-03-20T09:00:00Z") },
    { cardId: cad2.id, type: "interac_send", amount: "-1200.00", currency: "CAD", description: "Interac e-Transfer → lisa@example.com", recipientEmail: "lisa@example.com", status: "settled", createdAt: new Date("2026-03-17T14:30:00Z") },
    { cardId: cad2.id, type: "interac_receive", amount: "2000.00", currency: "CAD", description: "Interac e-Transfer → My Account", status: "settled", createdAt: new Date("2026-03-12T11:00:00Z") },
  ]);

  await db.insert(transactions).values([
    { cardId: usd2.id, type: "bit_send", amount: "-800.00", currency: "USD", description: "BIT Transfer → vendor@berkeley.com", recipientEmail: "vendor@berkeley.com", status: "settled", createdAt: new Date("2026-03-22T16:45:00Z") },
    { cardId: usd2.id, type: "bit_receive", amount: "2500.00", currency: "USD", description: "BIT Transfer → My Account", status: "settled", createdAt: new Date("2026-03-19T13:20:00Z") },
    { cardId: usd2.id, type: "conversion", amount: "706.10", currency: "USD", description: "CAD → USD Conversion", metadata: "$1000 CAD → $706.10 USD", status: "settled", createdAt: new Date("2026-03-15T10:00:00Z") },
    { cardId: usd2.id, type: "bit_send", amount: "-150.00", currency: "USD", description: "BIT Transfer → partner@berkeley.com", recipientEmail: "partner@berkeley.com", status: "settled", createdAt: new Date("2026-03-13T08:30:00Z") },
  ]);

  console.log("Seeded 16 transactions (8 per user)");
  console.log("\nLogin credentials:");
  console.log("  rahmat@berkeleypayment.com / password123");
  console.log("  sarah@berkeleypayment.com  / password123");
  console.log("Done!");
}

seed().catch(console.error);
