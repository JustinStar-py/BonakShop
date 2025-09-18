// FILE: app/(main)/profile/complete/page.tsx (New Path)
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 animate-pulse rounded-md flex items-center justify-center"><p>در حال بارگذاری نقشه...</p></div>
});

export default function CompleteProfilePage() {
    const { user, setUser, isLoadingUser } = useAppContext();
    const router = useRouter();
    
    const [formData, setFormData] = useState({ name: "", shopName: "", shopAddress: "", landline: "", latitude: null as number | null, longitude: null as number | null });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

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
        return <LoadingSpinner message="در حال بارگذاری..." />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle>خوش آمدید!</CardTitle>
                    <CardDescription>برای استفاده از خدمات، لطفاً اطلاعات پروفایل خود را تکمیل کنید.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInfoSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="name">نام و نام خانوادگی</Label><Input id="name" name="name" value={formData.name} onChange={handleInfoChange} required/></div>
                            <div className="space-y-2"><Label htmlFor="shopName">نام فروشگاه</Label><Input id="shopName" name="shopName" value={formData.shopName} onChange={handleInfoChange} required/></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="shopAddress">آدرس دقیق فروشگاه</Label><Textarea id="shopAddress" name="shopAddress" value={formData.shopAddress || ''} onChange={handleInfoChange} required/></div>
                        <div className="space-y-2"><Label htmlFor="landline">تلفن ثابت (اختیاری)</Label><Input id="landline" name="landline" value={formData.landline || ''} onChange={handleInfoChange} /></div>
                        <div className="space-y-2"><Label>موقعیت مکانی روی نقشه (اختیاری)</Label><MapPicker onLocationChange={handleLocationChange} /></div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : "ذخیره و ادامه"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
