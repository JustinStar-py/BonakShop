"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import apiClient from "@/lib/apiClient";
import ChatWindow from "@/components/features/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { AddCircleLinear as PlusCircle, ChatDotsLinear as MessageSquare, RestartLinear as RotateCcw } from "@solar-icons/react-perf";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";

type ViewMode = "LIST" | "CHAT";
type ChatSessionStatus = "OPEN" | "CLOSED";

interface ChatMessagePreview {
  id: string;
  content: string;
}

interface ChatSession {
  id: string;
  status: ChatSessionStatus;
  updatedAt: string;
  messages?: ChatMessagePreview[];
  _count?: {
    messages?: number;
  };
}

export default function UserChatPage() {
  const { user } = useAppContext();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get<ChatSession[]>("/chat/sessions");
      setSessions(res.data);
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "خطایی هنگام دریافت گفتگوها رخ داد. دوباره تلاش کنید."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId),
    [sessions, selectedSessionId]
  );

  const handleCreateSession = async () => {
    setCreating(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.post<ChatSession>("/chat/sessions");
      const newSession = res.data;
      setSessions((prev) => [newSession, ...prev]);
      setSelectedSessionId(newSession.id);
      setViewMode("CHAT");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "خطایی هنگام ایجاد گفتگو رخ داد."));
    } finally {
      setCreating(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setViewMode("CHAT");
  };

  const handleBackToList = () => {
    setViewMode("LIST");
  };

  const handleChatClosed = () => {
    fetchSessions();
    setSelectedSessionId(null);
    setViewMode("LIST");
  };

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
      }).format(new Date(value));
    } catch {
      return "";
    }
  };

  const unreadCount = (session: ChatSession) => session?._count?.messages ?? 0;

  return (
    <div className="w-full px-4 py-8 min-h-screen space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        {viewMode === "LIST" ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground">پیگیری گفتگوی خود با پشتیبانی</p>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="text-green-600" /> پیام‌ها و گفتگوها
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={fetchSessions}
                disabled={loading}
                aria-label="به‌روزرسانی لیست گفتگوها"
              >
                <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              <Button
                onClick={handleCreateSession}
                className="bg-green-600 hover:bg-green-700"
                disabled={creating}
              >
                <PlusCircle className="ml-2 h-4 w-4" />
                گفتگوی جدید
              </Button>
            </div>
          </>
        ) : (
          <Button variant="outline" onClick={handleBackToList}>
            بازگشت به لیست گفتگوها
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl shadow-sm border p-4 overflow-hidden flex flex-col max-w-4xl mx-auto w-full h-[650px]">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <div>
              <p className="text-xs text-muted-foreground">آخرین گفتگوهای شما</p>
              <h2 className="font-bold text-gray-700 text-lg">گفتگوهای پشتیبانی</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {sessions.length} گفتگو
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="animate-pulse bg-gray-100 rounded-xl h-20" />
              ))
            ) : sessions.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">
                هنوز گفتگویی ثبت نکرده‌اید. برای شروع گفتگوی جدید دکمه بالا را فشار دهید.
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={cn(
                    "w-full text-right rounded-2xl border p-3 transition-all",
                    selectedSessionId === session.id
                      ? "bg-green-50 border-green-200 shadow-sm"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-full",
                          session.status === "OPEN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {session.status === "OPEN" ? "باز" : "بسته"}
                      </span>
                      {unreadCount(session) > 0 && (
                        <span className="text-[11px] text-red-500 font-bold">
                          {unreadCount(session)} پیام خوانده‌نشده
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {formatDate(session.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {session.messages?.[0]?.content || "بدون پیام"}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === "CHAT" && (
        <div className="w-full min-h-[calc(100vh-120px)] flex flex-col">
          {selectedSession && user ? (
            <ChatWindow
              sessionId={selectedSession.id}
              currentUserId={user.id}
              onClose={handleChatClosed}
              onBack={handleBackToList}
              sessionOwnerId={user.id}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-gray-400 gap-3">
              <MessageSquare size={48} className="opacity-40" />
              <p>یک گفتگو را از لیست انتخاب کنید تا جزئیات آن را ببینید.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
