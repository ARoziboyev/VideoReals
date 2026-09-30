-- =====================================================================
--  VideoMove v2 — Notes, qo‘ng‘iroqlar, do‘stlar, musiqa, reklama, cover
--  schema.sql allaqachon ishga tushirilgan bo‘lsa, FAQAT shu faylni Run qiling.
--  Qayta ishga tushirish xavfsiz.
-- =====================================================================

-- ---------- Profiles: cover + username tasdiqlash ----------
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists username_confirmed boolean not null default true;
alter table public.profiles alter column username_confirmed set default false;

-- ---------- Post / story ko‘rinishi (hammaga / do‘stlarga) ----------
alter table public.posts add column if not exists visibility text not null default 'public';
alter table public.stories add column if not exists visibility text not null default 'public';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_visibility_check') then
    alter table public.posts add constraint posts_visibility_check check (visibility in ('public','friends'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stories_visibility_check') then
    alter table public.stories add constraint stories_visibility_check check (visibility in ('public','friends'));
  end if;
end $$;

-- ---------- Xabarlar: qo‘ng‘iroq turi + meta ----------
alter table public.messages add column if not exists meta jsonb;
alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type in ('text','image','video','voice','file','call'));

-- ---------- Do‘stlar (close friends) ----------
create table if not exists public.close_friends (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index if not exists idx_close_friends_friend on public.close_friends (friend_id);

create or replace function public.is_close_friend(owner uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from close_friends where user_id = owner and friend_id = auth.uid());
$$;

-- ---------- Musiqa ----------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  artist text not null check (char_length(artist) between 1 and 120),
  audio_url text not null,
  cover_url text,
  duration integer,
  plays_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_tracks_created on public.tracks (created_at desc);
create index if not exists idx_tracks_title_trgm on public.tracks using gin (title gin_trgm_ops);
create index if not exists idx_tracks_artist_trgm on public.tracks using gin (artist gin_trgm_ops);

create or replace function public.increment_track_play(tid uuid)
returns void language sql security definer set search_path = public as $$
  update tracks set plays_count = plays_count + 1 where id = tid;
$$;

-- ---------- Notes (Instagram zametkalari) ----------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text check (char_length(text) <= 60),
  track_id uuid references public.tracks(id) on delete set null,
  media_url text,
  media_type text check (media_type in ('image','gif')),
  visibility text not null default 'public' check (visibility in ('public','friends')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  check (coalesce(text, '') <> '' or track_id is not null or media_url is not null)
);
create index if not exists idx_notes_active on public.notes (expires_at, user_id);

-- ---------- Reklama (promotions) ----------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal text not null default 'reach' check (goal in ('reach','profile','messages')),
  audience text not null default 'everyone' check (audience in ('everyone','followers','interests')),
  interests text[] not null default '{}',
  daily_budget integer not null check (daily_budget >= 1000),
  days integer not null check (days between 1 and 30),
  status text not null default 'active' check (status in ('active','paused','ended')),
  impressions integer not null default 0,
  clicks integer not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_promotions_active on public.promotions (status, ends_at);
create index if not exists idx_promotions_user on public.promotions (user_id, created_at desc);

create or replace function public.tg_promotion_dates() returns trigger language plpgsql as $$
begin
  new.ends_at := new.starts_at + make_interval(days => new.days);
  return new;
end $$;
drop trigger if exists promotion_dates on public.promotions;
create trigger promotion_dates before insert on public.promotions for each row execute function public.tg_promotion_dates();

create or replace function public.get_sponsored_posts(p_limit int default 3)
returns table (promotion_id uuid, post_id uuid, goal text)
language sql security definer stable set search_path = public as $$
  select pr.id, pr.post_id, pr.goal
  from promotions pr join posts p on p.id = pr.post_id
  where pr.status = 'active' and now() between pr.starts_at and pr.ends_at
    and pr.user_id <> auth.uid() and p.visibility = 'public'
    and (
      pr.audience = 'everyone'
      or (pr.audience = 'followers' and exists (
            select 1 from followers f where f.follower_id = auth.uid() and f.following_id = pr.user_id))
      or (pr.audience = 'interests' and exists (
            select 1 from likes l join posts p2 on p2.id = l.post_id
            where l.user_id = auth.uid() and p2.hashtags && pr.interests and l.created_at > now() - interval '90 days'))
    )
  order by random()
  limit p_limit;
$$;

create or replace function public.track_promotion(pid uuid, kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update promotions set status = 'ended' where status <> 'ended' and ends_at < now();
  update promotions
     set impressions = impressions + case when kind = 'impression' then 1 else 0 end,
         clicks      = clicks      + case when kind = 'click' then 1 else 0 end
   where id = pid and status = 'active' and user_id <> auth.uid();
end $$;

-- ---------- Yangilangan funksiyalar ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text; uname text; i int := 0; full_name text;
begin
  full_name := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '');
  base := regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'user')), '[^a-z0-9_.]', '', 'g');
  if char_length(base) < 3 then base := base || 'user'; end if;
  base := left(base, 24);
  uname := base;
  while exists (select 1 from profiles where username = uname) and i < 50 loop
    i := i + 1;
    uname := base || floor(random() * 100000)::text;
  end loop;
  insert into profiles (id, username, first_name, last_name, avatar_url, username_confirmed)
  values (
    new.id, uname,
    coalesce(new.raw_user_meta_data ->> 'first_name', nullif(split_part(full_name, ' ', 1), '')),
    coalesce(new.raw_user_meta_data ->> 'last_name', nullif(regexp_replace(full_name, '^\S+\s*', ''), '')),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    (new.raw_user_meta_data ->> 'username') is not null
  );
  return new;
