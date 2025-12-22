// FILE: components/features/chat/ModernChatWindow.tsx
// DESCRIPTION: Modern WhatsApp-style chat interface with enhanced UX

'use client';

import { useState, useEffect, useRef } from 'react';
import { PlainLinear, LinkLinear, EmojiFunnyCircleLinear, MenuDotsLinear, AltArrowRightLinear, CheckCircleLinear, GalleryLinear } from '@solar-icons/react-perf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { useSimpleToast } from '@/components/ui/toast-notification';

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: { id?: string; name: string | null; role: string };
    createdAt: string;
    read?: boolean;
}

interface ModernChatWindowProps {
    sessionId: string;
    currentUserId: string;
    onClose?: () => void;
    isAdminView?: boolean;
    onBack?: () => void;
    userName?: string;
}

export default function ModernChatWindow({
    sessionId,
    currentUserId,
    onClose,
    isAdminView = false,
    onBack,
    userName = 'کاربر'
}: ModernChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const toast = useSimpleToast();

    useEffect(() => {
        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const res = await apiClient.get(`/chat/sessions/${sessionId}`);
                if (isMounted) {
                    setMessages(res.data.messages || []);
                    setStatus(res.data.status);
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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        const tempId = Date.now().toString();
        const optimisticMsg: Message = {
            id: tempId,
            content: input,
            senderId: currentUserId,
            sender: { id: currentUserId, name: 'من', role: 'UNKNOWN' },
            createdAt: new Date().toISOString(),
            read: false
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInput('');
        setSending(true);

        try {
            await apiClient.post('/chat/messages', {
                sessionId,
                content: optimisticMsg.content
            });
        } catch (err) {
            toast.error('خطا در ارسال پیام');
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setSending(false);
        }
    };

    const handleCloseSession = async () => {
        try {
            await apiClient.patch(`/chat/sessions/${sessionId}`, { status: 'CLOSED' });
            setStatus('CLOSED');
            toast.success('گفتگو بسته شد');
            if (onClose) onClose();
        } catch (err) {
            toast.error('خطا در بستن گفتگو');
        }
    };

    return (
        <div
            className={cn(
                'flex flex-col bg-white',
                isAdminView
                    ? 'h-[650px] rounded-xl border-2 border-zinc-200 shadow-xl overflow-hidden'
                    : 'fixed inset-0 z-30'
            )}
            dir="rtl"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    {!isAdminView && onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="text-white hover:bg-white/20"
                        >
                            <AltArrowRightLinear size={20} />
                        </Button>
                    )}

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                        {isAdminView ? userName.charAt(0) : 'پ'}
                    </div>

                    <div>
                        <h3 className="font-bold text-base">
                            {isAdminView ? userName : 'پشتیبانی بناک‌شاپ'}
                        </h3>
                        <p className="text-xs text-white/80 flex items-center gap-1">
                            {status === 'OPEN' ? (
                                <>
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    آنلاین
                                </>
                            ) : (
                                'آفلاین'
                            )}
                        </p>
                    </div>
                </div>

                {isAdminView && status === 'OPEN' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCloseSession}
                        className="text-white hover:bg-white/20"
                    >
                        <MenuDotsLinear size={20} />
                    </Button>
                )}
            </div>

            {/* Messages Area */}
            <div
                className={cn(
                    'flex-1 overflow-y-auto p-4 space-y-4',
                    'bg-[url("/chat-bg.png")] bg-repeat',
                    'bg-zinc-50',
                    !isAdminView && 'pb-24'
                )}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            >
                {messages.map((msg) => {
                    const messageSenderId = msg.sender?.id || msg.senderId;
                    const isMine = messageSenderId === currentUserId;

                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                'flex gap-2 animate-fadeIn items-end',
                                isMine ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {!isMine && !isAdminView && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                    پ
                                </div>
                            )}

                            <div
                                className={cn(
                                    'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-md relative group',
                                    isMine
                                        ? 'bg-primary text-white rounded-br-none'
                                        : 'bg-white text-zinc-800 rounded-bl-none border border-zinc-200'
                                )}
                            >
                                {isAdminView && !isMine && (
                                    <div className="text-xs font-semibold mb-1 text-primary">
                                        {msg.sender?.name || 'کاربر'}
                                    </div>
                                )}

                                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                                    {msg.content}
                                </p>

                                <div className={cn(
                                    'flex items-center gap-1 justify-end mt-1 text-[11px]',
                                    isMine ? 'text-white/70' : 'text-zinc-500'
                                )}>
                                    <span>
                                        {new Date(msg.createdAt).toLocaleTimeString('fa-IR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    {isMine && (
                                        msg.read ? (
                                            <CheckCircleLinear size={14} className="text-blue-300" />
                                        ) : (
                                            <CheckCircleLinear size={14} />
                                        )
                                    )}
                                </div>
                            </div>

                            {isMine && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                    {userName.charAt(0)}
                                </div>
                            )}
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex gap-2 items-end animate-fadeIn">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            پ
                        </div>
                        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-md">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {status === 'OPEN' ? (
                <div
                    className={cn(
                        'bg-white border-t border-zinc-200 p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]',
                        !isAdminView && 'fixed bottom-0 left-0 right-0 z-50'
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                        >
                            <EmojiFunnyCircleLinear size={22} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                        >
                            <LinkLinear size={22} />
                        </Button>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="پیام خود را بنویسید..."
                            className="flex-1 bg-zinc-50 border-zinc-300 rounded-full px-4 h-11 focus:bg-white transition-colors"
                            autoFocus
                        />

                        <Button
                            onClick={handleSend}
                            disabled={sending || !input.trim()}
                            className={cn(
                                'rounded-full w-11 h-11 p-0 transition-all duration-300',
                                input.trim()
                                    ? 'bg-primary hover:bg-primary/90 scale-100'
                                    : 'bg-zinc-300 scale-90'
                            )}
                        >
                            <PlainLinear size={18} className={cn(sending && 'animate-pulse')} />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className={cn(
                    'p-4 bg-zinc-100 text-center text-zinc-600 text-sm border-t',
                    !isAdminView && 'fixed bottom-0 left-0 right-0 z-50'
                )}>
                    <p className="font-medium">این گفتگو بسته شده است.</p>
                </div>
            )}
        </div>
    );
}
