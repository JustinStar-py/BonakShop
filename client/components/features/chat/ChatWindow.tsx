"use client";
import { useState, useEffect, useRef } from "react";
import { Send, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: { id?: string; name: string | null; role: string };
    createdAt: string;
}

interface ChatWindowProps {
    sessionId: string;
    currentUserId: string;
    onClose?: () => void;
    isAdminView?: boolean;
    onBack?: () => void;
    sessionOwnerId?: string;
}

export default function ChatWindow({
    sessionId,
    currentUserId,
    onClose,
    isAdminView,
    onBack,
    sessionOwnerId: initialOwnerId
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
    const [sending, setSending] = useState(false);
    const [sessionOwnerId, setSessionOwnerId] = useState<string | undefined>(initialOwnerId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialOwnerId) setSessionOwnerId(initialOwnerId);
    }, [initialOwnerId]);

    useEffect(() => {
        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const res = await apiClient.get(`/chat/sessions/${sessionId}`);
                if (isMounted) {
                    setMessages(res.data.messages || []);
                    setStatus(res.data.status);
                    if (res.data.userId) setSessionOwnerId(res.data.userId);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [sessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        const tempId = Date.now().toString();
        const optimisticMsg: Message = {
            id: tempId,
            content: input,
            senderId: currentUserId,
            sender: { id: currentUserId, name: "من", role: "UNKNOWN" },
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInput("");
        setSending(true);

        try {
            await apiClient.post("/chat/messages", {
                sessionId,
                content: optimisticMsg.content
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const handleCloseSession = async () => {
        if (!confirm("آیا مطمئن هستید که می‌خواهید این گفتگو را ببندید؟")) return;
        try {
            await apiClient.patch(`/chat/sessions/${sessionId}`, { status: 'CLOSED' });
            setStatus('CLOSED');
            if (onClose) onClose();
        } catch (err) {
            alert("خطا در بستن گفتگو");
        }
    };

    return (
        <div
            className={cn(
                isAdminView
                    ? "flex flex-col h-[600px] border rounded-lg bg-gray-50 overflow-hidden shadow-sm"
                    : "fixed inset-0 z-30 bg-gray-50 flex flex-col"
            )}
            dir="rtl"
        >
            {/* Header */}
            <div className="p-3 bg-white border-b flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    {!isAdminView && onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-600 hover:bg-gray-100">
                            <ArrowRight size={20} />
                        </Button>
                    )}

                    {isAdminView ? (
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                            وضعیت:
                            {status === 'CLOSED'
                                ? <span className="text-red-500 font-bold">بسته شده</span>
                                : <span className="text-green-600 font-bold">باز</span>
                            }
                        </span>
                    ) : (
                        <span className="font-bold text-gray-700">گفتگو با پشتیبانی</span>
                    )}
                </div>

                {status === 'OPEN' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCloseSession}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <XCircle size={18} className="ml-1" /> پایان گفتگو
                    </Button>
                )}
            </div>

            {/* Messages */}
            <div className={cn("flex-1 overflow-y-auto p-4 space-y-3", !isAdminView && "pb-[150px]")}>
                {messages.map((msg) => {
                    // ✅ روش جدید: استفاده از sender.id یا senderId
                    const messageSenderId = msg.sender?.id || msg.senderId;
                    const isMine = messageSenderId === currentUserId;

                    return (
                        <div
                            key={msg.id}
                            className={cn("flex", isMine ? "justify-end" : "justify-start")}
                        >
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                    isMine
                                        ? "bg-green-600 text-white rounded-bl-none"
                                        : "bg-blue-600 text-white rounded-br-none"
                                )}
                            >
                                {isAdminView && (
                                    <div className="text-xs mb-1 text-white/80 font-medium">
                                        {isMine ? "شما" : (msg.sender?.name || "کاربر")}
                                    </div>
                                )}

                                <p>{msg.content}</p>

                                <div className="text-[10px] mt-1 opacity-70 flex justify-end text-white/90">
                                    {new Date(msg.createdAt).toLocaleTimeString('fa-IR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {status === 'OPEN' ? (
                <div
                    className={cn(
                        isAdminView
                            ? "p-3 bg-white border-t flex gap-2"
                            : "fixed bottom-[70px] left-0 right-0 p-3 bg-white border-t flex gap-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
                    )}
                >
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="پیام خود را بنویسید..."
                        className="bg-gray-50 border-gray-200"
                        autoFocus
                    />
                    <Button
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Send size={18} className={cn(sending && "animate-pulse")} />
                    </Button>
                </div>
            ) : (
                <div
                    className={cn(
                        "p-4 bg-gray-100 text-center text-gray-500 text-sm border-t",
                        !isAdminView && "fixed bottom-[70px] left-0 right-0 z-50"
                    )}
                >
                    این گفتگو بسته شده است.
                </div>
            )}
        </div>
    );
}
