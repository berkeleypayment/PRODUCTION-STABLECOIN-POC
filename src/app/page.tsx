"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ── SVG icons ── */
const CopySvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const EyeSvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffSvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const CheckSvg = () => <span>✓</span>;

/* ── Types ── */
interface CardData {
  id: string;
  currency: "CAD" | "USD";
  panLast4: string;
  expiry: string;
  color: string;
  active: string;
  accountId: string;
  cardholderId: string;
}

/* ── Helpers ── */
function fmtRaw(r: string) {
  return (parseInt(r || "0") / 100).toFixed(2);
}

function useNumpad() {
  const [raw, setRaw] = useState("");
  const press = (d: string) => setRaw((r) => (r.length >= 7 ? r : r + d));
  const del = () => setRaw((r) => r.slice(0, -1));
  const reset = () => setRaw("");
  // Set raw from a typed dollar amount (e.g. "12.50" → "1250")
  const setFromAmount = (val: string) => {
    // Strip everything except digits and decimal
    const cleaned = val.replace(/[^\d.]/g, "");
    if (!cleaned) { setRaw(""); return; }
    const [intPart = "0", decPart = ""] = cleaned.split(".");
    const dec = (decPart + "00").slice(0, 2);
    const combined = (intPart + dec).replace(/^0+/, "") || "0";
    setRaw(combined.slice(0, 7));
  };
  return { raw, formatted: fmtRaw(raw), press, del, reset, setFromAmount };
}

/* ── Editable amount input (synced with numpad raw state) ── */
function AmountInput({ formatted, onChange }: { formatted: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={formatted}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => { if (e.target.value === "0.00") e.target.select(); }}
      style={{
        fontSize: 46,
        fontWeight: 700,
        letterSpacing: "-2.5px",
        color: "var(--text)",
        fontFamily: "var(--mono)",
        background: "transparent",
        border: "none",
        outline: "none",
        textAlign: "center",
        width: "100%",
        padding: 0,
        margin: 0,
      }}
    />
  );
}

/* ── Numpad component ── */
function Numpad({ onPress, onDel }: { onPress: (d: string) => void; onDel: () => void }) {
  return (
    <div className="numpad">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
        <div key={d} className="nk" onClick={() => onPress(d)}>{d}</div>
      ))}
      <div className="nk ghost" />
      <div className="nk" onClick={() => onPress("0")}>0</div>
      <div className="nk del" onClick={onDel}>⌫</div>
    </div>
  );
}

/* ── Copy button with check feedback ── */
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className={className || "copy-btn"} onClick={copy}>
      {copied ? <CheckSvg /> : <CopySvg />}
    </button>
  );
}

/* ── Toast ── */
function Toast({ message }: { message: string | null }) {
  return <div className={`toast ${message ? "show" : ""}`}>{message}</div>;
}

/* ── MC Logo ── */
function MCLogo({ small }: { small?: boolean }) {
  const cls = small ? "mc-logo-sm" : "mc-logo";
  return (
    <div className={cls}>
      <div className="c1" />
      <div className="c2" />
    </div>
  );
}

function VisaLogo({ small }: { small?: boolean }) {
  const w = small ? 40 : 56;
  const h = small ? 13 : 18;
  return (
    <svg width={w} height={h} viewBox="0 0 256 83" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M97.2 0.3L64 82.4H42.4L26.2 13.3C25.3 9.5 24.4 8.1 21.5 6.5C16.7 3.8 8.9 1.4 2 0L2.4 0.3H35.3C39.5 0.3 43.2 3 44.1 7.8L51.9 49.6L73.1 0.3H97.2ZM183.5 55.6C183.6 32.7 157 31.5 157.2 21.7C157.3 18.8 160.1 15.7 166.1 14.9C169.1 14.5 177.6 14.2 187.2 18.7L191 1.9C186.9 0.4 181.5 -1 174.7 -1C151.9 -1 135.6 10.5 135.5 25.6C135.4 36.7 145.4 42.9 153 46.6C160.8 50.4 163.5 52.8 163.5 56.2C163.4 61.3 157.4 63.6 151.7 63.7C141 63.9 134.8 61 129.9 58.6L126 76C131 78.3 140.5 80.3 150.4 80.4C174.7 80.4 190.7 69 183.5 55.6ZM228.7 82.4H247.5L231.2 0.3H218.8C215.1 0.3 212 2.4 210.6 5.6L181.6 82.4H202.1L206.1 71.7H231.3L228.7 82.4ZM211.5 56.1L221.8 27.2L227.7 56.1H211.5ZM128.2 0.3L111.3 82.4H91.8L108.7 0.3H128.2Z" fill="white"/>
    </svg>
  );
}

