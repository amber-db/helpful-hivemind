import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";

interface SharedData {
  prompt: string;
  caption: string | null;
  image_url: string;
  created_at: string;
}

export default function SharedImage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: share, error: err } = await supabase
        .from("shared_images")
        .select("gallery_image_id")
        .eq("share_token", token)
        .single();
      if (err || !share) { setError(true); setLoading(false); return; }

      const { data: img, error: imgErr } = await supabase
        .from("gallery_images")
        .select("prompt, caption, image_url, created_at")
        .eq("id", (share as any).gallery_image_id)
        .single();
      if (imgErr || !img) { setError(true); setLoading(false); return; }
      setData(img as SharedData);
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-2">
        <p className="text-foreground font-semibold">Image not found</p>
        <p className="text-muted-foreground text-sm">This shared link may have been removed.</p>
      </div>
    );
  }

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = data.image_url;
    link.download = `${(data.caption || data.prompt).slice(0, 30).replace(/\s+/g, "_")}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
        <img
          src={data.image_url}
          alt={data.caption || data.prompt}
          className="w-full"
        />
        <div className="p-5">
          <p className="text-sm font-medium text-foreground">{data.caption || data.prompt}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(data.created_at).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
          <button
            onClick={handleDownload}
            className="mt-4 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Download size={13} /> Download
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4">Shared from NexusAI ✨</p>
    </div>
  );
}
