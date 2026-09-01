begin;

create table public.tunexpert_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  lifetime_purchased integer not null default 0,
  lifetime_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tunexpert_credit_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  package_code text not null,
  credits integer not null check (credits > 0),
  amount_idr bigint not null check (amount_idr > 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  payment_url text,
  provider_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tunexpert_jobs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('music', 'isolation')),
  cost_credits integer not null check (cost_credits > 0),
  usage_seconds integer not null check (usage_seconds > 0),
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'refunded')),
  request_summary jsonb not null default '{}'::jsonb,
  provider_reference text,
  failure_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.tunexpert_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  balance_after integer not null,
  entry_type text not null check (entry_type in ('purchase', 'usage', 'refund', 'payment_reversal', 'adjustment')),
  entry_key text not null unique,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create index tunexpert_credit_orders_user_created_idx
  on public.tunexpert_credit_orders (user_id, created_at desc);
create index tunexpert_credit_orders_status_idx
  on public.tunexpert_credit_orders (status) where status = 'pending';
create index tunexpert_jobs_user_created_idx
  on public.tunexpert_jobs (user_id, created_at desc);
create index tunexpert_ledger_user_created_idx
  on public.tunexpert_ledger (user_id, created_at desc);

alter table public.tunexpert_wallets enable row level security;
alter table public.tunexpert_credit_orders enable row level security;
alter table public.tunexpert_jobs enable row level security;
alter table public.tunexpert_ledger enable row level security;

create policy tunexpert_wallets_select_own on public.tunexpert_wallets
  for select to authenticated using (user_id = (select auth.uid()));
create policy tunexpert_credit_orders_select_own on public.tunexpert_credit_orders
  for select to authenticated using (user_id = (select auth.uid()));
create policy tunexpert_jobs_select_own on public.tunexpert_jobs
  for select to authenticated using (user_id = (select auth.uid()));
create policy tunexpert_ledger_select_own on public.tunexpert_ledger
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.tunexpert_wallets to authenticated;
grant select on public.tunexpert_credit_orders to authenticated;
grant select on public.tunexpert_jobs to authenticated;
grant select on public.tunexpert_ledger to authenticated;

