// FILE: app/auth/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const success = await login(phone, password);
    if (success) {
      router.replace('/'); // Redirect to home page on successful login
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ورود به حساب کاربری</CardTitle>
          <CardDescription>برای ادامه، شماره تلفن و رمز عبور خود را وارد کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">شماره تلفن</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}