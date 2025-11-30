"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "خانه", icon: "home" },
    { href: "/products", label: "محصولات", icon: "box" },
    { href: "/orders", label: "سفارش‌ها", icon: "history" },
    { href: "/cart", label: "سبد خرید", icon: "cart" },
];

const icons = {
    home: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 15L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    ),
    box: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 12L7 12M22 12L17 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 2L12 7M12 22L12 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    ),
    history: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    cart: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.06164 5.64561C3.54324 2.93009 5.75468 1 8.49772 1H15.5023C18.2453 1 20.4568 2.93009 20.9384 5.64561L21.9481 11.6456C22.6148 15.4117 19.8283 18.8 16 18.8H8C4.17166 18.8 1.38519 15.4117 2.05187 11.6456L3.06164 5.64561Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    ),
};

export default function BottomNavigation({ totalCartItems }: { totalCartItems: number }) {
    const pathname = usePathname();
    if (pathname === '/cart') return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl shadow-gray-900/10">
            <nav className="flex justify-around items-center px-2 py-3 relative">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            href={item.href}
                            key={item.href}
                            className="relative flex flex-col items-center justify-center px-5 py-1 transition-all duration-300 active:scale-90"
                        >
                            {/* Top Dot Indicator */}
                            <div className={cn(
                                "absolute -top-1 w-1.5 h-1.5 rounded-full transition-all duration-500",
                                isActive 
                                    ? "bg-green-600 scale-100 opacity-100" 
                                    : "bg-gray-300 scale-0 opacity-0"
                            )} />
                            
                            <div className={cn(
                                "transition-all duration-500 relative",
                                isActive 
                                    ? "text-green-600 scale-110" 
                                    : "text-gray-400 hover:text-gray-600"
                            )}>
                                {isActive && (
                                    <div className="absolute inset-0 bg-green-400 blur-xl opacity-30 animate-pulse" />
                                )}
                                <div className="relative z-10">
                                    {icons[item.icon as keyof typeof icons]}
                                </div>
                            </div>
                            
                            <span className={cn(
                                "text-[10px] mt-1.5 font-medium transition-all duration-300",
                                isActive ? "text-green-600 font-bold scale-105" : "text-gray-500"
                            )}>
                                {item.label}
                            </span>
                            
                            {item.href === '/cart' && totalCartItems > 0 && (
                                <span className="absolute top-0 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-[10px] font-bold text-white ring-2 ring-white shadow-lg">
                                    {totalCartItems}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}