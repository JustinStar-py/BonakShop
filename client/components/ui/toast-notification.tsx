// FILE: components/ui/toast-notification.tsx
// DESCRIPTION: Modern toast notifications with animations and variants

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = Math.random().toString(36).substring(7);
        const toast: Toast = { id, type, message, duration };

        setToasts((prev) => [...prev, toast]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

interface ToastItemProps {
    toast: Toast;
    onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
    const { type, message } = toast;

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertCircle,
        info: Info
    };

    const colors = {
        success: 'bg-emerald-500/95 text-white border-emerald-600',
        error: 'bg-red-500/95 text-white border-red-600',
        warning: 'bg-amber-500/95 text-white border-amber-600',
        info: 'bg-blue-500/95 text-white border-blue-600'
    };

    const Icon = icons[type];

    return (
        <div
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md',
                'animate-in slide-in-from-bottom-5 fade-in-0 duration-300 ease-out',
                'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-5 data-[state=closed]:fade-out data-[state=closed]:duration-300',
                'pointer-events-auto transform transition-all',
                colors[type]
            )}
        >
            <Icon size={20} className="flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}

// Helper hook for easy toast usage
export function useSimpleToast() {
    const { showToast } = useToast();

    return {
        success: (message: string) => showToast('success', message),
        error: (message: string) => showToast('error', message),
        warning: (message: string) => showToast('warning', message),
        info: (message: string) => showToast('info', message)
    };
}
