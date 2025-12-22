"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { UserLinear, LogoutLinear, PhoneLinear, WalletLinear, HistoryLinear, AltArrowLeftLinear, ShopLinear, MapPointLinear, AltArrowRightLinear, ChatDotsLinear } from "@solar-icons/react-perf";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toPersianDigits from "@/utils/numberFormatter";
import { formatToTomanParts } from "@/utils/currencyFormatter";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 text-sm">در حال بارگذاری نقشه...</div>
});

type ViewState = 'DASHBOARD' | 'EDIT_INFO';

export default function ProfilePage() {
    const { user, setUser, isLoadingUser, logout } = useAppContext();
    const router = useRouter();
    const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        shopName: "",
        shopAddress: "",
        landline: "",
        latitude: null as number | null,
        longitude: null as number | null
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                shopName: user.shopName || "",
                shopAddress: user.shopAddress || "",
                landline: user.landline || "",
                latitude: user.latitude || null,
                longitude: user.longitude || null,
            });
        }
    }, [user]);

    const handleInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationChange = (lat: number, lng: number) => {
        setFormData({ ...formData, latitude: lat, longitude: lng });
    };

    const handleInfoSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(""); setSuccess("");
        try {
            const res = await apiClient.put('/user/profile', formData);
            setUser(res.data);
            setSuccess("اطلاعات با موفقیت به‌روز شد.");
            setTimeout(() => setCurrentView('DASHBOARD'), 1500);
        } catch (error) {
            setError(getErrorMessage(error, "خطا در ذخیره اطلاعات"));
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingUser || !user) return <LoadingSpinner message="در حال بارگذاری..." />;

    const balanceParts = formatToTomanParts(Number(user.balance || 0));
    const initialMapPosition = (user.latitude && user.longitude) ? [user.latitude, user.longitude] as [number, number] : undefined;

    if (currentView === 'EDIT_INFO') {
        return (
            <div className="pb-20 min-h-screen bg-white">
                <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 p-4 border-b flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100" onClick={() => setCurrentView('DASHBOARD')}>
                        <AltArrowRightLinear className="h-6 w-6 text-gray-700" />
                    </Button>
                    <h1 className="text-md font-bold text-gray-800">ویرایش اطلاعات</h1>
                </header>

                <main className="p-6">
                    <form onSubmit={handleInfoSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-600">نام و نام خانوادگی</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInfoChange} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shopName" className="text-gray-600">نام فروشگاه</Label>
                                <Input id="shopName" name="shopName" value={formData.shopName} onChange={handleInfoChange} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="landline" className="text-gray-600">تلفن ثابت</Label>
                            <Input id="landline" name="landline" value={formData.landline || ''} onChange={handleInfoChange} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white" placeholder="021..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shopAddress" className="text-gray-600">آدرس دقیق</Label>
                            <Textarea id="shopAddress" name="shopAddress" value={formData.shopAddress || ''} onChange={handleInfoChange} className="min-h-[100px] rounded-xl bg-gray-50 border-gray-200 focus:bg-white" />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-gray-600"><MapPointLinear size={16} /> موقعیت روی نقشه</Label>
                            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                <MapPicker onLocationChange={handleLocationChange} initialPosition={initialMapPosition} />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white text-md shadow-lg shadow-green-200" disabled={isLoading}>
                                {isLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
                            </Button>
                        </div>
                    </form>
                    {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 text-center animate-in fade-in slide-in-from-bottom-2">{error}</div>}
                    {success && <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100 text-center animate-in fade-in slide-in-from-bottom-2">{success}</div>}
                </main>
            </div>
        );
    }

    return (
        <div className="pb-24 min-h-screen bg-gray-50">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                        <UserLinear className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">{user.name || "کاربر جدید"}</h1>
                        <p className="text-green-100 text-sm mt-1 flex items-center gap-1 opacity-90">
                            <PhoneLinear className="w-3 h-3" />
                            {toPersianDigits(Number(user.phone))}
                        </p>
                    </div>
                </div>
            </div>

            {/* Wallet Card */}
            <div className="px-4 -mt-10 relative z-20 mb-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <WalletLinear className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-sm">کیف پول</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg border-blue-100 text-blue-600 hover:bg-blue-50">
                            افزایش موجودی
                        </Button>
                    </div>
                    <div className="text-center py-4">
                        <span className="text-3xl font-black text-gray-800 tracking-tight">
                            {balanceParts ? balanceParts.amount : "0"}
                        </span>
                        <span className="text-sm text-gray-400 mr-2 font-medium">تومان</span>
                    </div>
                </div>
            </div>

            {/* Menu List */}
            <div className="px-4 space-y-3">
                <button onClick={() => setCurrentView('EDIT_INFO')} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><ShopLinear className="w-5 h-5" /></div>
                        <span className="text-sm font-medium text-gray-700">ویرایش اطلاعات فروشگاه</span>
                    </div>
                    <AltArrowLeftLinear className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </button>

                <button className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><HistoryLinear className="w-5 h-5" /></div>
                        <span className="text-sm font-medium text-gray-700">تاریخچه تراکنش‌ها</span>
                    </div>
                    <AltArrowLeftLinear className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
                </button>

                <button onClick={() => router.push('/chat')} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-50 text-green-600"><ChatDotsLinear className="w-5 h-5" /></div>
                        <span className="text-sm font-medium text-gray-700">پشتیبانی آنلاین</span>
                    </div>
                    <AltArrowLeftLinear className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
                </button>

                <button onClick={logout} className="w-full bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 text-red-600 mt-6 hover:bg-red-100 transition-colors">
                    <LogoutLinear className="w-5 h-5" />
                    <span className="font-bold text-sm">خروج از حساب</span>
                </button>

                <div className="text-center pt-6 text-gray-400 text-xs">
                    Behar Naron App v1.0.0
                </div>
            </div>
        </div>
    );
}
