import { motion } from "framer-motion";
import { StickyNote, BookOpen, Calendar, Heart, RotateCcw, Download, ImageIcon, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";

/* ── PDF Export Helper ── */
function exportToPdf(title: string, buildContent: (doc: jsPDF) => void) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica");
  doc.setFontSize(22);
  doc.text(title, 20, 25);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 30, 190, 30);
  buildContent(doc);
  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

function PdfButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
      title="Download as PDF"
    >
      <Download size={13} />
      <span>PDF</span>
    </button>
  );
}

/* ── Visual Note Card ── */
export function NoteCard({ title, items }: { title: string; items: string[] }) {
  const handlePdf = () => {
    exportToPdf(title, (doc) => {
      doc.setFontSize(12);
      items.forEach((item, i) => {
        const y = 40 + i * 10;
        if (y > 270) return;
        doc.text(`• ${item}`, 25, y);
      });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="tool-card tool-card-note my-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StickyNote size={18} className="text-lemon-foreground" />
          <h3 className="font-bold text-base">{title}</h3>
        </div>
        <PdfButton onClick={handlePdf} />
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

  const handlePdf = () => {
    exportToPdf("Flashcards", (doc) => {
      doc.setFontSize(12);
      cards.forEach((c, i) => {
        const y = 40 + i * 18;
        if (y > 260) return;
        doc.setFont("helvetica", "bold");
        doc.text(`Q: ${c.front}`, 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(`A: ${c.back}`, 25, y + 7);
        doc.setDrawColor(230, 230, 230);
        doc.line(25, y + 11, 185, y + 11);
      });
    });
  };

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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {cards.length}
          </span>
          <PdfButton onClick={handlePdf} />
        </div>
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

  const handlePdf = () => {
    exportToPdf(title, (doc) => {
      doc.setFontSize(12);
      tasks.forEach((item, i) => {
        const y = 40 + i * 10;
        if (y > 270) return;
        const check = checkedItems.has(i) ? "✓" : "○";
        doc.text(`${check}  ${item.time}  ${item.task}`, 25, y);
      });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="tool-card tool-card-planner my-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-mint-foreground" />
          <h3 className="font-bold text-base">{title}</h3>
        </div>
        <PdfButton onClick={handlePdf} />
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

  const handlePdf = () => {
    exportToPdf(title, (doc) => {
      doc.setFontSize(14);
      items.forEach((item, i) => {
        const y = 40 + i * 15;
        if (y > 270) return;
        doc.text(`✦ ${item.text}`, 25, y);
      });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="tool-card tool-card-moodboard my-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-rose-foreground" />
          <h3 className="font-bold text-base">{title}</h3>
        </div>
        <PdfButton onClick={handlePdf} />
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

/* ── AI Image Card ── */
export function ImageCard({ prompt, caption }: { prompt: string; caption?: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt }),
        }
      );
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(data.error || "Image generation failed");
      }
      const data = await resp.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        throw new Error("No image returned");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  useEffect(() => {
    generateImage();
  }, [generateImage]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${(caption || prompt).slice(0, 30).replace(/\s+/g, "_")}.png`;
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="tool-card my-3"
      style={{
        background: "linear-gradient(135deg, hsl(200 60% 85% / 0.5), hsl(270 45% 87% / 0.3))",
        borderColor: "hsl(200 60% 85% / 0.5)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-sky-foreground" />
          <h3 className="font-bold text-base">Generated Image</h3>
        </div>
        {imageUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={13} />
            <span>Save</span>
          </button>
        )}
      </div>

      <div className="rounded-xl overflow-hidden bg-background/40 min-h-[200px] flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm">Generating image…</p>
            <p className="text-xs max-w-[300px] text-center opacity-60">{prompt}</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <p className="text-sm">😔 {error}</p>
            <button
              onClick={generateImage}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}
        {imageUrl && !loading && (
          <img
            src={imageUrl}
            alt={caption || prompt}
            className="w-full rounded-xl"
          />
        )}
      </div>

      {caption && !loading && (
        <p className="text-sm text-muted-foreground mt-2 text-center italic">{caption}</p>
      )}
    </motion.div>
  );
}
