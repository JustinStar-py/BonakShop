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
import { Loader2, Store, User, MapPin, Phone, CheckCircle2 } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// Dynamic import for Map to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => (
        <div className="h-60 w-full bg-gray-100 animate-pulse rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
            <MapPin size={32} className="opacity-50"/>
            <span className="text-sm">در حال بارگذاری نقشه...</span>
        </div>
    )
});

export default function CompleteProfilePage() {
    const { user, setUser, isLoadingUser } = useAppContext();
    const router = useRouter();
    
    const [formData, setFormData] = useState({ name: "", shopName: "", shopAddress: "", landline: "", latitude: null as number | null, longitude: null as number | null });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // اگر اطلاعات کاربر قبلاً کامل بود، هدایت شود
    useEffect(() => {
        if (user && user.name && user.shopName) {
            router.replace('/');
        }
    }, [user, router]);

    const handleInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationChange = (lat: number, lng: number) => {
        setFormData({ ...formData, latitude: lat, longitude: lng });
    };
    
    const handleInfoSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.shopName || !formData.shopAddress) {
            setError("لطفاً نام، نام فروشگاه و آدرس را تکمیل کنید.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setIsLoading(true); 
        setError("");
        try {
            const res = await apiClient.put('/user/profile', formData);
            setUser(res.data);
            router.replace('/');
        } catch (err: any) { 
            setError(err.response?.data?.error || "خطا در ذخیره اطلاعات"); 
        } finally { 
            setIsLoading(false); 
        }
    };
    
    if (isLoadingUser || !user) {
        return <LoadingSpinner message="در حال بررسی وضعیت حساب..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-8">
            
            {/* Progress Steps */}
            <div className="w-full max-w-lg mb-6 flex items-center justify-center gap-2">
                <div className="flex items-center gap-1 text-teal-600 text-xs font-bold">
                    <CheckCircle2 size={14} /> ثبت‌نام اولیه
                </div>
                <div className="w-12 h-[2px] bg-teal-600 rounded-full"></div>
                <div className="flex items-center gap-1 text-teal-800 text-xs font-black bg-white px-3 py-1 rounded-full shadow-sm border border-teal-100">
                    <Store size={14} /> اطلاعات فروشگاه
                </div>
            </div>

            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-center text-white">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center mb-3 border border-white/30 shadow-inner">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-xl font-bold mb-1">خوش آمدید همکار عزیز!</h1>
                    <p className="text-teal-100 text-xs opacity-90">برای شروع خرید، لطفاً مشخصات فروشگاه خود را وارد کنید.</p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleInfoSubmit} className="space-y-5">
                        
                        {/* Personal & Shop Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-gray-600 flex items-center gap-1"><User size={14}/> نام و نام خانوادگی</Label>
                                <Input 
                                    id="name" name="name" 
                                    value={formData.name} onChange={handleInfoChange} 
                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 transition-all"
                                    placeholder="مثال: علی محمدی"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shopName" className="text-xs font-bold text-gray-600 flex items-center gap-1"><Store size={14}/> نام فروشگاه</Label>
                                <Input 
                                    id="shopName" name="shopName" 
                                    value={formData.shopName} onChange={handleInfoChange} 
                                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 transition-all"
                                    placeholder="مثال: سوپرمارکت امید"
                                    required
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="shopAddress" className="text-xs font-bold text-gray-600 flex items-center gap-1"><MapPin size={14}/> آدرس دقیق</Label>
                            <Textarea 
                                id="shopAddress" name="shopAddress" 
                                value={formData.shopAddress || ''} onChange={handleInfoChange} 
                                className="min-h-[80px] rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 transition-all"
                                placeholder="استان، شهر، خیابان، کوچه، پلاک..."
                                required
                            />
                        </div>

                        {/* Landline */}
                        <div className="space-y-2">
                            <Label htmlFor="landline" className="text-xs font-bold text-gray-600 flex items-center gap-1"><Phone size={14}/> تلفن ثابت (اختیاری)</Label>
                            <Input 
                                id="landline" name="landline" 
                                value={formData.landline || ''} onChange={handleInfoChange} 
                                className="h-12 text-left rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 transition-all"
                                placeholder="مثال: 0913..."
                                type="tel"
                                dir="ltr"
                            />
                        </div>

                        {/* Map */}
                        <div className="space-y-2 pt-2">
                            <Label className="text-xs font-bold text-gray-600 mb-1 block">موقعیت مکانی روی نقشه (برای ارسال دقیق‌تر)</Label>
                            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                <MapPicker onLocationChange={handleLocationChange} height="h-52" />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-md shadow-lg shadow-teal-200 transition-transform active:scale-[0.98]" 
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "ذخیره اطلاعات و ورود"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <p className="text-gray-400 text-[10px] mt-6 text-center">اطلاعات شما نزد ما محفوظ است و فقط برای پردازش سفارشات استفاده می‌شود.</p>
        </div>
    );
}