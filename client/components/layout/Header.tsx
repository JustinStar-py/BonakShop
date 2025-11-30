"use client";

import { Button } from "@/components/ui/button";
import { Search, User as UserIcon, Truck, LayoutDashboard, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@/types"; // Assuming User type is in types/index.ts

interface HeaderProps {
  user: User | null;
  cartItemCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function Header({ user, cartItemCount, searchTerm, onSearchChange }: HeaderProps) {
  const router = useRouter();
  const userName = user?.name ? user.name.trim().split(" ")[0] : "کاربر";

  return (
    <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all">
      <div className="flex justify-between items-center px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md border border-gray-200 overflow-hidden flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="بهار نارون"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-gray-500">خوش آمدید</span>
            <span className="text-sm font-bold text-gray-800">{userName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user?.role === "ADMIN" && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100"
              onClick={() => router.push("/admin/dashboard")}
            >
              <LayoutDashboard className="h-5 w-5 text-gray-600" />
            </Button>
          )}
          {user?.role === "WORKER" && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100"
              onClick={() => router.push("/delivery")}
            >
              <Truck className="h-5 w-5 text-gray-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-gray-100"
            onClick={() => router.push("/profile")}
          >
            <UserIcon className="h-6 w-6 text-gray-700" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-gray-100"
            onClick={() => router.push("/cart")}
          >
            <ShoppingBag className="h-6 w-6 text-gray-700" />
            {cartItemCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* SEARCH INPUT */}
      <div className="px-4 pb-3">
        <div className="relative group">
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
          <input
            type="text"
            placeholder="جستجو در هزاران محصول..."
            className="w-full h-10 pr-10 pl-4 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-sm outline-none"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
