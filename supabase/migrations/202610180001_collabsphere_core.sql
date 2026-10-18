create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Student',
  city text,
  discoverable boolean not null default false,
  role text not null default 'student' check (role in ('student','organizer','admin')),
  created_at timestamptz not null default now()
);

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.societies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 120),
  description text not null default '',
  category text not null,
  format text not null check (format in ('in_person','online','hybrid')),
  city text,
  starts_at timestamptz not null,
  registration_deadline timestamptz,
  capacity integer not null default 30 check (capacity between 2 and 1000),
  budget_per_person numeric(10,2) not null default 0 check (budget_per_person >= 0),
  status text not null default 'draft' check (status in ('draft','submitted','pending_approval','approved','published','completed','rejected','changes_requested','cancelled')),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_hosts (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'host' check (role in ('host','co_host')),
  invitation_status text not null default 'accepted' check (invitation_status in ('pending','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','waitlisted','cancelled')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  public_location text not null,
  cost_per_person numeric(10,2) not null default 0 check (cost_per_person >= 0),
  capacity integer check (capacity > 0),
  accessibility text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.event_venues (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, venue_id)
);

create table public.venue_votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.vote_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_venue_id uuid references public.venues(id) on delete set null,
  to_venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  verification_method text not null check (verification_method in ('qr','organizer','online')),
  unique (event_id, user_id)
);

create table public.event_approvals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  decision text not null check (decision in ('approved','rejected','changes_requested')),
  note text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.participation_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  points integer not null check (points > 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default ''
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quality smallint check (quality between 1 and 5),
  organization smallint check (organization between 1 and 5),
  venue_suitability smallint check (venue_suitability between 1 and 5),
  experience smallint check (experience between 1 and 5),
  suggestions text not null default '',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_status_starts_at_idx on public.events(status, starts_at);
create index events_creator_idx on public.events(creator_id);
create index event_registrations_user_idx on public.event_registrations(user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index venue_votes_event_idx on public.venue_votes(event_id, venue_id);

create or replace function public.handle_new_collabsphere_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Student'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_collabsphere_user_created
after insert on auth.users
for each row execute function public.handle_new_collabsphere_user();

alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.societies enable row level security;
alter table public.events enable row level security;
alter table public.event_hosts enable row level security;
alter table public.event_registrations enable row level security;
alter table public.venues enable row level security;
alter table public.event_venues enable row level security;
alter table public.venue_votes enable row level security;
alter table public.vote_audit_logs enable row level security;
alter table public.attendance_records enable row level security;
alter table public.event_approvals enable row level security;
alter table public.notifications enable row level security;
alter table public.participation_points enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.event_feedback enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self_or_discoverable on public.profiles for select to authenticated using (id = (select auth.uid()) or discoverable = true);
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()) and role = 'student');
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));
create policy houses_read_all on public.houses for select to anon, authenticated using (true);
create policy societies_read_all on public.societies for select to anon, authenticated using (true);
create policy events_read_published on public.events for select to anon, authenticated using (status = 'published' or creator_id = (select auth.uid()));
create policy events_insert_own on public.events for insert to authenticated with check (creator_id = (select auth.uid()) and status in ('draft','submitted'));
create policy events_update_own_unpublished on public.events for update to authenticated using (creator_id = (select auth.uid()) and status in ('draft','submitted','changes_requested')) with check (creator_id = (select auth.uid()) and status in ('draft','submitted','changes_requested'));
create policy event_hosts_read on public.event_hosts for select to authenticated using (user_id = (select auth.uid()) or exists (select 1 from public.events e where e.id = event_id and e.creator_id = (select auth.uid())));
create policy registrations_read_self on public.event_registrations for select to authenticated using (user_id = (select auth.uid()));
create policy registrations_insert_self on public.event_registrations for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.events e where e.id = event_id and e.status = 'published'));
create policy registrations_update_self on public.event_registrations for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy venues_read_all on public.venues for select to anon, authenticated using (true);
create policy event_venues_read_public on public.event_venues for select to anon, authenticated using (exists (select 1 from public.events e where e.id = event_id and e.status = 'published'));
create policy votes_read_own on public.venue_votes for select to authenticated using (user_id = (select auth.uid()));
create policy votes_insert_own_registered on public.venue_votes for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.event_registrations r join public.events e on e.id = r.event_id where r.event_id = venue_votes.event_id and r.user_id = (select auth.uid()) and r.status = 'registered' and e.status = 'published'));
create policy votes_update_own_registered on public.venue_votes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and exists (select 1 from public.event_registrations r where r.event_id = venue_votes.event_id and r.user_id = (select auth.uid()) and r.status = 'registered'));
create policy attendance_read_self on public.attendance_records for select to authenticated using (user_id = (select auth.uid()));
create policy approvals_read_self_or_admin on public.event_approvals for select to authenticated using (reviewer_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy notifications_read_self on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update_self on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy points_read_self on public.participation_points for select to authenticated using (user_id = (select auth.uid()));
create policy badges_read_all on public.badges for select to anon, authenticated using (true);
create policy user_badges_read_self on public.user_badges for select to authenticated using (user_id = (select auth.uid()));
create policy feedback_read_own on public.event_feedback for select to authenticated using (user_id = (select auth.uid()));
create policy feedback_insert_own on public.event_feedback for insert to authenticated with check (user_id = (select auth.uid()));
create policy audit_read_admin on public.audit_logs for select to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

grant select on public.houses, public.societies, public.venues, public.badges to anon, authenticated;
grant select on public.events, public.event_venues to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant insert, select, update on public.events to authenticated;
grant select, insert, update on public.event_registrations to authenticated;
grant select, insert, update on public.venue_votes to authenticated;
grant select on public.event_hosts, public.attendance_records, public.event_approvals, public.notifications, public.participation_points, public.user_badges, public.event_feedback to authenticated;
grant insert on public.event_feedback to authenticated;
grant update on public.notifications to authenticated;
grant all on public.profiles, public.houses, public.societies, public.events, public.event_hosts, public.event_registrations, public.venues, public.event_venues, public.venue_votes, public.vote_audit_logs, public.attendance_records, public.event_approvals, public.notifications, public.participation_points, public.badges, public.user_badges, public.event_feedback, public.audit_logs to service_role;
