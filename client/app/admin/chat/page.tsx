"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import ChatWindow from "@/components/features/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { RestartLinear as RefreshCw, ChatDotsLinear as MessageSquare } from "@solar-icons/react-perf";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

type ChatSessionStatus = "OPEN" | "CLOSED";

interface AdminChatSession {
    id: string;
    status: ChatSessionStatus;
    userId: string;
    user: {
        name: string | null;
        shopName: string | null;
        phone: string;
    };
    messages?: { id: string; content: string }[];
    _count?: { messages?: number };
}

export default function AdminChatPage() {
    const { user } = useAppContext();
    const [sessions, setSessions] = useState<AdminChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const url = filter === 'ALL' ? "/admin/chat" : `/admin/chat?status=${filter}`;
            const res = await apiClient.get<{ sessions?: AdminChatSession[] } | AdminChatSession[]>(url);
            if (Array.isArray(res.data)) {
                setSessions(res.data);
            } else if (res.data.sessions) {
                setSessions(res.data.sessions);
            }
        } catch (error) {
            console.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000); // Poll list every 10s
        return () => clearInterval(interval);
    }, [fetchSessions]);

    const selectedSession = useMemo(
        () => sessions.find((session) => session.id === selectedSessionId),
        [sessions, selectedSessionId]
    );

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-blue-600" /> مدیریت پشتیبانی
                </h1>
                <div className="flex gap-2">
                    <Button variant={filter === 'ALL' ? 'default' : 'outline'} onClick={() => setFilter('ALL')} size="sm">همه</Button>
                    <Button variant={filter === 'OPEN' ? 'default' : 'outline'} onClick={() => setFilter('OPEN')} size="sm">باز</Button>
                    <Button variant={filter === 'CLOSED' ? 'default' : 'outline'} onClick={() => setFilter('CLOSED')} size="sm">بسته</Button>
                    <Button variant="ghost" size="icon" onClick={fetchSessions}>
                        <RefreshCw size={18} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                {/* Session List */}
                <div className="bg-white rounded-lg shadow-sm border p-4 overflow-y-auto">
                    {loading && sessions.length === 0 ? (
                        <div className="text-center text-gray-400 py-4">در حال بارگذاری...</div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            هیچ گفتگویی یافت نشد.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedSessionId(s.id)}
                                    className={cn(
                                        "p-3 rounded-lg cursor-pointer transition-all border",
                                        selectedSessionId === s.id
                                            ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300"
                                            : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm">{s.user?.name || "کاربر ناشناس"}</span>
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", s.status === 'OPEN' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                            {s.status === 'OPEN' ? 'باز' : 'بسته'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">
                                        {s.user?.shopName ?? "—"} | {s.user?.phone ?? "—"}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate">
                                        {s.messages?.[0]?.content || "بدون پیام"}
                                    </div>
                                    {(s._count?.messages || 0) > 0 && (
                                        <div className="mt-1 flex justify-end">
                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                                                {s._count?.messages} پیام جدید
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Window */}
                <div className="md:col-span-2">
                    {selectedSession && user ? (
                        <ChatWindow
                            sessionId={selectedSession.id}
                            currentUserId={user.id}
                            isAdminView={true}
                            sessionOwnerId={selectedSession.userId}
                            onClose={() => fetchSessions()}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 border rounded-lg text-gray-400 flex-col gap-2">
                            <MessageSquare size={48} className="opacity-20" />
                            <p>یک گفتگو را جهت پاسخگویی انتخاب کنید.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
