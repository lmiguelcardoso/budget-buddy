"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/hooks/use-settings";
import { MessageSquare, Plus, Send, Loader2 } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatClientProps {
  initialConversations: Conversation[];
}

export function ChatClient({ initialConversations }: ChatClientProps) {
  const { t } = useSettings();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function refreshConversations() {
    const res = await fetch("/api/chat/conversations");
    const data = await res.json();
    if (data.success) setConversations(data.data);
  }

  async function selectConversation(id: string) {
    setActiveId(id);
    setError(null);
    const res = await fetch(`/api/chat/conversations/${id}/messages`);
    const data = await res.json();
    if (data.success) setMessages(data.data);
  }

  async function newConversation() {
    const res = await fetch("/api/chat/conversations", { method: "POST" });
    const data = await res.json();
    if (!data.success) return;
    await refreshConversations();
    setActiveId(data.data.id);
    setMessages([]);
    setError(null);
  }

  async function sendMessage() {
    if (!input.trim() || !activeId || loading) return;
    const content = input.trim();
    const conversationId = activeId;
    setInput("");
    setLoading(true);
    setError(null);

    const optimistic: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        // Update conversation title if it was the first message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, title: content.slice(0, 60), updatedAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        setError(t("chat.error"));
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    } catch {
      setError(t("chat.error"));
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="p-3">
          <Button onClick={newConversation} variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            {t("chat.new")}
          </Button>
        </div>
        <Separator />
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`w-full text-left rounded-md px-3 py-2 text-sm truncate transition-colors ${
                activeId === c.id
                  ? "bg-background font-medium"
                  : "text-muted-foreground hover:bg-background/60"
              }`}
            >
              {c.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {activeId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground border"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted border rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("chat.placeholder")}
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !input.trim()} size="icon">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">{t("chat.empty")}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{t("chat.empty_desc")}</p>
            <Button onClick={newConversation} className="mt-2 gap-2">
              <Plus className="h-4 w-4" />
              {t("chat.new")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
