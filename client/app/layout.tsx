// FILE: app/layout.tsx (Updated with Leaflet CSS and Yekan Font)
// Import necessary modules and components
import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Arad } from "@/lib/fonts"; // Import the font
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import GlobalLoader from "@/components/layout/GlobalLoader";
import { ToastProvider } from "@/components/ui/toast-notification";

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

//Define metadata for the application
export const metadata: Metadata = {
  title: "فروشگاه بهار نارون",
  description: "اپلیکیشن سفارش عمده مواد غذایی برای فروشگاه‌های کوچک",
  icons: {
    icon: "/logo.png",
  }
};

// Root layout component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${Arad.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <SpeedInsights />
        <Analytics />
        <ToastProvider>
          <AppProvider>
            <GlobalLoader />
            {children}
          </AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
