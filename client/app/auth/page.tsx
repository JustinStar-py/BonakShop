"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Store, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import toPersianDigits from "@/utils/persianNum";

export default function AuthPage() {
    const { user, login } = useAppContext();
    const router = useRouter();

    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<"request" | "verify">("request");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [user, router]);

    const requestOtp = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(""); setInfo("");
        try {
            await apiClient.post("/auth/send-otp", { phone });
            setStep("verify");
            setInfo("کد ورود ارسال شد. لطفاً ظرف دو دقیقه وارد کنید.");
        } catch (err: any) {
            setError(err.response?.data?.error || "خطا در ارسال کد.");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(""); setInfo("");
        try {
            const res = await apiClient.post("/auth/verify-otp", { phone, code });
            const { accessToken, refreshToken, user: u } = res.data;
            await login(phone, undefined, { accessToken, refreshToken, user: u });
            router.replace("/");
        } catch (err: any) {
            setError(err.response?.data?.error || "کد وارد شده نامعتبر است.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetFlow = () => {
        setStep("request");
        setCode("");
        setError("");
        setInfo("");
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
                    <h1 className="text-2xl font-extrabold text-gray-800 mb-1 tracking-tight">بهار نارون</h1>
                    <p className="text-gray-500 text-sm">سامانه هوشمند خرید عمده</p>
                </div>

                <div className="px-8 pb-8">
                    <form onSubmit={step === "request" ? requestOtp : verifyOtp} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 mr-1">شماره تلفن همراه</Label>
                            <div className="relative group">
                                <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                <Input
                                    className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 transition-all text-left"
                                    dir="ltr"
                                    placeholder="0912..."
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={step === "verify"}
                                />
                            </div>
                        </div>

                        {step === "verify" && (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 mr-1">کد ورود</Label>
                            <div className="relative group">
                                <ShieldCheck className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                <Input
                                    className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-500 transition-all text-center tracking-widest font-bold"
                                    dir="ltr"
                                    inputMode="numeric"
                                    pattern="[0-9۰-۹]*"
                                    placeholder="123456"
                                    maxLength={6}
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <Button type="button" variant="link" className="p-0 text-xs text-teal-600" onClick={resetFlow}>ویرایش شماره</Button>
                          </div>
                        )}

                        {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl text-center font-medium border border-red-100">{error}</div>}
                        {info && <div className="bg-green-50 text-green-600 text-xs p-3 rounded-xl text-center font-medium border border-green-100 flex items-center justify-center gap-2"><CheckCircle2 size={16}/> {info}</div>}
                        
                        <Button type="submit" className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-md font-bold shadow-lg shadow-teal-200/50 transition-all active:scale-[0.98] mt-2" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">{step === "request" ? "دریافت کد ورود" : "تایید و ورود"} <ArrowRight size={18}/></span>}
                        </Button>
                        {step === "verify" && (
                          <p className="text-[11px] text-gray-500 text-center mt-1">کد تا ۲ دقیقه معتبر است. اعداد فارسی/انگلیسی قابل قبول‌اند.</p>
                        )}
                    </form>
                </div>
            </div>
            <p className="absolute bottom-4 text-white/60 text-xs font-light">امنیت و سرعت با بهار نارون</p>
        </div>
    );
}
