-- HAMA: Subscription Plan Pricing Cleanup
-- Aligns subscription_plans with src/constants/plans.ts (single source of truth):
--   seeker      Free 0 / Premium 199 / Pro 599
--   landlord    Basic 899 / Premium 2899 / Pro 6899
--   seller      Basic 399 / Premium 1899 / Pro 4899
--   provider    Basic 399 / Premium 1399 / Pro 3899
-- Paid plans are reduced by KSh 100 (no old prices retained).

update public.subscription_plans set price = 199 where user_type = 'seeker' and tier = 'Premium';
update public.subscription_plans set price = 599 where user_type = 'seeker' and tier = 'Pro';

update public.subscription_plans set price = 899 where user_type = 'landlord' and tier = 'Basic';
update public.subscription_plans set price = 2899 where user_type = 'landlord' and tier = 'Premium';
update public.subscription_plans set price = 6899 where user_type = 'landlord' and tier = 'Pro';

update public.subscription_plans set price = 399 where user_type = 'seller' and tier = 'Basic';
update public.subscription_plans set price = 1899 where user_type = 'seller' and tier = 'Premium';
update public.subscription_plans set price = 4899 where user_type = 'seller' and tier = 'Pro';

update public.subscription_plans set price = 399 where user_type = 'service_provider' and tier = 'Basic';
update public.subscription_plans set price = 1399 where user_type = 'service_provider' and tier = 'Premium';
update public.subscription_plans set price = 3899 where user_type = 'service_provider' and tier = 'Pro';

commit;