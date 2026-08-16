-- HAMA: Subscription Plan Restructure (2026)
-- Aligns subscription_plans with src/constants/plans.ts (single source of truth):
--   seeker            Premium 199 (single plan; Free/Pro removed)
--   landlord          Basic 899 / Premium 2899 / Pro 6899 (unchanged, 3 free uploads)
--   seller            Free 5 products / Basic 399 (up to 20) / Premium 599 (unlimited)
--   service_provider  Premium 299 (single plan; Basic/Pro removed)
-- Idempotent: safe to re-run. user_subscriptions.plan_id is ON DELETE SET NULL.

begin;

-- ============ SEEKER — single Premium 199 ============
delete from public.subscription_plans where user_type = 'seeker' and tier in ('Free', 'Pro');
update public.subscription_plans
   set price = 199,
       features = '["Featured properties access", "Featured products access", "Full marketplace shopping", "Best house deal notifications", "Community access & feed", "Unlimited saves", "AI recommendations", "Advanced filters"]'::jsonb,
       highlighted = true
 where user_type = 'seeker' and tier = 'Premium';

-- ============ LANDLORD — unchanged pricing ============
update public.subscription_plans set price = 899  where user_type = 'landlord' and tier = 'Basic';
update public.subscription_plans set price = 2899 where user_type = 'landlord' and tier = 'Premium';
update public.subscription_plans set price = 6899 where user_type = 'landlord' and tier = 'Pro';

-- ============ SELLER — Free 5 / Basic 399-20 / Premium 599-unlimited ============
-- Repurpose the old Pro row (…009) as the Free plan.
insert into public.subscription_plans (id, user_type, tier, price, currency, features, highlighted)
values ('30000000-0000-4000-8000-000000000009', 'seller', 'Free', 0, 'KSh', '["5 free products"]'::jsonb, false)
on conflict (id) do update
  set user_type = excluded.user_type,
      tier = excluded.tier,
      price = excluded.price,
      currency = excluded.currency,
      features = excluded.features,
      highlighted = excluded.highlighted;
delete from public.subscription_plans where user_type = 'seller' and tier = 'Free' and id <> '30000000-0000-4000-8000-000000000009';
update public.subscription_plans set price = 399, features = '["Up to 20 products"]'::jsonb, highlighted = false where user_type = 'seller' and tier = 'Basic';
update public.subscription_plans set price = 599, features = '["Unlimited products", "Featured store"]'::jsonb, highlighted = true where user_type = 'seller' and tier = 'Premium';
delete from public.subscription_plans where user_type = 'seller' and tier = 'Pro';

-- ============ SERVICE PROVIDER — single Premium 299 ============
delete from public.subscription_plans where user_type = 'service_provider' and tier in ('Basic', 'Pro');
update public.subscription_plans
   set price = 299,
       features = '["List your services", "Priority ranking", "Lead generation", "Verified badge", "Analytics"]'::jsonb,
       highlighted = true
 where user_type = 'service_provider' and tier = 'Premium';

commit;
