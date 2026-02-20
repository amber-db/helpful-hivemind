import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import {
  loadPersonas,
  saveCustomPersona,
  deleteCustomPersona,
  DEFAULT_PERSONAS,
  PERSONA_COLORS,
  type Persona,
} from "@/lib/personas";

const EMOJI_OPTIONS = ["✨", "🎨", "📚", "⚡", "🌸", "🧠", "🎭", "🌊", "🔮", "🦋", "🌿", "🎵"];
const COLOR_OPTIONS = ["mint", "peach", "lavender", "sky", "rose", "lemon"];

interface PersonaPickerProps {
  personas: Persona[];
  activeId: string;
  onSelect: (persona: Persona) => void;
  onPersonasChange: () => void;
}

export function PersonaPicker({ personas, activeId, onSelect, onPersonasChange }: PersonaPickerProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [color, setColor] = useState("mint");

  const handleCreate = () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    saveCustomPersona({
      name: name.trim(),
      emoji,
      description: description.trim() || `Custom ${name} persona`,
      systemPrompt: systemPrompt.trim(),
      color,
    });
    setName("");
    setEmoji("✨");
    setDescription("");
    setSystemPrompt("");
    setColor("mint");
    setShowBuilder(false);
    onPersonasChange();
  };

  const handleDelete = (id: string) => {
    deleteCustomPersona(id);
    onPersonasChange();
  };

  const isDefault = (id: string) => DEFAULT_PERSONAS.some((p) => p.id === id);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Personalities
        </span>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          {showBuilder ? "Cancel" : "+ Create"}
        </button>
      </div>

      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-3 mb-3"
          >
            <div className="p-3 rounded-xl bg-background/80 border border-border space-y-2.5">
              <div className="flex gap-2">
                <div className="flex flex-wrap gap-1">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                        emoji === e ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (e.g. Luna)"
                className="w-full text-sm bg-muted/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                className="w-full text-sm bg-muted/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Personality instructions (e.g. You are a gentle poet who speaks in metaphors...)"
                rows={3}
                className="w-full text-sm bg-muted/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full ${PERSONA_COLORS[c]?.split(" ")[0] || "bg-muted"} transition-all ${
                      color === c ? "ring-2 ring-primary ring-offset-1" : ""
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !systemPrompt.trim()}
                className="w-full text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                Create Persona
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-0.5 px-2">
        {personas.map((persona) => (
          <div
            key={persona.id}
            onClick={() => onSelect(persona)}
            className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-sm transition-all ${
              persona.id === activeId
                ? "bg-primary/10 text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <span className="text-base">{persona.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{persona.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{persona.description}</p>
            </div>
            {!isDefault(persona.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(persona.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
