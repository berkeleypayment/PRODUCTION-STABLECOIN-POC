import { pgTable, uuid, varchar, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";

/* ── Enums ── */
export const currencyEnum = pgEnum("currency", ["CAD", "USD"]);
export const txStatusEnum = pgEnum("tx_status", ["pending", "settled", "failed"]);
export const txTypeEnum = pgEnum("tx_type", [
  "bit_send",
  "bit_receive",
  "interac_send",
  "interac_receive",
  "interac_request",
  "conversion",
]);

/* ── Users ── */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  avatarInitials: varchar("avatar_initials", { length: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── Cards ── */
export const cards = pgTable("cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  cardholderId: varchar("cardholder_id", { length: 32 }).notNull(),
  accountId: varchar("account_id", { length: 32 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  panLast4: varchar("pan_last4", { length: 4 }).notNull(),
  expiry: varchar("expiry", { length: 5 }).notNull(),
  color: varchar("color", { length: 32 }).notNull(),
  active: varchar("active", { length: 5 }).notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── Transactions ── */
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id").references(() => cards.id).notNull(),
  type: txTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  status: txStatusEnum("status").notNull().default("pending"),
  metadata: varchar("metadata", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── BIT Network Registrations ── */
export const bitRegistrations = pgTable("bit_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  cardId: uuid("card_id").references(() => cards.id).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  accountId: varchar("account_id", { length: 32 }).notNull(),
  extTag: varchar("ext_tag", { length: 32 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