function CardLogo({ currency, small, allVisa }: { currency: string; small?: boolean; allVisa?: boolean }) {
  if (allVisa) return <VisaLogo small={small} />;
  return currency === "USD" ? <VisaLogo small={small} /> : <MCLogo small={small} />;
}

/* ══════════════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatarInitials: string } | null>(null);
  const [userCards, setUserCards] = useState<CardData[]>([]);
  const [allVisaLogo, setAllVisaLogo] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [activeCard, setActiveCard] = useState(0);
  const [usdUnlocked, setUsdUnlocked] = useState(false);
  const [panVisible, setPanVisible] = useState(false);
  const [cvvVisible, setCvvVisible] = useState(false);
  const [revealedPan, setRevealedPan] = useState<string | null>(null);
  const [revealedCvv, setRevealedCvv] = useState<string | null>(null);
  const [sensitiveLoading, setSensitiveLoading] = useState(false);
  const sensitiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cards and balances
  const loadCards = useCallback(async () => {
    const res = await fetch("/api/cards");
    if (!res.ok) return;
    const data: CardData[] = await res.json();
    setUserCards(data);
    setUsdUnlocked(data.some((c) => c.currency === "USD"));
    data.forEach((c) => {
      fetch(`/api/balance?cardId=${c.id}`)
        .then((r) => r.json())
        .then((b) => {
          if (b.availableBalance !== undefined) {
            setBalances((prev) => ({ ...prev, [c.id]: b.availableBalance }));
          }
        })
        .catch(() => {});
    });
  }, []);

  // Fetch user and cards on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setUser(u);
        loadCards();
        fetch("/api/config").then((r) => r.json()).then((c) => setAllVisaLogo(c.allVisaLogo)).catch(() => {});
        // Pre-fetch BIT registration status so Receive drawer opens without flicker
        fetch("/api/register").then((r) => r.json()).then((data) => {
          if (data.registered) {
            setBitRegistered(true);
            setBitEmail(data.email);
          } else {
            setBitRegistered(false);
          }
        }).catch(() => setBitRegistered(false));
      })
      .catch(() => router.push("/login"));
  }, [router, loadCards]);

  // Transactions
  const [txs, setTxs] = useState<{ id: string; description: string; amount: string; currency: string; status: string; createdAt: string }[]>([]);

  // Fetch transactions when active card changes
  useEffect(() => {
    if (!userCards.length) return;
    const c = userCards[activeCard];
    if (!c) return;
    fetch(`/api/transactions?cardId=${c.id}`)
      .then((r) => r.json())
      .then((data) => setTxs(Array.isArray(data) ? data : []))
      .catch(() => setTxs([]));
  }, [activeCard, userCards]);

  // Drawers
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Convert state
  const [cadToUsd, setCadToUsd] = useState(true);
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [convertAmt, setConvertAmt] = useState("100");
  const [rateUpdated, setRateUpdated] = useState("Fetching rate…");

  // BIT Network registration state
  const [bitRegistered, setBitRegistered] = useState<boolean | null>(null);
  const [bitEmail, setBitEmail] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regStatus, setRegStatus] = useState<{ type: string; title: string; sub: string } | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Clear sensitive data from memory after 30 seconds
  const scheduleSensitiveClear = useCallback(() => {
    if (sensitiveTimerRef.current) clearTimeout(sensitiveTimerRef.current);
    sensitiveTimerRef.current = setTimeout(() => {
      setRevealedPan(null);
      setRevealedCvv(null);
      setPanVisible(false);
      setCvvVisible(false);
    }, 30_000);
  }, []);

  // Fetch sensitive card details fresh each time (no caching — PCI)
  const fetchAndReveal = useCallback(async () => {
    const current = userCards[activeCard];
    if (!current || sensitiveLoading) return;
    setSensitiveLoading(true);
    try {
      const res = await fetch(`/api/card-details?cardId=${current.id}`);
      if (res.ok) {
        const data = await res.json();
        setRevealedPan(data.cardNumber);
        setRevealedCvv(data.cvv);
        scheduleSensitiveClear();
      }
    } catch {}
    setSensitiveLoading(false);
  }, [userCards, activeCard, sensitiveLoading, scheduleSensitiveClear]);

  const hideSensitive = useCallback(() => {
    setRevealedPan(null);
    setRevealedCvv(null);
    setPanVisible(false);
    setCvvVisible(false);
    if (sensitiveTimerRef.current) clearTimeout(sensitiveTimerRef.current);
  }, []);

  const togglePan = useCallback(() => {
    if (panVisible) {
      hideSensitive();
    } else {
      if (!revealedPan) fetchAndReveal();
      setPanVisible(true);
    }
  }, [panVisible, revealedPan, fetchAndReveal, hideSensitive]);

  const toggleCvv = useCallback(() => {
    if (cvvVisible) {
      hideSensitive();
    } else {
      if (!revealedCvv) fetchAndReveal();
      setCvvVisible(true);
    }
  }, [cvvVisible, revealedCvv, fetchAndReveal, hideSensitive]);

  // Numpads
  const usdPad = useNumpad();
  const cadPad = useNumpad();
  const reqPad = useNumpad();

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const closeAll = useCallback(() => {
    setOpenDrawer(null);
    setModalOpen(false);
  }, []);

  // ── Card switching ──
  const bringToFront = useCallback((idx: number) => {
    if (idx === activeCard) return;
    setRevealedPan(null);
    setRevealedCvv(null);
    setPanVisible(false);
    setCvvVisible(false);
    if (sensitiveTimerRef.current) clearTimeout(sensitiveTimerRef.current);
    setActiveCard(idx);
  }, [activeCard]);

  // ── Fetch rate for convert ──
  const fetchRate = useCallback(async (direction: boolean) => {
    const base = direction ? "CAD" : "USD";
    const quote = direction ? "USD" : "CAD";
    try {
      const res = await fetch(`https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${quote}`);
      const d = await res.json();
      setLiveRate(d[0].rate);
      setRateUpdated("Updated just now");
    } catch {
      setLiveRate(direction ? 0.7061 : 1.417);
      setRateUpdated("Using cached rate");
    }
  }, []);

  // ── Open convert drawer ──
  const openConvertDrawer = useCallback(() => {
    const dir = activeCard === 0;
    setCadToUsd(dir);
    setLiveRate(null);
    setConvertAmt("0.00");
    setOpenDrawer("convert");
    fetchRate(dir);
  }, [activeCard, fetchRate]);

  const swapConvert = useCallback(() => {
    setCadToUsd((prev) => {
      const next = !prev;
      setLiveRate(null);
      fetchRate(next);
      return next;
    });
  }, [fetchRate]);

  // ── Activate USD ──
  const [creatingUsd, setCreatingUsd] = useState(false);

  const activateUSD = useCallback(async () => {
    if (creatingUsd) return;
    setCreatingUsd(true);
    try {
      const res = await fetch("/api/create-usd-card", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Failed to create USD account");
        setCreatingUsd(false);
        return;
      }
      setModalOpen(false);
      showToast("USD account created!");
      await loadCards();
      // Switch to the USD card (should be index 1 now)
      const updatedRes = await fetch("/api/cards");
      if (updatedRes.ok) {
        const updatedCards: CardData[] = await updatedRes.json();
        const usdIdx = updatedCards.findIndex((c) => c.currency === "USD");
        if (usdIdx >= 0) setActiveCard(usdIdx);
      }
    } catch {
      showToast("Something went wrong");
    }
    setCreatingUsd(false);
  }, [creatingUsd, showToast, loadCards]);

  // ── Send USD ──
  const [sendingBit, setSendingBit] = useState(false);

  const doSend = useCallback(async () => {
    const amt = usdPad.formatted;
    const email = (document.getElementById("emailInput") as HTMLInputElement)?.value.trim();
    if (!email || amt === "0.00" || sendingBit) return;

    const usdCard = userCards.find((c) => c.currency === "USD");
    if (!usdCard) return;

    setSendingBit(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: usdCard.id,
          amount: amt,
          currency: "USD",
          recipientEmail: email,
          type: "bit_send",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Send failed");
        setSendingBit(false);
        return;
      }
      closeAll();
      showToast(`$${amt} USD sending via BIT — settles in ~15s`);
      usdPad.reset();
      loadCards();
    } catch {
      showToast("Something went wrong");
    }
    setSendingBit(false);
  }, [usdPad, sendingBit, userCards, closeAll, showToast, loadCards]);

  // ── Send CAD ──
  const doInteracSend = useCallback(() => {
    const amt = cadPad.formatted;
    const rec = (document.getElementById("interacRecipient") as HTMLInputElement)?.value.trim();
    if (!rec || amt === "0.00") return;
    closeAll();
    showToast("$" + amt + " CAD sent via Interac");
    cadPad.reset();
  }, [cadPad, closeAll, showToast]);

  // ── Request CAD ──
  const doInteracRequest = useCallback(() => {
    const amt = reqPad.formatted;
    const rec = (document.getElementById("reqRecipient") as HTMLInputElement)?.value.trim();
    if (!rec || amt === "0.00") return;
    closeAll();
    showToast("Request for $" + amt + " CAD sent via Interac");
    reqPad.reset();
  }, [reqPad, closeAll, showToast]);

  // ── Convert ──
  const [converting, setConverting] = useState(false);

  const doConvert = useCallback(async () => {
    const amt = parseFloat(convertAmt) || 0;
    const r = liveRate || (cadToUsd ? 0.7061 : 1.417);
    const out = (amt * r).toFixed(2);
    const fromC = cadToUsd ? "CAD" : "USD";
    const toC = cadToUsd ? "USD" : "CAD";
    if (converting) return;
    if (amt <= 0) {
      showToast("Amount must be greater than 0");
      return;
    }

    const fromCard = userCards.find((c) => c.currency === fromC);
    const toCard = userCards.find((c) => c.currency === toC);
    if (!fromCard || !toCard) return;

    setConverting(true);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCardId: fromCard.id,
          toCardId: toCard.id,
          amount: amt.toFixed(2),
          rate: r.toString(),
          fromCurrency: fromC,
          toCurrency: toC,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Conversion failed");
        setConverting(false);
        return;
      }

      closeAll();
      showToast(`Converted $${amt.toFixed(2)} ${fromC} → $${out} ${toC}`);
      // Refresh balances
      loadCards();
    } catch {
      showToast("Something went wrong");
    }
    setConverting(false);
  }, [convertAmt, liveRate, cadToUsd, converting, userCards, closeAll, showToast, loadCards]);

  // ── Register ──
  const doRegister = useCallback(async () => {
    const email = regEmail.trim();
    if (!email || !email.includes("@")) {
      setRegStatus({ type: "error", title: "Invalid email", sub: "Please enter a valid email address." });
      return;
    }

    const usdCard = userCards.find((c) => c.currency === "USD");
    if (!usdCard) return;

    setRegLoading(true);
    setRegStatus({ type: "checking", title: "Registering…", sub: "Linking email to your USD card on the BIT Network." });

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cardId: usdCard.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setRegStatus({ type: "error", title: "Registration failed", sub: data.error || "Something went wrong." });
        setRegLoading(false);
        return;
      }

      setBitRegistered(true);
      setBitEmail(email);
      setRegEmail("");
      setRegStatus({ type: "success", title: "Registered successfully", sub: "Anyone can now send you USD using this email." });
      showToast("Registered on BIT Network");
    } catch {
      setRegStatus({ type: "error", title: "Error", sub: "Something went wrong." });
    }
    setRegLoading(false);
  }, [regEmail, userCards, showToast]);

  // ── Derived values ──
  const card = userCards[activeCard] || null;
  const cardCurrency = card?.currency || "CAD";
  const cardFlag = cardCurrency === "CAD" ? "🇨🇦" : "🇺🇸";
  const cardBal = card ? (balances[card.id] !== undefined ? `$${parseFloat(balances[card.id]).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Loading…") : "—";
  const maskedNum = card ? `★★★★  ★★★★  ★★★★  ${card.panLast4}` : "";
  const txTitle = card ? `${cardCurrency} Transactions` : "Transactions";
  const rate = liveRate || (cadToUsd ? 0.7061 : 1.417);
  const convertAmtNum = parseFloat(convertAmt) || 0;
  const convertOut = (convertAmtNum * rate).toFixed(2);
  const fc = cadToUsd ? "CAD" : "USD";
  const tc = cadToUsd ? "USD" : "CAD";
  const rateStr = `1 ${fc} = ${rate.toFixed(4)} ${tc}`;

  const handleSend = () => {
    if (activeCard === 0) setOpenDrawer("interacSend");
    else setOpenDrawer("send");
  };
  const handleReceive = () => {
    if (activeCard === 0) {
      setOpenDrawer("interacReceive");
    } else {
      // Fetch BIT registration status before opening
      fetch("/api/register")
        .then((r) => r.json())
        .then((data) => {
          if (data.registered) {
            setBitRegistered(true);
            setBitEmail(data.email);
          } else {
            setBitRegistered(false);
            setBitEmail("");
          }
          setRegEmail("");
          setRegStatus(null);
          setRegLoading(false);
        })
        .catch(() => {});
      setOpenDrawer("receive");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  const firstName = user.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <div className="logo">
          <div className="logo-mark">B</div>
          Berkeley Payments
        </div>
        <div className="avatar" onClick={handleLogout} style={{ cursor: "pointer" }} title="Click to sign out">
          {user.avatarInitials}
        </div>
      </header>

      {/* Overlay */}
      <div className={`overlay ${openDrawer ? "open" : ""}`} onClick={closeAll} />

      {/* ── SEND USD DRAWER ── */}
      <div className={`drawer ${openDrawer === "send" ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">Send USD</div>
          <div className="drawer-close" onClick={closeAll}>✕</div>
        </div>
        <div className="drawer-body">
          <div className="amount-box">
            <div className="amount-label-sm">Amount</div>
            <div className="amount-val" style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span>$</span>
              <AmountInput formatted={usdPad.formatted} onChange={usdPad.setFromAmount} />
            </div>
            <div className="amount-badge">🇺🇸 USD</div>
          </div>
          <Numpad onPress={usdPad.press} onDel={usdPad.del} />
          <div>
            <div className="field-label">Recipient Email</div>
            <input className="input-field" type="email" id="emailInput" placeholder="email@company.com" />
          </div>
          <div className="settlement-info">
            <span className="settlement-icon">⏱</span>
            <span>Transfers typically settle in <strong>up to 15 seconds</strong> via BIT Network.</span>
          </div>
          <button className="btn-primary" onClick={doSend} disabled={sendingBit}>{sendingBit ? "Sending…" : `Send $${usdPad.formatted} USD via BIT`}</button>
        </div>
      </div>

      {/* ── RECEIVE USD DRAWER ── */}
      <div className={`drawer ${openDrawer === "receive" ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">Receive USD</div>
          <div className="drawer-close" onClick={closeAll}>✕</div>
        </div>
        <div className="drawer-body">
          {/* Current BIT registration status */}
          {bitRegistered && (
            <div style={{ background: "var(--purple-l)", border: "1px solid var(--purple-m)", borderRadius: "var(--radius)", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: "var(--purple)", fontSize: 16 }}>✓</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>BIT Network Active</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.5 }}>
                Your USD card is linked to:
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, color: "var(--purple)", marginTop: 4 }}>
                {bitEmail}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
                Anyone on the BIT Network can send you USD using this email. Registering a new email below will replace this one.
              </div>
            </div>
          )}

          {bitRegistered === false && (
            <>
              <div className="reg-hero">
                <div className="reg-icon">↙</div>
                <div className="reg-hero-title">Register on the BIT Network</div>
                <div className="reg-hero-sub">Link your email to your USD card so anyone on the network can send you money instantly.</div>
              </div>
              <div className="steps">
                <div className="step"><div className="step-num">1</div><div className="step-text"><strong>Enter your email</strong>This becomes your BIT Network address. Anyone who knows it can send you USD.</div></div>
                <div className="step"><div className="step-num">2</div><div className="step-text"><strong>We verify your email</strong>A quick check is run to ensure your address is ready to receive funds.</div></div>
                <div className="step"><div className="step-num">3</div><div className="step-text"><strong>Your account is activated</strong>Transfers sent to your email auto-deposit to this USD card.</div></div>
              </div>
            </>
          )}

          <div>
            <div className="field-label">{bitRegistered ? "Replace with a new email" : "Your Email Address"}</div>
            <input className="input-field" type="email" placeholder="you@company.com" value={regEmail} onChange={(e) => { setRegEmail(e.target.value); setRegStatus(null); }} />
          </div>

          {regStatus && (
            <div className={`status-box visible ${regStatus.type}`}>
              <div className="status-ico">
                {regStatus.type === "checking" ? <div className="spinner" /> : regStatus.type === "success" ? <span style={{ color: "var(--purple)" }}>✓</span> : <span style={{ color: "var(--error)" }}>✗</span>}
              </div>
              <div className="status-msg"><strong>{regStatus.title}</strong><span>{regStatus.sub}</span></div>
            </div>
          )}

          <button className="btn-primary" onClick={doRegister} disabled={regLoading}>
            {regLoading ? "Registering…" : bitRegistered ? "Update BIT Network Address" : "Register via BIT Network"}
          </button>
        </div>
      </div>

      {/* ── CONVERT DRAWER ── */}
      <div className={`drawer ${openDrawer === "convert" ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">Convert {fc} to {tc}</div>
          <div className="drawer-close" onClick={closeAll}>✕</div>
        </div>
        <div className="drawer-body">
          <div className="rate-banner">
            <div>
              <div className="rate-label">Live Exchange Rate</div>
              <div className="rate-sub">{rateUpdated}</div>
            </div>
            <div className="rate-value">{rateStr}</div>
          </div>
          <div className="convert-row">
            <div className="convert-box" style={{ background: "var(--white)" }}>
              <div className="convert-box-label">From · {fc}</div>
              <input type="number" className="convert-input" value={convertAmt} min="0" onFocus={(e) => { if (parseFloat(convertAmt) === 0) { setConvertAmt(""); e.target.select(); } }} onBlur={() => { if (convertAmt === "") setConvertAmt("0.00"); }} onChange={(e) => setConvertAmt(e.target.value)} />
              <div className="convert-box-cur">{(() => { const c = userCards.find((c) => c.currency === fc); return c && balances[c.id] !== undefined ? `Balance: $${parseFloat(balances[c.id]).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Balance: …"; })()}</div>
            </div>
            <div className="swap-icon" onClick={swapConvert}>⇄</div>
            <div className="convert-box">
              <div className="convert-box-label">To · {tc}</div>
              <div className="convert-box-val">${convertOut}</div>
              <div className="convert-box-cur">{(() => { const c = userCards.find((c) => c.currency === tc); return c && balances[c.id] !== undefined ? `Balance: $${parseFloat(balances[c.id]).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Balance: …"; })()}</div>
            </div>
          </div>
          <div className="convert-summary">
            <div className="summary-row"><span className="lbl">Exchange rate</span><span className="val">{rateStr}</span></div>
            <div className="summary-divider" />
            <div className="summary-row"><span className="lbl">You send</span><span className="val">${convertAmtNum.toFixed(2)} {fc}</span></div>
            <div className="summary-row"><span className="lbl">You receive</span><span className="val">${convertOut} {tc}</span></div>
          </div>
          <button className="btn-primary" onClick={doConvert} disabled={converting}>{converting ? "Converting…" : `Convert to ${tc}`}</button>
        </div>
      </div>

      {/* ── CAD SEND DRAWER ── */}
      <div className={`drawer ${openDrawer === "interacSend" ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">Send Money</div>
          <div className="drawer-close" onClick={closeAll}>✕</div>
        </div>
        <div className="drawer-body">
          <div className="amount-box">
            <div className="amount-label-sm">Amount</div>
            <div className="amount-val" style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span>$</span>
              <AmountInput formatted={cadPad.formatted} onChange={cadPad.setFromAmount} />
            </div>
            <div className="amount-badge">🇨🇦 CAD</div>
          </div>
          <Numpad onPress={cadPad.press} onDel={cadPad.del} />
          <div>
            <div className="field-label">Recipient Email or Phone</div>
            <input className="input-field" type="text" id="interacRecipient" placeholder="email@example.com or 416-555-0100" />
          </div>
          <div>
            <div className="field-label">Message (optional)</div>
            <input className="input-field" type="text" id="interacMessage" placeholder="e.g. Rent for March" />
          </div>
          <div className="settlement-info">
            <span className="settlement-icon">⏱</span>
            <span>Transfers typically settle in <strong>up to 30 minutes</strong> via Interac e-Transfer.</span>
          </div>
          <button className="btn-primary" onClick={doInteracSend}>Send ${cadPad.formatted} CAD via Interac</button>
        </div>
      </div>

      {/* ── CAD REQUEST DRAWER ── */}
      <div className={`drawer ${openDrawer === "interacReceive" ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">Request Money</div>
          <div className="drawer-close" onClick={closeAll}>✕</div>
        </div>
        <div className="drawer-body">
          <div className="amount-box">
            <div className="amount-label-sm">Amount</div>
            <div className="amount-val" style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span>$</span>
              <AmountInput formatted={reqPad.formatted} onChange={reqPad.setFromAmount} />
            </div>
            <div className="amount-badge">🇨🇦 CAD</div>
          </div>
          <Numpad onPress={reqPad.press} onDel={reqPad.del} />
          <div>
            <div className="field-label">Request From (Email or Phone)</div>
            <input className="input-field" type="text" id="reqRecipient" placeholder="email@example.com or 416-555-0100" />
          </div>
          <div>
            <div className="field-label">Message (optional)</div>
            <input className="input-field" type="text" id="reqMessage" placeholder="e.g. Split for dinner" />
          </div>
          <button className="btn-primary" onClick={doInteracRequest}>Request ${reqPad.formatted} CAD via Interac</button>
        </div>
      </div>

      {/* ── CREATE USD MODAL ── */}
      <div className={`modal-overlay ${modalOpen ? "open" : ""}`}>
        <div className="modal">
          <div className="modal-icon">💳</div>
          <div className="modal-title">Open a USD Account</div>
          <div className="modal-sub">Add a USD card to send money over the BIT Network and receive USD from anyone instantly.</div>
          <div className="modal-perks">
            <div className="modal-perk"><span className="perk-icon">↗</span> Send USD to anyone by email</div>
            <div className="modal-perk"><span className="perk-icon">↙</span> Receive USD via BIT Network</div>
            <div className="modal-perk"><span className="perk-icon">⇄</span> Convert your CAD balance to USD</div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={activateUSD} disabled={creatingUsd}>{creatingUsd ? "Creating…" : "Create USD Account"}</button>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Maybe later</button>
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <main className="main">
        <div>
          <div className="greeting">{greeting}, {firstName} 👋</div>
          <div className="greeting-sub">{todayStr}</div>
        </div>

        {/* ── Card Stack ── */}
        {card && (
        <div className="card-stack-wrapper">
          <div className="card-stack">
            {/* Peek card (only when multiple cards) */}
            {usdUnlocked && userCards.length > 1 && (() => {
              const otherIdx = activeCard === 0 ? 1 : 0;
              const other = userCards[otherIdx];
              if (!other) return null;
              const otherFlag = other.currency === "CAD" ? "🇨🇦" : "🇺🇸";
              const otherBal = balances[other.id] !== undefined ? `$${parseFloat(balances[other.id]).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "…";
              return (
                <div className={`card-peek ${other.color}`} onClick={() => bringToFront(otherIdx)}>
                  <div className="peek-top">
                    <div className="peek-left">
                      <div className="peek-cur">{otherFlag} {other.currency}</div>
                      <div className="peek-bal">{otherBal}</div>
                    </div>
                    <CardLogo currency={other.currency} small allVisa={allVisaLogo} />
                  </div>
                  <div className="peek-bottom">
                    <div className="peek-num">••••{other.panLast4}</div>
                  </div>
                </div>
              );
            })()}

            {/* Front card */}
            <div className={`card-front ${card.color}`}>
              <div className="card-row1">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="card-badge">{cardFlag} {cardCurrency}</div>
                  <div className="card-bal-top">{cardBal}</div>
                </div>
                <CardLogo currency={cardCurrency} allVisa={allVisaLogo} />
              </div>
              <div className="card-num-row">
                <div className="card-num-text">
                  {panVisible && revealedPan
                    ? revealedPan.replace(/(.{4})/g, "$1  ").trim()
                    : maskedNum}
                </div>
                <button className="card-eye-btn" onClick={togglePan}>
                  {sensitiveLoading ? <div className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", borderTopColor: "white" }} /> : panVisible ? <EyeOffSvg /> : <EyeSvg />}
                </button>
                {panVisible && revealedPan && (
                  <CopyButton text={revealedPan} className="card-mini-btn" />
                )}
              </div>
              <div className="card-row3">
                <div className="card-f">
                  <div className="card-fl">Cardholder</div>
                  <div className="card-fv">{user.name}</div>
                </div>
                <div className="card-f center">
                  <div className="card-fl">CVV</div>
                  <div className="card-frow center">
                    <div className="card-fv">{cvvVisible && revealedCvv ? revealedCvv : "•••"}</div>
                    <button className="card-eye-btn" onClick={toggleCvv}>
                      {sensitiveLoading ? <div className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", borderTopColor: "white" }} /> : cvvVisible ? <EyeOffSvg /> : <EyeSvg />}
                    </button>
                    {cvvVisible && revealedCvv && (
                      <CopyButton text={revealedCvv} className="card-mini-btn" />
                    )}
                  </div>
                </div>
                <div className="card-f right">
                  <div className="card-fl">Expires</div>
                  <div className="card-frow right">
                    <div className="card-fv">{card.expiry}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ── Create USD CTA ── */}
        {!usdUnlocked && (
          <div className="create-usd-cta" onClick={() => setModalOpen(true)}>
            <div className="cta-icon">+</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--purple)" }}>Open a USD Account</div>
              <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 2 }}>Send money instantly via BIT Network</div>
            </div>
            <div style={{ fontSize: 16, color: "var(--purple)", opacity: 0.5, marginLeft: "auto" }}>→</div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className={`quick ${usdUnlocked ? "three" : "two"}`}>
          <div className="q-btn" onClick={handleSend}><span className="q-icon">↗</span> Send</div>
          <div className="q-btn" onClick={handleReceive}><span className="q-icon">↙</span> Receive</div>
          {usdUnlocked && <div className="q-btn" onClick={openConvertDrawer}><span className="q-icon">⇄</span> Convert</div>}
        </div>

        {/* ── Transactions ── */}
        <div className="panel">
          <div className="panel-hd">
            <div className="panel-title">{txTitle}</div>
          </div>
          <div className="tx-list">
            {txs.length === 0 && (
              <div style={{ padding: "20px 8px", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>No transactions yet</div>
            )}
            {txs.map((t) => (
              <div className="tx" key={t.id}>
                <div className="tx-info">
                  <div className="tx-name">{t.description}</div>
                  <div className="tx-date">{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {new Date(t.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="tx-right">
                  <div className="tx-amt">{parseFloat(t.amount) >= 0 ? "+$" : "-$"}{Math.abs(parseFloat(t.amount)).toFixed(2)} {t.currency}</div>
                  <div className="tx-stat">{t.status.charAt(0).toUpperCase() + t.status.slice(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Toast message={toast} />
    </>
  );
}
