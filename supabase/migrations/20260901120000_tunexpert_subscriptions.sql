begin;

create table public.tunexpert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null check (plan_code in ('essential', 'pro', 'studio')),
  monthly_credits integer not null check (monthly_credits > 0),
  amount_idr bigint not null check (amount_idr > 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  status text not null default 'pending' check (
    status in ('pending', 'activating', 'activation_failed', 'active', 'past_due', 'cancelled')
  ),
  provider_name text not null unique check (provider_name ~ '^TXS-[A-F0-9]{20}$'),
  provider_subscription_id text unique,
  payment_type text check (payment_type is null or payment_type in ('credit_card', 'gopay')),
  masked_payment_method text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_billing_at timestamptz,
  cancelled_at timestamptz,
  activation_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index tunexpert_subscriptions_one_open_per_user_idx
  on public.tunexpert_subscriptions (user_id)
  where status in ('pending', 'activating', 'active', 'past_due');
create index tunexpert_subscriptions_user_created_idx
  on public.tunexpert_subscriptions (user_id, created_at desc);
create index tunexpert_subscriptions_provider_name_idx
  on public.tunexpert_subscriptions (provider_name);

alter table public.tunexpert_credit_orders
  add column order_type text not null default 'topup'
    check (order_type in ('topup', 'subscription_initial')),
  add column subscription_id uuid references public.tunexpert_subscriptions(id) on delete set null;

create index tunexpert_credit_orders_subscription_idx
  on public.tunexpert_credit_orders (subscription_id)
  where subscription_id is not null;

create table public.tunexpert_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.tunexpert_subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_order_id text not null unique,
  provider_transaction_id text unique,
  amount_idr bigint not null check (amount_idr > 0),
  credits_granted integer not null check (credits_granted > 0),
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  paid_at timestamptz not null default now(),
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create index tunexpert_subscription_payments_subscription_idx
  on public.tunexpert_subscription_payments (subscription_id, created_at desc);
create index tunexpert_subscription_payments_user_idx
  on public.tunexpert_subscription_payments (user_id, created_at desc);

alter table public.tunexpert_subscriptions enable row level security;
alter table public.tunexpert_subscription_payments enable row level security;

create policy tunexpert_subscriptions_select_own on public.tunexpert_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy tunexpert_subscription_payments_select_own on public.tunexpert_subscription_payments
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.tunexpert_subscriptions to authenticated;
grant select on public.tunexpert_subscription_payments to authenticated;

create or replace function public.tunexpert_claim_subscription_activation(
  p_order_no text
) returns table (
  subscription_id uuid,
  user_id uuid,
  provider_name text,
  plan_code text,
  monthly_credits integer,
  amount_idr bigint,
  next_billing_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.tunexpert_credit_orders%rowtype;
  v_subscription public.tunexpert_subscriptions%rowtype;
begin
  select * into v_order
  from public.tunexpert_credit_orders
  where order_no = p_order_no and order_type = 'subscription_initial'
  for update;

  if not found or v_order.status <> 'paid' or v_order.subscription_id is null then
    return;
  end if;

  select * into v_subscription
  from public.tunexpert_subscriptions
  where id = v_order.subscription_id
  for update;

  if not found or v_subscription.status not in ('pending', 'activation_failed') then
    return;
  end if;

  update public.tunexpert_subscriptions
  set status = 'activating', activation_error = null, updated_at = now()
  where id = v_subscription.id;

  return query select
    v_subscription.id,
    v_subscription.user_id,
    v_subscription.provider_name,
    v_subscription.plan_code,
    v_subscription.monthly_credits,
    v_subscription.amount_idr,
    v_subscription.next_billing_at;
end;
$$;

create or replace function public.tunexpert_settle_subscription_payment(
  p_provider_name text,
  p_provider_order_id text,
  p_provider_transaction_id text,
  p_amount_idr bigint
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subscription public.tunexpert_subscriptions%rowtype;
  v_payment_id uuid;
  v_balance integer;
begin
  select * into v_subscription
  from public.tunexpert_subscriptions
  where provider_name = p_provider_name
  for update;

  if not found then raise exception 'TUNEXPERT_SUBSCRIPTION_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_subscription.status = 'cancelled' then return false; end if;
  if p_amount_idr <> v_subscription.amount_idr then
    raise exception 'TUNEXPERT_SUBSCRIPTION_AMOUNT_MISMATCH' using errcode = '22023';
  end if;

  insert into public.tunexpert_subscription_payments (
    subscription_id, user_id, provider_order_id, provider_transaction_id,
    amount_idr, credits_granted, status
  ) values (
    v_subscription.id, v_subscription.user_id, left(p_provider_order_id, 200),
    nullif(left(p_provider_transaction_id, 200), ''), v_subscription.amount_idr,
    v_subscription.monthly_credits, 'paid'
  )
  on conflict (provider_order_id) do nothing
  returning id into v_payment_id;

  if v_payment_id is null then return false; end if;

  insert into public.tunexpert_wallets (user_id, balance, lifetime_purchased)
  values (v_subscription.user_id, v_subscription.monthly_credits, v_subscription.monthly_credits)
  on conflict (user_id) do update
    set balance = public.tunexpert_wallets.balance + excluded.balance,
        lifetime_purchased = public.tunexpert_wallets.lifetime_purchased + excluded.lifetime_purchased,
        updated_at = now()
  returning balance into v_balance;

  update public.tunexpert_subscriptions
  set status = 'active',
      current_period_start = coalesce(current_period_end, now()),
      current_period_end = coalesce(current_period_end, now()) + interval '1 month',
      next_billing_at = coalesce(next_billing_at, now()) + interval '1 month',
      updated_at = now()
  where id = v_subscription.id;

  insert into public.tunexpert_ledger (
    user_id, delta, balance_after, entry_type, entry_key, reference_id, description
  ) values (
    v_subscription.user_id, v_subscription.monthly_credits, v_balance, 'purchase',
    'subscription-payment:' || v_payment_id::text, v_payment_id,
    'tuneXpert monthly subscription credit grant'
  );

  return true;
end;
$$;

create or replace function public.tunexpert_reverse_subscription_payment(
  p_provider_order_id text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.tunexpert_subscription_payments%rowtype;
  v_balance integer;
begin
  select * into v_payment
  from public.tunexpert_subscription_payments
  where provider_order_id = p_provider_order_id
  for update;

  if not found or v_payment.status = 'refunded' then return false; end if;

  update public.tunexpert_wallets
  set balance = balance - v_payment.credits_granted,
      lifetime_purchased = greatest(0, lifetime_purchased - v_payment.credits_granted),
      updated_at = now()
  where user_id = v_payment.user_id
  returning balance into v_balance;

  update public.tunexpert_subscription_payments
  set status = 'refunded', refunded_at = now()
  where id = v_payment.id;

  insert into public.tunexpert_ledger (
    user_id, delta, balance_after, entry_type, entry_key, reference_id, description
  ) values (
    v_payment.user_id, -v_payment.credits_granted, v_balance, 'payment_reversal',
    'subscription-reversal:' || v_payment.id::text, v_payment.id,
    'Reversed tuneXpert subscription payment'
  ) on conflict (entry_key) do nothing;

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
declare
  v_subscription_id uuid;
begin
  update public.tunexpert_credit_orders
  set status = 'cancelled', updated_at = now()
  where order_no = p_order_no and status = 'pending'
  returning subscription_id into v_subscription_id;

  if v_subscription_id is not null then
    update public.tunexpert_subscriptions
    set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = v_subscription_id and status = 'pending';
  end if;
end;
$$;

revoke all on function public.tunexpert_claim_subscription_activation(text) from public, anon, authenticated;
revoke all on function public.tunexpert_settle_subscription_payment(text, text, text, bigint) from public, anon, authenticated;
revoke all on function public.tunexpert_reverse_subscription_payment(text) from public, anon, authenticated;

grant execute on function public.tunexpert_claim_subscription_activation(text) to service_role;
grant execute on function public.tunexpert_settle_subscription_payment(text, text, text, bigint) to service_role;
grant execute on function public.tunexpert_reverse_subscription_payment(text) to service_role;

commit;
