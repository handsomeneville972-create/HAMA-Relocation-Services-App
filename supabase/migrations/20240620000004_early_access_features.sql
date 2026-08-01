-- ============================================================
-- HAMA Database Schema — Early Access Features Migration
--
-- Creates tables for the Early Access / Founding Member Program:
--   - early_access_waitlist      Priority Subscriber Waitlist
--   - referral_codes             Unique referral codes per user
--   - referrals                  Referral tracking & signups
--   - email_subscriptions        Newsletter/update subscribers
--   - subscription_interest      Plan interest tracking
--
-- Drop policies first for idempotent re-runs, then create tables,
-- enable RLS, create policies, and add performance indexes.
-- ============================================================

-- ============================================================
-- 1. EARLY ACCESS WAITLIST
-- ============================================================
create table if not exists public.early_access_waitlist (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text not null,
  phone           text,
  preferred_plan  text not null default 'Undecided' check (preferred_plan in ('Free','Premium','Pro','Enterprise','Undecided')),
  business_size   text,
  business_type   text,
  intent          text not null default 'low' check (intent in ('high','medium','low')),
  user_id         uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.early_access_waitlist enable row level security;

-- Policies
DROP POLICY IF EXISTS "Anyone authenticated can join waitlist" ON public.early_access_waitlist;
create policy "Anyone authenticated can join waitlist"
  on public.early_access_waitlist for insert
  with check (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view their own waitlist entry" ON public.early_access_waitlist;
create policy "Users can view their own waitlist entry"
  on public.early_access_waitlist for select
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON public.early_access_waitlist;
create policy "Admins can view all waitlist entries"
  on public.early_access_waitlist for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Hamisha Squad can view waitlist entries" ON public.early_access_waitlist;
create policy "Hamisha Squad can view waitlist entries"
  on public.early_access_waitlist for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('hamisha_squad', 'admin'))
  );

-- Indexes
create index if not exists idx_early_access_waitlist_email on public.early_access_waitlist(email);
create index if not exists idx_early_access_waitlist_intent on public.early_access_waitlist(intent);
create index if not exists idx_early_access_waitlist_preferred_plan on public.early_access_waitlist(preferred_plan);
create index if not exists idx_early_access_waitlist_created_at on public.early_access_waitlist(created_at desc);

-- ============================================================
-- 2. REFERRAL CODES
-- ============================================================
create table if not exists public.referral_codes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  code          text not null,
  created_at    timestamptz not null default now(),

  -- Each user gets one unique code
  unique(user_id),
  unique(code)
);

alter table public.referral_codes enable row level security;

-- Auto-generate referral code on profile creation
create or replace function public.generate_referral_code()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  short_id text;
  random_part text;
  new_code text;
begin
  -- Create a code: first 6 chars of user ID (uppercase, alphanumeric) + 4 random chars
  short_id := upper(regexp_replace(new.id::text, '[^a-zA-Z0-9]', '', 'g'));
  short_id := left(short_id, 6);
  random_part := upper(substr(md5(random()::text), 1, 4));
  new_code := short_id || random_part;

  insert into public.referral_codes (user_id, code)
  values (new.id, new_code)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger on profile creation
create or replace trigger on_profile_created_generate_referral_code
  after insert on public.profiles
  for each row execute function public.generate_referral_code();

-- Policies
DROP POLICY IF EXISTS "Users can view their own referral code" ON public.referral_codes;
create policy "Users can view their own referral code"
  on public.referral_codes for select
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can lookup a referral code" ON public.referral_codes;
create policy "Anyone can lookup a referral code"
  on public.referral_codes for select
  using (true);

DROP POLICY IF EXISTS "Admins can manage referral codes" ON public.referral_codes;
create policy "Admins can manage referral codes"
  on public.referral_codes for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Indexes
create index if not exists idx_referral_codes_code on public.referral_codes(code);
create index if not exists idx_referral_codes_user_id on public.referral_codes(user_id);

-- Backfill referral codes for profiles that already exist
-- (so migration can be applied after seed data without leaving existing users without codes)
insert into public.referral_codes (user_id, code)
select
  p.id,
  upper(regexp_replace(p.id::text, '[^a-zA-Z0-9]', '', 'g')) || upper(substr(md5(random()::text || p.id::text), 1, 4)) as code
