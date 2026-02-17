import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const suggestions = [
  "Explain quantum computing in simple terms",
  "Write a Python function to sort a list",
  "What are the best practices for React?",
  "Help me plan a weekend trip to Paris",
];

export function WelcomeScreen({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="text-primary" size={28} />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">How can I help you?</h1>
        <p className="text-muted-foreground">Ask me anything — I'm here to assist.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {suggestions.map((text, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            onClick={() => onSuggestion(text)}
            className="text-left p-4 rounded-xl border border-border bg-secondary hover:bg-chat-hover text-sm text-secondary-foreground transition-colors"
          >
            {text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
