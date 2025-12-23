// FILE: components/features/chat/ChatSessionsList.tsx
// DESCRIPTION: Modern chat sessions list for admin dashboard

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatDotsLinear as MessageSquare, ClockCircleLinear as Clock, UserLinear as User, MagniferLinear as Search } from '@solar-icons/react-perf';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';
import { Shimmer } from '@/components/ui/shimmer-effect';

interface ChatSession {
    id: string;
    userId: string;
    user: { name: string | null; phone: string };
    status: 'OPEN' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
    _count: { messages: number };
    lastMessage?: {
        content: string;
        createdAt: string;
    };
}

interface ChatSessionsListProps {
    onSelectSession: (session: ChatSession) => void;
    selectedSessionId?: string;
}

export default function ChatSessionsList({
    onSelectSession,
    selectedSessionId
}: ChatSessionsListProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'OPEN' | 'CLOSED'>('all');

    const fetchSessions = useCallback(async () => {
        try {
            const res = await apiClient.get('/chat/sessions');
            setSessions(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 5000);
        return () => clearInterval(interval);
    }, [fetchSessions]);

    const filteredSessions = sessions.filter(session => {
        const matchesSearch =
            session.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.user.phone.includes(searchTerm);

        const matchesStatus =
            statusFilter === 'all' || session.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const openSessions = filteredSessions.filter(s => s.status === 'OPEN').length;

    return (
        <div className="flex flex-col h-full bg-white border-l border-zinc-200">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="text-primary" size={24} />
                        <h2 className="font-bold text-lg text-zinc-800">گفتگوها</h2>
                    </div>
                    <Badge variant={openSessions > 0 ? 'default' : 'secondary'} className="px-3">
                        {openSessions} فعال
                    </Badge>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجوی کاربر..."
                        className="pr-10 bg-white"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-3">
                    {(['all', 'OPEN', 'CLOSED'] as const).map((filter) => (
                        <Button
                            key={filter}
                            size="sm"
                            variant={statusFilter === filter ? 'default' : 'outline'}
                            onClick={() => setStatusFilter(filter)}
                            className="flex-1"
                        >
                            {filter === 'all' ? 'همه' : filter === 'OPEN' ? 'باز' : 'بسته'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Shimmer variant="circle" className="w-12 h-12" />
                                    <div className="flex-1 space-y-2">
                                        <Shimmer variant="text" className="w-3/4" />
                                        <Shimmer variant="text" className="w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8">
                        <MessageSquare size={48} className="mb-3" />
                        <p className="text-sm font-medium">
                            {searchTerm ? 'نتیجه‌ای یافت نشد' : 'گفتگویی وجود ندارد'}
                        </p>
                    </div>
                ) : (
                    filteredSessions.map((session) => {
                        const isSelected = session.id === selectedSessionId;
                        const hasUnread = session._count.messages > 0 && session.status === 'OPEN';

                        return (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session)}
                                className={cn(
                                    'p-4 border-b border-zinc-100 cursor-pointer transition-all duration-200',
                                    'hover:bg-zinc-50 active:bg-zinc-100',
                                    isSelected && 'bg-primary/5 border-r-4 border-r-primary'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className={cn(
                                        'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0',
                                        session.status === 'OPEN'
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-zinc-200 text-zinc-600'
                                    )}>
                                        {session.user.name?.charAt(0) || <User size={20} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-zinc-900 truncate">
                                                {session.user.name || session.user.phone}
                                            </h3>
                                            {session.lastMessage && (
                                                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(session.lastMessage.createdAt).toLocaleTimeString('fa-IR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-zinc-600 truncate">
                                            {session.lastMessage?.content || 'گفتگوی جدید'}
                                        </p>

                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge
                                                variant={session.status === 'OPEN' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {session.status === 'OPEN' ? 'باز' : 'بسته'}
                                            </Badge>
                                            {hasUnread && (
                                                <Badge variant="destructive" className="text-xs">
                                                    {session._count.messages} پیام جدید
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
