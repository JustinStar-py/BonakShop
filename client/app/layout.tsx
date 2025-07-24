// FILE: app/layout.tsx (Updated with Leaflet CSS and Yekan Font)
// Import necessary modules and components
import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Vazirmatn } from "next/font/google"; 
import { Samim } from "@/lib/fonts"; // Import the font

const vazirmatn = Vazirmatn({
  subsets: ["latin", "arabic"],
  variable: "--font-vazir",
});

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Define metadata for the application
export const metadata: Metadata = {
  title: "فروشگاه عمده‌فروشی",
  description: "اپلیکیشن سفارش عمده مواد غذایی برای فروشگاه‌های کوچک",
};

// Root layout component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} font-sans antialiased`}> {/* Apply the font variable */}
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}