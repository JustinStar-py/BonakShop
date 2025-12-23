"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BellLinear, BoxLinear, CartLinear, DangerTriangleLinear, RestartLinear, CheckCircleLinear } from "@solar-icons/react-perf";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: 'order' | 'stock' | 'return';
  title: string;
  message: string;
  link: string;
  timestamp: string;
  urgent: boolean;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Track known IDs to detect new ones
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const playNotificationSound = useCallback(() => {
    try {
      // Actually, let's use a simple oscillator beep since we don't want to rely on assets that might not exist.
      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, []);

  const showBrowserNotification = useCallback((newItems: Notification[]) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const text = newItems.length === 1
        ? newItems[0].message
        : `${newItems.length} پیام جدید دارید`;

      new Notification("بهار نارون", {
        body: text,
        icon: "/logo.png" // Assuming logo exists
      });
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<Notification[]>('/admin/notifications');
      const currentItems: Notification[] = res.data;

      setNotifications(currentItems);
      setUnreadCount(currentItems.length);

      // Detect new items
      const newItems: Notification[] = [];
      const currentIds = new Set<string>();

      currentItems.forEach(item => {
        currentIds.add(item.id);
        if (!knownIdsRef.current.has(item.id)) {
          newItems.push(item);
        }
      });

      // Update known IDs
      knownIdsRef.current = currentIds;

      // Trigger alerts if new items found (and not first load)
      if (!isFirstLoadRef.current && newItems.length > 0) {
        playNotificationSound();
        showBrowserNotification(newItems);
      }

      isFirstLoadRef.current = false;

    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  }, [playNotificationSound, showBrowserNotification]);

  // Request permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case 'order': return <CartLinear className="h-4 w-4 text-blue-500" />;
      case 'stock': return <BoxLinear className="h-4 w-4 text-orange-500" />;
      case 'return': return <RestartLinear className="h-4 w-4 text-red-500" />;
      default: return <DangerTriangleLinear className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (link: string) => {
    setIsOpen(false);
    router.push(link);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setUnreadCount(0);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-800">
          <BellLinear size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
          <h4 className="font-semibold text-sm">اعلان‌ها</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchNotifications}
            disabled={isLoading}
          >
            <RestartLinear className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <CheckCircleLinear className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p>همه چیز مرتب است!</p>
              <p className="text-xs mt-1">اعلان جدیدی ندارید.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start"
                  onClick={() => handleNotificationClick(notification.link)}
                >
                  <div className={cn(
                    "mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-white border shadow-sm",
                    notification.urgent && "bg-red-50 border-red-100"
                  )}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                      {notification.title}
                      {notification.urgent && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">فوری</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-slate-400 pt-1">
                      {new Date(notification.timestamp).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
