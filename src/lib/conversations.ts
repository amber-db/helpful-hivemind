import type { Message } from "./chat";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "nexusai-conversations";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  return first.content.length > 40
    ? first.content.slice(0, 40) + "…"
    : first.content;
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function saveConversation(
  id: string | null,
  messages: Message[]
): Conversation {
  const conversations = loadConversations();
  const now = Date.now();

  if (id) {
    const idx = conversations.findIndex((c) => c.id === id);
    if (idx !== -1) {
      conversations[idx].messages = messages;
      conversations[idx].title = getTitle(messages);
      conversations[idx].updatedAt = now;
      save(conversations);
      return conversations[idx];
    }
  }

  const conv: Conversation = {
    id: generateId(),
    title: getTitle(messages),
    messages,
    createdAt: now,
    updatedAt: now,
  };
  conversations.unshift(conv);
  save(conversations);
  return conv;
}

export function deleteConversation(id: string) {
  const conversations = loadConversations().filter((c) => c.id !== id);
  save(conversations);
}
