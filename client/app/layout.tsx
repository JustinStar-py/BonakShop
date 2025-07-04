// FILE: app/layout.tsx (Reverted to original state)
import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "فروشگاه عمده‌فروشی",
  description: "اپلیکیشن سفارش عمده مواد غذایی برای فروشگاه‌های کوچک",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}