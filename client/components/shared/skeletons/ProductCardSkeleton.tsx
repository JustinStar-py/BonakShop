"use client";

export default function ProductCardSkeleton() {
  return (
    <div className="relative flex h-[230px] flex-col rounded-xl bg-white px-4 pt-4 pb-3 shadow-sm overflow-hidden">
      {/* Image Skeleton */}
      <div className="relative -mx-4 -mt-2 mb-2 flex h-32 items-center justify-center">
        <div className="h-24 w-24 rounded-lg bg-gray-100 animate-pulse" />
      </div>

      {/* Badge Skeleton */}
      <div className="absolute top-2 left-2 h-5 w-10 rounded-full bg-gray-100 animate-pulse" />

      {/* Title Skeleton */}
      <div className="mb-1 flex flex-col items-end gap-1 px-1 min-h-[34px]">
        <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
      </div>

      {/* Price Skeleton */}
      <div className="mt-auto flex items-end justify-end gap-1">
        <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
        <div className="h-5 w-20 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
