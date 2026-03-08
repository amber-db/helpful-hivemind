
-- Allow reading gallery images that have been shared (joined via shared_images)
CREATE POLICY "Anyone can read shared gallery images"
  ON public.gallery_images
  FOR SELECT
  TO anon, authenticated
  USING (
    id IN (SELECT gallery_image_id FROM public.shared_images)
  );
