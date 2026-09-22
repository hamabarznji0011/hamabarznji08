alter table public.profiles
  add column if not exists games_played integer not null default 0,
  add column if not exists losses integer not null default 0;

update public.profiles
set games_played = coalesce(games_played, 0),
    losses = coalesce(losses, 0);

alter table public.profiles
  add constraint profiles_games_played_check check (games_played >= 0),
  add constraint profiles_losses_check check (losses >= 0);