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
    const { prompt, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const messages: any[] = [
      {
        role: "user",
        content: imageUrl
          ? [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ]
          : `Generate an image: ${prompt}. Only output the image, no text.`,
      },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          modalities: ["image", "text"],
          messages,
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
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("Image edit error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Image editing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    // Check for images array
    const images = choice?.message?.images;
    if (images && images.length > 0) {
      const img = images[0];
      const url = img.image_url?.url || img.url;
      if (url) {
        return new Response(
          JSON.stringify({ imageUrl: url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for inline_data in parts
    const parts = choice?.message?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inline_data) {
          return new Response(
            JSON.stringify({
              imageUrl: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Check content for base64
    const content = choice?.message?.content;
    if (content && typeof content === "string") {
      const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (base64Match) {
        return new Response(
          JSON.stringify({ imageUrl: base64Match[0] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (Array.isArray(content)) {
      for (const item of content) {
        if (item.type === "image_url") {
          return new Response(
            JSON.stringify({ imageUrl: item.image_url.url }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.error("No image in response:", JSON.stringify(data).slice(0, 500));
    return new Response(
      JSON.stringify({ error: "No image generated" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("edit-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
