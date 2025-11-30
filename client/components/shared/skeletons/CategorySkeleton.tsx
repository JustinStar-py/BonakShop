"use client";

export default function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-16 w-16 rounded-full bg-gray-100 animate-pulse" />
      <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
    </div>
  );
}
