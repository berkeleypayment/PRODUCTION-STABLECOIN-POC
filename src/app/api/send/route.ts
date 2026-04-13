import { NextResponse, after } from "next/server";
import { db } from "@/db";
import { transactions, cards, bitRegistrations, users, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { transferUSDC } from "@/lib/base-network";

// POST /api/send — send money (BIT USD or Interac CAD)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { cardId, amount, currency, recipientEmail, type, message } = body;

  if (!cardId || !amount || !currency || !recipientEmail || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const numAmount = parseFloat(amount);
  if (numAmount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }

  // Verify sender card ownership
  const [senderCard] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!senderCard || senderCard.userId !== session.userId) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // ── Interac CAD: keep the simple flow ──
  if (type === "interac_send") {
    const description = `Interac e-Transfer → ${recipientEmail}`;
    const [tx] = await db
      .insert(transactions)
      .values({
        cardId,
        type: "interac_send",
        amount: `-${numAmount.toFixed(2)}`,
        currency,
        description,
        recipientEmail,
        status: "settled",
        metadata: message || null,
      })
      .returning();
    return NextResponse.json(tx);
  }

  // ── BIT USD flow ──
  if (type !== "bit_send") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Step 1: Look up recipient BIT registration
  const [recipientReg] = await db
    .select()
    .from(bitRegistrations)
    .where(eq(bitRegistrations.email, recipientEmail.toLowerCase().trim()))
    .limit(1);

  if (!recipientReg) {
    return NextResponse.json({ error: "This email is not registered on the BIT Network" }, { status: 404 });
  }

  // Step 2: Prevent sending to own address
  if (recipientReg.userId === session.userId) {
    return NextResponse.json({ error: "This is your own BIT Network address" }, { status: 400 });
  }

  // Step 3: Get recipient card (must be USD)
  const [recipientCard] = await db.select().from(cards).where(eq(cards.id, recipientReg.cardId));
  if (!recipientCard) {
    return NextResponse.json({ error: "Recipient card not found" }, { status: 404 });
  }

  // Step 4: Get sender and recipient users + companies for wallet info
  const [senderUser] = await db.select().from(users).where(eq(users.id, session.userId));
  const [recipientUser] = await db.select().from(users).where(eq(users.id, recipientReg.userId));
  if (!senderUser || !recipientUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [senderCompany] = await db.select().from(companies).where(eq(companies.id, senderUser.companyId));
  const [recipientCompany] = await db.select().from(companies).where(eq(companies.id, recipientUser.companyId));
  if (!senderCompany || !recipientCompany) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const senderPrivateKey = process.env[senderCompany.privateKeyEnvVarName];
  const recipientAddress = process.env[recipientCompany.baseWalletAddressEnvVarName];
  if (!senderPrivateKey || !recipientAddress) {
    return NextResponse.json({ error: "Wallet configuration missing" }, { status: 500 });
  }

  // Step 5: Check sender balance on Berkeley
  const baseUrl = process.env.BERKELEY_BASE_URL;
  const token = process.env.BERKELEY_PRIVATE_TOKEN;

  const balRes = await fetch(
    `${baseUrl}/api/v1/card_issuing/accounts/${senderCard.accountId}/balance`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!balRes.ok) {
    return NextResponse.json({ error: "Failed to check balance" }, { status: 502 });
  }
  const balData = await balRes.json();
  const available = parseFloat(balData.data.available_balance);
  if (available < numAmount) {
    return NextResponse.json({ error: `Insufficient balance. Available: $${available.toFixed(2)}` }, { status: 400 });
  }

  // Step 6: Unload sender card
  const unloadCents = Math.round(numAmount * 100);
  const unloadRes = await fetch(`${baseUrl}/api/v1/card_issuing/value_loads/unload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      account_id: Number(senderCard.accountId),
      amount: unloadCents,
      message: `BIT Transfer to ${recipientEmail}`,
    }),
  });
  if (!unloadRes.ok && unloadRes.status !== 201) {
    return NextResponse.json({ error: "Failed to unload sender card" }, { status: 502 });
  }

  // Step 7: Create sender transaction (pending)
  const [senderTx] = await db
    .insert(transactions)
    .values({
      cardId: senderCard.id,
      type: "bit_send",
      amount: `-${numAmount.toFixed(2)}`,
      currency: "USD",
      description: `BIT Transfer → ${recipientEmail}`,
      recipientEmail,
      status: "pending",
      metadata: message || null,
    })
    .returning();

  // Step 8: Async — base network transfer, load recipient, create recipient tx, settle sender tx
  after(async () => {
    try {
      // 8a: Move USDC on Base from sender company wallet → recipient company wallet
      const { txHash } = await transferUSDC({
        senderPrivateKey,
        recipientAddress,
        amountUsd: numAmount.toFixed(2),
      });

      // 8b: Load recipient card on Berkeley
      const loadCents = Math.round(numAmount * 100);
      const loadRes = await fetch(`${baseUrl}/api/v1/card_issuing/value_loads/load`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_id: Number(recipientCard.accountId),
          amount: loadCents,
          message: `BIT Transfer from ${senderUser.email}`,
        }),
      });
      if (!loadRes.ok && loadRes.status !== 201) {
        throw new Error("Failed to load recipient card");
      }

      // 8c: Create recipient transaction (settled)
      await db.insert(transactions).values({
        cardId: recipientCard.id,
        type: "bit_receive",
        amount: numAmount.toFixed(2),
        currency: "USD",
        description: `BIT Transfer ← ${senderUser.email}`,
        recipientEmail: senderUser.email,
        status: "settled",
        metadata: `Base tx: ${txHash}`,
      });

      // 8d: Update sender transaction to settled
      await db
        .update(transactions)
        .set({ status: "settled", metadata: `Base tx: ${txHash}`, updatedAt: new Date() })
        .where(eq(transactions.id, senderTx.id));
    } catch (err) {
      console.error("BIT send async flow failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);

      // Refund sender card by reloading the original amount
      let refundOk = false;
      try {
        const refundRes = await fetch(`${baseUrl}/api/v1/card_issuing/value_loads/load`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            account_id: Number(senderCard.accountId),
            amount: unloadCents,
            message: `Refund failed BIT transfer to ${recipientEmail}`,
          }),
        });
        refundOk = refundRes.ok || refundRes.status === 201;
      } catch (refundErr) {
        console.error("Refund failed:", refundErr);
      }

      // Mark sender tx as failed with net zero amount
      await db
        .update(transactions)
        .set({
          status: "failed",
          amount: "0.00",
          metadata: refundOk
            ? `Failed: ${errMsg} — refunded`
            : `Failed: ${errMsg} — REFUND FAILED, manual review required`,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, senderTx.id));
    }
  });

  return NextResponse.json(senderTx, { status: 202 });
}
