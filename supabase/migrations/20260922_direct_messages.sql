create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  constraint direct_messages_different_participants check (sender_id <> receiver_id),
  constraint direct_messages_has_content check (length(trim(body)) > 0 or image_url is not null)
);

create index if not exists direct_messages_sender_receiver_created_at_idx
  on public.direct_messages (sender_id, receiver_id, created_at);

alter table public.direct_messages enable row level security;

drop policy if exists "Participants can read direct messages" on public.direct_messages;
create policy "Participants can read direct messages"
on public.direct_messages
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send direct messages" on public.direct_messages;
create policy "Users can send direct messages"
on public.direct_messages
for insert
to authenticated
with check (auth.uid() = sender_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end
$$;