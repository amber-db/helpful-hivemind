import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Message } from "@/lib/chat";
import { NoteCard, FlashcardSet, PlannerCard, MoodBoard, ImageCard } from "./ToolCards";
import type { Persona } from "@/lib/personas";

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={copy}
      className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
    </button>
  );
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const language = className?.replace("language-", "") || "";
  return (
    <div className="relative group mb-3 rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-muted px-4 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{language}</span>
        <CopyButton text={children.trimEnd()} />
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.82rem",
          background: "hsl(30 40% 95%)",
        }}
        wrapLongLines
      >
        {children.trimEnd()}
      </SyntaxHighlighter>
    </div>
  );
}

/* Parse tool blocks from AI output */
function parseToolBlocks(content: string) {
  const toolRegex = /```(note|flashcards|planner|moodboard|image)\n([\s\S]*?)```/g;
  const parts: Array<{ type: "text" | "note" | "flashcards" | "planner" | "moodboard" | "image"; content: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = toolRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: match[1] as any, content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text" as const, content }];
}

function renderToolCard(type: string, raw: string) {
  try {
    const data = JSON.parse(raw.trim());
    switch (type) {
      case "note":
        return <NoteCard title={data.title || "Notes"} items={data.items || []} />;
      case "flashcards":
        return <FlashcardSet cards={data.cards || []} />;
      case "planner":
        return <PlannerCard title={data.title || "Today's Plan"} tasks={data.tasks || []} />;
      case "moodboard":
        return <MoodBoard title={data.title || "Mood Board"} items={data.items || []} />;
      case "image":
        return <ImageCard prompt={data.prompt} caption={data.caption} />;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function ChatMessage({ message, persona }: { message: Message; persona?: Persona }) {
  const isUser = message.role === "user";

  const parts = isUser ? null : parseToolBlocks(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group py-5 px-4 ${isUser ? "bg-chat-user" : "bg-chat-assistant"}`}
    >
      <div className="max-w-3xl mx-auto flex gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-peach text-peach-foreground"
          }`}
        >
          {isUser ? "🙂" : (persona?.emoji || "✨")}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {isUser ? "You" : (persona?.name || "Nexus")}
          </p>
          {isUser ? (
            <p className="text-foreground leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose-chat">
              {parts?.map((part, i) => {
                if (part.type !== "text") {
                  return <div key={i}>{renderToolCard(part.type, part.content)}</div>;
                }
                return (
                  <ReactMarkdown
                    key={i}
                    components={{
                      code({ className, children, ...props }) {
                        const isBlock = className?.startsWith("language-");
                        if (isBlock) {
                          return <CodeBlock className={className}>{String(children)}</CodeBlock>;
                        }
                        return <code className={className} {...props}>{children}</code>;
                      },
                      pre({ children }) {
                        return <>{children}</>;
                      },
                    }}
                  >
                    {part.content}
                  </ReactMarkdown>
                );
              })}
            </div>
          )}
        </div>
        <CopyButton
          text={message.content}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 self-start"
        />
      </div>
    </motion.div>
  );
}
