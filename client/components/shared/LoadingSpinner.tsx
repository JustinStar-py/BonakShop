interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "لطفاً چند لحظه صبر کنید..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <div className="loader3"></div>
      <p className="mt-12 text-md font-medium text-gray-800">{message}</p>
    </div>
  );
}