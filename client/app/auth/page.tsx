// FILE: app/auth/page.tsx (New, Refactored Version)
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
    const { user, login } = useAppContext();
    const router = useRouter();

    const [loginPhone, setLoginPhone] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [registerPhone, setRegisterPhone] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    // اگر کاربر لاگین بود، او را به صفحه اصلی هدایت کن
    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [user, router]);


    const handleTabChange = (tab: string) => {
      setError("");
      setSuccessMessage("");
      setActiveTab(tab);
    }

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        if (registerPassword.length < 6) {
            setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
            return;
        }
        if (registerPassword !== confirmPassword) {
            setError("رمزهای عبور با یکدیگر مطابقت ندارند.");
            return;
        }
        setIsLoading(true);
        setError("");
        setSuccessMessage("");
        try {
            await apiClient.post('/auth/register', { 
                phone: registerPhone, 
                password: registerPassword, 
                confirmPassword 
            });
            setSuccessMessage("ثبت نام با موفقیت انجام شد! لطفاً وارد شوید.");
            setActiveTab("login");
        } catch (err: any) {
            setError(err.response?.data?.error || "خطایی در هنگام ثبت‌نام رخ داد.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccessMessage("");
        try {
            // login function from context handles everything
            const success = await login(loginPhone, loginPassword); 
            if (success) {
                router.replace('/'); // Redirect on successful login
            } else {
                // The error will be set automatically by the context's login function
            }
        } catch (err: any) {
            // This catch is for network errors, the context handles API errors
            setError("خطا در ارتباط با سرور.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4" dir="rtl">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>به بنک‌شاپ خوش آمدید</CardTitle>
                    <CardDescription>برای ادامه وارد شوید یا ثبت‌نام کنید</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">ورود</TabsTrigger>
                            <TabsTrigger value="register">ثبت نام</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4 pt-4">
                                <div className="space-y-2"><Label htmlFor="login-phone">شماره تلفن</Label><Input id="login-phone" type="tel" placeholder="مثال: 09130000000" required value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="login-password">رمز عبور</Label><Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></div>
                                {error && activeTab === 'login' && <p className="text-sm text-red-500 text-center">{error}</p>}
                                {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}
                                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ورود...</> : "ورود"}</Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4 pt-4">
                                <div className="space-y-2"><Label htmlFor="register-phone">شماره تلفن</Label><Input id="register-phone" type="tel" placeholder="09123456789 مثال" required value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="register-password">رمز عبور (حداقل ۶ کاراکتر)</Label><Input id="register-password" type="password" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="confirm-password">تکرار رمز عبور</Label><Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                                {error && activeTab === 'register' && <p className="text-sm text-red-500 text-center">{error}</p>}
                                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ثبت نام...</> : "ثبت نام"}</Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}