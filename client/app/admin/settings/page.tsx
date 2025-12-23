"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TrashBinMinimalisticLinear as Trash2, AddCircleLinear as Plus, GalleryLinear as ImageIcon, DisketteLinear as Save, LinkLinear as LinkIcon, VerifiedCheckLinear as ShieldCheck, KeyLinear as Key } from "@solar-icons/react-perf";
import apiClient from "@/lib/apiClient";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  isActive: boolean;
  priority: number;
}

export default function SettingsPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: "", image: "", link: "", priority: 0 });

  // Settings State
  const [settings, setSettings] = useState({ whitelistEnabled: false, joinCodes: "", whitelistedNumbers: "" });
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  useEffect(() => {
    fetchBanners();
    fetchSettings();
  }, []);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/admin/banners");
      setBanners(res.data);
    } catch (error) {
      console.error("Failed to fetch banners", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setIsSettingsLoading(true);
    try {
      const res = await apiClient.get("/admin/settings");
      setSettings(res.data);
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await apiClient.post("/admin/settings", settings);
      alert("تنظیمات با موفقیت ذخیره شد");
    } catch (error) {
      console.error("خطا در ذخیره تنظیمات:", error);
      alert("خطا در ذخیره تنظیمات");
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/admin/banners", newBanner);
      setNewBanner({ title: "", image: "", link: "", priority: 0 });
      setIsAddOpen(false);
      fetchBanners();
    } catch (error) {
      console.error("خطا در افزودن بنر:", error);
      alert("خطا در افزودن بنر");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("آیا از حذف این بنر اطمینان دارید؟")) return;
    try {
      await apiClient.delete(`/admin/banners/${id}`);
      fetchBanners();
    } catch (error) {
      console.error("خطا در حذف بنر:", error);
      alert("خطا در حذف بنر");
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      // Optimistic update
      setBanners(banners.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
      await apiClient.put(`/admin/banners/${banner.id}`, { ...banner, isActive: !banner.isActive });
    } catch (error) {
      console.error("Error toggling banner", error);
      fetchBanners(); // Revert on error
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Public Settings (تنظیمات عمومی)</h1>
        <p className="text-slate-500">مدیریت بنرها و تنظیمات دسترسی سامانه</p>
      </div>

      <Tabs defaultValue="banners" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="banners">بنرهای صفحه اصلی</TabsTrigger>
          <TabsTrigger value="general">تنظیمات دسترسی و عمومی</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">بنرهای اسلایدر اصلی</h2>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus size={16} /> افزودن بنر جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>افزودن بنر جدید</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddBanner} className="space-y-4">
                  <div className="space-y-2">
                    <Label>آدرس تصویر (لینک مستقیم)</Label>
                    <div className="relative">
                      <ImageIcon className="absolute right-3 top-3 text-slate-400" size={16} />
                      <Input
                        className="pr-10"
                        placeholder="https://example.com/banner.jpg"
                        value={newBanner.image}
                        onChange={e => setNewBanner({ ...newBanner, image: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان (اختیاری)</Label>
                    <Input
                      placeholder="مثلا: تخفیف ویژه تابستانه"
                      value={newBanner.title}
                      onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>لینک مقصد (اختیاری)</Label>
                    <div className="relative">
                      <LinkIcon className="absolute right-3 top-3 text-slate-400" size={16} />
                      <Input
                        className="pr-10"
                        placeholder="/products/123"
                        value={newBanner.link}
                        onChange={e => setNewBanner({ ...newBanner, link: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>اولویت نمایش (عدد بزرگتر = بالاتر)</Label>
                    <Input
                      type="number"
                      value={newBanner.priority}
                      onChange={e => setNewBanner({ ...newBanner, priority: Number(e.target.value) })}
                    />
                  </div>
                  <Button type="submit" className="w-full">ذخیره</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <p className="text-slate-500">در حال بارگذاری...</p>
            ) : banners.length === 0 ? (
              <p className="text-slate-500">هنوز بنری اضافه نشده است.</p>
            ) : (
              banners.map((banner) => (
                <Card key={banner.id} className="overflow-hidden group">
                  <div className="relative h-48 w-full bg-slate-100">
                    {banner.image ? (
                      <Image
                        src={banner.image}
                        alt={banner.title || "Banner"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <ImageIcon size={40} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        اولویت: {banner.priority}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800">{banner.title || "بدون عنوان"}</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]" dir="ltr">{banner.link || "بدون لینک"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteBanner(banner.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-sm text-slate-600">وضعیت نمایش:</span>
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={() => handleToggleActive(banner)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary" />
                تنظیمات لیست سفید (Whitelist)
              </CardTitle>
              <CardDescription>
                در صورت فعال‌سازی، تنها کاربرانی که تایید شده‌اند یا کد ورود معتبر دارند می‌توانند وارد شوند.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base">فعال‌سازی حالت لیست سفید</Label>
                  <p className="text-sm text-slate-500">محدود کردن دسترسی به کاربران تایید شده</p>
                </div>
                <Switch
                  checked={settings.whitelistEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, whitelistEnabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key size={16} />
                  کدهای عضویت ثابت (Static Codes)
                </Label>
                <Textarea
                  placeholder="کدها را با کاما جدا کنید. مثال: 123456, 333333, admin_code"
                  value={settings.joinCodes}
                  onChange={(e) => setSettings({ ...settings, joinCodes: e.target.value })}
                  className="font-mono text-left"
                  dir="ltr"
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  کاربران جدید می‌توانند با وارد کردن یکی از این کدها، به صورت خودکار تایید و وارد شوند.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  شماره‌های تست (Whitelisted Numbers)
                </Label>
                <Textarea
                  placeholder="شماره‌ها را با کاما جدا کنید. مثال: 09120000000, 11111"
                  value={settings.whitelistedNumbers}
                  onChange={(e) => setSettings({ ...settings, whitelistedNumbers: e.target.value })}
                  className="font-mono text-left"
                  dir="ltr"
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  این شماره‌ها بدون دریافت پیامک و با کد ثابت 12345 می‌توانند وارد شوند و به صورت خودکار تایید می‌شوند.
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} disabled={isSettingsLoading}>
                  <Save size={16} className="mr-2" />
                  ذخیره تنظیمات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
