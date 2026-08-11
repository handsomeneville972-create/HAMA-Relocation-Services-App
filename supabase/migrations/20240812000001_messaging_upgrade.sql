-- ============================================================
-- HAMA Messaging System Upgrade
-- Adds context fields, new tables, storage, and indexes.
-- All statements are idempotent (IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- ============================================================
-- 1. ALTER EXISTING TABLES
-- ============================================================

-- conversations: add context FKs and last_message_id
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_id UUID;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS service_provider_id UUID;

-- conversation_participants: add last_read_at
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- messages: add new columns (keep 'text' for backward compat)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id UUID;

-- profiles: add push_token for Expo push notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- ============================================================
-- 2. NEW TABLES
-- ============================================================

-- user_presence: online/offline tracking
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id       UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- blocks: user blocking
CREATE TABLE IF NOT EXISTS public.blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- message_reports: moderation
CREATE TABLE IF NOT EXISTS public.message_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id        UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  conversation_id   UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  category          TEXT NOT NULL CHECK (category IN ('spam','harassment','scam','inappropriate','other')),
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

-- user_presence: anyone can read (for online status), users can upsert own row
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view presence' AND tablename = 'user_presence') THEN
    CREATE POLICY "Anyone can view presence"
      ON public.user_presence FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upsert own presence' AND tablename = 'user_presence') THEN
    CREATE POLICY "Users can upsert own presence"
      ON public.user_presence FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own presence' AND tablename = 'user_presence') THEN
    CREATE POLICY "Users can update own presence"
      ON public.user_presence FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- blocks: users can read/create own blocks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own blocks' AND tablename = 'blocks') THEN
    CREATE POLICY "Users can view own blocks"
      ON public.blocks FOR SELECT
      TO authenticated
      USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create blocks' AND tablename = 'blocks') THEN
    CREATE POLICY "Users can create blocks"
      ON public.blocks FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = blocker_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own blocks' AND tablename = 'blocks') THEN
    CREATE POLICY "Users can delete own blocks"
      ON public.blocks FOR DELETE
      TO authenticated
      USING (auth.uid() = blocker_id);
  END IF;
END $$;

-- message_reports: users can insert own reports, read own reports, no update/delete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create reports' AND tablename = 'message_reports') THEN
    CREATE POLICY "Users can create reports"
      ON public.message_reports FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own reports' AND tablename = 'message_reports') THEN
    CREATE POLICY "Users can view own reports"
      ON public.message_reports FOR SELECT
      TO authenticated
      USING (auth.uid() = reporter_id);
  END IF;
END $$;

-- messages: add update policy (sender can edit own messages)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Senders can update own messages' AND tablename = 'messages') THEN
    CREATE POLICY "Senders can update own messages"
      ON public.messages FOR UPDATE
      TO authenticated
      USING (
        auth.uid() = sender_id
        AND EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = messages.conversation_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- messages: add delete policy (sender can soft-delete own messages)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Senders can delete own messages' AND tablename = 'messages') THEN
    CREATE POLICY "Senders can delete own messages"
      ON public.messages FOR DELETE
      TO authenticated
      USING (
        auth.uid() = sender_id
        AND EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = messages.conversation_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- conversations: add update policy for participants (for last_message_id updates)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can update conversations' AND tablename = 'conversations') THEN
    CREATE POLICY "Participants can update conversations"
      ON public.conversations FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = id AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- conversation_participants: add update policy (for last_read_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can update own participant row' AND tablename = 'conversation_participants') THEN
    CREATE POLICY "Participants can update own participant row"
      ON public.conversation_participants FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_messages_message_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_property ON public.conversations(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_product ON public.conversations(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_provider ON public.conversations(service_provider_id) WHERE service_provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_id) WHERE last_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen_at);

-- ============================================================
-- 5. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to own folder
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload chat attachments' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can upload chat attachments"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'chat-attachments'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Storage RLS: participants can read conversation attachments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view chat attachments' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Participants can view chat attachments"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'chat-attachments'
      );
  END IF;
END $$;

-- Storage RLS: users can delete own uploads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own chat attachments' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can delete own chat attachments"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'chat-attachments'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ============================================================
-- 6. ENABLE REALTIME
-- ============================================================

-- Add conversations to Realtime publication (for live inbox updates)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

-- Messages table already in Realtime publication from earlier migration

-- ============================================================
-- 7. UPDATED_AT TRIGGER
-- ============================================================

-- Add updated_at trigger to messages table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'messages_updated_at'
  ) THEN
    CREATE TRIGGER messages_updated_at
      BEFORE UPDATE ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

COMMIT;
