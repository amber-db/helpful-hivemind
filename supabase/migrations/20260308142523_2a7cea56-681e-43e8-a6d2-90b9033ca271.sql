
CREATE TABLE public.shared_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_image_id uuid NOT NULL REFERENCES public.gallery_images(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_images ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "Users can CRUD own shared images"
  ON public.shared_images
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anyone can read by share token (for public viewing)
CREATE POLICY "Anyone can read shared images by token"
  ON public.shared_images
  FOR SELECT
  TO anon, authenticated
  USING (true);
