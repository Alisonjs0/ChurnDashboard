create extension if not exists pgcrypto;

create table if not exists public.conversation_messages (
  id text primary key,
  message_id text not null,
  client_id text not null,
  client_name text not null,
  client_email text,
  client_phone text,
  sender text not null check (sender in ('support', 'client', 'system')),
  sender_name text not null,
  message text not null,
  timestamp text not null,
  sent_at timestamptz not null default now(),
  type text not null default 'message' check (type in ('message', 'note', 'alert')),
  status text not null default 'sent' check (status in ('sent', 'received', 'failed')),
  error text,
  source text,
  direction text not null default 'internal' check (direction in ('outbound', 'inbound', 'internal')),
  webhook_status integer,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_conversation_messages_client_sent_at
  on public.conversation_messages (client_id, sent_at);

create index if not exists idx_conversation_messages_status
  on public.conversation_messages (status);

create table if not exists public.webhook_events (
  id text primary key,
  timestamp timestamptz not null default now(),
  type text not null check (type in ('sent', 'received', 'error')),
  status text not null,
  client_id text not null,
  client_name text not null,
  endpoint text not null,
  source text,
  message_id text,
  payload jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  error text
);

create index if not exists idx_webhook_events_client_timestamp
  on public.webhook_events (client_id, timestamp desc);

create index if not exists idx_webhook_events_type_timestamp
  on public.webhook_events (type, timestamp desc);

alter table public.conversation_messages enable row level security;
alter table public.webhook_events enable row level security;

create policy if not exists "conversation_messages_allow_all"
  on public.conversation_messages
  for all
  using (true)
  with check (true);

create policy if not exists "webhook_events_allow_all"
  on public.webhook_events
  for all
  using (true)
  with check (true);
