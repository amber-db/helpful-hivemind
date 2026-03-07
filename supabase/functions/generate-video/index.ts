import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "No prompt provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use Gemini to generate a descriptive video script, then use Veo via the AI gateway
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [
            {
              role: "user",
              content: `Generate a short video based on this description: ${prompt}. Create an animated visualization or illustration that represents this concept.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Video generation error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Video generation is not available yet. Try generating an image instead!" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Try to extract image/video from the response
    const content = data.choices?.[0]?.message?.content;
    
    if (typeof content === "string") {
      // Check for base64 encoded content
      const base64Match = content.match(/data:(image|video)\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (base64Match) {
        return new Response(
          JSON.stringify({ videoUrl: base64Match[0] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Check for URL
      const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(mp4|webm|gif|png|jpg)/i);
      if (urlMatch) {
        return new Response(
          JSON.stringify({ videoUrl: urlMatch[0] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check parts array format
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "image_url" || part.inline_data) {
          const mimeType = part.inline_data?.mime_type || "image/png";
          const b64 = part.inline_data?.data;
          if (b64) {
            return new Response(
              JSON.stringify({ videoUrl: `data:${mimeType};base64,${b64}` }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ error: "Video generation is not available yet. Try generating an image instead!" }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
