-- ============================================================
-- HAMA Seed Data
--
-- Populates the database with comprehensive development data.
-- Run this AFTER running the two migration files.
-- Run in Supabase SQL Editor: supabase.com/dashboard/project/{ref}/sql/new
--
-- Usage: Paste into SQL Editor and click Run (all 3 files in order).
-- Dev login: All users have password: 'password123'
-- ============================================================

-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto" with schema "extensions";

-- ============================================================
-- 1. AUTH USERS & PROFILES
-- ============================================================
-- Note: The trigger `on_auth_user_created` (from migration 1)
-- automatically creates profiles when auth.users rows are inserted.
-- We provide raw_user_meta_data so profiles get the right role/name.

insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at) values
  ('a0000000-0000-4000-8000-000000000001', 'james@example.com',   extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"display_name":"James Mwangi","role":"seller"}',            now(), now()),
  ('a0000000-0000-4000-8000-000000000002', 'sarah@example.com',   extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"display_name":"Sarah Akinyi","role":"seeker"}',           now(), now()),
  ('a0000000-0000-4000-8000-000000000003', 'peter@example.com',   extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"display_name":"Peter Kamau","role":"service_provider"}',  now(), now()),
  ('a0000000-0000-4000-8000-000000000004', 'grace@example.com',   extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"display_name":"Grace Wanjiku","role":"landlord"}',        now(), now()),
  ('a0000000-0000-4000-8000-000000000005', 'david@example.com',   extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"display_name":"David Ochieng","role":"seeker"}',          now(), now()),
  ('a0000000-0000-4000-8000-000000000006', 'faith@example.com',   extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"display_name":"Faith Njeri","role":"seller"}',            now(), now())
on conflict (id) do nothing;

-- Update profiles with the full fields (trigger creates basic rows)
-- We only update if the profile was just created (not if already existing)
update public.profiles set
  phone              = data.phone,
  phone_verified     = data.phone_verified,
  verification_level = data.verification_level,
  updated_at         = now()
from (values
  ('a0000000-0000-4000-8000-000000000001', '+254712345678', true, 'full'),
  ('a0000000-0000-4000-8000-000000000002', '+254723456789', true, 'full'),
  ('a0000000-0000-4000-8000-000000000003', null,            false, 'email'),
  ('a0000000-0000-4000-8000-000000000004', '+254734567890', true, 'full'),
  ('a0000000-0000-4000-8000-000000000005', null,            false, 'unverified'),
  ('a0000000-0000-4000-8000-000000000006', '+254745678901', true, 'id')
) as data(id, phone, phone_verified, verification_level)
where public.profiles.id = data.id::uuid;

-- ============================================================
-- 2. SELLERS
-- ============================================================
insert into public.sellers (id, user_id, name, description, logo_url, banner_url, location, contact, rating, review_count, followers, joined_date, verified) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Urban Nest Furniture',
   'Premium furniture for modern African homes. We source the finest materials to bring you comfort and style.',
   'https://i.pravatar.cc/150?u=urbannest', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200',
   'Nairobi, Kenya', '+254 712 345 678', 4.8, 234, 1560, '2023-06-15', true),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000006', 'Tech Haven KE',
   'Your one-stop shop for electronics and gadgets. Quality guaranteed with warranty on all products.',
   'https://i.pravatar.cc/150?u=techhaven', 'https://images.unsplash.com/photo-1468495244123-6c4c332eeece?w=1200',
   'Nairobi, Kenya', '+254 723 456 789', 4.6, 189, 980, '2023-08-20', true),
  ('b0000000-0000-4000-8000-000000000003', null, 'Home Essentials',
   'Everything you need to make your house a home. Affordable prices, premium quality.',
   'https://i.pravatar.cc/150?u=homeessentials', 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1200',
   'Nairobi, Kenya', '+254 734 567 890', 4.7, 312, 2100, '2023-04-10', true)
