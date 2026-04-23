import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Confiance Tech - Premium Electronics",
  description: "Your trusted source for premium tech products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
