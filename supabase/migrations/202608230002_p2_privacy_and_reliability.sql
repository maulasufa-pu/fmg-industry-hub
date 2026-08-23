begin;

alter table if exists public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;

create table if not exists public.roles (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*$'),
  name text not null,
  sort_order integer not null default 0
);
alter table public.roles enable row level security;
drop policy if exists "roles public read" on public.roles;
create policy "roles public read" on public.roles for select using (true);

create table if not exists public.data_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('export', 'delete')),
  request_email text,
  status text not null default 'pending' check (status in ('pending', 'identity_verification', 'processing', 'completed', 'rejected', 'cancelled')),
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists data_privacy_requests_user_created_idx on public.data_privacy_requests(user_id, created_at desc);
alter table public.data_privacy_requests enable row level security;

drop policy if exists "privacy requests own read" on public.data_privacy_requests;
create policy "privacy requests own read" on public.data_privacy_requests for select to authenticated using (auth.uid() = user_id);
drop policy if exists "privacy requests own insert" on public.data_privacy_requests;
create policy "privacy requests own insert" on public.data_privacy_requests for insert to authenticated with check (auth.uid() = user_id and status = 'pending');

create table if not exists public.data_retention_rules (
  data_category text primary key,
  retention_days integer not null check (retention_days > 0),
  legal_basis text not null,
  updated_at timestamptz not null default now()
);
alter table public.data_retention_rules enable row level security;

create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  error_name text not null,
  message text not null,
  digest text,
  path text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists app_error_events_created_idx on public.app_error_events(created_at desc);
alter table public.app_error_events enable row level security;

insert into public.data_retention_rules(data_category, retention_days, legal_basis) values
  ('completed_privacy_requests', 365, 'Operational proof after request completion'),
  ('failed_delivery_logs', 730, 'Operational troubleshooting and fraud prevention'),
  ('contact_inquiries', 730, 'Customer service follow-up')
on conflict (data_category) do update set retention_days = excluded.retention_days, legal_basis = excluded.legal_basis, updated_at = now();

create or replace function public.sync_terms_consent_from_auth()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set
    terms_version = nullif(new.raw_user_meta_data ->> 'terms_version', ''),
    terms_accepted_at = case when coalesce(new.raw_user_meta_data ->> 'terms_accepted_at', '') ~ '^\\d{4}-\\d{2}-\\d{2}T' then (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz else terms_accepted_at end
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_terms_consent_from_auth_trigger on auth.users;
create trigger sync_terms_consent_from_auth_trigger after insert or update of raw_user_meta_data on auth.users for each row execute function public.sync_terms_consent_from_auth();

create or replace function public.apply_terms_consent_to_profile()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare metadata jsonb;
begin
  select raw_user_meta_data into metadata from auth.users where id = new.id;
  new.terms_version := coalesce(new.terms_version, nullif(metadata ->> 'terms_version', ''));
  if new.terms_accepted_at is null and coalesce(metadata ->> 'terms_accepted_at', '') ~ '^\d{4}-\d{2}-\d{2}T' then
    new.terms_accepted_at := (metadata ->> 'terms_accepted_at')::timestamptz;
  end if;
  return new;
end;
$$;

drop trigger if exists apply_terms_consent_to_profile_trigger on public.profiles;
create trigger apply_terms_consent_to_profile_trigger before insert on public.profiles for each row execute function public.apply_terms_consent_to_profile();

create or replace function public.purge_expired_operational_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare privacy_count integer := 0; contact_count integer := 0;
begin
  delete from public.data_privacy_requests where status in ('completed','rejected','cancelled') and coalesce(completed_at, updated_at) < now() - interval '365 days';
  get diagnostics privacy_count = row_count;
  if to_regclass('public.contact_inquiries') is not null then
    delete from public.contact_inquiries where created_at < now() - interval '730 days';
    get diagnostics contact_count = row_count;
  end if;
  return jsonb_build_object('privacy_requests_deleted', privacy_count, 'contact_inquiries_deleted', contact_count, 'ran_at', now());
end;
$$;
revoke all on function public.purge_expired_operational_data() from public, anon, authenticated;

commit;
