import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { streamChat, type Message } from "@/lib/chat";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (input: string) => {
      const userMsg: Message = { role: "user", content: input };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

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
          onDone: () => setIsLoading(false),
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
    [messages]
  );

  const newChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">NexusAI</h2>
        </div>
        <button
          onClick={newChat}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
        >
          <Plus size={14} />
          New chat
        </button>
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
  );
};

export default Index;
