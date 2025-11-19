"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Phone, Lock, Store, ArrowRight, CheckCircle2 } from "lucide-react";

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
            setError("رمز عبور باید حداقل ۶ کاراکتر باشد."); return;
        }
        if (registerPassword !== confirmPassword) {
            setError("رمزهای عبور با یکدیگر مطابقت ندارند."); return;
        }
        setIsLoading(true); setError(""); setSuccessMessage("");
        try {
            await apiClient.post('/auth/register', { phone: registerPhone, password: registerPassword, confirmPassword });
            setSuccessMessage("ثبت نام موفقیت‌آمیز بود! لطفاً وارد شوید.");
            setActiveTab("login");
        } catch (err: any) {
            setError(err.response?.data?.error || "خطایی در هنگام ثبت‌نام رخ داد.");
        } finally { setIsLoading(false); }
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(""); setSuccessMessage("");
        try {
            const success = await login(loginPhone, loginPassword); 
            if (success) router.replace('/');
        } catch (err: any) {
            setError("خطا در ارتباط با سرور.");
        } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-500 to-blue-600 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
            {/* اشکال هندسی پس‌زمینه */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-white/50">
                <div className="p-8 pb-4 text-center">
                    <div className="w-20 h-20 bg-teal-50 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner transform rotate-3 hover:rotate-0 transition-all duration-500">
                        <Store className="w-10 h-10 text-teal-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-800 mb-1 tracking-tight">بنک‌شاپ</h1>
                    <p className="text-gray-500 text-sm">سامانه هوشمند خرید عمده</p>
                </div>

                <div className="px-8 pb-8">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1.5 rounded-xl h-14">
                            <TabsTrigger value="login" className="rounded-lg text-gray-500 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm h-full transition-all font-bold">ورود</TabsTrigger>
                            <TabsTrigger value="register" className="rounded-lg text-gray-500 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm h-full transition-all font-bold">ثبت نام</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="mt-0 animate-in fade-in slide-in-from-left-4 duration-300">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 mr-1">شماره تلفن همراه</Label>
                                    <div className="relative group">
                                        <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                        <Input className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 transition-all text-left" dir="ltr" placeholder="0912..." type="tel" required value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 mr-1">رمز عبور</Label>
                                    <div className="relative group">
                                        <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                        <Input className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 transition-all text-left" dir="ltr" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                                    </div>
                                </div>
                                
                                {error && activeTab === 'login' && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl text-center font-medium border border-red-100">{error}</div>}
                                {successMessage && <div className="bg-green-50 text-green-600 text-xs p-3 rounded-xl text-center font-medium border border-green-100 flex items-center justify-center gap-2"><CheckCircle2 size={16}/> {successMessage}</div>}
                                
                                <Button type="submit" className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-md font-bold shadow-lg shadow-teal-200/50 transition-all active:scale-[0.98] mt-2" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">ورود به حساب <ArrowRight size={18}/></span>}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 text-left" dir="ltr" placeholder="شماره تلفن" type="tel" required value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 text-left" dir="ltr" placeholder="رمز عبور (حداقل ۶ رقم)" type="password" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 text-left" dir="ltr" placeholder="تکرار رمز عبور" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                    </div>
                                </div>

                                {error && activeTab === 'register' && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl text-center font-medium border border-red-100">{error}</div>}

                                <Button type="submit" className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-md font-bold shadow-lg shadow-blue-200/50 transition-all active:scale-[0.98] mt-2" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : "ثبت نام رایگان"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <p className="absolute bottom-4 text-white/60 text-xs font-light">امنیت و سرعت با بنک‌شاپ</p>
        </div>
    );
}