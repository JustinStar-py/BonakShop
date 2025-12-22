"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import dynamic from 'next/dynamic';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RestartLinear as Loader2, ShopLinear as Store, UserLinear as User, MapPointLinear as MapPin, PhoneLinear as Phone, CheckCircleLinear as CheckCircle2, AltArrowRightLinear as ArrowRight, BagLinear as ShoppingBag } from "@solar-icons/react-perf";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// Dynamic import for Map to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => (
        <div className="h-60 w-full bg-gray-100 animate-pulse rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
            <MapPin size={32} className="opacity-50" />
            <span className="text-sm">در حال بارگذاری نقشه...</span>
        </div>
    )
});

export default function CompleteProfilePage() {
    const { user, setUser, isLoadingUser } = useAppContext();
    const router = useRouter();

    const [step, setStep] = useState<1 | 2>(1);
    const [formData, setFormData] = useState({
        userType: "SHOP_OWNER" as "SHOP_OWNER" | "INDIVIDUAL",
        name: "",
        shopName: "",
        shopAddress: "",
        landline: "",
        latitude: null as number | null,
        longitude: null as number | null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Redirect if profile already complete
    useEffect(() => {
        if (user && user.name && (user.userType === "INDIVIDUAL" || user.shopName)) {
            router.replace('/');
        }
    }, [user, router]);

    const handleInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationChange = (lat: number, lng: number) => {
        setFormData({ ...formData, latitude: lat, longitude: lng });
    };

    const handleRoleSelect = (type: "SHOP_OWNER" | "INDIVIDUAL") => {
        setFormData({ ...formData, userType: type });
        setStep(2);
    };

    const handleInfoSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.shopAddress) {
            setError("لطفاً نام و آدرس را تکمیل کنید.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (formData.userType === "SHOP_OWNER" && !formData.shopName) {
            setError("لطفاً نام فروشگاه را وارد کنید.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const res = await apiClient.put('/user/profile', formData);
            setUser(res.data);
            router.replace('/');
        } catch (error) {
            setError(getErrorMessage(error, "خطا در ذخیره اطلاعات"));
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
                <div className={`flex items-center gap-1 text-xs font-bold ${step >= 1 ? "text-green-600" : "text-gray-400"}`}>
                    <CheckCircle2 size={14} /> ثبت‌نام
                </div>
                <div className={`w-12 h-[2px] rounded-full transition-colors ${step >= 2 ? "bg-green-600" : "bg-gray-200"}`}></div>
                <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition-all ${step === 2 ? "text-green-800 bg-white shadow-sm border border-green-100" : "text-gray-400"}`}>
                    {step === 1 ? <User size={14} /> : <Store size={14} />} {step === 1 ? "انتخاب نقش" : "اطلاعات تکمیلی"}
                </div>
            </div>

            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-500">

                {step === 1 ? (
                    // --- STEP 1: Role Selection ---
                    <div className="p-8 text-center animate-in fade-in slide-in-from-right-4">
                        <h1 className="text-xl font-extrabold text-gray-800 mb-2">شما کدام هستید؟</h1>
                        <p className="text-gray-500 text-xs mb-8">لطفاً نوع فعالیت خود را مشخص کنید تا خدمات بهتری دریافت کنید.</p>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleRoleSelect("SHOP_OWNER")}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group text-right"
                            >
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Store size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm mb-1">صاحب فروشگاه هستم</h3>
                                    <p className="text-gray-400 text-[11px]">برای خرید عمده محصولات جهت فروش در مغازه</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleRoleSelect("INDIVIDUAL")}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-right"
                            >
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm mb-1">خریدار شخصی هستم</h3>
                                    <p className="text-gray-400 text-[11px]">برای خرید مایحتاج منزل و مصرف شخصی</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- STEP 2: Info Form ---
                    <div className="animate-in fade-in slide-in-from-right-4">
                        <div className={`p-6 text-center text-white ${formData.userType === 'SHOP_OWNER' ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-blue-600 to-blue-500'}`}>
                            <div className="flex items-center justify-start mb-2">
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8" onClick={() => setStep(1)}>
                                    <ArrowRight size={18} />
                                </Button>
                            </div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center mb-3 border border-white/30 shadow-inner">
                                {formData.userType === 'SHOP_OWNER' ? <Store className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
                            </div>
                            <h1 className="text-xl font-bold mb-1">
                                {formData.userType === 'SHOP_OWNER' ? "اطلاعات فروشگاه" : "اطلاعات شخصی"}
                            </h1>
                            <p className="text-white/90 text-xs opacity-90">
                                {formData.userType === 'SHOP_OWNER'
                                    ? "برای دریافت فاکتور رسمی، مشخصات دقیق را وارد کنید."
                                    : "برای ارسال سفارش، آدرس دقیق خود را وارد کنید."}
                            </p>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleInfoSubmit} className="space-y-5">

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold text-gray-600 flex items-center gap-1"><User size={14} /> نام و نام خانوادگی</Label>
                                        <Input
                                            id="name" name="name"
                                            value={formData.name} onChange={handleInfoChange}
                                            className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all"
                                            placeholder="مثال: علی محمدی"
                                            required
                                        />
                                    </div>

                                    {formData.userType === 'SHOP_OWNER' && (
                                        <div className="space-y-2 animate-in fade-in height-0">
                                            <Label htmlFor="shopName" className="text-xs font-bold text-gray-600 flex items-center gap-1"><Store size={14} /> نام فروشگاه</Label>
                                            <Input
                                                id="shopName" name="shopName"
                                                value={formData.shopName} onChange={handleInfoChange}
                                                className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all"
                                                placeholder="مثال: سوپرمارکت امید"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shopAddress" className="text-xs font-bold text-gray-600 flex items-center gap-1"><MapPin size={14} /> آدرس دقیق</Label>
                                    <Textarea
                                        id="shopAddress" name="shopAddress"
                                        value={formData.shopAddress || ''} onChange={handleInfoChange}
                                        className="min-h-[80px] rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all"
                                        placeholder="استان، شهر، خیابان، کوچه، پلاک..."
                                        required
                                    />
                                </div>

                                {formData.userType === 'SHOP_OWNER' && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <Label htmlFor="landline" className="text-xs font-bold text-gray-600 flex items-center gap-1"><Phone size={14} /> تلفن ثابت (اختیاری)</Label>
                                        <Input
                                            id="landline" name="landline"
                                            value={formData.landline || ''} onChange={handleInfoChange}
                                            className="h-12 text-left rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all"
                                            placeholder="مثال: 021..."
                                            type="tel"
                                            dir="ltr"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs font-bold text-gray-600 mb-1 block">موقعیت مکانی روی نقشه</Label>
                                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                        <MapPicker onLocationChange={handleLocationChange} height="h-52" />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className={`w-full h-12 rounded-xl text-white font-bold text-md shadow-lg transition-transform active:scale-[0.98] ${formData.userType === 'SHOP_OWNER' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : "ذخیره و ورود به فروشگاه"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-gray-400 text-[10px] mt-6 text-center">اطلاعات شما نزد ما محفوظ است و فقط برای پردازش سفارشات استفاده می‌شود.</p>
        </div>
    );
}
