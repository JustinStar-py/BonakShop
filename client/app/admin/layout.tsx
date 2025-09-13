// FILE: app/admin/layout.tsx
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, ListPlus, Building, Truck as TruckIcon, LogOut } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function NavItem({ href, activePath, icon: Icon, children }: any) {
    const router = useRouter();
    const isActive = activePath.startsWith(href);
    return (
        <Button
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => router.push(href)}
        >
            <Icon /> {children}
        </Button>
    );
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoadingUser } = useAppContext();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/auth'); // Redirect to login page after logout
    };
    
    if (isLoadingUser) {
        return <LoadingSpinner message="در حال بررسی دسترسی..." />;
    }

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">دسترسی غیر مجاز</h1>
                <p>شما اجازه ورود به این بخش را ندارید.</p>
                <Button onClick={() => router.push('/')} className="mt-4">بازگشت به صفحه اصلی</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-foreground flex" dir="rtl">
            <aside className="w-64 bg-card border-l p-4 flex flex-col justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-8 text-center text-card-foreground">پنل ادمین</h2>
                    <nav className="space-y-2">
                        <NavItem href="/admin/dashboard" activePath={pathname} icon={DollarSign}>داشبورد</NavItem>
                        <NavItem href="/admin/products" activePath={pathname} icon={Package}>مدیریت محصولات</NavItem>
                        <NavItem href="/admin/categories" activePath={pathname} icon={ListPlus}>مدیریت دسته‌بندی‌ها</NavItem>
                        <NavItem href="/admin/companies" activePath={pathname} icon={Building}>مدیریت شرکت‌ها</NavItem>
                        <NavItem href="/admin/procurement" activePath={pathname} icon={TruckIcon}>تدارکات</NavItem>
                        <NavItem href="/admin/delivery" activePath={pathname} icon={TruckIcon}>مدیریت تحویل</NavItem>
                    </nav>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                    <LogOut /> خروج
                </Button>
            </aside>
            <main className="flex-1 p-6 overflow-auto">
                {children}
            </main>
        </div>
    );
}