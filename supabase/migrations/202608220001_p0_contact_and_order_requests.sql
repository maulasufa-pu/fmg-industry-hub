begin;

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  company text,
  reason text not null check (reason in ('project','partnership','publishing','press','support','other')),
  subject text not null check (char_length(subject) between 3 and 180),
  message text not null check (char_length(message) between 20 and 2000),
  status text not null default 'new' check (status in ('new','reviewing','replied','closed','spam')),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_inquiries enable row level security;
revoke all on public.contact_inquiries from anon, authenticated;

alter table public.projects add column if not exists nda_required boolean not null default false;
alter table public.projects add column if not exists preferred_engineer_id uuid null;
alter table public.projects add column if not exists order_bundle_id uuid null;
alter table public.projects add column if not exists idempotency_key uuid null;
create unique index if not exists projects_client_idempotency_key_uidx
  on public.projects(client_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.project_order_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(project_id) on delete cascade,
  service_id uuid null references public.services(id) on delete set null,
  service_key text not null,
  label text not null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  currency text not null default 'USD',
  included_in_bundle boolean not null default false,
  created_at timestamptz not null default now(),
  unique(project_id, service_key)
);

alter table public.project_order_items enable row level security;

drop policy if exists project_order_items_select_participant on public.project_order_items;
create policy project_order_items_select_participant
on public.project_order_items for select
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.project_id = project_order_items.project_id
      and (
        p.client_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.main_role in ('admin','owner')
        )
      )
  )
);

create or replace function public.submit_project_request(
  p_user_id uuid,
  p_idempotency_key uuid,
  p_project jsonb,
  p_items jsonb,
  p_references jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
begin
  select p.project_id into v_project_id
  from public.projects p
  where p.client_id = p_user_id and p.idempotency_key = p_idempotency_key;

  if v_project_id is not null then return v_project_id; end if;

  insert into public.projects (
    client_id, title, artist_name, album_title, genre, sub_genre,
    stage, status, description, budget_amount, budget_currency,
    payment_plan, start_date, deadline, delivery_format, nda_required,
    preferred_engineer_id, order_bundle_id, idempotency_key
  ) values (
    p_user_id,
    p_project->>'title',
    nullif(p_project->>'artist_name', ''),
    nullif(p_project->>'album_title', ''),
    nullif(p_project->>'genre', ''),
    nullif(p_project->>'sub_genre', ''),
    'drafting',
    'requested',
    p_project->>'description',
    (p_project->>'budget_amount')::numeric,
    'USD',
    p_project->>'payment_plan',
    nullif(p_project->>'start_date', '')::date,
    nullif(p_project->>'deadline', '')::date,
    array(select jsonb_array_elements_text(coalesce(p_project->'delivery_format', '[]'::jsonb))),
    coalesce((p_project->>'nda_required')::boolean, false),
    nullif(p_project->>'preferred_engineer_id', '')::uuid,
    nullif(p_project->>'order_bundle_id', '')::uuid,
    p_idempotency_key
  ) returning project_id into v_project_id;

  insert into public.project_order_items (
    project_id, service_id, service_key, label, unit_price, currency, included_in_bundle
  )
  select v_project_id, x.service_id, x.service_key, x.label, x.unit_price, 'USD', x.included_in_bundle
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as x(
    service_id uuid, service_key text, label text, unit_price numeric,
    currency text, included_in_bundle boolean
  );

  insert into public.project_reference_links(project_id, url)
  select v_project_id, value
  from jsonb_array_elements_text(coalesce(p_references, '[]'::jsonb));

  return v_project_id;
exception
  when unique_violation then
    select p.project_id into v_project_id
    from public.projects p
    where p.client_id = p_user_id and p.idempotency_key = p_idempotency_key;
    if v_project_id is not null then return v_project_id; end if;
    raise;
end;
$$;

revoke all on function public.submit_project_request(uuid, uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.submit_project_request(uuid, uuid, jsonb, jsonb, jsonb) to service_role;

commit;
