-- =====================================================================
--  VideoMove — Supabase schema
--  Supabase Dashboard → SQL Editor → paste → Run.  (Qayta ishga tushirsa ham xavfsiz)
-- =====================================================================
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- =====================================================================
-- 1. TABLES
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  first_name text,
  last_name text,
  avatar_url text,
  bio text not null default '',
  settings jsonb not null default '{}'::jsonb,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  posts_count integer not null default 0,
  is_online boolean not null default false,
  last_seen timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_.]{3,30}$'),
  constraint bio_length check (char_length(bio) <= 300)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_type text not null default 'video' check (media_type in ('video','image')),
  video_url text,
  image_url text,
  thumbnail_url text,
  caption text not null default '' check (char_length(caption) <= 2200),
  hashtags text[] not null default '{}',
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint media_present check (
    (media_type = 'video' and video_url is not null) or
    (media_type = 'image' and image_url is not null))
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comment_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_id uuid not null references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists public.followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text,
  media_type text not null check (media_type in ('image','video','text')),
  text_content text check (char_length(text_content) <= 500),
  background text,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  check ((media_type = 'text' and text_content is not null) or (media_type <> 'text' and media_url is not null))
);

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table if not exists public.story_likes (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('follow','like','comment','reply','mention','message','story_like','live')),
  reference_id uuid,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  avatar_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete set null,
  content text check (char_length(content) <= 4000),
  message_type text not null default 'text' check (message_type in ('text','image','video','voice','file')),
  media_url text,
  file_name text,
  file_size bigint,
  duration integer,
  reply_to uuid references public.messages(id) on delete set null,
  forwarded boolean not null default false,
  is_deleted boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 120),
  is_active boolean not null default true,
  viewer_count integer not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.live_comments (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 300),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 2. INDEXES
-- =====================================================================
create index if not exists idx_profiles_username_trgm on public.profiles using gin (username gin_trgm_ops);
create index if not exists idx_posts_created on public.posts (created_at desc);
create index if not exists idx_posts_user on public.posts (user_id, created_at desc);
create index if not exists idx_posts_hashtags on public.posts using gin (hashtags);
create index if not exists idx_posts_caption_trgm on public.posts using gin (caption gin_trgm_ops);
create index if not exists idx_likes_post on public.likes (post_id);
create index if not exists idx_comments_post on public.comments (post_id, created_at);
create index if not exists idx_saved_user on public.saved_posts (user_id, created_at desc);
create index if not exists idx_followers_following on public.followers (following_id);
create index if not exists idx_followers_follower on public.followers (follower_id);
create index if not exists idx_stories_active on public.stories (expires_at, user_id);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists idx_members_user on public.conversation_members (user_id);
create index if not exists idx_messages_conv on public.messages (conversation_id, created_at desc);
create index if not exists idx_reactions_conv on public.message_reactions (conversation_id);
create index if not exists idx_live_active on public.live_streams (is_active, started_at desc);
create index if not exists idx_live_comments on public.live_comments (stream_id, created_at);

-- =====================================================================
-- 3. HELPER FUNCTIONS
-- =====================================================================
create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from conversation_members where conversation_id = cid and user_id = auth.uid());
$$;

create or replace function public.is_conversation_member_text(cid text)
returns boolean language plpgsql security definer stable set search_path = public as $$
begin
  return exists (select 1 from conversation_members where conversation_id = cid::uuid and user_id = auth.uid());
exception when invalid_text_representation then
  return false;
end $$;

