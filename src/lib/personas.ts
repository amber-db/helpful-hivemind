export interface Persona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  color: string; // tailwind color token like "peach" | "mint" | "lavender" | "sky" | "rose"
}

const STORAGE_KEY = "nexusai-personas";
const ACTIVE_KEY = "nexusai-active-persona";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "default",
    name: "Nexus",
    emoji: "✨",
    description: "Your friendly all-purpose assistant",
    systemPrompt: "You are Nexus, a warm, friendly, and helpful AI assistant. You use a conversational tone with occasional emoji. You're encouraging and supportive. Use markdown formatting when helpful. Be concise but thorough.",
    color: "mint",
  },
  {
    id: "creative",
    name: "Muse",
    emoji: "🎨",
    description: "Creative writer & brainstorming partner",
    systemPrompt: "You are Muse, a wildly creative AI with artistic flair. You think outside the box, use vivid language, metaphors, and playful prose. You love brainstorming, storytelling, and making ideas sparkle. Use emoji liberally. Be expressive and imaginative.",
    color: "lavender",
  },
  {
    id: "scholar",
    name: "Sage",
    emoji: "📚",
    description: "Patient tutor & study companion",
    systemPrompt: "You are Sage, a patient and knowledgeable tutor. You break down complex topics into simple explanations, use analogies, and check for understanding. You create study materials, flashcards, and structured notes. Be encouraging and thorough.",
    color: "sky",
  },
  {
    id: "coach",
    name: "Spark",
    emoji: "⚡",
    description: "Motivational life & productivity coach",
    systemPrompt: "You are Spark, an energetic productivity and life coach. You help users set goals, build routines, plan their days, and stay motivated. You're upbeat, action-oriented, and love creating planners and to-do lists. Use encouraging language and emoji.",
    color: "peach",
  },
];

export function loadPersonas(): Persona[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const custom: Persona[] = raw ? JSON.parse(raw) : [];
    return [...DEFAULT_PERSONAS, ...custom];
  } catch {
    return DEFAULT_PERSONAS;
  }
}

export function saveCustomPersona(persona: Omit<Persona, "id">): Persona {
  const all = loadCustomPersonas();
  const newPersona = { ...persona, id: generateId() };
  all.push(newPersona);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newPersona;
}

export function loadCustomPersonas(): Persona[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteCustomPersona(id: string) {
  const personas = loadCustomPersonas().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
}

export function getActivePersonaId(): string {
  return localStorage.getItem(ACTIVE_KEY) || "default";
}

export function setActivePersonaId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export const PERSONA_COLORS: Record<string, string> = {
  mint: "bg-mint text-mint-foreground",
  peach: "bg-peach text-peach-foreground",
  lavender: "bg-lavender text-lavender-foreground",
  sky: "bg-sky text-sky-foreground",
  rose: "bg-rose text-rose-foreground",
  lemon: "bg-lemon text-lemon-foreground",
};