from public.profiles p
left join public.referral_codes rc on rc.user_id = p.id
where rc.id is null
on conflict (user_id) do nothing;

-- ============================================================
-- 3. REFERRALS (tracking referral actions)
-- ============================================================
create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references public.profiles(id) on delete cascade,
  referred_user_id  uuid references public.profiles(id) on delete set null,
  referred_email    text,
  referred_name     text,
  referral_code     text,
  status            text not null default 'pending' check (status in ('pending','joined','rewarded')),
  created_at        timestamptz not null default now(),
  joined_at         timestamptz
);

alter table public.referrals enable row level security;

-- Policies
DROP POLICY IF EXISTS "Users can view referrals they made" ON public.referrals;
create policy "Users can view referrals they made"
  on public.referrals for select
  using (auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
create policy "Users can create referrals"
  on public.referrals for insert
  with check (auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
create policy "Admins can view all referrals"
  on public.referrals for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Hamisha Squad can view referrals" ON public.referrals;
create policy "Hamisha Squad can view referrals"
  on public.referrals for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('hamisha_squad', 'admin'))
  );

-- Indexes
create index if not exists idx_referrals_referrer_user_id on public.referrals(referrer_user_id);
create index if not exists idx_referrals_referred_user_id on public.referrals(referred_user_id);
create index if not exists idx_referrals_status on public.referrals(status);
create index if not exists idx_referrals_created_at on public.referrals(created_at desc);

-- ============================================================
-- 4. EMAIL SUBSCRIPTIONS
-- ============================================================
create table if not exists public.email_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  name              text,
  user_id           uuid references public.profiles(id) on delete set null,
  topics            jsonb default '[]'::jsonb,
  subscribed        boolean not null default true,
  subscribed_at     timestamptz not null default now(),
  unsubscribed_at   timestamptz,

  unique(email)
);

alter table public.email_subscriptions enable row level security;

-- Policies
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.email_subscriptions;
create policy "Anyone can subscribe"
  on public.email_subscriptions for insert
  with check (true);

DROP POLICY IF EXISTS "Anyone can update their own subscription" ON public.email_subscriptions;
create policy "Anyone can update their own subscription"
  on public.email_subscriptions for update
  using (
    -- Allow if authenticated user matches the linked user_id
    (auth.uid() = user_id)
    or
    -- Allow if no user_id is linked (anonymous subscription) — email-based auth
    (user_id is null and auth.role() = 'authenticated')
  );

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.email_subscriptions;
create policy "Admins can view all subscriptions"
  on public.email_subscriptions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Hamisha Squad can view subscriptions" ON public.email_subscriptions;
create policy "Hamisha Squad can view subscriptions"
  on public.email_subscriptions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('hamisha_squad', 'admin'))
  );

-- Indexes
create index if not exists idx_email_subscriptions_email on public.email_subscriptions(email);
create index if not exists idx_email_subscriptions_user_id on public.email_subscriptions(user_id);
create index if not exists idx_email_subscriptions_subscribed on public.email_subscriptions(subscribed);
create index if not exists idx_email_subscriptions_created_at on public.email_subscriptions(subscribed_at desc);

-- ============================================================
-- 5. SUBSCRIPTION INTEREST TRACKING
--
-- Records when users view/click pricing plans during Early Access.
-- Powers revenue forecasting and pricing validation.
-- ============================================================
create table if not exists public.subscription_interest (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete set null,
  plan_tier       text not null,
  user_type       text check (user_type in ('seeker','landlord','seller','service_provider')),
  action          text not null default 'viewed' check (action in ('viewed','clicked','compared')),
  source          text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

alter table public.subscription_interest enable row level security;

-- Policies
DROP POLICY IF EXISTS "Anyone authenticated can record interest" ON public.subscription_interest;
create policy "Anyone authenticated can record interest"
  on public.subscription_interest for insert
  with check (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can view all interest data" ON public.subscription_interest;
create policy "Admins can view all interest data"
  on public.subscription_interest for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Hamisha Squad can view interest data" ON public.subscription_interest;
create policy "Hamisha Squad can view interest data"
  on public.subscription_interest for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('hamisha_squad', 'admin'))
  );

-- Indexes for analytics queries
create index if not exists idx_subscription_interest_user_id on public.subscription_interest(user_id);
create index if not exists idx_subscription_interest_plan_tier on public.subscription_interest(plan_tier);
create index if not exists idx_subscription_interest_action on public.subscription_interest(action);
create index if not exists idx_subscription_interest_created_at on public.subscription_interest(created_at desc);