-- Notifications are created ONLY by triggers (respecting the recipient's settings)
create or replace function public.create_notification(p_user uuid, p_sender uuid, p_type text, p_ref uuid, p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare prefs jsonb;
begin
  if p_user is null or p_user = p_sender then return; end if;
  select settings -> 'notifications' into prefs from profiles where id = p_user;
  if prefs is not null and prefs ? p_type and (prefs ->> p_type)::boolean = false then return; end if;
  insert into notifications (user_id, sender_id, type, reference_id, data) values (p_user, p_sender, p_type, p_ref, p_data);
end $$;
revoke execute on function public.create_notification(uuid, uuid, text, uuid, jsonb) from public, anon, authenticated;

-- New auth user → profile row
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
  insert into profiles (id, username, first_name, last_name, avatar_url)
  values (
    new.id, uname,
    coalesce(new.raw_user_meta_data ->> 'first_name', nullif(split_part(full_name, ' ', 1), '')),
    coalesce(new.raw_user_meta_data ->> 'last_name', nullif(regexp_replace(full_name, '^\S+\s*', ''), '')),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- 4. COUNTER + NOTIFICATION TRIGGERS
-- =====================================================================
create or replace function public.tg_likes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
    perform create_notification((select user_id from posts where id = new.post_id), new.user_id, 'like', new.post_id);
    return new;
  end if;
  update posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  return old;
end $$;
drop trigger if exists on_like_change on public.likes;
create trigger on_like_change after insert or delete on public.likes for each row execute function public.tg_likes();

create or replace function public.tg_comments() returns trigger language plpgsql security definer set search_path = public as $$
declare m record;
begin
  if tg_op = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
    if new.parent_id is not null then
      perform create_notification((select user_id from comments where id = new.parent_id), new.user_id, 'reply', new.post_id);
    else
      perform create_notification((select user_id from posts where id = new.post_id), new.user_id, 'comment', new.post_id);
    end if;
    for m in select distinct lower(t.m[1]) as uname from regexp_matches(new.content, '@([A-Za-z0-9_.]{3,30})', 'g') as t(m) loop
      perform create_notification((select id from profiles where username = m.uname), new.user_id, 'mention', new.post_id);
    end loop;
    return new;
  end if;
  update posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  return old;
end $$;
drop trigger if exists on_comment_change on public.comments;
create trigger on_comment_change after insert or delete on public.comments for each row execute function public.tg_comments();

create or replace function public.tg_comment_likes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update comments set likes_count = likes_count + 1 where id = new.comment_id; return new;
  end if;
  update comments set likes_count = greatest(likes_count - 1, 0) where id = old.comment_id; return old;
end $$;
drop trigger if exists on_comment_like_change on public.comment_likes;
create trigger on_comment_like_change after insert or delete on public.comment_likes for each row execute function public.tg_comment_likes();

create or replace function public.tg_followers() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update profiles set followers_count = followers_count + 1 where id = new.following_id;
    update profiles set following_count = following_count + 1 where id = new.follower_id;
    perform create_notification(new.following_id, new.follower_id, 'follow', new.follower_id);
    return new;
  end if;
  update profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
  update profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
  return old;
end $$;
drop trigger if exists on_follow_change on public.followers;
create trigger on_follow_change after insert or delete on public.followers for each row execute function public.tg_followers();

create or replace function public.tg_posts() returns trigger language plpgsql security definer set search_path = public as $$
declare m record;
begin
  if tg_op = 'INSERT' then
    update profiles set posts_count = posts_count + 1 where id = new.user_id;
    for m in select distinct lower(t.m[1]) as uname from regexp_matches(new.caption, '@([A-Za-z0-9_.]{3,30})', 'g') as t(m) loop
      perform create_notification((select id from profiles where username = m.uname), new.user_id, 'mention', new.id);
    end loop;
    return new;
  end if;
  update profiles set posts_count = greatest(posts_count - 1, 0) where id = old.user_id;
  return old;
end $$;
drop trigger if exists on_post_change on public.posts;
create trigger on_post_change after insert or delete on public.posts for each row execute function public.tg_posts();

create or replace function public.tg_story_views() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update stories set views_count = views_count + 1 where id = new.story_id;
  return new;
end $$;
drop trigger if exists on_story_view on public.story_views;
create trigger on_story_view after insert on public.story_views for each row execute function public.tg_story_views();

create or replace function public.tg_story_likes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform create_notification((select user_id from stories where id = new.story_id), new.user_id, 'story_like', new.story_id);
  return new;
end $$;
drop trigger if exists on_story_like on public.story_likes;
create trigger on_story_like after insert on public.story_likes for each row execute function public.tg_story_likes();

create or replace function public.tg_messages() returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  update conversations set updated_at = now() where id = new.conversation_id;
  for r in select user_id from conversation_members where conversation_id = new.conversation_id and user_id <> new.sender_id loop
    perform create_notification(r.user_id, new.sender_id, 'message', new.conversation_id);
  end loop;
  return new;
end $$;
drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert after insert on public.messages for each row execute function public.tg_messages();

create or replace function public.tg_live_start() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform create_notification(f.follower_id, new.host_id, 'live', new.id) from followers f where f.following_id = new.host_id;
  return new;
end $$;
drop trigger if exists on_live_start on public.live_streams;
create trigger on_live_start after insert on public.live_streams for each row execute function public.tg_live_start();

-- =====================================================================
-- 5. RPC FUNCTIONS (called from the frontend)
-- =====================================================================
create or replace function public.get_or_create_dm(other_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if other_user = me then raise exception 'You cannot message yourself'; end if;
  select c.id into cid from conversations c
    join conversation_members a on a.conversation_id = c.id and a.user_id = me
    join conversation_members b on b.conversation_id = c.id and b.user_id = other_user
    where c.is_group = false limit 1;
  if cid is not null then return cid; end if;
  if coalesce((select settings -> 'privacy' ->> 'messages' from profiles where id = other_user), 'everyone') = 'followers'
     and not exists (select 1 from followers where follower_id = other_user and following_id = me) then
    raise exception 'This user only accepts messages from people they follow';
  end if;
  insert into conversations (is_group, created_by) values (false, me) returning id into cid;
  insert into conversation_members (conversation_id, user_id) values (cid, me), (cid, other_user);
  return cid;
end $$;

create or replace function public.create_group_conversation(p_title text, p_members uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Group name is required'; end if;
  insert into conversations (is_group, title, created_by) values (true, trim(p_title), me) returning id into cid;
  insert into conversation_members (conversation_id, user_id, role) values (cid, me, 'admin');
  insert into conversation_members (conversation_id, user_id)
    select cid, u from unnest(p_members) as u where u <> me and exists (select 1 from profiles where id = u)
    on conflict do nothing;
  return cid;
end $$;

create or replace function public.mark_conversation_read(cid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_conversation_member(cid) then return; end if;
  update messages set read_at = now(), delivered_at = coalesce(delivered_at, now())
    where conversation_id = cid and sender_id <> auth.uid() and read_at is null;
  update conversation_members set last_read_at = now() where conversation_id = cid and user_id = auth.uid();
  update notifications set is_read = true where user_id = auth.uid() and type = 'message' and reference_id = cid and not is_read;
end $$;

create or replace function public.mark_messages_delivered(cid uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update messages m set delivered_at = now()
    where m.delivered_at is null and m.sender_id <> auth.uid()
      and (cid is null or m.conversation_id = cid)
      and exists (select 1 from conversation_members cm where cm.conversation_id = m.conversation_id and cm.user_id = auth.uid());
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
    (select to_jsonb(x) from (select ms.id, ms.content, ms.message_type, ms.sender_id, ms.created_at, ms.is_deleted
        from messages ms where ms.conversation_id = c.id order by ms.created_at desc limit 1) x),
    (select count(*)::int from messages ms where ms.conversation_id = c.id and ms.sender_id <> auth.uid()
        and ms.created_at > m.last_read_at and not ms.is_deleted)
  from conversations c
  join conversation_members m on m.conversation_id = c.id and m.user_id = auth.uid()
  order by c.updated_at desc;
$$;

create or replace function public.trending_hashtags(p_limit int default 20)
returns table (tag text, uses bigint) language sql stable set search_path = public as $$
  select t, count(*) from posts, unnest(hashtags) as t
  where created_at > now() - interval '30 days'
  group by t order by count(*) desc limit p_limit;
$$;

-- =====================================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.followers enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.story_likes enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.live_streams enable row level security;
alter table public.live_comments enable row level security;

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- posts
drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select using (true);
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete to authenticated using (user_id = auth.uid());

-- likes
drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes for select using (true);
drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes for delete to authenticated using (user_id = auth.uid());

-- comments (author or post owner can delete)
drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments for select using (true);
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from posts p where p.id = post_id and p.user_id = auth.uid()));

-- comment_likes
drop policy if exists "comment_likes_select" on public.comment_likes;
create policy "comment_likes_select" on public.comment_likes for select using (true);
drop policy if exists "comment_likes_insert_own" on public.comment_likes;
create policy "comment_likes_insert_own" on public.comment_likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "comment_likes_delete_own" on public.comment_likes;
create policy "comment_likes_delete_own" on public.comment_likes for delete to authenticated using (user_id = auth.uid());

-- saved_posts (private)
drop policy if exists "saved_select_own" on public.saved_posts;
create policy "saved_select_own" on public.saved_posts for select to authenticated using (user_id = auth.uid());
drop policy if exists "saved_insert_own" on public.saved_posts;
create policy "saved_insert_own" on public.saved_posts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "saved_delete_own" on public.saved_posts;
create policy "saved_delete_own" on public.saved_posts for delete to authenticated using (user_id = auth.uid());

-- followers
drop policy if exists "followers_select" on public.followers;
create policy "followers_select" on public.followers for select using (true);
drop policy if exists "followers_insert_own" on public.followers;
create policy "followers_insert_own" on public.followers for insert to authenticated with check (follower_id = auth.uid());
drop policy if exists "followers_delete_own" on public.followers;
create policy "followers_delete_own" on public.followers for delete to authenticated using (follower_id = auth.uid());

-- stories (active ones are public; owner sees own)
drop policy if exists "stories_select" on public.stories;
create policy "stories_select" on public.stories for select using (expires_at > now() or user_id = auth.uid());
drop policy if exists "stories_insert_own" on public.stories;
create policy "stories_insert_own" on public.stories for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "stories_delete_own" on public.stories;
create policy "stories_delete_own" on public.stories for delete to authenticated using (user_id = auth.uid());

-- story_views (viewer sees own view; story owner sees the list)
drop policy if exists "story_views_select" on public.story_views;
create policy "story_views_select" on public.story_views for select to authenticated
  using (viewer_id = auth.uid() or exists (select 1 from stories s where s.id = story_id and s.user_id = auth.uid()));
drop policy if exists "story_views_insert_own" on public.story_views;
create policy "story_views_insert_own" on public.story_views for insert to authenticated with check (viewer_id = auth.uid());

-- story_likes
drop policy if exists "story_likes_select" on public.story_likes;
create policy "story_likes_select" on public.story_likes for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from stories s where s.id = story_id and s.user_id = auth.uid()));
drop policy if exists "story_likes_insert_own" on public.story_likes;
create policy "story_likes_insert_own" on public.story_likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "story_likes_delete_own" on public.story_likes;
create policy "story_likes_delete_own" on public.story_likes for delete to authenticated using (user_id = auth.uid());

-- notifications (read/update/delete own; inserts only via triggers)
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- conversations (created via RPC only)
drop policy if exists "conversations_select_member" on public.conversations;
create policy "conversations_select_member" on public.conversations for select to authenticated using (public.is_conversation_member(id));
drop policy if exists "conversations_update_member" on public.conversations;
create policy "conversations_update_member" on public.conversations for update to authenticated using (public.is_conversation_member(id));

-- conversation_members
drop policy if exists "members_select" on public.conversation_members;
create policy "members_select" on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists "members_update_own" on public.conversation_members;
create policy "members_update_own" on public.conversation_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "members_leave" on public.conversation_members;
create policy "members_leave" on public.conversation_members for delete to authenticated using (user_id = auth.uid());

-- messages
drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));
drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own" on public.messages for delete to authenticated using (sender_id = auth.uid());

-- message_reactions
drop policy if exists "reactions_select_member" on public.message_reactions;
create policy "reactions_select_member" on public.message_reactions for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists "reactions_insert_own" on public.message_reactions;
create policy "reactions_insert_own" on public.message_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.is_conversation_member(conversation_id));
drop policy if exists "reactions_delete_own" on public.message_reactions;
create policy "reactions_delete_own" on public.message_reactions for delete to authenticated using (user_id = auth.uid());

