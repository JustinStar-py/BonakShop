// FILE: app/admin/chat/enhanced-page.tsx
// DESCRIPTION: Modern admin chat page with split-view layout

'use client';

import { useState } from 'react';
import ChatSessionsList from '@/components/features/chat/ChatSessionsList';
import ModernChatWindow from '@/components/features/chat/ModernChatWindow';
import { ChatDotsLinear as MessageSquare } from '@solar-icons/react-perf';
import { useAppContext } from '@/context/AppContext';

interface ChatSession {
    id: string;
    userId: string;
    user: { name: string | null; phone: string };
    status: 'OPEN' | 'CLOSED';
}

export default function EnhancedAdminChatPage() {
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const { user } = useAppContext();

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6">
            {/* Sessions List - Left Side */}
            <div className="w-96 rounded-xl shadow-lg overflow-hidden border-2 border-zinc-200">
                <ChatSessionsList
                    onSelectSession={(session) => setSelectedSession(session)}
                    selectedSessionId={selectedSession?.id}
                />
            </div>

            {/* Chat Window - Right Side */}
            <div className="flex-1">
                {selectedSession ? (
                    <ModernChatWindow
                        sessionId={selectedSession.id}
                        currentUserId={user?.id || ''}
                        isAdminView
                        userName={selectedSession.user.name || selectedSession.user.phone}
                        onClose={() => setSelectedSession(null)}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-300">
                        <MessageSquare size={64} className="text-zinc-300 mb-4" />
                        <p className="text-zinc-500 font-medium text-lg">گفتگو را از لیست سمت چپ انتخاب کنید</p>
                        <p className="text-zinc-400 text-sm mt-2">برای شروع گفتگو، یک مکالمه را کلیک کنید</p>
                    </div>
                )}
            </div>
        </div>
    );
}
