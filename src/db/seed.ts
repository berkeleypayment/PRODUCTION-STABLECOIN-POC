import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import { users, cards, transactions, bitRegistrations } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const DEMO_USERS = [
  { name: "Rahmat Yousufi", email: "rahmat@berkeleypayment.com", initials: "RY" },
  { name: "Sarah Chen", email: "sarah@berkeleypayment.com", initials: "SC" },
  { name: "James Wilson", email: "james@berkeleypayment.com", initials: "JW" },
  { name: "Emily Zhang", email: "emily@berkeleypayment.com", initials: "EZ" },
  { name: "Michael Torres", email: "michael@berkeleypayment.com", initials: "MT" },
  { name: "Priya Patel", email: "priya@berkeleypayment.com", initials: "PP" },
  { name: "David Kim", email: "david@berkeleypayment.com", initials: "DK" },
  { name: "Olivia Brown", email: "olivia@berkeleypayment.com", initials: "OB" },
  { name: "Carlos Rivera", email: "carlos@berkeleypayment.com", initials: "CR" },
  { name: "Aisha Mohammed", email: "aisha@berkeleypayment.com", initials: "AM" },
  { name: "Ryan O'Connor", email: "ryan@berkeleypayment.com", initials: "RO" },
  { name: "Sophie Martin", email: "sophie@berkeleypayment.com", initials: "SM" },
  { name: "Liam Nguyen", email: "liam@berkeleypayment.com", initials: "LN" },
  { name: "Nina Johansson", email: "nina@berkeleypayment.com", initials: "NJ" },
  { name: "Alex Petrov", email: "alex@berkeleypayment.com", initials: "AP" },
  { name: "Maria Garcia", email: "maria@berkeleypayment.com", initials: "MG" },
  { name: "Hassan Ali", email: "hassan@berkeleypayment.com", initials: "HA" },
  { name: "Julia Schmidt", email: "julia@berkeleypayment.com", initials: "JS" },
  { name: "Kevin Lee", email: "kevin@berkeleypayment.com", initials: "KL" },
  { name: "Rachel Green", email: "rachel@berkeleypayment.com", initials: "RG" },
  { name: "Omar Farouk", email: "omar@berkeleypayment.com", initials: "OF" },
  { name: "Lisa Wang", email: "lisa@berkeleypayment.com", initials: "LW" },
  { name: "Thomas Anderson", email: "thomas@berkeleypayment.com", initials: "TA" },
  { name: "Fatima Zahra", email: "fatima@berkeleypayment.com", initials: "FZ" },
  { name: "Ben Carter", email: "ben@berkeleypayment.com", initials: "BC" },
  { name: "Yuki Tanaka", email: "yuki@berkeleypayment.com", initials: "YT" },
  { name: "Daniel Murphy", email: "daniel@berkeleypayment.com", initials: "DM" },
  { name: "Ava Mitchell", email: "ava@berkeleypayment.com", initials: "AV" },
  { name: "Raj Sharma", email: "raj@berkeleypayment.com", initials: "RS" },
  { name: "Emma Thompson", email: "emma@berkeleypayment.com", initials: "ET" },
  { name: "Lucas Silva", email: "lucas@berkeleypayment.com", initials: "LS" },
  { name: "Chloe Dubois", email: "chloe@berkeleypayment.com", initials: "CD" },
  { name: "Nathan Park", email: "nathan@berkeleypayment.com", initials: "NP" },
  { name: "Isabella Rossi", email: "isabella@berkeleypayment.com", initials: "IR" },
  { name: "Viktor Kozlov", email: "viktor@berkeleypayment.com", initials: "VK" },
  { name: "Zara Khan", email: "zara@berkeleypayment.com", initials: "ZK" },
  { name: "Chris Evans", email: "chris@berkeleypayment.com", initials: "CE" },
  { name: "Mia Johnson", email: "mia@berkeleypayment.com", initials: "MJ" },
  { name: "Ahmed Hassan", email: "ahmed@berkeleypayment.com", initials: "AH" },
  { name: "Grace Liu", email: "grace@berkeleypayment.com", initials: "GL" },
  { name: "Patrick O'Brien", email: "patrick@berkeleypayment.com", initials: "PO" },
  { name: "Diana Popescu", email: "diana@berkeleypayment.com", initials: "DP" },
  { name: "Ethan Wright", email: "ethan@berkeleypayment.com", initials: "EW" },
  { name: "Sakura Ito", email: "sakura@berkeleypayment.com", initials: "SI" },
  { name: "Marcus Reed", email: "marcus@berkeleypayment.com", initials: "MR" },
  { name: "Leila Ahmadi", email: "leila@berkeleypayment.com", initials: "LA" },
  { name: "Jack Robinson", email: "jack@berkeleypayment.com", initials: "JR" },
  { name: "Nadia Volkov", email: "nadia@berkeleypayment.com", initials: "NV" },
  { name: "Sam Taylor", email: "sam@berkeleypayment.com", initials: "ST" },
  { name: "Rosa Hernandez", email: "rosa@berkeleypayment.com", initials: "RH" },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPan4() {
  return String(rand(1000, 9999));
}


function randExpiry() {
  const m = String(rand(1, 12)).padStart(2, "0");
  const y = String(rand(27, 30));
  return `${m}/${y}`;
}


function randDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - rand(1, daysAgo));
  d.setHours(rand(8, 17), rand(0, 59), 0, 0);
  return d;
}

