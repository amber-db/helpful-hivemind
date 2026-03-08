-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Chat',
  persona_id text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own conversations"
  ON public.conversations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own messages"
  ON public.messages FOR ALL
  TO authenticated
  USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
  );

-- Gallery images table
CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  caption text,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own gallery images"
  ON public.gallery_images FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Custom personas table
CREATE TABLE public.custom_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '✨',
  description text NOT NULL DEFAULT '',
  system_prompt text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'mint',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own personas"
  ON public.custom_personas FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_gallery_user ON public.gallery_images(user_id, created_at DESC);
CREATE INDEX idx_personas_user ON public.custom_personas(user_id);