on conflict (id) do nothing;

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
insert into public.products (id, seller_id, name, description, price, original_price, category, subcategory, condition, rating, review_count, location, featured) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Modern L-Shaped Sofa',
   'Premium fabric L-shaped sofa with memory foam cushions. Perfect for modern living rooms.', 85000, 110000, 'Furniture', 'Sofas', 'New', 4.8, 56, 'Nairobi', true),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'King Size Bed Frame',
   'Elegant king-size bed frame with storage drawers. Solid wood construction with premium finish.', 65000, 80000, 'Furniture', 'Beds', 'New', 4.9, 42, 'Nairobi', true),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002', '55" 4K Smart TV',
   'Ultra HD Smart TV with built-in streaming apps, voice control, and stunning picture quality.', 95000, 120000, 'Appliances', 'TVs', 'New', 4.7, 89, 'Nairobi', true),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'Double Door Refrigerator',
   'Energy-efficient double-door refrigerator with smart cooling technology and spacious interior.', 78000, null, 'Appliances', 'Refrigerators', 'New', 4.6, 34, 'Nairobi', false),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000003', 'Premium Curtain Set',
   'Set of 4 premium blackout curtains with thermal insulation. Multiple colors available.', 8500, null, 'Home Essentials', 'Curtains', 'New', 4.5, 67, 'Nairobi', false),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000002', 'Gaming Laptop Pro',
   'High-performance gaming laptop with RTX graphics, 16GB RAM, and 1TB SSD.', 145000, null, 'Electronics', 'Laptops', 'New', 4.9, 23, 'Nairobi', true),
  ('c0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', 'Dining Table Set 6-Seater',
   'Elegant 6-seater dining table set with tempered glass top and premium leather chairs.', 55000, null, 'Furniture', 'Dining Tables', 'New', 4.7, 38, 'Nairobi', false),
  ('c0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000002', 'Automatic Washing Machine',
   'Front-load automatic washing machine with 10kg capacity and multiple wash programs.', 52000, null, 'Appliances', 'Washing Machines', 'New', 4.5, 45, 'Nairobi', false),
  ('c0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000003', 'Office Desk with Drawers',
   'Spacious office desk with multiple storage drawers and cable management system.', 28000, null, 'Furniture', 'Office Desks', 'New', 4.6, 29, 'Nairobi', false),
  ('c0000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-000000000001', 'Memory Foam Mattress',
   'Premium memory foam mattress with cooling gel layer. Medium firmness for optimal comfort.', 45000, 58000, 'Furniture', 'Mattresses', 'New', 4.8, 91, 'Nairobi', true)
on conflict (id) do nothing;

-- ============================================================
-- 4. PRODUCT IMAGES
-- ============================================================
insert into public.product_images (product_id, image_url, sort_order) values
  ('c0000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', 0),
  ('c0000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600', 1),
  ('c0000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600', 2),
  ('c0000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1505693416385-ac8ce068fe85?w=600', 0),
  ('c0000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1505692952047-1a78307d0e5b?w=600', 1),
  ('c0000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600', 0),
  ('c0000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1468495244123-6c4c332eeece?w=600', 1),
  ('c0000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1571175443880-49e1d45b2b2e?w=600', 0),
  ('c0000000-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600', 0),
  ('c0000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600', 0),
  ('c0000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600', 0),
  ('c0000000-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600', 0),
  ('c0000000-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600', 0),
  ('c0000000-0000-4000-8000-00000000000a', 'https://images.unsplash.com/photo-1505693416385-ac8ce068fe85?w=600', 0)
on conflict do nothing;

-- ============================================================
-- 5. PRODUCT REVIEWS
-- ============================================================
insert into public.product_reviews (product_id, user_id, rating, content) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 5, 'Absolutely love this sofa! The fabric is premium quality and very comfortable.'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 4, 'Great sofa for the price. Delivery was prompt and assembly was easy.'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 5, 'Stunning picture quality! The smart features work flawlessly.'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 5, 'Best gaming laptop I have ever owned. Runs Cyberpunk at max settings!'),
  ('c0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000002', 4, 'Very comfortable mattress. Good value for money.')
on conflict (product_id, user_id) do nothing;

