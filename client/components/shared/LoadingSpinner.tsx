"use client";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "لطفاً چند لحظه صبر کنید..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white/80 backdrop-blur-sm z-50" dir="rtl">
      {/* استفاده از همان کلاسی که در globals.css داشتید اما در یک کانتینر مرتب */}
      <div className="relative">
          <div className="loader3 scale-75 sm:scale-100"></div>
      </div>
      <p className="mt-8 text-sm font-bold text-gray-600 animate-pulse">{message}</p>
    </div>
  );
}