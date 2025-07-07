// FILE: app/layout.tsx (Updated with Leaflet CSS)
import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

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