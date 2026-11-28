-- Unified Multi-Platform Social Chats & Comments Inbox (Marketing Hub)
-- Isolated strictly by organization_slug so each client only sees their own chats.

CREATE TABLE IF NOT EXISTS public.marketing_inbox_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_slug text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('instagram', 'facebook', 'whatsapp', 'youtube', 'tiktok', 'linkedin')),
  thread_type text NOT NULL DEFAULT 'dm' CHECK (thread_type IN ('dm', 'comment')),
  external_thread_id text NOT NULL,
  external_account_id text,
  contact_id text,
  contact_name text NOT NULL,
  contact_handle text,
  contact_avatar_url text,
  post_reference_title text,
  post_reference_url text,
  last_message_preview text NOT NULL DEFAULT '',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),
  assigned_to_email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_slug, channel, external_thread_id)
);

CREATE TABLE IF NOT EXISTS public.marketing_inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.marketing_inbox_threads(id) ON DELETE CASCADE,
  organization_slug text NOT NULL,
  channel text NOT NULL,
  external_message_id text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_name text NOT NULL,
  sender_id text,
  body text NOT NULL,
  media_url text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by_email text,
  delivery_status text NOT NULL DEFAULT 'delivered' CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'local_only')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_slug, channel, external_message_id)
);

CREATE INDEX IF NOT EXISTS idx_inbox_threads_org_last_msg
  ON public.marketing_inbox_threads (organization_slug, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_threads_org_channel_status
  ON public.marketing_inbox_threads (organization_slug, channel, status);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread_sent
  ON public.marketing_inbox_messages (thread_id, sent_at ASC);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_org_channel
  ON public.marketing_inbox_messages (organization_slug, channel);

ALTER TABLE public.marketing_inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view marketing inbox threads" ON public.marketing_inbox_threads;
CREATE POLICY "Authenticated users can view marketing inbox threads"
  ON public.marketing_inbox_threads
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view marketing inbox messages" ON public.marketing_inbox_messages;
CREATE POLICY "Authenticated users can view marketing inbox messages"
  ON public.marketing_inbox_messages
  FOR SELECT
  TO authenticated
  USING (true);
