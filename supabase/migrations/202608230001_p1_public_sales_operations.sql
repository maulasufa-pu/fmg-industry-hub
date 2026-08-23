begin;

-- Portfolio classification and arrangement case-study fields. Existing releases
-- intentionally remain "release" until an admin explicitly classifies the work;
-- credits are not a reliable proxy for the service FMG actually sold.
alter table public.portfolio
  add column if not exists work_type text[] not null default array['release']::text[],
  add column if not exists client_brief text,
  add column if not exists challenge text,
  add column if not exists arrangement_solution text,
  add column if not exists before_url text,
  add column if not exists after_url text,
  add column if not exists turnaround_days integer,
  add column if not exists revision_count integer,
  add column if not exists deliverables text[] not null default '{}'::text[],
  add column if not exists testimonial_quote text,
  add column if not exists testimonial_name text;

create index if not exists portfolio_work_type_gin_idx
  on public.portfolio using gin (work_type);
create index if not exists portfolio_public_order_idx
  on public.portfolio (priority_order asc nulls last, release_date_aggregator desc nulls last);

alter table public.portfolio drop constraint if exists portfolio_turnaround_days_check;
alter table public.portfolio add constraint portfolio_turnaround_days_check
  check (turnaround_days is null or turnaround_days between 1 and 365);
alter table public.portfolio drop constraint if exists portfolio_revision_count_check;
alter table public.portfolio add constraint portfolio_revision_count_check
  check (revision_count is null or revision_count between 0 and 50);

alter table public.projects
  add column if not exists publishing_submission_status text not null default 'draft',
  add column if not exists publishing_last_validated_at timestamptz,
  add column if not exists publishing_validation_errors jsonb not null default '[]'::jsonb;

create table if not exists public.publishing_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(project_id) on delete cascade,
  action text not null,
  distributor text,
  status text not null default 'queued',
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  attempt_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publishing_delivery_status_check
    check (status in ('queued','submitted','accepted','live','rejected','takedown','failed'))
);

create index if not exists publishing_delivery_project_created_idx
  on public.publishing_delivery_logs (project_id, created_at desc);
create index if not exists publishing_delivery_status_idx
  on public.publishing_delivery_logs (status, updated_at desc);

create table if not exists public.publishing_analytics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(project_id) on delete cascade,
  platform text not null,
  period_start date not null,
  period_end date not null,
  streams bigint not null default 0,
  listeners bigint not null default 0,
  revenue_amount numeric(14,2) not null default 0,
  revenue_currency text not null default 'USD',
  source text not null default 'manual',
  synced_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint publishing_analytics_period_check check (period_end >= period_start),
  constraint publishing_analytics_nonnegative_check
    check (streams >= 0 and listeners >= 0 and revenue_amount >= 0),
  unique (project_id, platform, period_start, period_end)
);

create index if not exists publishing_analytics_project_period_idx
  on public.publishing_analytics (project_id, period_end desc);

create table if not exists public.invoice_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  recipient_email text not null,
  delivery_type text not null default 'reminder',
  status text not null default 'queued',
  template_version text not null,
  provider_message_id text,
  attempt_count integer not null default 0,
  error_message text,
  tracking_token uuid not null default gen_random_uuid() unique,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_delivery_status_check check (status in ('queued','sent','failed','opened')),
  constraint invoice_delivery_type_check check (delivery_type in ('invoice','reminder','overdue'))
);

create index if not exists invoice_delivery_invoice_created_idx
  on public.invoice_delivery_logs (invoice_id, created_at desc);
create index if not exists invoice_delivery_retry_idx
  on public.invoice_delivery_logs (status, next_retry_at)
  where status = 'failed';

alter table public.publishing_delivery_logs enable row level security;
alter table public.publishing_analytics enable row level security;
alter table public.invoice_delivery_logs enable row level security;

drop policy if exists "Project participants can read publishing delivery logs" on public.publishing_delivery_logs;
create policy "Project participants can read publishing delivery logs"
  on public.publishing_delivery_logs for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.project_id = publishing_delivery_logs.project_id
        and (
          p.client_id = auth.uid()
          or exists (
            select 1 from public.profiles pr
            where pr.id = auth.uid() and pr.main_role in ('admin','owner')
          )
        )
    )
  );

drop policy if exists "Project participants can read publishing analytics" on public.publishing_analytics;
create policy "Project participants can read publishing analytics"
  on public.publishing_analytics for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.project_id = publishing_analytics.project_id
        and (
          p.client_id = auth.uid()
          or exists (
            select 1 from public.profiles pr
            where pr.id = auth.uid() and pr.main_role in ('admin','owner')
          )
        )
    )
  );

drop policy if exists "Admins can read invoice delivery logs" on public.invoice_delivery_logs;
create policy "Admins can read invoice delivery logs"
  on public.invoice_delivery_logs for select to authenticated
  using (
    exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.main_role in ('admin','owner')
    )
  );

revoke all on public.publishing_delivery_logs from anon;
revoke all on public.publishing_analytics from anon;
revoke all on public.invoice_delivery_logs from anon;
grant select on public.publishing_delivery_logs to authenticated;
grant select on public.publishing_analytics to authenticated;
grant select on public.invoice_delivery_logs to authenticated;
grant all on public.publishing_delivery_logs to service_role;
grant all on public.publishing_analytics to service_role;
grant all on public.invoice_delivery_logs to service_role;

commit;
