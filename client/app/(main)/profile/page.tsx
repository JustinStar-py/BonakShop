"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import dynamic from 'next/dynamic';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, User, ShieldCheck, MapPin, LogOut, ChevronLeft, Store, Phone } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toPersianDigits from "@/utils/persianNum";

// MapPicker dynamic import
const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 text-sm">در حال بارگذاری نقشه...</div>
});

type ViewState = 'DASHBOARD' | 'EDIT_INFO' | 'CHANGE_PASS';

export default function ProfilePage() {
    const { user, setUser, isLoadingUser, logout } = useAppContext();
    const router = useRouter();
    
    // مدیریت نمای فعلی (داشبورد یا فرم‌ها)
    const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
    
    const [formData, setFormData] = useState({ name: "", shopName: "", shopAddress: "", landline: "", latitude: null as number | null, longitude: null as number | null });
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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

    // پاک کردن پیام‌ها هنگام تغییر ویو
    useEffect(() => {
        setError("");
        setSuccess("");
    }, [currentView]);

    const handleInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationChange = (lat: number, lng: number) => {
        setFormData({ ...formData, latitude: lat, longitude: lng });
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };
    
    const handleInfoSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(""); setSuccess("");
        try {
            const res = await apiClient.put('/user/profile', formData);
            setUser(res.data);
            setSuccess("اطلاعات با موفقیت به‌روز شد.");
            // بعد از ۱ ثانیه برگرد به داشبورد
            setTimeout(() => setCurrentView('DASHBOARD'), 1500);
        } catch (err: any) { 
            setError(err.response?.data?.error || "خطا در ذخیره اطلاعات"); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 6) {
            setError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد."); return;
        }
        if (passwordData.newPassword !== passwordData.confirmNewPassword) { 
            setError("رمز عبور جدید و تکرار آن مطابقت ندارند."); return; 
        }
        setIsLoading(true); setError(""); setSuccess("");
        try {
            const res = await apiClient.post('/user/change-password', passwordData);
            setSuccess(res.data.message);
            setPasswordData({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
            setTimeout(() => setCurrentView('DASHBOARD'), 1500);
        } catch (err: any) { 
            setError(err.response?.data?.error || "خطا در تغییر رمز عبور"); 
        } finally { 
            setIsLoading(false); 
        }
    };
    
    if (isLoadingUser || !user) return <LoadingSpinner message="در حال بارگذاری..." />;
    
    const initialMapPosition = (user.latitude && user.longitude) ? [user.latitude, user.longitude] as [number, number] : undefined;

    // --- RENDER: VIEW 1 - DASHBOARD ---
    if (currentView === 'DASHBOARD') {
        return (
            <div className="pb-24 min-h-screen bg-gray-50">
                {/* Header Card */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white pt-8 pb-12 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                     <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                             <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">{user.name || "کاربر جدید"}</h1>
                            <p className="text-teal-100 text-sm mt-1 flex items-center gap-1 opacity-90">
                                <Phone className="w-3 h-3" />
                                {toPersianDigits(Number(user.phone))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="px-4 -mt-6 relative z-20 space-y-3">
                    <button onClick={() => setCurrentView('EDIT_INFO')} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Store className="w-5 h-5" /></div>
                            <span className="text-sm font-medium text-gray-700">اطلاعات فروشگاه و آدرس</span>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </button>

                    <button onClick={() => setCurrentView('CHANGE_PASS')} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><ShieldCheck className="w-5 h-5" /></div>
                            <span className="text-sm font-medium text-gray-700">امنیت و تغییر رمز عبور</span>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
                    </button>

                    <button onClick={logout} className="w-full bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 text-red-600 mt-8 hover:bg-red-100 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold text-sm">خروج از حساب</span>
                    </button>
                    
                    <div className="text-center pt-6 text-gray-400 text-xs">
                         BonakShop App v1.0.0
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: VIEW 2 & 3 - FORMS ---
    const isEditInfo = currentView === 'EDIT_INFO';
    const title = isEditInfo ? "اطلاعات فروشگاه" : "تغییر رمز عبور";

    return (
        <div className="pb-20 min-h-screen bg-white">
            <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 p-4 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100" onClick={() => setCurrentView('DASHBOARD')}>
                    <ArrowRight className="h-6 w-6 text-gray-700" />
                </Button>
                <h1 className="text-md font-bold text-gray-800">{title}</h1>
            </header>

            <main className="p-6">
                {isEditInfo ? (
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
                            <Label className="flex items-center gap-2 text-gray-600"><MapPin size={16}/> موقعیت روی نقشه</Label>
                            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                <MapPicker onLocationChange={handleLocationChange} initialPosition={initialMapPosition} />
                            </div>
                        </div>
                        
                        <div className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-md shadow-lg shadow-teal-200" disabled={isLoading}>
                                {isLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                         <div className="space-y-2">
                            <Label htmlFor="oldPassword">رمز عبور فعلی</Label>
                            <Input type="password" id="oldPassword" name="oldPassword" required value={passwordData.oldPassword} onChange={handlePasswordChange} className="h-12 rounded-xl" />
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl text-blue-700 text-xs leading-5 mb-2">
                            رمز عبور جدید باید حداقل ۶ کاراکتر باشد و شامل حروف و اعداد باشد تا امنیت بیشتری داشته باشد.
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">رمز عبور جدید</Label>
                            <Input type="password" id="newPassword" name="newPassword" required value={passwordData.newPassword} onChange={handlePasswordChange} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword">تکرار رمز عبور جدید</Label>
                            <Input type="password" id="confirmNewPassword" name="confirmNewPassword" required value={passwordData.confirmNewPassword} onChange={handlePasswordChange} className="h-12 rounded-xl" />
                        </div>
                        <div className="pt-4">
                            <Button type="submit" className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-md shadow-lg shadow-orange-200" disabled={isLoading}>
                                {isLoading ? "در حال تغییر..." : "تغییر رمز عبور"}
                            </Button>
                        </div>
                    </form>
                )}

                {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 text-center animate-in fade-in slide-in-from-bottom-2">{error}</div>}
                {success && <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100 text-center animate-in fade-in slide-in-from-bottom-2">{success}</div>}
            </main>
        </div>
    );
}