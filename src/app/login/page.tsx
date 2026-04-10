"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <main className="main" style={{ maxWidth: 400, marginTop: 80 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "var(--purple)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "white",
            margin: "0 auto 16px",
          }}
        >
          B
        </div>
        <div className="greeting">Welcome back</div>
        <div className="greeting-sub">Sign in to Berkeley Payments</div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div>
          <div className="field-label">Email</div>
          <input
            className="input-field"
            type="email"
            placeholder="you@berkeleypayment.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <div className="field-label">Password</div>
          <input
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div
            style={{
              background: "var(--error-b)",
              border: "1px solid #FDA29B",
              borderRadius: "var(--radius)",
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--error)",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

    </main>
  );
}
