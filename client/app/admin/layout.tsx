"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    WidgetLinear as LayoutDashboard,
    BoxLinear as Package,
    LayersLinear as Layers,
    ShopLinear as Building2,
    DeliveryLinear as Truck,
    LogoutLinear as LogOut,
    HamburgerMenuLinear as Menu,
    BagLinear as ShoppingBasket,
    AltArrowLeftLinear as ChevronLeft,
    UsersGroupRoundedLinear as Users,
    SettingsLinear as Settings,
    ChatDotsLinear as MessageSquare
} from "@solar-icons/react-perf";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/admin/NotificationBell";

// Define navigation items for cleaner rendering
const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "داشبورد", icon: LayoutDashboard },
    { href: "/admin/chat", label: "پشتیبانی", icon: MessageSquare },
    { href: "/admin/users", label: "کاربران", icon: Users },
    { href: "/admin/products", label: "محصولات", icon: Package },
    { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: Layers },
    { href: "/admin/companies", label: "شرکت‌ها", icon: Building2 },
    { href: "/admin/procurement", label: "تدارکات", icon: ShoppingBasket },
    { href: "/admin/delivery", label: "مدیریت تحویل", icon: Truck },
    { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];

function NavItem({ href, activePath, icon: Icon, children, onClick }: any) {
    const router = useRouter();
    const isActive = activePath.startsWith(href);

    return (
        <Button
            variant="ghost"
            className={cn(
                "w-full justify-start gap-3 font-normal transition-all duration-200",
                isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary border-r-4 border-primary rounded-none rounded-l-md"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            )}
            onClick={() => {
                router.push(href);
                if (onClick) onClick();
            }}
        >
            <Icon size={20} />
            <span className="text-sm">{children}</span>
            {isActive && <ChevronLeft size={16} className="mr-auto opacity-50" />}
        </Button>
    );
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoadingUser } = useAppContext();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/auth');
    };

    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <LoadingSpinner message="در حال بررسی دسترسی..." />
            </div>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-sm border text-center max-w-md w-full">
                    <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-slate-800">دسترسی محدود</h1>
                    <p className="text-slate-500 mb-6">شما اجازه ورود به پنل مدیریت را ندارید.</p>
                    <Button onClick={() => router.push('/')} className="w-full">
                        بازگشت به صفحه اصلی
                    </Button>
                </div>
            </div>
        );
    }

    // Find current page title
    const currentPage = NAV_ITEMS.find(item => pathname.startsWith(item.href))?.label || "پنل مدیریت";

    // Reusable Sidebar Content
    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <div className="flex flex-col h-full bg-white">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20">
                    <ShoppingBasket size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-lg text-slate-900">بهار نارون</h2>
                    <p className="text-xs text-slate-500">پنل مدیریت فروشگاه</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-xs font-semibold text-slate-400 px-4 py-2 mb-2">منوی اصلی</p>
                {NAV_ITEMS.map((item) => (
                    <NavItem
                        key={item.href}
                        href={item.href}
                        activePath={pathname}
                        icon={item.icon}
                        onClick={onNavClick}
                    >
                        {item.label}
                    </NavItem>
                ))}
            </nav>

            {/* User Profile Summary in Sidebar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {user.name ? user.name[0] : 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{user.name || 'مدیر سیستم'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.phone}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row" dir="rtl">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white border-l border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-30 shadow-sm">
                <SidebarContent />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen transition-all">
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="-mr-2">
                                        <Menu className="h-5 w-5 text-slate-600" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="p-0 w-72">
                                    <SidebarContent />
                                </SheetContent>
                            </Sheet>
                        </div>
                        <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                            {currentPage}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors gap-2"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">خروج از حساب</span>
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
