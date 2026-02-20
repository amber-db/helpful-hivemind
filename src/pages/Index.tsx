import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatSidebar } from "@/components/ChatSidebar";
import { streamChat, type Message } from "@/lib/chat";
import {
  loadConversations,
  saveConversation,
  deleteConversation,
  type Conversation,
} from "@/lib/conversations";
import { toast } from "sonner";

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshConversations = () => setConversations(loadConversations());

  const send = useCallback(
    async (input: string) => {
      const userMsg: Message = { role: "user", content: input };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      // Save immediately to get an id
      const conv = saveConversation(activeId, newMessages);
      setActiveId(conv.id);
      refreshConversations();

      let assistantSoFar = "";
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        await streamChat({
          messages: newMessages,
          onDelta: upsert,
          onDone: () => {
            setIsLoading(false);
            // Save final messages with assistant response
            setMessages((prev) => {
              saveConversation(conv.id, prev);
              refreshConversations();
              return prev;
            });
          },
          onError: (err) => {
            toast.error(err);
            setIsLoading(false);
          },
        });
      } catch {
        toast.error("Something went wrong. Please try again.");
        setIsLoading(false);
      }
    },
    [messages, activeId]
  );

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
  };

  const selectConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setActiveId(conv.id);
      setMessages(conv.messages);
    }
  };

  const handleDelete = (id: string) => {
    deleteConversation(id);
    refreshConversations();
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        isOpen={sidebarOpen}
        onSelect={selectConversation}
        onNew={newChat}
        onDelete={handleDelete}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            {!sidebarOpen && <div className="w-8" />}
            <h2 className="text-sm font-semibold text-foreground">NexusAI</h2>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestion={send} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="py-6 px-4 bg-chat-assistant">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={send} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;
