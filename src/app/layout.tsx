import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Berkeley Payments",
  description: "Stablecoin POC – Berkeley Payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="logo">
            <div className="logo-mark">B</div>
            Berkeley Payments
          </div>
          <div className="avatar">RY</div>
        </header>
        {children}
      </body>
    </html>
  );
}