-- ============================================================
-- 6. SERVICE PROVIDERS
-- ============================================================
insert into public.service_providers (id, user_id, name, description, logo_url, banner_url, category, subcategory, location, rating, review_count, verified, pricing, response_time, availability, phone, email) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'QuickFix Plumbers',
   'Professional plumbing services for residential and commercial properties. Available 24/7 for emergencies.',
   'https://i.pravatar.cc/150?u=quickfix', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200',
   'Home Maintenance', 'Plumbers', 'Nairobi', 4.7, 156, true, 'KSh 1,500/hr', '< 30 min', '24/7', '+254 712 345 678', 'info@quickfix.co.ke'),
  ('d0000000-0000-4000-8000-000000000002', null, 'SparkPro Electricians',
   'Certified electricians for installations, repairs, and inspections. Safety guaranteed.',
   'https://i.pravatar.cc/150?u=sparkpro', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200',
   'Home Maintenance', 'Electricians', 'Nairobi', 4.8, 203, true, 'KSh 1,800/hr', '< 45 min', 'Mon-Sat 7AM-8PM', '+254 723 456 789', 'hello@sparkpro.co.ke'),
  ('d0000000-0000-4000-8000-000000000003', null, 'Elite Cleaners',
   'Deep cleaning services for homes and offices. Eco-friendly products used.',
   'https://i.pravatar.cc/150?u=elitecleaners', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200',
   'Cleaning', 'Deep Cleaning', 'Nairobi', 4.9, 312, true, 'KSh 3,000/session', '< 1 hr', 'Daily 6AM-6PM', '+254 734 567 890', 'book@elitecleaners.co.ke'),
  ('d0000000-0000-4000-8000-000000000004', null, 'DesignHome Interiors',
   'Award-winning interior designers creating beautiful spaces for modern living.',
   'https://i.pravatar.cc/150?u=designhome', 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200',
   'Home Improvement', 'Interior Designers', 'Nairobi', 4.9, 87, true, 'KSh 5,000/hr', '< 2 hrs', 'Mon-Fri 9AM-5PM', '+254 745 678 901', 'studio@designhome.co.ke'),
  ('d0000000-0000-4000-8000-000000000005', null, 'SafeNet CCTV',
   'Professional CCTV installation and smart home security solutions.',
   'https://i.pravatar.cc/150?u=safenet', 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200',
   'Technology', 'CCTV Installers', 'Nairobi', 4.6, 134, true, 'From KSh 8,000', '< 1 hr', 'Mon-Sat 8AM-7PM', '+254 756 789 012', 'sales@safenet.co.ke'),
  ('d0000000-0000-4000-8000-000000000006', null, 'Master Painters',
   'Professional painting services for interiors and exteriors. Premium finishes guaranteed.',
   'https://i.pravatar.cc/150?u=masterpaint', 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1200',
   'Home Maintenance', 'Painters', 'Nairobi', 4.7, 198, true, 'KSh 2,500/hr', '< 1 hr', 'Mon-Sat 7AM-6PM', '+254 767 890 123', 'info@masterpainters.co.ke'),
  ('d0000000-0000-4000-8000-000000000007', null, 'Sparkle House Cleaners',
   'Regular house cleaning and maintenance services. Reliable, thorough, and affordable.',
   'https://i.pravatar.cc/150?u=sparkle', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200',
   'Cleaning', 'House Cleaners', 'Nairobi', 4.6, 234, true, 'KSh 1,500/session', '< 2 hrs', 'Daily 6AM-6PM', '+254 701 111 222', 'hello@sparklecleaners.co.ke'),
  ('d0000000-0000-4000-8000-000000000008', null, 'FreshFold Laundry',
   'Professional laundry and dry cleaning services with free pickup and delivery.',
   'https://i.pravatar.cc/150?u=freshfold', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200',
   'Cleaning', 'Laundry Services', 'Nairobi', 4.5, 345, true, 'From KSh 500/kg', '< 3 hrs', 'Daily 8AM-8PM', '+254 702 222 333', 'info@freshfold.co.ke'),
  ('d0000000-0000-4000-8000-000000000009', null, 'Skyline Architects',
   'Innovative architectural design for residential and commercial projects. Specializing in modern African architecture.',
   'https://i.pravatar.cc/150?u=skylinearch', 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200',
   'Construction', 'Architects', 'Nairobi', 4.8, 67, true, 'From KSh 10,000/hr', '< 4 hrs', 'Mon-Fri 8AM-5PM', '+254 703 333 444', 'studio@skylinearchitects.co.ke')
on conflict (id) do nothing;

-- ============================================================
-- 7. SERVICE REVIEWS
-- ============================================================
insert into public.service_reviews (provider_id, user_id, rating, content) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 5, 'Peter fixed our leaking pipes quickly and professionally. Highly recommend!'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 5, 'Great electricians. They rewired our entire house in 2 days.'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 4, 'Very thorough cleaning service. My apartment has never looked this clean!'),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 5, 'Installed 4 cameras and a DVR system. Great quality and fair pricing.')
on conflict (provider_id, user_id) do nothing;

