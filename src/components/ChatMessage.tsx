import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Bot, User, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Message } from "@/lib/chat";

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
      className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
    </button>
  );
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const language = className?.replace("language-", "") || "";
  return (
    <div className="relative group mb-3">
      <div className="flex items-center justify-between bg-muted/80 rounded-t-lg px-4 py-1.5 text-xs text-muted-foreground">
        <span>{language}</span>
        <CopyButton text={children.trimEnd()} />
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "0.5rem",
          borderBottomRightRadius: "0.5rem",
          fontSize: "0.85rem",
        }}
        wrapLongLines
      >
        {children.trimEnd()}
      </SyntaxHighlighter>
    </div>
  );
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group py-6 px-4 ${isUser ? "bg-chat-user" : "bg-chat-assistant"}`}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {isUser ? (
            <p className="text-foreground leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
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
                {message.content}
              </ReactMarkdown>
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
