import { supabase } from "@/integrations/supabase/client";
import type { Message } from "./chat";
import type { Persona } from "./personas";

/* ── Conversations ── */

export interface DbConversation {
  id: string;
  title: string;
  persona_id: string;
  created_at: string;
  updated_at: string;
}

export async function loadDbConversations(): Promise<DbConversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, persona_id, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbConversation[];
}

export async function loadDbMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

function getTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  return first.content.length > 40 ? first.content.slice(0, 40) + "…" : first.content;
}

export async function saveDbConversation(
  conversationId: string | null,
  messages: Message[],
  personaId: string
): Promise<string> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not authenticated");

  const title = getTitle(messages);

  if (conversationId) {
    // Update title & timestamp
    await supabase
      .from("conversations")
      .update({ title, updated_at: new Date().toISOString() } as any)
      .eq("id", conversationId);

    // Get existing count to only insert new messages
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    const existingCount = count ?? 0;
    const newMessages = messages.slice(existingCount);
    if (newMessages.length > 0) {
      await supabase.from("messages").insert(
        newMessages.map((m) => ({
          conversation_id: conversationId,
          role: m.role,
          content: m.content,
        })) as any
      );
    }
    return conversationId;
  }

  // Create new conversation
  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, title, persona_id: personaId } as any)
    .select("id")
    .single();
  if (error || !conv) throw error || new Error("Failed to create conversation");

  const convId = (conv as any).id as string;
  if (messages.length > 0) {
    await supabase.from("messages").insert(
      messages.map((m) => ({
        conversation_id: convId,
        role: m.role,
        content: m.content,
      })) as any
    );
  }
  return convId;
}

export async function deleteDbConversation(id: string) {
  await supabase.from("conversations").delete().eq("id", id);
}

/* ── Gallery ── */

export interface DbGalleryImage {
  id: string;
  prompt: string;
  caption: string | null;
  image_url: string;
  created_at: string;
}

export async function loadDbGalleryImages(): Promise<DbGalleryImage[]> {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("id, prompt, caption, image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as DbGalleryImage[];
}

export async function saveDbGalleryImage(img: { prompt: string; caption?: string; imageUrl: string }) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  await supabase.from("gallery_images").insert({
    user_id: user.id,
    prompt: img.prompt,
    caption: img.caption ?? null,
    image_url: img.imageUrl,
  } as any);
}

export async function deleteDbGalleryImage(id: string) {
  await supabase.from("gallery_images").delete().eq("id", id);
}

/* ── Custom Personas ── */

export interface DbPersona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  system_prompt: string;
  color: string;
}

export async function loadDbCustomPersonas(): Promise<DbPersona[]> {
  const { data, error } = await supabase
    .from("custom_personas")
    .select("id, name, emoji, description, system_prompt, color")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbPersona[];
}

export async function saveDbCustomPersona(p: Omit<Persona, "id">): Promise<DbPersona> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("custom_personas")
    .insert({
      user_id: user.id,
      name: p.name,
      emoji: p.emoji,
      description: p.description,
      system_prompt: p.systemPrompt,
      color: p.color,
    } as any)
    .select("id, name, emoji, description, system_prompt, color")
    .single();
  if (error || !data) throw error || new Error("Failed");
  return data as DbPersona;
}

export async function deleteDbCustomPersona(id: string) {
  await supabase.from("custom_personas").delete().eq("id", id);
}
