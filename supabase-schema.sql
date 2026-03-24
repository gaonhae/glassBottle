create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_len check (char_length(display_name) between 1 and 24)
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint families_name_len check (char_length(name) between 2 and 40),
  constraint families_invite_code_len check (char_length(invite_code) between 6 and 16)
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  unique (family_id, user_id),
  unique (user_id),
  constraint family_members_display_name_len check (char_length(display_name) between 1 and 24)
);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  body_text text not null,
  status text not null default 'scheduled',
  timezone_at_send text not null,
  created_at timestamptz not null default now(),
  editable_until timestamptz not null,
  scheduled_at timestamptz not null,
  delivered_at timestamptz,
  read_at timestamptz,
  canceled_at timestamptz,
  constraint letters_status_check check (status in ('scheduled', 'delivered', 'read', 'canceled')),
  constraint letters_not_self check (sender_user_id <> recipient_user_id),
  constraint letters_body_len check (char_length(body_text) between 1 and 2000)
);

create index if not exists idx_family_members_family_id on public.family_members (family_id);
create index if not exists idx_letters_recipient_status on public.letters (recipient_user_id, status, delivered_at desc);
create index if not exists idx_letters_sender_created on public.letters (sender_user_id, created_at desc);
create index if not exists idx_letters_due on public.letters (status, scheduled_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.user_in_family(target_family_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = auth.uid()
  );
$$;

revoke all on function public.user_in_family(uuid) from public;
grant execute on function public.user_in_family(uuid) to authenticated;

create or replace function public.create_family(p_name text, p_invite_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_family_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if exists (
    select 1
    from public.family_members fm
    where fm.user_id = current_user_id
  ) then
    raise exception 'User already belongs to a family.';
  end if;

  insert into public.families (name, invite_code, owner_user_id)
  values (trim(p_name), upper(trim(p_invite_code)), current_user_id)
  returning id into created_family_id;

  insert into public.family_members (family_id, user_id, display_name)
  values (created_family_id, current_user_id, trim(p_display_name));

  return created_family_id;
end;
$$;

revoke all on function public.create_family(text, text, text) from public;
grant execute on function public.create_family(text, text, text) to authenticated;

create or replace function public.join_family(p_invite_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_family_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if exists (
    select 1
    from public.family_members fm
    where fm.user_id = current_user_id
  ) then
    raise exception 'User already belongs to a family.';
  end if;

  select f.id
  into target_family_id
  from public.families f
  where f.invite_code = upper(trim(p_invite_code));

  if target_family_id is null then
    raise exception 'Invalid invite code.';
  end if;

  insert into public.family_members (family_id, user_id, display_name)
  values (target_family_id, current_user_id, trim(p_display_name));

  return target_family_id;
end;
$$;

revoke all on function public.join_family(text, text) from public;
grant execute on function public.join_family(text, text) to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.ensure_family_member_limit()
returns trigger
language plpgsql
as $$
declare
  member_count integer;
begin
  select count(*) into member_count from public.family_members where family_id = new.family_id;

  if member_count >= 8 then
    raise exception 'Family member limit reached (max 8).';
  end if;

  return new;
end;
$$;

drop trigger if exists family_member_limit_trigger on public.family_members;
create trigger family_member_limit_trigger
before insert on public.family_members
for each row
execute function public.ensure_family_member_limit();

create or replace function public.prepare_letter_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.editable_until is null then
    new.editable_until = now() + interval '5 minutes';
  end if;

  return new;
end;
$$;

drop trigger if exists letter_defaults_trigger on public.letters;
create trigger letter_defaults_trigger
before insert on public.letters
for each row
execute function public.prepare_letter_defaults();

create or replace function public.enforce_same_family_on_letter()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.family_members sender
    join public.family_members recipient on sender.family_id = recipient.family_id
    where sender.user_id = new.sender_user_id
      and recipient.user_id = new.recipient_user_id
      and sender.family_id = new.family_id
  ) then
    raise exception 'Sender and recipient must be in the same family.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_same_family_on_letter_trigger on public.letters;
create trigger enforce_same_family_on_letter_trigger
before insert on public.letters
for each row
execute function public.enforce_same_family_on_letter();

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.letters enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists families_select_if_member on public.families;
create policy families_select_if_member
on public.families
for select
to authenticated
using (public.user_in_family(id));

drop policy if exists families_insert_owner on public.families;
create policy families_insert_owner
on public.families
for insert
to authenticated
with check (auth.uid() = owner_user_id);

drop policy if exists families_update_owner on public.families;
create policy families_update_owner
on public.families
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists family_members_select_same_family on public.family_members;
create policy family_members_select_same_family
on public.family_members
for select
to authenticated
using (public.user_in_family(family_id));

drop policy if exists family_members_insert_self on public.family_members;
create policy family_members_insert_self
on public.family_members
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (select 1 from public.families f where f.id = family_id)
);

drop policy if exists family_members_update_self on public.family_members;
create policy family_members_update_self
on public.family_members
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists letters_select_sender_or_visible_recipient on public.letters;
create policy letters_select_sender_or_visible_recipient
on public.letters
for select
to authenticated
using (
  auth.uid() = sender_user_id
  or (auth.uid() = recipient_user_id and status in ('delivered', 'read'))
);

drop policy if exists letters_insert_sender_only on public.letters;
create policy letters_insert_sender_only
on public.letters
for insert
to authenticated
with check (
  auth.uid() = letters.sender_user_id
  and letters.sender_user_id <> letters.recipient_user_id
  and exists (
    select 1
    from public.family_members sender
    join public.family_members recipient on sender.family_id = recipient.family_id
    where sender.user_id = letters.sender_user_id
      and recipient.user_id = letters.recipient_user_id
      and sender.family_id = letters.family_id
  )
);

drop policy if exists letters_update_sender_before_delivery on public.letters;
create policy letters_update_sender_before_delivery
on public.letters
for update
to authenticated
using (auth.uid() = sender_user_id and status = 'scheduled')
with check (auth.uid() = sender_user_id and status in ('scheduled', 'canceled'));

drop policy if exists letters_update_recipient_mark_read on public.letters;
create policy letters_update_recipient_mark_read
on public.letters
for update
to authenticated
using (auth.uid() = recipient_user_id and status = 'delivered')
with check (auth.uid() = recipient_user_id and status = 'read');


