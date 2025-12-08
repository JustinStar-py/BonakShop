"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useSimpleToast } from "@/components/ui/toast-notification";

// Persian to English number converter
function persianToEnglish(str: string): string {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let result = str;
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
    }
    return result;
}

export default function AuthPage() {
    const { user, login } = useAppContext();
    const router = useRouter();
    const toast = useSimpleToast();

    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<"request" | "verify">("request");
    const [isLoading, setIsLoading] = useState(false);
    const codeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [user, router]);

    const requestOtp = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Convert Persian numbers to English
        const englishPhone = persianToEnglish(phone);

        // Validate phone number format
        if (!englishPhone.startsWith('0')) {
            toast.error("شماره باید با 0 شروع شود (مثال: 09026919331)");
            setIsLoading(false);
            return;
        }

        if (englishPhone.length !== 11) {
            toast.error("شماره باید 11 رقم باشد (مثال: 09026919331)");
            setIsLoading(false);
            return;
        }

        if (!/^0\d{10}$/.test(englishPhone)) {
            toast.error("فرمت شماره صحیح نیست (مثال: 09026919331)");
            setIsLoading(false);
            return;
        }

        try {
            await apiClient.post("/auth/send-otp", { phone: englishPhone });
            setPhone(englishPhone); // Update with English numbers
            setStep("verify");
            toast.success("کد ورود ارسال شد. لطفاً ظرف دو دقیقه وارد کنید.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "خطا در ارسال کد.");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Convert Persian numbers to English for code
        const englishCode = persianToEnglish(code);

        try {
            const res = await apiClient.post("/auth/verify-otp", { phone, code: englishCode });
            const { accessToken, refreshToken, user: u } = res.data;
            await login(phone, undefined, { accessToken, refreshToken, user: u });
            toast.success("ورود موفقیت‌آمیز!");
            router.replace("/");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "کد وارد شده نامعتبر است.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetFlow = () => {
        setStep("request");
        setCode("");
    };

    // Web OTP API - Auto-read SMS code
    useEffect(() => {
        if (step === 'verify' && 'OTPCredential' in window) {
            const ac = new AbortController();

            navigator.credentials
                .get({
                    // @ts-expect-error - Web OTP API is not fully typed
                    otp: { transport: ['sms'] },
                    signal: ac.signal
                })
                .then((otp: any) => {
                    if (otp?.code) {
                        setCode(otp.code);
                        toast.info('کد از پیامک خوانده شد ✓');
                    }
                })
                .catch(err => {
                    // User cancelled or API not supported
                    console.log(err);
                });

            return () => ac.abort();
        }
    }, [step, toast]);

    // Handle phone input with Persian to English conversion
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const englishValue = persianToEnglish(value);
        // Only allow numbers
        if (/^[0-9]*$/.test(englishValue)) {
            setPhone(englishValue);
        }
    };

    // Handle code input with Persian to English conversion
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const englishValue = persianToEnglish(value);
        // Only allow numbers, max 6 digits
        if (/^[0-9]*$/.test(englishValue) && englishValue.length <= 6) {
            setCode(englishValue);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
            {/* اشکال هندسی پس‌زمینه */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-emerald-400 opacity-20 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-white/50">
                <div className="p-8 pb-4 text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner transform rotate-3 hover:rotate-0 transition-all duration-500">
                        <Image src="/logo.png" alt="Logo" width={50} height={50} className="object-contain" priority />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-800 mb-1 tracking-tight">بهار نارون</h1>
                    <p className="text-gray-500 text-sm">سامانه هوشمند خرید عمده</p>
                </div>

                <div className="px-8 pb-8">
                    <form onSubmit={step === "request" ? requestOtp : verifyOtp} className="space-y-4">
                        {step === "request" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 mr-1">شماره تلفن همراه</Label>
                                <div className="relative group">
                                    <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <Input
                                        className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all text-left"
                                        dir="ltr"
                                        placeholder="09026919331"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        maxLength={11}
                                    />
                                </div>
                            </div>
                        )}

                        {step === "verify" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1 mb-2">
                                    <span className="text-sm font-bold text-gray-700">{phone}</span>
                                    <Button type="button" variant="link" className="p-0 text-xs text-green-600 h-auto" onClick={resetFlow}>ویرایش شماره</Button>
                                </div>
                                <Label className="text-xs font-bold text-gray-500 mr-1">کد ورود</Label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <Input
                                        ref={codeInputRef}
                                        className="pr-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all text-center tracking-widest font-bold"
                                        dir="ltr"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                        required
                                        value={code}
                                        onChange={handleCodeChange}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 text-center mt-1">کد تا ۲ دقیقه معتبر است. اعداد فارسی/انگلیسی قابل قبول‌اند.</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white text-md font-bold shadow-lg shadow-green-200/50 transition-all active:scale-[0.98] mt-2" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">{step === "request" ? "دریافت کد ورود" : "تایید و ورود"} <ArrowRight size={18} /></span>}
                        </Button>
                    </form>
                </div>
            </div>
            {step === "request" && (
                <div className="absolute bottom-4 flex flex-col items-center gap-2 z-10">
                    <a referrerPolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=680926&Code=ddh2sBKCxHmWqySC22llyr3LJQGpGOpD'>
                        <img referrerPolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=680926&Code=ddh2sBKCxHmWqySC22llyr3LJQGpGOpD' alt='' style={{ cursor: 'pointer' }} className="w-20 h-auto bg-white/80 rounded-xl p-1 shadow-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300" />
                    </a>
                    <p className="text-white/60 text-xs font-light">امنیت و سرعت با بهار نارون</p>
                </div>
            )}
        </div>
    );
}
