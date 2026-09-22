alter table public.friend_requests enable row level security;

drop policy if exists "Allow Insert" on public.friend_requests;
create policy "Allow Insert"
on public.friend_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow Participants Select"
on public.friend_requests;
create policy "Allow Participants Select"
on public.friend_requests
for select
to anon, authenticated
using (true);

drop policy if exists "Allow Receiver Update"
on public.friend_requests;
create policy "Allow Receiver Update"
on public.friend_requests
for update
to authenticated
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);

drop policy if exists "Allow Participant Delete" on public.friend_requests;
create policy "Allow Participant Delete"
on public.friend_requests
for delete
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'friend_requests'
  ) then
    alter publication supabase_realtime add table public.friend_requests;
  end if;
end
$$;