-- ============================================================
-- 8. NEIGHBORHOODS
-- ============================================================
insert into public.neighborhoods (id, name, city, description, image_url, rating, security_rating, amenities_rating, transport_rating, avg_rent, property_count, review_count) values
  -- Premium areas
  ('e0000000-0000-4000-8000-000000000001', 'Westlands', 'Nairobi', 'Upscale business district with excellent amenities, restaurants, and nightlife.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 4.5, 4, 5, 4, 55000, 234, 567),
  ('e0000000-0000-4000-8000-000000000002', 'Kilimani', 'Nairobi', 'Popular residential area with great schools, malls, and restaurants.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 4.3, 4, 4, 3, 40000, 189, 423),
  ('e0000000-0000-4000-8000-000000000003', 'Lavington', 'Nairobi', 'Quiet, leafy suburb popular with families. Excellent security and large homes.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', 4.7, 5, 4, 3, 80000, 145, 345),
  ('e0000000-0000-4000-8000-000000000004', 'Ngara', 'Nairobi', 'Affordable area popular with students. Walking distance to major universities.', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 3.8, 3, 3, 5, 15000, 312, 678),
  ('e0000000-0000-4000-8000-000000000005', 'Karen', 'Nairobi', 'Expansive leafy suburb with large homes, wildlife, and premium shopping.', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', 4.8, 5, 4, 2, 120000, 198, 432),
  ('e0000000-0000-4000-8000-000000000006', 'Runda', 'Nairobi', 'Exclusive gated community popular with diplomats and executives.', 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600', 4.9, 5, 5, 3, 150000, 112, 289),
  ('e0000000-0000-4000-8000-000000000007', 'Muthaiga', 'Nairobi', 'Prestigious neighborhood with embassies, golf club, and luxury homes.', 'https://images.unsplash.com/photo-1600566753086-00f18f6bae45?w=600', 4.8, 5, 5, 3, 140000, 98, 234),
  ('e0000000-0000-4000-8000-000000000008', 'Kileleshwa', 'Nairobi', 'Trendy residential area popular with young professionals.', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600', 4.4, 4, 4, 4, 50000, 178, 389),
  ('e0000000-0000-4000-8000-000000000009', 'Riverside', 'Nairobi', 'Prime riverside location with luxury apartments and hotels.', 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600', 4.6, 5, 4, 4, 70000, 156, 312),
  -- Middle-income areas
  ('e0000000-0000-4000-8000-00000000000a', 'South B', 'Nairobi', 'Established residential area close to city center.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 4.0, 3, 4, 4, 25000, 267, 456),
  ('e0000000-0000-4000-8000-00000000000b', 'South C', 'Nairobi', 'Peaceful residential area near Wilson Airport.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', 4.1, 4, 3, 3, 30000, 234, 378),
  ('e0000000-0000-4000-8000-00000000000c', 'Langata', 'Nairobi', 'Sprawling suburb near Nairobi National Park.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 4.2, 4, 3, 3, 35000, 289, 512),
  ('e0000000-0000-4000-8000-00000000000d', 'Kasarani', 'Nairobi', 'Vibrant area with sports facilities and good transport links.', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 3.8, 3, 3, 4, 18000, 345, 567),
  ('e0000000-0000-4000-8000-00000000000e', 'Roysambu', 'Nairobi', 'Growing residential area near Thika Road.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 3.9, 3, 3, 4, 20000, 312, 445),
  ('e0000000-0000-4000-8000-00000000000f', 'Ruaka', 'Nairobi', 'Rapidly developing area near Two Rivers Mall.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', 4.0, 3, 4, 3, 28000, 278, 389),
  ('e0000000-0000-4000-8000-000000000010', 'Syokimau', 'Nairobi', 'Popular area near JKIA airport.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 3.9, 3, 3, 4, 22000, 198, 334),
  ('e0000000-0000-4000-8000-000000000011', 'Athi River', 'Nairobi', 'Industrial and residential area with affordable housing.', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 3.5, 3, 2, 3, 15000, 267, 289),
  ('e0000000-0000-4000-8000-000000000012', 'Kitengela', 'Nairobi', 'Fast-growing satellite town with affordable housing.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 3.6, 3, 3, 3, 12000, 356, 423),
  -- Affordable areas
  ('e0000000-0000-4000-8000-000000000013', 'Embakasi', 'Nairobi', 'Large residential area near JKIA.', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 3.4, 2, 3, 4, 10000, 456, 678),
  ('e0000000-0000-4000-8000-000000000014', 'Umoja', 'Nairobi', 'Established estate with good community amenities.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 3.5, 3, 3, 4, 12000, 389, 534),
  ('e0000000-0000-4000-8000-000000000015', 'Donholm', 'Nairobi', 'Popular estate with easy city access.', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 3.6, 3, 3, 4, 13000, 312, 445),
  ('e0000000-0000-4000-8000-000000000016', 'Pipeline', 'Nairobi', 'Bustling estate with vibrant markets.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 3.2, 2, 3, 4, 8000, 423, 567),
  ('e0000000-0000-4000-8000-000000000017', 'Kayole', 'Nairobi', 'High-density estate with strong community feel.', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 3.0, 2, 2, 3, 7000, 512, 623),
  ('e0000000-0000-4000-8000-000000000018', 'Zimmerman', 'Nairobi', 'Growing area along Thika Road.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 3.5, 3, 3, 4, 14000, 267, 345),
  ('e0000000-0000-4000-8000-000000000019', 'Githurai', 'Nairobi', 'Lively area near Kenyatta University.', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 3.3, 2, 3, 4, 9000, 378, 489),
  ('e0000000-0000-4000-8000-00000000001a', 'Kahawa West', 'Nairobi', 'Student-friendly area near KU.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 3.4, 3, 3, 4, 10000, 298, 412),
  ('e0000000-0000-4000-8000-00000000001b', 'Rongai', 'Nairobi', 'Sprawling satellite town with rapid development.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 3.7, 3, 3, 3, 16000, 412, 567),
  -- Tier 1 cities
  ('e0000000-0000-4000-8000-00000000001c', 'Nyali', 'Mombasa', 'Upscale coastal suburb with beautiful beaches.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 4.5, 4, 5, 3, 45000, 189, 345),
  ('e0000000-0000-4000-8000-00000000001d', 'Milimani', 'Kisumu', 'Prime residential area with lake views.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 4.3, 4, 4, 3, 35000, 156, 278),
  ('e0000000-0000-4000-8000-00000000001e', 'Milimani', 'Nakuru', 'Prestigious area with gardens and good schools.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', 4.2, 4, 4, 3, 30000, 134, 256),
  ('e0000000-0000-4000-8000-00000000001f', 'Kapsoya', 'Eldoret', 'Growing area with modern housing.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 4.0, 3, 3, 3, 22000, 178, 223),
  -- Tier 2 cities
  ('e0000000-0000-4000-8000-000000000020', 'Thika Town', 'Thika', 'Industrial town north of Nairobi with affordable housing options.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 3.7, 3, 3, 4, 18000, 234, 312),
  ('e0000000-0000-4000-8000-000000000021', 'Kiambu Town', 'Kiambu', 'Growing satellite town with modern apartments and green spaces.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 3.8, 3, 3, 3, 20000, 198, 278),
  ('e0000000-0000-4000-8000-000000000022', 'Machakos Town', 'Machakos', 'Emerging urban center with affordable housing and good infrastructure.', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 3.6, 3, 3, 3, 15000, 189, 267),
  ('e0000000-0000-4000-8000-000000000023', 'Naivasha Town', 'Naivasha', 'Scenic lakeside town popular with tourists and flower farm workers.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 3.9, 4, 3, 3, 22000, 156, 234),
  ('e0000000-0000-4000-8000-000000000024', 'Nyeri Town', 'Nyeri', 'Central Kenya hub with cool climate and growing real estate market.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', 3.8, 4, 3, 3, 18000, 145, 198),
  ('e0000000-0000-4000-8000-000000000025', 'Meru Town', 'Meru', 'Mount Kenya region commercial center with expanding housing options.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 3.7, 3, 3, 3, 16000, 167, 212)
on conflict (id) do nothing;

-- ============================================================
-- 9. PROPERTIES
-- ============================================================
insert into public.properties (id, landlord_id, title, description, price, bedrooms, bathrooms, size_sqm, location, rating, review_count, furnished, available) values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004',
   'Modern 2-Bedroom Apartment in Westlands',
   'Beautiful modern apartment with stunning city views. Open-plan living, fully fitted kitchen, and spacious balcony.',
   45000, 2, 2, 85, 'Westlands, Nairobi', 4.6, 28, true, true),
  ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004',
   'Cozy 1-Bedroom in Kilimani',
   'Charming ground-floor apartment with private garden. Perfect for young professionals.',
   28000, 1, 1, 55, 'Kilimani, Nairobi', 4.4, 15, true, true),
  ('f0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004',
   'Spacious 3-Bedroom House in Lavington',
   'Family home with large compound, servant quarters, and beautiful garden.',
   85000, 3, 3, 150, 'Lavington, Nairobi', 4.8, 42, false, true),
  ('f0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004',
   'Student Studio near University of Nairobi',
   'Affordable studio apartment walking distance to main campus.',
   12000, 0, 1, 25, 'Ngara, Nairobi', 4.2, 38, true, true)
on conflict (id) do nothing;

-- ============================================================
-- 10. PROPERTY IMAGES
-- ============================================================
insert into public.property_images (property_id, image_url, sort_order) values
  ('f0000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', 0),
  ('f0000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', 1),
  ('f0000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', 2),
  ('f0000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', 0),
  ('f0000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', 1),
  ('f0000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 0),
  ('f0000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 1),
  ('f0000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', 0)
on conflict do nothing;

-- ============================================================
-- 11. PROPERTY AMENITIES
-- ============================================================
insert into public.property_amenities (property_id, name) values
  ('f0000000-0000-4000-8000-000000000001', 'Parking'),
  ('f0000000-0000-4000-8000-000000000001', 'Gym'),
  ('f0000000-0000-4000-8000-000000000001', 'Security'),
  ('f0000000-0000-4000-8000-000000000001', 'Water Tank'),
  ('f0000000-0000-4000-8000-000000000001', 'Generator'),
  ('f0000000-0000-4000-8000-000000000002', 'Security'),
  ('f0000000-0000-4000-8000-000000000002', 'Water'),
  ('f0000000-0000-4000-8000-000000000002', 'Parking'),
  ('f0000000-0000-4000-8000-000000000003', 'Parking'),
  ('f0000000-0000-4000-8000-000000000003', 'Garden'),
  ('f0000000-0000-4000-8000-000000000003', 'Security'),
  ('f0000000-0000-4000-8000-000000000003', 'Servant Quarters'),
  ('f0000000-0000-4000-8000-000000000003', 'Water Tank'),
  ('f0000000-0000-4000-8000-000000000003', 'Generator'),
  ('f0000000-0000-4000-8000-000000000003', 'CCTV'),
  ('f0000000-0000-4000-8000-000000000004', 'Water'),
  ('f0000000-0000-4000-8000-000000000004', 'Electricity'),
  ('f0000000-0000-4000-8000-000000000004', 'Security'),
  ('f0000000-0000-4000-8000-000000000004', 'WiFi')
on conflict do nothing;

-- ============================================================
-- 12. PROPERTY REVIEWS
-- ============================================================
insert into public.property_reviews (property_id, user_id, rating, security_rating, cleanliness_rating, accessibility_rating, amenities_rating, value_rating, content, helpful_count) values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 5, 5, 4, 4, 5, 4,
   'Great apartment in a prime location. The security is excellent and the amenities are top-notch.', 23),
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 4, 4, 5, 3, 4, 4,
   'Good value for money. The gym and security are great. Parking can be tight sometimes.', 12),
  ('f0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 5, 5, 5, 4, 5, 5,
   'Beautiful family home! The garden is perfect for kids. Very secure neighborhood.', 45),
  ('f0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 4, 3, 4, 5, 4, 5,
   'Perfect for a student. Affordable and close to campus. The WiFi is reliable.', 34)
on conflict (property_id, user_id) do nothing;

-- ============================================================
-- 13. COMMUNITY POSTS
-- ============================================================
insert into public.community_posts (id, user_id, type, content, image_url, video_url, likes_count, comments_count, shares_count, bookmarks_count) values
  ('10000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'photo',
   'Just finished setting up my new living room! The L-shaped sofa from Urban Nest is absolutely stunning. Love how it turned out! 🛋️✨',
   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', null, 245, 34, 12, 56),
  ('10000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'tip',
   'Pro tip: Always check the water pressure before renting a house. Low pressure can be a nightmare! Here''s how to test it with a simple bottle method. 🚿',
   null, null, 567, 89, 234, 178),
  ('10000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'video',
   'Neighborhood tour of Westlands, Nairobi - the ultimate guide for young professionals looking to relocate! 🏙️',
   null, 'https://www.w3schools.com/html/mov_bbb.mp4', 892, 145, 67, 234),
  ('10000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'experience',
   'My experience moving from Kisumu to Nairobi for work. The Hamisha Squad made it so easy! Here''s everything you need to know about relocating. 🚚',
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', null, 423, 67, 89, 145),
  ('10000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000006', 'review',
   'Just reviewed my neighborhood in Kilimani. Overall rating: 4.5/5 - Great security, excellent amenities, and fantastic restaurants nearby!',
   'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', null, 178, 45, 23, 67),
  ('10000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', 'advice',
   'Student housing tips: 5 things I wish I knew before renting near the university. Save money and avoid common mistakes! 🎓',
   null, null, 678, 156, 345, 267)
on conflict (id) do nothing;

-- ============================================================
-- 14. COMMUNITY POST TAGS
-- ============================================================
insert into public.community_post_tags (post_id, tag) values
  ('10000000-0000-4000-8000-000000000001', 'interiordesign'),
  ('10000000-0000-4000-8000-000000000001', 'homesetup'),
  ('10000000-0000-4000-8000-000000000001', 'furniture'),
  ('10000000-0000-4000-8000-000000000002', 'housingtips'),
  ('10000000-0000-4000-8000-000000000002', 'renting'),
  ('10000000-0000-4000-8000-000000000002', 'diytips'),
  ('10000000-0000-4000-8000-000000000003', 'neighborhoodguide'),
  ('10000000-0000-4000-8000-000000000003', 'nairobi'),
  ('10000000-0000-4000-8000-000000000003', 'relocation'),
  ('10000000-0000-4000-8000-000000000004', 'relocation'),
  ('10000000-0000-4000-8000-000000000004', 'experience'),
  ('10000000-0000-4000-8000-000000000004', 'hamishasquad'),
  ('10000000-0000-4000-8000-000000000005', 'neighborhoodreview'),
  ('10000000-0000-4000-8000-000000000005', 'kilimani'),
  ('10000000-0000-4000-8000-000000000005', 'nairobi'),
  ('10000000-0000-4000-8000-000000000006', 'studenthousing'),
  ('10000000-0000-4000-8000-000000000006', 'tips'),
  ('10000000-0000-4000-8000-000000000006', 'university')
on conflict (post_id, tag) do nothing;

-- ============================================================
-- 15. COMMUNITY POST LIKES (seed some existing likes)
-- ============================================================
insert into public.community_post_likes (post_id, user_id) values
  ('10000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003'),
  ('10000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006')
on conflict (post_id, user_id) do nothing;

-- ============================================================
-- 16. COMMUNITY POST BOOKMARKS
-- ============================================================
insert into public.community_post_bookmarks (post_id, user_id) values
  ('10000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005')
on conflict (post_id, user_id) do nothing;

-- ============================================================
-- 17. POST COMMENTS
-- ============================================================
insert into public.post_comments (post_id, user_id, content) values
  ('10000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'Your living room looks amazing! Where did you get the coffee table?'),
  ('10000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'Love the color scheme! Great taste 👌'),
  ('10000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'Great tip! I learned this the hard way in my first rental 😅'),
  ('10000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Westlands is the best! I work there and love the vibe.'),
  ('10000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'The Hamisha Squad helped me move too! They were amazing.'),
  ('10000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 'Thanks for the tips! I''m starting university next month.'),
  ('10000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'Number 3 is so important! Wish I knew that before.')
on conflict do nothing;

-- ============================================================
-- 18. SUBSCRIPTION PLANS
-- ============================================================
insert into public.subscription_plans (id, user_type, tier, price, currency, features, highlighted) values
  ('30000000-0000-4000-8000-000000000001', 'seeker', 'Free', 0, 'KSh', '["Basic search", "Save up to 20 properties", "Standard recommendations"]'::jsonb, false),
  ('30000000-0000-4000-8000-000000000002', 'seeker', 'Premium', 299, 'KSh', '["Unlimited saves", "AI recommendations", "Advanced filters", "Student housing tools", "Priority notifications"]'::jsonb, true),
  ('30000000-0000-4000-8000-000000000003', 'seeker', 'Pro', 699, 'KSh', '["Premium listings first", "Advanced neighborhood reports", "Relocation discounts", "Priority support", "Exclusive deals"]'::jsonb, false),
  ('30000000-0000-4000-8000-000000000004', 'landlord', 'Basic', 999, 'KSh', '["10 active listings"]'::jsonb, false),
  ('30000000-0000-4000-8000-000000000005', 'landlord', 'Premium', 2999, 'KSh', '["50 listings", "Featured properties"]'::jsonb, true),
  ('30000000-0000-4000-8000-000000000006', 'landlord', 'Pro', 6999, 'KSh', '["Unlimited listings", "Analytics dashboard", "Priority placement", "Marketing tools"]'::jsonb, false),
  ('30000000-0000-4000-8000-000000000007', 'seller', 'Basic', 499, 'KSh', '["25 products"]'::jsonb, false),
  ('30000000-0000-4000-8000-000000000008', 'seller', 'Premium', 1999, 'KSh', '["250 products", "Featured store"]'::jsonb, true),
  ('30000000-0000-4000-8000-000000000009', 'seller', 'Pro', 4999, 'KSh', '["Unlimited products", "Store analytics", "Homepage promotion"]'::jsonb, false),
  ('30000000-0000-4000-8000-00000000000a', 'service_provider', 'Basic', 499, 'KSh', '["List your services"]'::jsonb, false),
  ('30000000-0000-4000-8000-00000000000b', 'service_provider', 'Premium', 1499, 'KSh', '["Priority ranking", "Lead generation", "Verified badge"]'::jsonb, true),
  ('30000000-0000-4000-8000-00000000000c', 'service_provider', 'Pro', 3999, 'KSh', '["Top ranking", "Premium leads", "Verified badge", "Analytics"]'::jsonb, false)
on conflict (id) do nothing;

-- ============================================================
-- 19. USER SUBSCRIPTIONS
-- ============================================================
insert into public.user_subscriptions (user_id, plan_id, status, started_at, expires_at) values
  ('a0000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'active', now(), now() + interval '30 days'),
  ('a0000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005', 'active', now(), now() + interval '30 days'),
  ('a0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000008', 'active', now(), now() + interval '30 days'),
  ('a0000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-00000000000b', 'active', now(), now() + interval '30 days')
on conflict do nothing;

-- ============================================================
-- 20. NOTIFICATIONS
-- ============================================================
insert into public.notifications (user_id, type, title, message, icon, read, action_link) values
  ('a0000000-0000-4000-8000-000000000001', 'property', '🏠 New Property Match', 'A new property matching your budget was listed in Kilimani.', 'home', false, null),
  ('a0000000-0000-4000-8000-000000000001', 'marketplace', '🛋️ New Arrivals', 'New furniture has arrived near your location from Urban Nest.', 'shopping-bag', false, null),
  ('a0000000-0000-4000-8000-000000000002', 'discount', '🚚 Hamisha Squad Discount', 'Hamisha Squad discounts available this week! Save 15% on relocation.', 'truck', false, null),
   ('a0000000-0000-4000-8000-000000000001', 'message', 'Landlord Response', 'A landlord replied to your inquiry about the Westlands apartment.', 'message-square', false, null),
  ('a0000000-0000-4000-8000-000000000005', 'student', '🎓 Student Housing Available', 'Student housing near your university is now available from KSh 8,000.', 'graduation-cap', true, null),
   ('a0000000-0000-4000-8000-000000000004', 'review', 'New Review', 'Someone reviewed your property "Modern 2-Bedroom Apartment".', 'star', true, null),
  ('a0000000-0000-4000-8000-000000000001', 'follow', '👋 New Follower', 'Sarah Akinyi started following your store Urban Nest Furniture.', 'user-plus', true, null),
  ('a0000000-0000-4000-8000-000000000003', 'booking', '✅ Service Booked', 'Your booking with QuickFix Plumbers has been confirmed for tomorrow.', 'calendar-check', true, null)
on conflict do nothing;

-- ============================================================
-- 21. CONVERSATIONS & MESSAGES
-- ============================================================
-- Create conversations
insert into public.conversations (id, created_at, updated_at) values
  ('20000000-0000-4000-8000-000000000001', '2024-06-15T10:00:00Z', '2024-06-15T14:31:00Z'),
  ('20000000-0000-4000-8000-000000000002', '2024-06-14T09:00:00Z', '2024-06-14T16:00:00Z'),
  ('20000000-0000-4000-8000-000000000003', '2024-06-13T10:00:00Z', '2024-06-13T11:00:00Z')
on conflict (id) do nothing;

-- Add participants
insert into public.conversation_participants (conversation_id, user_id) values
  ('20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002')
on conflict (conversation_id, user_id) do nothing;

-- Add messages
insert into public.messages (conversation_id, sender_id, text, read, created_at) values
  ('20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Hi Grace! I''m interested in the Modern 2-Bedroom Apartment in Westlands.', true, '2024-06-15T10:00:00Z'),
  ('20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'Hello James! Great choice. What would you like to know?', true, '2024-06-15T10:15:00Z'),
  ('20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Is the apartment still available? And can I schedule a viewing this weekend?', true, '2024-06-15T12:00:00Z'),
  ('20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'Yes, the apartment is still available. Would you like to schedule a viewing?', false, '2024-06-15T14:30:00Z'),
  ('20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'I''m free on Saturday morning if that works for you!', false, '2024-06-15T14:31:00Z'),
  ('20000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Hi Peter! I need an electrician to fix some wiring in my new place.', true, '2024-06-14T09:00:00Z'),
  ('20000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'Sure, I can help with that. What''s the issue?', true, '2024-06-14T09:30:00Z'),
  ('20000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'The living room lights keep flickering and one outlet stopped working.', true, '2024-06-14T10:00:00Z'),
  ('20000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'Sure, I can come by tomorrow afternoon to take a look.', true, '2024-06-14T16:00:00Z'),
  ('20000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Hey Sarah! How are you settling into your new place?', true, '2024-06-13T10:00:00Z'),
  ('20000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'Hey! The L-shaped sofa I bought from Urban Nest is amazing!', true, '2024-06-13T11:00:00Z')
on conflict do nothing;

-- ============================================================
-- 22. USER FAVORITES
-- ============================================================
insert into public.user_favorites (user_id, item_type, item_id) values
  ('a0000000-0000-4000-8000-000000000001', 'property', 'f0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000001', 'property', 'f0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000001', 'product', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000001', 'product', 'c0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000001', 'product', 'c0000000-0000-4000-8000-000000000006'),
  ('a0000000-0000-4000-8000-000000000001', 'product', 'c0000000-0000-4000-8000-00000000000a'),
  ('a0000000-0000-4000-8000-000000000001', 'post', '10000000-0000-4000-8000-000000000004'),
  ('a0000000-0000-4000-8000-000000000001', 'post', '10000000-0000-4000-8000-000000000006'),
  ('a0000000-0000-4000-8000-000000000002', 'property', 'f0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000002', 'product', 'c0000000-0000-4000-8000-000000000005'),
  ('a0000000-0000-4000-8000-000000000002', 'product', 'c0000000-0000-4000-8000-000000000008'),
  ('a0000000-0000-4000-8000-000000000002', 'post', '10000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000003', 'property', 'f0000000-0000-4000-8000-000000000004'),
  ('a0000000-0000-4000-8000-000000000003', 'product', 'c0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000003', 'post', '10000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000003', 'post', '10000000-0000-4000-8000-000000000005'),
  ('a0000000-0000-4000-8000-000000000004', 'property', 'f0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000004', 'product', 'c0000000-0000-4000-8000-000000000007'),
  ('a0000000-0000-4000-8000-000000000004', 'product', 'c0000000-0000-4000-8000-000000000009'),
  ('a0000000-0000-4000-8000-000000000004', 'post', '10000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000005', 'product', 'c0000000-0000-4000-8000-000000000006'),
  ('a0000000-0000-4000-8000-000000000006', 'property', 'f0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000006', 'product', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000006', 'product', 'c0000000-0000-4000-8000-00000000000a'),
  ('a0000000-0000-4000-8000-000000000006', 'post', '10000000-0000-4000-8000-000000000006')
on conflict (user_id, item_type, item_id) do nothing;
