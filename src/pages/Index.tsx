import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatSidebar } from "@/components/ChatSidebar";
import { streamChat, type Message } from "@/lib/chat";
import {
  loadDbConversations,
  loadDbMessages,
  saveDbConversation,
  deleteDbConversation,
  loadDbCustomPersonas,
  type DbConversation,
  type DbPersona,
} from "@/lib/db";
import { DEFAULT_PERSONAS, type Persona } from "@/lib/personas";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Download, LogOut } from "lucide-react";
import jsPDF from "jspdf";

function getInitialDarkMode() {
  try {
    const saved = localStorage.getItem("nexusai-dark-mode");
    if (saved !== null) return saved === "true";
  } catch {}
  return false;
}

function dbPersonaToPersona(p: DbPersona): Persona {
  return { id: p.id, name: p.name, emoji: p.emoji, description: p.description, systemPrompt: p.system_prompt, color: p.color };
}

function exportConversationPdf(messages: Message[], personaName: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;
  const maxW = pageW - margin * 2;

  doc.setFillColor(166, 217, 200);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(50, 50, 50);
  doc.text("Conversation Export", margin, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), margin, 32);

  let y = 48;
  messages.forEach((msg) => {
    const isUser = msg.role === "user";
    const name = isUser ? "You" : personaName;
    const text = msg.content.replace(/```(?:note|flashcards|planner|moodboard|image|spreadsheet|presentation|video)\n[\s\S]*?```/g, "[visual content]");
    const lines = doc.splitTextToSize(text, maxW - 10);
    const blockH = 8 + lines.length * 5 + 6;
    if (y + blockH > 275) { doc.addPage(); y = 20; }
    if (isUser) { doc.setFillColor(200, 220, 240); } else { doc.setFillColor(245, 200, 175); }
    doc.roundedRect(margin, y, maxW, blockH, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(name, margin + 5, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(lines, margin + 5, y + 13);
    y += blockH + 4;
  });

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Exported from NexusAI ✨", margin, 287);
  const title = messages.find(m => m.role === "user")?.content.slice(0, 30) || "conversation";
  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}_export.pdf`);
}

const Index = () => {
  const { signOut } = useAuth();
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [activePersonaId, setActivePersonaIdState] = useState("default");
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  // Load conversations and custom personas from DB
  useEffect(() => {
    refreshConversations();
    refreshPersonas();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("nexusai-dark-mode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshConversations = async () => {
    try {
      const convs = await loadDbConversations();
      setConversations(convs);
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  };

  const refreshPersonas = async () => {
    try {
      const custom = await loadDbCustomPersonas();
      setPersonas([...DEFAULT_PERSONAS, ...custom.map(dbPersonaToPersona)]);
    } catch (e) {
      console.error("Failed to load personas", e);
    }
  };

  const handleSelectPersona = (persona: Persona) => {
    setActivePersonaIdState(persona.id);
  };

  const send = useCallback(
    async (input: string) => {
      const userMsg: Message = { role: "user", content: input };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      let convId = activeId;
      try {
        convId = await saveDbConversation(activeId, newMessages, activePersona.id);
        setActiveId(convId);
        refreshConversations();
      } catch (e) {
        console.error("Failed to save conversation", e);
      }

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
              if (convId) {
                saveDbConversation(convId, prev, activePersona.id).then(() => refreshConversations());
              }
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

  const selectConversation = async (id: string) => {
    try {
      const msgs = await loadDbMessages(id);
      setActiveId(id);
      setMessages(msgs);
      // Set persona from conversation
      const conv = conversations.find((c) => c.id === id);
      if (conv?.persona_id) setActivePersonaIdState(conv.persona_id);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDbConversation(id);
      refreshConversations();
      if (activeId === id) { setActiveId(null); setMessages([]); }
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  // Adapt DbConversation to sidebar's expected shape
  const sidebarConversations = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    messages: [] as Message[],
    createdAt: new Date(c.created_at).getTime(),
    updatedAt: new Date(c.updated_at).getTime(),
  }));

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={sidebarConversations}
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
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {!sidebarOpen && <div className="w-8" />}
            <span className="text-base">{activePersona?.emoji}</span>
            <h2 className="text-sm font-bold text-foreground">{activePersona?.name || "NexusAI"}</h2>
            <span className="text-xs text-muted-foreground hidden sm:inline">{activePersona?.description}</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => exportConversationPdf(messages, activePersona?.name || "Nexus")}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Export conversation as PDF"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

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

        <ChatInput onSend={send} isLoading={isLoading} personaEmoji={activePersona?.emoji} />
      </div>
    </div>
  );
};

export default Index;
