import { supabase } from "@/integrations/supabase/client";

export async function shareGalleryImage(galleryImageId: string): Promise<string> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not authenticated");

  // Check if already shared
  const { data: existing } = await supabase
    .from("shared_images")
    .select("share_token")
    .eq("gallery_image_id", galleryImageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return (existing as any).share_token as string;

  const { data, error } = await supabase
    .from("shared_images")
    .insert({ gallery_image_id: galleryImageId, user_id: user.id } as any)
    .select("share_token")
    .single();

  if (error || !data) throw error || new Error("Failed to share");
  return (data as any).share_token as string;
}

export async function unshareGalleryImage(galleryImageId: string): Promise<void> {
  await supabase
    .from("shared_images")
    .delete()
    .eq("gallery_image_id", galleryImageId);
}