-- Composite index for revenue forecasting
create index if not exists idx_subscription_interest_plan_action on public.subscription_interest(plan_tier, action);

-- ============================================================
-- 6. ADMIN-FRIENDLY VIEWS
-- ============================================================

-- View: Waitlist summary with intent breakdown
create or replace view public.view_waitlist_summary as
select
  count(*) as total_entries,
  count(*) filter (where intent = 'high') as high_intent,
  count(*) filter (where intent = 'medium') as medium_intent,
  count(*) filter (where intent = 'low') as low_intent,
  preferred_plan,
  count(*) as plan_count
from public.early_access_waitlist
group by preferred_plan
order by plan_count desc;

-- View: Referral performance per user
create or replace view public.view_referral_performance as
select
  rc.user_id,
  rc.code,
  count(r.id) filter (where r.status = 'pending') as pending_referrals,
  count(r.id) filter (where r.status = 'joined') as successful_signups,
  count(r.id) filter (where r.status = 'rewarded') as rewarded_referrals,
  count(r.id) as total_referrals
from public.referral_codes rc
left join public.referrals r on r.referrer_user_id = rc.user_id
group by rc.user_id, rc.code;

-- View: Subscription interest summary for revenue forecasting
create or replace view public.view_subscription_forecast as
select
  plan_tier,
  count(*) filter (where action = 'viewed') as total_views,
  count(*) filter (where action = 'clicked') as total_clicks,
  count(distinct user_id) as unique_interested_users,
  user_type
from public.subscription_interest
group by plan_tier, user_type
order by unique_interested_users desc;

-- ============================================================
-- 7. HELPER FUNCTION: Get referral stats for a user
-- ============================================================
create or replace function public.get_referral_stats(p_user_id uuid)
returns table (
  total_referrals bigint,
  successful_signups bigint,
  current_tier text,
  next_tier_required int
)
language sql
stable
security definer
as $$
  with stats as (
    select
      count(*) filter (where status = 'pending') as pending_count,
      count(*) filter (where status = 'joined') as joined_count,
      count(*) filter (where status = 'rewarded') as rewarded_count,
      count(*) as total
    from public.referrals
    where referrer_user_id = p_user_id
  )
  select
    stats.total,
    stats.joined_count + stats.rewarded_count,
    case
      when stats.joined_count + stats.rewarded_count >= 10 then 'vip_inner_circle'
      when stats.joined_count + stats.rewarded_count >= 5 then 'champion_referrer'
      when stats.joined_count + stats.rewarded_count >= 3 then 'early_access_plus'
      else null
    end::text,
    case
      when stats.joined_count + stats.rewarded_count < 3 then 3
      when stats.joined_count + stats.rewarded_count < 5 then 5
      when stats.joined_count + stats.rewarded_count < 10 then 10
      else 0
    end
  from stats;
$$;

-- ============================================================
-- 8. HELPER FUNCTION: Record subscription interest
-- ============================================================
create or replace function public.record_subscription_interest(
  p_user_id uuid,
  p_plan_tier text,
  p_user_type text default null,
  p_action text default 'viewed',
  p_source text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.subscription_interest (user_id, plan_tier, user_type, action, source, metadata)
  values (p_user_id, p_plan_tier, p_user_type, p_action, p_source, p_metadata)
  returning id into new_id;

  return new_id;
end;
$$;

-- ============================================================
-- 9. HELPER FUNCTION: Submit waitlist entry
-- ============================================================
create or replace function public.submit_waitlist_entry(
  p_name text,
  p_email text,
  p_preferred_plan text default 'Undecided',
  p_phone text default null,
  p_business_size text default null,
  p_business_type text default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_id uuid;
  v_intent text;
begin
  -- Determine intent level based on plan selection
  v_intent := case
    when p_preferred_plan in ('Pro', 'Enterprise') then 'high'
    when p_preferred_plan = 'Premium' then 'medium'
    else 'low'
  end;

  insert into public.early_access_waitlist (name, email, phone, preferred_plan, business_size, business_type, intent, user_id)
  values (p_name, p_email, p_phone, p_preferred_plan, p_business_size, p_business_type, v_intent, p_user_id)
  returning id into new_id;

  return new_id;
end;
$$;