end $$;

create or replace function public.get_my_conversations()
returns table (id uuid, is_group boolean, title text, avatar_url text, updated_at timestamptz,
               members jsonb, last_message jsonb, unread_count integer)
language sql security definer stable set search_path = public as $$
  select c.id, c.is_group, c.title, c.avatar_url, c.updated_at,
    (select jsonb_agg(jsonb_build_object('id', p.id, 'username', p.username, 'first_name', p.first_name,
        'last_name', p.last_name, 'avatar_url', p.avatar_url, 'is_online', p.is_online,
        'last_seen', p.last_seen, 'settings', p.settings))
       from conversation_members m2 join profiles p on p.id = m2.user_id where m2.conversation_id = c.id),
    (select to_jsonb(x) from (select ms.id, ms.content, ms.message_type, ms.sender_id, ms.created_at, ms.is_deleted, ms.meta
        from messages ms where ms.conversation_id = c.id order by ms.created_at desc limit 1) x),
    (select count(*)::int from messages ms where ms.conversation_id = c.id and ms.sender_id <> auth.uid()
        and ms.created_at > m.last_read_at and not ms.is_deleted)
  from conversations c
  join conversation_members m on m.conversation_id = c.id and m.user_id = auth.uid()
  order by c.updated_at desc;
$$;

-- ---------- RLS ----------
alter table public.close_friends enable row level security;
alter table public.tracks enable row level security;
alter table public.notes enable row level security;
alter table public.promotions enable row level security;

-- posts & stories: friends-only ko‘rinish
drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select
  using (visibility = 'public' or user_id = auth.uid() or public.is_close_friend(user_id));

drop policy if exists "stories_select" on public.stories;
create policy "stories_select" on public.stories for select
  using ((expires_at > now() and (visibility = 'public' or public.is_close_friend(user_id))) or user_id = auth.uid());

drop policy if exists "close_friends_select_own" on public.close_friends;
create policy "close_friends_select_own" on public.close_friends for select to authenticated using (user_id = auth.uid());
drop policy if exists "close_friends_insert_own" on public.close_friends;
create policy "close_friends_insert_own" on public.close_friends for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "close_friends_delete_own" on public.close_friends;
create policy "close_friends_delete_own" on public.close_friends for delete to authenticated using (user_id = auth.uid());

drop policy if exists "tracks_select" on public.tracks;
create policy "tracks_select" on public.tracks for select using (true);
drop policy if exists "tracks_insert_own" on public.tracks;
create policy "tracks_insert_own" on public.tracks for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "tracks_update_own" on public.tracks;
create policy "tracks_update_own" on public.tracks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "tracks_delete_own" on public.tracks;
create policy "tracks_delete_own" on public.tracks for delete to authenticated using (user_id = auth.uid());

drop policy if exists "notes_select" on public.notes;
create policy "notes_select" on public.notes for select to authenticated
  using ((expires_at > now() and (visibility = 'public' or public.is_close_friend(user_id))) or user_id = auth.uid());
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "promotions_select_own" on public.promotions;
create policy "promotions_select_own" on public.promotions for select to authenticated using (user_id = auth.uid());
drop policy if exists "promotions_insert_own" on public.promotions;
create policy "promotions_insert_own" on public.promotions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from posts p where p.id = post_id and p.user_id = auth.uid()));
drop policy if exists "promotions_update_own" on public.promotions;
create policy "promotions_update_own" on public.promotions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "promotions_delete_own" on public.promotions;
create policy "promotions_delete_own" on public.promotions for delete to authenticated using (user_id = auth.uid());

-- ---------- Storage: music bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('music', 'music', true, 20971520, array['audio/*'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vm_public_read" on storage.objects;
create policy "vm_public_read" on storage.objects for select
  using (bucket_id in ('avatars','videos','images','thumbnails','stories','music'));
drop policy if exists "vm_public_insert_own" on storage.objects;
create policy "vm_public_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','videos','images','thumbnails','stories','music') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "vm_public_update_own" on storage.objects;
create policy "vm_public_update_own" on storage.objects for update to authenticated
  using (bucket_id in ('avatars','videos','images','thumbnails','stories','music') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "vm_public_delete_own" on storage.objects;
create policy "vm_public_delete_own" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars','videos','images','thumbnails','stories','music') and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Realtime ----------
do $$
declare t text;
begin
  foreach t in array array['notes','tracks'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;