const TX_TEMPLATES_CAD = [
  { type: "interac_send" as const, descFn: (e: string) => `Interac e-Transfer → ${e}`, sign: "-" },
  { type: "interac_receive" as const, descFn: () => "Interac e-Transfer → My Account", sign: "+" },
];

const TX_TEMPLATES_USD = [
  { type: "bit_send" as const, descFn: (e: string) => `BIT Transfer → ${e}`, sign: "-" },
  { type: "bit_receive" as const, descFn: () => "BIT Transfer → My Account", sign: "+" },
];

const RECIPIENT_EMAILS = [
  "john@example.com", "sara@example.com", "mike@example.com",
  "lisa@example.com", "vendor@berkeley.com", "partner@berkeley.com",
  "supplier@example.com", "client@example.com",
];

async function seed() {
  console.log("Seeding database with 50 users...");

  // Clear existing data
  await db.delete(bitRegistrations);
  await db.delete(transactions);
  await db.delete(cards);
  await db.delete(users);

  const passwordHash = hashSync("password123", 10);

  for (let i = 0; i < DEMO_USERS.length; i++) {
    const u = DEMO_USERS[i];

    const [user] = await db
      .insert(users)
      .values({ name: u.name, email: u.email, passwordHash, avatarInitials: u.initials })
      .returning();

    const cadLast4 = randPan4();
    const usdLast4 = randPan4();

    const [cadCard] = await db
      .insert(cards)
      .values({
        userId: user.id,
        cardholderId: "0",
        accountId: "0",
        currency: "CAD",
        panLast4: cadLast4,
        expiry: randExpiry(),
        color: "card-color-pink",
        active: "true",
      })
      .returning();

    const [usdCard] = await db
      .insert(cards)
      .values({
        userId: user.id,
        cardholderId: "0",
        accountId: "0",
        currency: "USD",
        panLast4: usdLast4,
        expiry: randExpiry(),
        color: "card-color-purple",
        active: "false",
      })
      .returning();

    // 4 CAD transactions
    const cadTxs = [];
    for (let t = 0; t < 4; t++) {
      const tmpl = TX_TEMPLATES_CAD[t % 2];
      const amt = rand(100, 2000);
      const recip = RECIPIENT_EMAILS[rand(0, RECIPIENT_EMAILS.length - 1)];
      cadTxs.push({
        cardId: cadCard.id,
        type: tmpl.type,
        amount: `${tmpl.sign}${amt}.00`,
        currency: "CAD" as const,
        description: tmpl.descFn(recip),
        recipientEmail: tmpl.sign === "-" ? recip : null,
        status: "settled" as const,
        createdAt: randDate(30),
      });
    }
    await db.insert(transactions).values(cadTxs);

    // 4 USD transactions
    const usdTxs = [];
    for (let t = 0; t < 4; t++) {
      const tmpl = TX_TEMPLATES_USD[t % 2];
      const amt = rand(100, 1500);
      const recip = RECIPIENT_EMAILS[rand(0, RECIPIENT_EMAILS.length - 1)];
      usdTxs.push({
        cardId: usdCard.id,
        type: tmpl.type,
        amount: `${tmpl.sign}${amt}.00`,
        currency: "USD" as const,
        description: tmpl.descFn(recip),
        recipientEmail: tmpl.sign === "-" ? recip : null,
        status: "settled" as const,
        createdAt: randDate(30),
      });
    }
    await db.insert(transactions).values(usdTxs);

    console.log(`  [${i + 1}/50] ${u.name} (${u.email})`);
  }

  console.log("\nSeeded 50 users, 100 cards, 400 transactions");
  console.log("All passwords: password123");
  console.log("Done!");
}

seed().catch(console.error);
