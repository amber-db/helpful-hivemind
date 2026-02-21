import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOL_INSTRUCTIONS = `

You have access to special visual tools. When appropriate, use these to create engaging visual content. Output them as fenced code blocks with special language tags:

1. **Visual Notes** - Use \`\`\`note with JSON:
\`\`\`note
{"title": "Key Takeaways", "items": ["First point", "Second point", "Third point"]}
\`\`\`

2. **Flashcards** - Use \`\`\`flashcards with JSON:
\`\`\`flashcards
{"cards": [{"front": "Question?", "back": "Answer"}, {"front": "Q2?", "back": "A2"}]}
\`\`\`

3. **Daily Planner** - Use \`\`\`planner with JSON:
\`\`\`planner
{"title": "Morning Routine", "tasks": [{"time": "7:00 AM", "task": "Wake up"}, {"time": "7:30 AM", "task": "Exercise"}]}
\`\`\`

4. **Mood Board** - Use \`\`\`moodboard with JSON:
\`\`\`moodboard
{"title": "Inspiration", "items": [{"text": "Dream big ✨", "color": "lavender"}, {"text": "Stay curious", "color": "mint"}, {"text": "Be kind 💕", "color": "rose"}, {"text": "Keep growing 🌱", "color": "peach"}]}
\`\`\`

5. **AI Image** - When the user asks you to generate, draw, create, or make an image/picture/illustration, use \`\`\`image with JSON:
\`\`\`image
{"prompt": "A detailed description of the image to generate", "caption": "Optional caption for the image"}
\`\`\`

Colors available for mood boards: peach, mint, lavender, sky, rose, lemon.

Use these tools proactively when they would enhance the response — for study content use flashcards, for plans use planner, for summaries use notes, for creative/inspirational content use mood boards, and for image requests use the image tool. You can mix regular markdown with tool blocks. All tool cards can be exported as PDF by the user.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt, personaName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const defaultPrompt = "You are Nexus, a warm, friendly, and helpful AI assistant. You use a conversational tone with occasional emoji. You're encouraging and supportive. Use markdown formatting when helpful. Be concise but thorough.";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: (systemPrompt || defaultPrompt) + TOOL_INSTRUCTIONS,
            },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
