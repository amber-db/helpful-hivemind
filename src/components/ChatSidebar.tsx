import { MessageSquare, Plus, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PersonaPicker } from "./PersonaPicker";
import type { Conversation } from "@/lib/conversations";
import type { Persona } from "@/lib/personas";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggle: () => void;
  personas: Persona[];
  activePersonaId: string;
  onSelectPersona: (persona: Persona) => void;
  onPersonasChange: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  isOpen,
  onSelect,
  onNew,
  onDelete,
  onToggle,
  personas,
  activePersonaId,
  onSelectPersona,
  onPersonasChange,
}: ChatSidebarProps) {
  return (
    <>
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-3 left-3 z-50 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Open sidebar"
        >
          <PanelLeft size={18} />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-screen flex-shrink-0 bg-card border-r border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-border">
              <button
                onClick={onNew}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-xl hover:bg-primary/10"
              >
                <Plus size={14} />
                New chat
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Persona picker */}
            <div className="border-b border-border">
              <PersonaPicker
                personas={personas}
                activeId={activePersonaId}
                onSelect={onSelectPersona}
                onPersonasChange={onPersonasChange}
              />
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Chats
              </p>
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-0.5">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => onSelect(conv.id)}
                      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all ${
                        conv.id === activeId
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <MessageSquare size={14} className="flex-shrink-0" />
                      <span className="truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
