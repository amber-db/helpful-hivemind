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
import {
  loadPersonas,
  getActivePersonaId,
  setActivePersonaId,
  type Persona,
} from "@/lib/personas";
import { toast } from "sonner";

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>(loadPersonas);
  const [activePersonaId, setActivePersonaIdState] = useState(getActivePersonaId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshConversations = () => setConversations(loadConversations());
  const refreshPersonas = () => setPersonas(loadPersonas());

  const handleSelectPersona = (persona: Persona) => {
    setActivePersonaIdState(persona.id);
    setActivePersonaId(persona.id);
  };

  const send = useCallback(
    async (input: string) => {
      const userMsg: Message = { role: "user", content: input };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

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
          persona: activePersona,
        });
      } catch {
        toast.error("Something went wrong. Please try again.");
        setIsLoading(false);
      }
    },
    [messages, activeId, activePersona]
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
        personas={personas}
        activePersonaId={activePersonaId}
        onSelectPersona={handleSelectPersona}
        onPersonasChange={refreshPersonas}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {!sidebarOpen && <div className="w-8" />}
            <span className="text-base">{activePersona?.emoji}</span>
            <h2 className="text-sm font-bold text-foreground">{activePersona?.name || "NexusAI"}</h2>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {activePersona?.description}
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestion={send} persona={activePersona} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} persona={activePersona} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="py-6 px-4 bg-chat-assistant">
                  <div className="max-w-3xl mx-auto flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-peach flex items-center justify-center text-sm">
                      {activePersona?.emoji || "✨"}
                    </div>
                    <div className="pt-2">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
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
        <ChatInput onSend={send} isLoading={isLoading} personaEmoji={activePersona?.emoji} />
      </div>
    </div>
  );
};

export default Index;
