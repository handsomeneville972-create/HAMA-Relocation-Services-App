-- HAMA: Messaging Tables
-- Creates conversations, conversation_participants, and messages tables
-- for in-app messaging between users (house seekers, landlords, sellers, service providers).

-- ============================================================
-- CONVERSATIONS
-- ============================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Fast lookups for conversation participants
create index if not exists idx_conversation_participants_user
  on public.conversation_participants(user_id);

create index if not exists idx_conversation_participants_conversation
  on public.conversation_participants(conversation_id);

-- Fast message fetching by conversation
create index if not exists idx_messages_conversation
  on public.messages(conversation_id, created_at asc);

-- Fast unread message count
create index if not exists idx_messages_unread
  on public.messages(conversation_id, sender_id, read)
  where read = false;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Conversations: participants can read, anyone authenticated can create
create policy "Participants can view conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = id
      and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.uid() is not null);

create policy "Participants can update conversations"
  on public.conversations for update
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = id
      and user_id = auth.uid()
    )
  );

-- Conversation participants: participants can view, authenticated can insert
create policy "Participants can view conversation participants"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Authenticated users can add participants"
  on public.conversation_participants for insert
  with check (auth.uid() is not null);

-- Messages: participants can read, participants can insert their own
create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Participants can update messages (read receipts)"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable Realtime for messages table (for live chat)
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conversations_updated_at
  before update on public.conversations
  for each row
  execute function public.handle_updated_at();

commit;
