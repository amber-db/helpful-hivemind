import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { Message } from "@/lib/chat";

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`py-6 px-4 ${isUser ? "bg-chat-user" : "bg-chat-assistant"}`}
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
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
