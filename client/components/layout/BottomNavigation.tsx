// FILE: components/layout/BottomNavigation.tsx (Updated)
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, History, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navItems = [
    { href: "/", label: "خانه", icon: Home },
    { href: "/products", label: "محصولات", icon: List },
    { href: "/orders", label: "سفارش‌ها", icon: History },
    { href: "/cart", label: "سبد خرید", icon: ShoppingCart },
];

export default function BottomNavigation({ totalCartItems }: { totalCartItems: number }) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-2 flex justify-around shadow-lg z-50">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link
                        href={item.href}
                        key={item.href}
                        className={`flex flex-col items-center justify-center h-16 px-4 rounded-2xl transition-colors duration-300 relative ${isActive ? 'text-blue-500' : 'text-gray-600'}`}
                    >
                        <Icon size={24} />
                        <span className="text-xs mt-1 font-semibold">{item.label}</span>
                        {item.href === '/cart' && totalCartItems > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                                {totalCartItems}
                            </Badge>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}