-- live
drop policy if exists "live_select" on public.live_streams;
create policy "live_select" on public.live_streams for select using (true);
drop policy if exists "live_insert_own" on public.live_streams;
create policy "live_insert_own" on public.live_streams for insert to authenticated with check (host_id = auth.uid());
drop policy if exists "live_update_own" on public.live_streams;
create policy "live_update_own" on public.live_streams for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
drop policy if exists "live_delete_own" on public.live_streams;
create policy "live_delete_own" on public.live_streams for delete to authenticated using (host_id = auth.uid());

drop policy if exists "live_comments_select" on public.live_comments;
create policy "live_comments_select" on public.live_comments for select using (true);
drop policy if exists "live_comments_insert" on public.live_comments;
create policy "live_comments_insert" on public.live_comments for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from live_streams s where s.id = stream_id and s.is_active));

-- =====================================================================
-- 7. STORAGE BUCKETS + POLICIES
--    Public buckets: path = <user_id>/<file>
--    Private chat buckets: path = <conversation_id>/<user_id>/<file>
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',        'avatars',        true,   5242880, array['image/*']),
  ('videos',         'videos',         true,  52428800, array['video/*']),
  ('images',         'images',         true,  15728640, array['image/*']),
  ('thumbnails',     'thumbnails',     true,   5242880, array['image/*']),
  ('stories',        'stories',        true,  52428800, array['image/*','video/*']),
  ('chat-media',     'chat-media',     false, 52428800, null),
  ('voice-messages', 'voice-messages', false, 10485760, array['audio/*'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vm_public_read" on storage.objects;
create policy "vm_public_read" on storage.objects for select
  using (bucket_id in ('avatars','videos','images','thumbnails','stories'));
drop policy if exists "vm_public_insert_own" on storage.objects;
create policy "vm_public_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','videos','images','thumbnails','stories') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "vm_public_update_own" on storage.objects;
create policy "vm_public_update_own" on storage.objects for update to authenticated
  using (bucket_id in ('avatars','videos','images','thumbnails','stories') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "vm_public_delete_own" on storage.objects;
create policy "vm_public_delete_own" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars','videos','images','thumbnails','stories') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vm_chat_read_member" on storage.objects;
create policy "vm_chat_read_member" on storage.objects for select to authenticated
  using (bucket_id in ('chat-media','voice-messages') and public.is_conversation_member_text((storage.foldername(name))[1]));
drop policy if exists "vm_chat_insert_member" on storage.objects;
create policy "vm_chat_insert_member" on storage.objects for insert to authenticated
  with check (bucket_id in ('chat-media','voice-messages')
    and public.is_conversation_member_text((storage.foldername(name))[1])
    and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "vm_chat_delete_own" on storage.objects;
create policy "vm_chat_delete_own" on storage.objects for delete to authenticated
  using (bucket_id in ('chat-media','voice-messages') and (storage.foldername(name))[2] = auth.uid()::text);

-- =====================================================================
-- 8. REALTIME
-- =====================================================================
alter table public.messages replica identity full;
alter table public.message_reactions replica identity full;
alter table public.comments replica identity full;
alter table public.posts replica identity full;
alter table public.live_streams replica identity full;

do $$
declare t text;
begin
  foreach t in array array['messages','message_reactions','notifications','comments','posts','profiles',
                           'conversations','conversation_members','live_streams','live_comments','stories'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Optional: expired story cleanup (requires pg_cron extension)
-- select cron.schedule('vm-clean-stories', '0 * * * *', $$delete from public.stories where expires_at < now() - interval '1 day'$$);
