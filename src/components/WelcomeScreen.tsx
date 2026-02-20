import { motion } from "framer-motion";
import { StickyNote, BookOpen, Calendar, Heart, Sparkles } from "lucide-react";
import type { Persona } from "@/lib/personas";

const suggestions = [
  { text: "Create study flashcards about the solar system", icon: BookOpen, color: "bg-lavender text-lavender-foreground" },
  { text: "Plan my perfect productive morning routine", icon: Calendar, color: "bg-mint text-mint-foreground" },
  { text: "Make a vision board for my goals this year", icon: Heart, color: "bg-rose text-rose-foreground" },
  { text: "Summarize the key ideas of mindfulness into visual notes", icon: StickyNote, color: "bg-lemon text-lemon-foreground" },
];

export function WelcomeScreen({ onSuggestion, persona }: { onSuggestion: (text: string) => void; persona?: Persona }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pastel-blob w-72 h-72 bg-mint -top-20 -right-20 absolute" />
      <div className="pastel-blob w-96 h-96 bg-peach -bottom-32 -left-32 absolute" />
      <div className="pastel-blob w-60 h-60 bg-lavender top-1/3 right-1/4 absolute" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 relative z-10"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5 text-2xl"
        >
          {persona?.emoji || "✨"}
        </motion.div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          Hey there! I'm <span className="gradient-text">{persona?.name || "Nexus"}</span>
        </h1>
        <p className="text-muted-foreground text-base">
          {persona?.description || "Your friendly AI companion — ask me anything! ✨"}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full relative z-10">
        {suggestions.map((item, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            onClick={() => onSuggestion(item.text)}
            className="group text-left p-4 rounded-2xl border border-border bg-background/80 backdrop-blur-sm hover:shadow-md hover:border-primary/30 text-sm text-foreground transition-all flex items-start gap-3"
          >
            <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
              <item.icon size={16} />
            </div>
            <span className="pt-1">{item.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