create or replace function public.tunexpert_reserve_job(
  p_user_id uuid,
  p_job_id uuid,
  p_job_type text,
  p_cost_credits integer,
  p_usage_seconds integer,
  p_request_summary jsonb default '{}'::jsonb
) returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance integer;
begin
  if p_user_id is null or p_job_id is null or p_cost_credits <= 0 or p_usage_seconds <= 0 then
    raise exception 'INVALID_TUNEXPERT_JOB' using errcode = '22023';
  end if;
  if p_job_type not in ('music', 'isolation') then
    raise exception 'INVALID_TUNEXPERT_JOB_TYPE' using errcode = '22023';
  end if;

  insert into public.tunexpert_wallets (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  update public.tunexpert_wallets
  set balance = balance - p_cost_credits,
      lifetime_used = lifetime_used + p_cost_credits,
      updated_at = now()
  where user_id = p_user_id and balance >= p_cost_credits
  returning balance into v_balance;

  if not found then
    raise exception 'INSUFFICIENT_TUNEXPERT_CREDITS' using errcode = 'P0001';
  end if;

  insert into public.tunexpert_jobs (
    id, user_id, job_type, cost_credits, usage_seconds, request_summary
  ) values (
    p_job_id, p_user_id, p_job_type, p_cost_credits, p_usage_seconds,
    coalesce(p_request_summary, '{}'::jsonb)
  );

  insert into public.tunexpert_ledger (
    user_id, delta, balance_after, entry_type, entry_key, reference_id, description
  ) values (
    p_user_id, -p_cost_credits, v_balance, 'usage', 'job:' || p_job_id::text,
    p_job_id, 'tuneXpert ' || p_job_type
  );

  return v_balance;
end;
$$;

create or replace function public.tunexpert_complete_job(
  p_job_id uuid,
  p_provider_reference text default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.tunexpert_jobs
  set status = 'completed',
      provider_reference = nullif(left(p_provider_reference, 200), ''),
      completed_at = now()
  where id = p_job_id and status = 'reserved';
end;
$$;

create or replace function public.tunexpert_refund_job(
  p_job_id uuid,
  p_reason text default null
) returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.tunexpert_jobs%rowtype;
  v_balance integer;
begin
  select * into v_job from public.tunexpert_jobs where id = p_job_id for update;
  if not found then raise exception 'TUNEXPERT_JOB_NOT_FOUND' using errcode = 'P0002'; end if;

  if v_job.status <> 'reserved' then
    select balance into v_balance from public.tunexpert_wallets where user_id = v_job.user_id;
    return coalesce(v_balance, 0);
  end if;

  update public.tunexpert_wallets
  set balance = balance + v_job.cost_credits,
      lifetime_used = greatest(0, lifetime_used - v_job.cost_credits),
      updated_at = now()
  where user_id = v_job.user_id
  returning balance into v_balance;

  update public.tunexpert_jobs
  set status = 'refunded', failure_reason = left(p_reason, 500), completed_at = now()
  where id = p_job_id;

  insert into public.tunexpert_ledger (
    user_id, delta, balance_after, entry_type, entry_key, reference_id, description
  ) values (
    v_job.user_id, v_job.cost_credits, v_balance, 'refund',
    'job-refund:' || p_job_id::text, p_job_id, 'Automatic refund for failed tuneXpert job'
  ) on conflict (entry_key) do nothing;

  return v_balance;
end;
$$;

create or replace function public.tunexpert_settle_credit_order(
  p_order_no text,
  p_provider_transaction_id text default null
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.tunexpert_credit_orders%rowtype;
  v_balance integer;
begin
  select * into v_order
  from public.tunexpert_credit_orders
  where order_no = p_order_no
  for update;

  if not found then raise exception 'TUNEXPERT_ORDER_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_order.status = 'paid' then return false; end if;
  if v_order.status = 'refunded' then raise exception 'TUNEXPERT_ORDER_ALREADY_REFUNDED' using errcode = '22023'; end if;

  insert into public.tunexpert_wallets (user_id, balance, lifetime_purchased)
  values (v_order.user_id, v_order.credits, v_order.credits)
  on conflict (user_id) do update
    set balance = public.tunexpert_wallets.balance + excluded.balance,
        lifetime_purchased = public.tunexpert_wallets.lifetime_purchased + excluded.lifetime_purchased,
        updated_at = now()
  returning balance into v_balance;

  update public.tunexpert_credit_orders
  set status = 'paid',
      provider_transaction_id = nullif(left(p_provider_transaction_id, 200), ''),
      paid_at = now(),
      updated_at = now()
  where id = v_order.id;

  insert into public.tunexpert_ledger (
    user_id, delta, balance_after, entry_type, entry_key, reference_id, description
  ) values (
    v_order.user_id, v_order.credits, v_balance, 'purchase',
    'order:' || v_order.id::text, v_order.id, 'tuneXpert credit purchase'
  );

  return true;
end;
$$;

create or replace function public.tunexpert_cancel_credit_order(
  p_order_no text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.tunexpert_credit_orders
  set status = 'cancelled', updated_at = now()
  where order_no = p_order_no and status = 'pending';
end;
$$;

create or replace function public.tunexpert_reverse_credit_order(
  p_order_no text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.tunexpert_credit_orders%rowtype;
  v_balance integer;
begin
  select * into v_order
  from public.tunexpert_credit_orders
  where order_no = p_order_no
  for update;

  if not found then raise exception 'TUNEXPERT_ORDER_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_order.status = 'refunded' then return false; end if;
  if v_order.status <> 'paid' then
    update public.tunexpert_credit_orders set status = 'cancelled', updated_at = now() where id = v_order.id;
    return false;
  end if;

  update public.tunexpert_wallets
  set balance = balance - v_order.credits,
      lifetime_purchased = greatest(0, lifetime_purchased - v_order.credits),
      updated_at = now()
  where user_id = v_order.user_id
  returning balance into v_balance;

  update public.tunexpert_credit_orders
  set status = 'refunded', updated_at = now()
  where id = v_order.id;

  insert into public.tunexpert_ledger (
    user_id, delta, balance_after, entry_type, entry_key, reference_id, description
  ) values (
    v_order.user_id, -v_order.credits, v_balance, 'payment_reversal',
    'order-reversal:' || v_order.id::text, v_order.id, 'Reversed tuneXpert credit purchase'
  ) on conflict (entry_key) do nothing;

  return true;
end;
$$;

revoke all on function public.tunexpert_reserve_job(uuid, uuid, text, integer, integer, jsonb) from public, anon, authenticated;
revoke all on function public.tunexpert_complete_job(uuid, text) from public, anon, authenticated;
revoke all on function public.tunexpert_refund_job(uuid, text) from public, anon, authenticated;
revoke all on function public.tunexpert_settle_credit_order(text, text) from public, anon, authenticated;
revoke all on function public.tunexpert_cancel_credit_order(text) from public, anon, authenticated;
revoke all on function public.tunexpert_reverse_credit_order(text) from public, anon, authenticated;

grant execute on function public.tunexpert_reserve_job(uuid, uuid, text, integer, integer, jsonb) to service_role;
grant execute on function public.tunexpert_complete_job(uuid, text) to service_role;
grant execute on function public.tunexpert_refund_job(uuid, text) to service_role;
grant execute on function public.tunexpert_settle_credit_order(text, text) to service_role;
grant execute on function public.tunexpert_cancel_credit_order(text) to service_role;
grant execute on function public.tunexpert_reverse_credit_order(text) to service_role;

commit;
