// FILE: app/(main)/profile/page.tsx
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// MapPicker به صورت داینامیک وارد می‌شود تا سمت سرور رندر نشود
const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 animate-pulse rounded-md flex items-center justify-center"><p>در حال بارگذاری نقشه...</p></div>
});

export default function ProfilePage() {
    const { user, setUser, isLoadingUser } = useAppContext();
    const router = useRouter();
    
    // State for form data
    const [formData, setFormData] = useState({ name: "", shopName: "", shopAddress: "", landline: "", latitude: null as number | null, longitude: null as number | null });
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    
    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // وقتی اطلاعات کاربر از کانتکست بارگذاری شد، فرم را با آن پر کن
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

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };
    
    // ارسال فرم اطلاعات پروفایل
    const handleInfoSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(""); setSuccess("");
        try {
            const res = await apiClient.put('/user/profile', formData);
            setUser(res.data); // آپدیت اطلاعات کاربر در کانتکست سراسری
            setSuccess("اطلاعات با موفقیت به‌روز شد.");
        } catch (err: any) { 
            setError(err.response?.data?.error || "خطا در ذخیره اطلاعات"); 
        } finally { 
            setIsLoading(false); 
        }
    };

    // ارسال فرم تغییر رمز عبور
    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 6) {
            setError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmNewPassword) { 
            setError("رمز عبور جدید و تکرار آن مطابقت ندارند."); 
            return; 
        }
        setIsLoading(true); setError(""); setSuccess("");
        try {
            const res = await apiClient.post('/user/change-password', passwordData);
            setSuccess(res.data.message);
            setPasswordData({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
        } catch (err: any) { 
            setError(err.response?.data?.error || "خطا در تغییر رمز عبور"); 
        } finally { 
            setIsLoading(false); 
        }
    };
    
    if (isLoadingUser || !user) {
        return <LoadingSpinner message="در حال بارگذاری اطلاعات..." />;
    }

    const initialMapPosition = (user.latitude && user.longitude) ? [user.latitude, user.longitude] as [number, number] : undefined;

    return (
        <div className="pb-20">
            <header className="sticky top-0 bg-white z-10 p-4 border-b flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowRight className="h-6 w-6" />
                </Button>
                <h1 className="text-md font-bold">پروفایل من</h1>
            </header>

            <main className="p-4 space-y-8">
                <Card>
                    <CardHeader><CardTitle>ویرایش اطلاعات</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleInfoSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="name">نام و نام خانوادگی</Label><Input id="name" name="name" value={formData.name} onChange={handleInfoChange} /></div>
                                <div className="space-y-2"><Label htmlFor="shopName">نام فروشگاه</Label><Input id="shopName" name="shopName" value={formData.shopName} onChange={handleInfoChange} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="shopAddress">آدرس</Label><Textarea id="shopAddress" name="shopAddress" value={formData.shopAddress || ''} onChange={handleInfoChange} /></div>
                            <div className="space-y-2"><Label htmlFor="landline">تلفن ثابت</Label><Input id="landline" name="landline" value={formData.landline || ''} onChange={handleInfoChange} /></div>
                            <div className="space-y-2"><Label>موقعیت مکانی روی نقشه (اختیاری)</Label><MapPicker onLocationChange={handleLocationChange} initialPosition={initialMapPosition} /></div>
                            <Button type="submit" disabled={isLoading}>{isLoading ? "در حال ذخیره..." : "ذخیره اطلاعات"}</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>تغییر رمز عبور</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="oldPassword">رمز عبور فعلی</Label><Input type="password" id="oldPassword" name="oldPassword" required value={passwordData.oldPassword} onChange={handlePasswordChange} /></div>
                            <div className="space-y-2"><Label htmlFor="newPassword">رمز عبور جدید</Label><Input type="password" id="newPassword" name="newPassword" required value={passwordData.newPassword} onChange={handlePasswordChange} /></div>
                            <div className="space-y-2"><Label htmlFor="confirmNewPassword">تکرار رمز عبور جدید</Label><Input type="password" id="confirmNewPassword" name="confirmNewPassword" required value={passwordData.confirmNewPassword} onChange={handlePasswordChange} /></div>
                            <Button type="submit" disabled={isLoading}>{isLoading ? "در حال تغییر..." : "تغییر رمز عبور"}</Button>
                        </form>
                    </CardContent>
                </Card>

                {error && <p className="text-sm text-red-500 text-center p-2 bg-red-100 rounded-md">{error}</p>}
                {success && <p className="text-sm text-green-600 text-center p-2 bg-green-100 rounded-md">{success}</p>}
            </main>
        </div>
    );
}