import { motion } from "framer-motion";
import { StickyNote, BookOpen, Calendar, Heart, RotateCcw } from "lucide-react";
import { useState } from "react";

/* ── Visual Note Card ── */
export function NoteCard({ title, items }: { title: string; items: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="tool-card tool-card-note my-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <StickyNote size={18} className="text-lemon-foreground" />
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-1 w-2 h-2 rounded-full bg-lemon-foreground/40 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ── Flashcard ── */
export function FlashcardSet({ cards }: { cards: { front: string; back: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="tool-card tool-card-flashcard my-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-lavender-foreground" />
          <h3 className="font-bold text-base">Flashcards</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer min-h-[120px] rounded-xl bg-background/60 p-5 flex items-center justify-center text-center transition-all hover:shadow-md"
      >
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            {flipped ? "Answer" : "Question"} — tap to flip
          </p>
          <p className={`text-sm font-medium ${flipped ? "text-primary" : ""}`}>
            {flipped ? card.back : card.front}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => { setFlipped(false); setCurrentIndex(Math.max(0, currentIndex - 1)); }}
          disabled={currentIndex === 0}
          className="text-xs px-3 py-1.5 rounded-lg bg-background/60 hover:bg-background disabled:opacity-30 transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={() => setFlipped(false)}
          className="p-1.5 rounded-lg bg-background/60 hover:bg-background transition-colors"
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => { setFlipped(false); setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1)); }}
          disabled={currentIndex === cards.length - 1}
          className="text-xs px-3 py-1.5 rounded-lg bg-background/60 hover:bg-background disabled:opacity-30 transition-colors"
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}

/* ── Daily Planner ── */
export function PlannerCard({ title, tasks }: { title: string; tasks: { time: string; task: string; done?: boolean }[] }) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="tool-card tool-card-planner my-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={18} className="text-mint-foreground" />
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      <div className="space-y-2">
        {tasks.map((item, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            className={`flex items-center gap-3 p-2.5 rounded-xl bg-background/60 cursor-pointer transition-all hover:bg-background/80 ${
              checkedItems.has(i) ? "opacity-50" : ""
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                checkedItems.has(i) ? "bg-primary border-primary" : "border-muted-foreground/30"
              }`}
            >
              {checkedItems.has(i) && (
                <span className="text-primary-foreground text-xs">✓</span>
              )}
            </div>
            <span className="text-xs font-mono text-muted-foreground w-14 flex-shrink-0">
              {item.time}
            </span>
            <span className={`text-sm flex-1 ${checkedItems.has(i) ? "line-through" : ""}`}>
              {item.task}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Mood Board ── */
export function MoodBoard({ title, items }: { title: string; items: { text: string; color: string }[] }) {
  const colorMap: Record<string, string> = {
    peach: "bg-peach/60 text-peach-foreground",
    mint: "bg-mint/60 text-mint-foreground",
    lavender: "bg-lavender/60 text-lavender-foreground",
    sky: "bg-sky/60 text-sky-foreground",
    rose: "bg-rose/60 text-rose-foreground",
    lemon: "bg-lemon/60 text-lemon-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="tool-card tool-card-moodboard my-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <Heart size={18} className="text-rose-foreground" />
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl ${colorMap[item.color] || colorMap.lavender} font-handwritten text-lg text-center`}
          >
            {item.text}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
