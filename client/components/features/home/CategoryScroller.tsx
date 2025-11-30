"use client";

import { Category } from "@/types";
import Image from "next/image";

interface CategoryScrollerProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export default function CategoryScroller({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryScrollerProps) {
  return (
    <div className="py-4 mb-2 border-b border-gray-300">
      <div
        className="flex gap-5 overflow-x-auto px-4 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((c) => (
          <div
            key={c.id}
            className={`flex flex-col items-center flex-shrink-0 gap-2 cursor-pointer group ${
              selectedCategory === c.id ? "opacity-100" : "opacity-80 hover:opacity-100"
            }`}
            onClick={() => onSelectCategory(c.id)}
          >
            {/* کانتینر حلقه‌ها */}
            <div className="relative">
              {/* حلقه گرادینت (خارجی‌ترین) - Updated to green-500 as per recent changes */}
              <div className="p-[2px] rounded-full bg-green-500 transition-all duration-300 shadow-sm group-hover:shadow-md">
                {/* فاصله بین گرادینت و فیلی */}
                <div className="bg-white p-[1.5px] rounded-full">
                  {/* حلقه فیلی نازک‌تر */}
                  <div className="border-[1px] border-gray-300 rounded-full p-[1px] group-hover:border-green-500 transition-all duration-300">
                    {/* حلقه سفید داخلی */}
                    <div className="bg-white p-[2px] rounded-full">
                      {/* تصویر */}
                      <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-50 relative">
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
          </div>
        ))}
      </div>
    </div>
  );
}
