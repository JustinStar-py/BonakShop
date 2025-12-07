"use client";

import { Category } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface CategoryScrollerProps {
  categories: Category[];
}

export default function CategoryScroller({
  categories,
}: CategoryScrollerProps) {
  return (
    <div className="mb-2 border-b border-gray-300">
      <div
        className="flex gap-5 overflow-x-auto px-4 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?categoryId=${c.id}`}
            className="flex flex-col items-center flex-shrink-0 gap-2 cursor-pointer group opacity-90 hover:opacity-100"
          >
            {/* کانتینر حلقه‌ها */}
            <div className="relative">
              {/* حلقه گرادینت (خارجی‌ترین) - Updated to green-500 as per recent changes */}
              <div className="p-[1px] rounded-2xl bg-stone-300 transition-all duration-300 shadow-sm group-hover:shadow-md">
                {/* فاصله بین گرادینت و فیلی */}
                <div className="bg-white rounded-2xl">
                  {/* حلقه فیلی نازک‌تر */}
                  <div className="border-[1px] border-gray-100 rounded-2xl p-[0.5px] group-hover:border-green-200 transition-all duration-300">
                    {/* حلقه سفید داخلی */}
                    <div className="bg-white rounded-2xl">
                      {/* تصویر */}
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-50 relative">
                        {c.image ? (
                          <Image
                            src={c.image}
                            alt={c.name}
                            fill
                            className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl text-gray-400">
                            {c.icon || "📦"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-gray-600 truncate w-16 text-center group-hover:text-green-600 transition-colors">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
