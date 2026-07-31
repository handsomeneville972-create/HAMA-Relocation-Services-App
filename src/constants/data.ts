import { Product, Seller, ServiceProvider, CommunityPost, Property, PropertyReview, Neighborhood, SubscriptionPlan, Notification, User, Landlord } from './types';

// ============ USERS ============

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'James Mwangi', email: 'james@example.com', emailVerified: true, phone: '+254712345678', phoneVerified: true, avatar: 'https://i.pravatar.cc/150?u=james', role: 'seller', verified: true, verificationLevel: 'full', joinDate: '2024-01-15', lastLoginAt: '2024-06-15T10:00:00Z' },
  { id: 'u2', name: 'Sarah Akinyi', email: 'sarah@example.com', emailVerified: true, phone: '+254723456789', phoneVerified: true, avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'seeker', verified: true, verificationLevel: 'full', joinDate: '2024-03-20', lastLoginAt: '2024-06-14T09:00:00Z' },
  { id: 'u3', name: 'Peter Kamau', email: 'peter@example.com', emailVerified: true, phone: undefined, phoneVerified: false, avatar: 'https://i.pravatar.cc/150?u=peter', role: 'service_provider', verified: true, verificationLevel: 'email', joinDate: '2024-02-10', lastLoginAt: '2024-06-13T15:00:00Z' },
  { id: 'u4', name: 'Grace Wanjiku', email: 'grace@example.com', emailVerified: true, phone: '+254734567890', phoneVerified: true, avatar: 'https://i.pravatar.cc/150?u=grace', role: 'landlord', verified: true, verificationLevel: 'full', joinDate: '2023-11-05', lastLoginAt: '2024-06-15T08:00:00Z' },
  { id: 'u5', name: 'David Ochieng', email: 'david@example.com', emailVerified: false, phone: undefined, phoneVerified: false, avatar: 'https://i.pravatar.cc/150?u=david', role: 'seeker', verified: false, verificationLevel: 'unverified', joinDate: '2024-06-01', lastLoginAt: undefined },
  { id: 'u6', name: 'Faith Njeri', email: 'faith@example.com', emailVerified: true, phone: '+254745678901', phoneVerified: true, avatar: 'https://i.pravatar.cc/150?u=faith', role: 'seller', verified: true, verificationLevel: 'id', joinDate: '2024-04-18', lastLoginAt: '2024-06-12T11:00:00Z' },
];

// ============ SELLERS ============

export const MOCK_SELLERS: Seller[] = [
  {
    id: 's1', name: 'Urban Nest Furniture', logo: 'https://i.pravatar.cc/150?u=urbannest', banner: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200',
    description: 'Premium furniture for modern African homes. We source the finest materials to bring you comfort and style.',
    location: 'Nairobi, Kenya', contact: '+254 712 345 678', rating: 4.8, reviewCount: 234, followers: 1560, joinedDate: '2023-06-15', verified: true,
    products: [],
  },
  {
    id: 's2', name: 'Tech Haven KE', logo: 'https://i.pravatar.cc/150?u=techhaven', banner: 'https://images.unsplash.com/photo-1468495244123-6c4c332eeece?w=1200',
    description: 'Your one-stop shop for electronics and gadgets. Quality guaranteed with warranty on all products.',
    location: 'Nairobi, Kenya', contact: '+254 723 456 789', rating: 4.6, reviewCount: 189, followers: 980, joinedDate: '2023-08-20', verified: true,
    products: [],
  },
  {
    id: 's3', name: 'Home Essentials', logo: 'https://i.pravatar.cc/150?u=homeessentials', banner: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1200',
    description: 'Everything you need to make your house a home. Affordable prices, premium quality.',
    location: 'Nairobi, Kenya', contact: '+254 734 567 890', rating: 4.7, reviewCount: 312, followers: 2100, joinedDate: '2023-04-10', verified: true,
    products: [],
  },
];

// ============ PRODUCTS ============

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Modern L-Shaped Sofa', description: 'Premium fabric L-shaped sofa with memory foam cushions. Perfect for modern living rooms. Features include removable covers, sturdy wooden frame, and elegant design.', price: 85000, originalPrice: 110000,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600', 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600'],
    category: 'Furniture', subcategory: 'Sofas', condition: 'New', seller: MOCK_SELLERS[0], rating: 4.8, reviewCount: 56, location: 'Nairobi', featured: true, createdAt: '2024-06-01',
  },
  {
    id: 'p2', name: 'King Size Bed Frame', description: 'Elegant king-size bed frame with storage drawers. Solid wood construction with premium finish.', price: 65000, originalPrice: 80000,
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600', 'https://images.unsplash.com/photo-1505692952047-1a78307d0e5b?w=600'],
    category: 'Furniture', subcategory: 'Beds', condition: 'New', seller: MOCK_SELLERS[0], rating: 4.9, reviewCount: 42, location: 'Nairobi', featured: true, createdAt: '2024-05-28',
  },
  {
    id: 'p3', name: '55" 4K Smart TV', description: 'Ultra HD Smart TV with built-in streaming apps, voice control, and stunning picture quality.', price: 95000, originalPrice: 120000,
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600', 'https://images.unsplash.com/photo-1468495244123-6c4c332eeece?w=600'],
    category: 'Appliances', subcategory: 'TVs', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.7, reviewCount: 89, location: 'Nairobi', featured: true, createdAt: '2024-06-10',
  },
  {
    id: 'p4', name: 'Double Door Refrigerator', description: 'Energy-efficient double-door refrigerator with smart cooling technology and spacious interior.', price: 78000,
    images: ['https://images.unsplash.com/photo-1571175443880-49e1d45b2b2e?w=600'],
    category: 'Appliances', subcategory: 'Refrigerators', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.6, reviewCount: 34, location: 'Nairobi', featured: false, createdAt: '2024-06-05',
  },
  {
    id: 'p5', name: 'Premium Curtain Set', description: 'Set of 4 premium blackout curtains with thermal insulation. Multiple colors available.', price: 8500,
    images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'],
    category: 'Household Items', subcategory: 'Curtains', condition: 'New', seller: MOCK_SELLERS[2], rating: 4.5, reviewCount: 67, location: 'Nairobi', featured: false, createdAt: '2024-06-08',
  },
  {
    id: 'p6', name: 'Gaming Laptop Pro', description: 'High-performance gaming laptop with RTX graphics, 16GB RAM, and 1TB SSD.', price: 145000,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    category: 'Electronics', subcategory: 'Laptops', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.9, reviewCount: 23, location: 'Nairobi', featured: true, createdAt: '2024-06-12',
  },
  {
    id: 'p7', name: 'Dining Table Set 6-Seater', description: 'Elegant 6-seater dining table set with tempered glass top and premium leather chairs.', price: 55000,
    images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600'],
    category: 'Furniture', subcategory: 'Dining Tables', condition: 'New', seller: MOCK_SELLERS[0], rating: 4.7, reviewCount: 38, location: 'Nairobi', featured: false, createdAt: '2024-05-20',
  },
  {
    id: 'p8', name: 'Automatic Washing Machine', description: 'Front-load automatic washing machine with 10kg capacity and multiple wash programs.', price: 52000,
    images: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600'],
    category: 'Appliances', subcategory: 'Washing Machines', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.5, reviewCount: 45, location: 'Nairobi', featured: false, createdAt: '2024-06-02',
  },
  {
    id: 'p9', name: 'Office Desk with Drawers', description: 'Spacious office desk with multiple storage drawers and cable management system.', price: 28000,
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600'],
    category: 'Furniture', subcategory: 'Office Desks', condition: 'New', seller: MOCK_SELLERS[2], rating: 4.6, reviewCount: 29, location: 'Nairobi', featured: false, createdAt: '2024-06-06',
  },
  {
    id: 'p10', name: 'Memory Foam Mattress', description: 'Premium memory foam mattress with cooling gel layer. Medium firmness for optimal comfort.', price: 45000, originalPrice: 58000,
    images: ['https://images.unsplash.com/photo-1505693416385-ac8ce068fe85?w=600'],
    category: 'Furniture', subcategory: 'Mattresses', condition: 'New', seller: MOCK_SELLERS[0], rating: 4.8, reviewCount: 91, location: 'Nairobi', featured: true, createdAt: '2024-06-11',
  },
  // Home Essentials — expanded category
  {
    id: 'p11', name: 'Premium Bedding Set', description: 'Luxury 6-piece bedding set including fitted sheet, duvet cover, and pillowcases.', price: 6500, originalPrice: 8500,
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'],
    category: 'Home Essentials', subcategory: 'Bedding', condition: 'New', seller: MOCK_SELLERS[2], rating: 4.6, reviewCount: 78, location: 'Nairobi', featured: false, createdAt: '2024-06-07',
  },
  {
    id: 'p12', name: 'Complete Kitchen Set', description: '20-piece kitchen utensil set including pots, pans, and cooking utensils.', price: 12000,
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'],
    category: 'Home Essentials', subcategory: 'Kitchenware', condition: 'New', seller: MOCK_SELLERS[2], rating: 4.7, reviewCount: 56, location: 'Nairobi', featured: false, createdAt: '2024-06-03',
  },
  {
    id: 'p13', name: 'Plastic Storage Boxes 4-Pack', description: 'Stackable storage boxes with lids. Perfect for organizing your home.', price: 3200,
    images: ['https://images.unsplash.com/photo-1586105530157-5e138c0c018f?w=600'],
    category: 'Home Essentials', subcategory: 'Storage Boxes', condition: 'New', seller: MOCK_SELLERS[2], rating: 4.4, reviewCount: 112, location: 'Nairobi', featured: false, createdAt: '2024-06-06',
  },
  // Utilities — new category
  {
    id: 'p14', name: '500L Water Tank', description: 'High-quality 500-liter polyethylene water tank with lid and outlet valve.', price: 8500,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600'],
    category: 'Utilities', subcategory: 'Water Tanks', condition: 'New', seller: MOCK_SELLERS[0], rating: 4.5, reviewCount: 67, location: 'Nairobi', featured: false, createdAt: '2024-06-04',
  },
  {
    id: 'p15', name: '300W Solar Panel Kit', description: 'Complete solar panel system with inverter, battery, and LED bulbs. Perfect for backup power.', price: 45000,
    images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600'],
    category: 'Utilities', subcategory: 'Solar Systems', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.8, reviewCount: 45, location: 'Nairobi', featured: true, createdAt: '2024-06-09',
  },
  {
    id: 'p16', name: '2000W Power Inverter', description: 'Pure sine wave inverter with surge protection. Ideal for home backup.', price: 22000,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600'],
    category: 'Utilities', subcategory: 'Inverters', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.6, reviewCount: 34, location: 'Nairobi', featured: false, createdAt: '2024-06-08',
  },
  {
    id: 'p17', name: '5.5kVA Petrol Generator', description: 'Reliable generator for home backup power. Quiet operation and fuel-efficient.', price: 65000, originalPrice: 75000,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600'],
    category: 'Utilities', subcategory: 'Generators', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.7, reviewCount: 89, location: 'Nairobi', featured: true, createdAt: '2024-06-07',
  },
  // Student Starter Packs — new category
  {
    id: 'p18', name: 'Student Starter Kit', description: 'Everything a first-time renter needs: mattress, curtain, gas cooker, utensils, and bedding.', price: 25000,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
    category: 'Student Starter Packs', subcategory: 'Starter Kits', condition: 'New', seller: MOCK_SELLERS[2], rating: 4.6, reviewCount: 156, location: 'Nairobi', featured: true, createdAt: '2024-06-01',
  },
  {
    id: 'p19', name: 'Dorm Room Bundle', description: 'Complete dorm essentials including bedding, desk lamp, storage boxes, and laundry basket.', price: 8500,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
    category: 'Student Starter Packs', subcategory: 'Dorm Essentials', condition: 'New', seller: MOCK_SELLERS[2], rating: 4.5, reviewCount: 89, location: 'Nairobi', featured: false, createdAt: '2024-05-30',
  },
  // Appliances — expanded with new subcategories
  {
    id: 'p20', name: 'Water Dispenser (Hot & Cold)', description: 'Top-loading water dispenser with hot and cold settings. Ideal for home and office.', price: 15000,
    images: ['https://images.unsplash.com/photo-1571175443880-49e1d45b2b2e?w=600'],
    category: 'Appliances', subcategory: 'Water Dispensers', condition: 'New', seller: MOCK_SELLERS[2], rating: 4.5, reviewCount: 67, location: 'Nairobi', featured: false, createdAt: '2024-06-05',
  },
  {
    id: 'p21', name: 'Split Air Conditioner 1.5HP', description: 'Energy-efficient split AC with cooling and heating. Perfect for bedrooms and small living rooms.', price: 55000,
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600'],
    category: 'Appliances', subcategory: 'Air Conditioners', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.6, reviewCount: 78, location: 'Nairobi', featured: true, createdAt: '2024-06-10',
  },
  // Electronics — expanded with new subcategories
  {
    id: 'p22', name: 'WiFi 6 Router', description: 'High-speed dual-band router with mesh support. Covers up to 200 sqm.', price: 8500,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    category: 'Electronics', subcategory: 'Routers', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.7, reviewCount: 123, location: 'Nairobi', featured: false, createdAt: '2024-06-06',
  },
  {
    id: 'p23', name: '4-Camera CCTV System', description: 'Complete 4-camera security system with DVR, night vision, and mobile app access.', price: 35000,
    images: ['https://images.unsplash.com/photo-1558002038-1055907df827?w=600'],
    category: 'Electronics', subcategory: 'CCTV', condition: 'New', seller: MOCK_SELLERS[1], rating: 4.6, reviewCount: 89, location: 'Nairobi', featured: true, createdAt: '2024-06-04',
  },
];

// Link products to sellers
MOCK_SELLERS[0].products = MOCK_PRODUCTS.filter(p => p.seller.id === 's1');
MOCK_SELLERS[1].products = MOCK_PRODUCTS.filter(p => p.seller.id === 's2');
MOCK_SELLERS[2].products = MOCK_PRODUCTS.filter(p => p.seller.id === 's3');

// ============ SERVICE PROVIDERS ============

export const MOCK_SERVICE_PROVIDERS: ServiceProvider[] = [
  // Relocation
  { id: 'sp1', name: 'Hamisha Movers', logo: 'https://i.pravatar.cc/150?u=hamisha', banner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', description: 'Professional relocation and moving services across Kenya. We make moving easy!', category: 'Relocation', subcategory: 'Hamisha Squad', location: 'Nairobi', rating: 4.8, reviewCount: 423, verified: true, pricing: 'From KSh 5,000', responseTime: '< 1 hr', availability: 'Mon-Sat 6AM-8PM', phone: '+254 712 345 678', email: 'hello@hamishamovers.co.ke' },
  { id: 'sp2', name: 'SafeMove Packers', logo: 'https://i.pravatar.cc/150?u=safemove', banner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', description: 'Expert packing and moving services. Fragile items handled with care.', category: 'Relocation', subcategory: 'Packers', location: 'Nairobi', rating: 4.6, reviewCount: 189, verified: true, pricing: 'KSh 3,000/hr', responseTime: '< 2 hrs', availability: 'Daily 6AM-6PM', phone: '+254 723 456 789', email: 'info@safemove.co.ke' },
  // Home Maintenance
  { id: 'sp3', name: 'QuickFix Plumbers', logo: 'https://i.pravatar.cc/150?u=quickfix', banner: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200', description: 'Professional plumbing services for residential and commercial properties. Available 24/7 for emergencies.', category: 'Home Maintenance', subcategory: 'Plumbers', location: 'Nairobi', rating: 4.7, reviewCount: 156, verified: true, pricing: 'KSh 1,500/hr', responseTime: '< 30 min', availability: '24/7', phone: '+254 734 567 890', email: 'info@quickfix.co.ke' },
  { id: 'sp4', name: 'SparkPro Electricians', logo: 'https://i.pravatar.cc/150?u=sparkpro', banner: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200', description: 'Certified electricians for installations, repairs, and inspections. Safety guaranteed.', category: 'Home Maintenance', subcategory: 'Electricians', location: 'Nairobi', rating: 4.8, reviewCount: 203, verified: true, pricing: 'KSh 1,800/hr', responseTime: '< 45 min', availability: 'Mon-Sat 7AM-8PM', phone: '+254 745 678 901', email: 'hello@sparkpro.co.ke' },
  { id: 'sp5', name: 'Master Painters', logo: 'https://i.pravatar.cc/150?u=masterpaint', banner: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1200', description: 'Professional painting services for interiors and exteriors. Premium finishes guaranteed.', category: 'Home Maintenance', subcategory: 'Painters', location: 'Nairobi', rating: 4.7, reviewCount: 198, verified: true, pricing: 'KSh 2,500/hr', responseTime: '< 1 hr', availability: 'Mon-Sat 7AM-6PM', phone: '+254 756 789 012', email: 'info@masterpainters.co.ke' },
  { id: 'sp6', name: 'Crafty Carpenters', logo: 'https://i.pravatar.cc/150?u=carpenter', banner: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200', description: 'Custom furniture, cabinets, and home woodwork. Quality craftsmanship guaranteed.', category: 'Home Maintenance', subcategory: 'Carpenters', location: 'Nairobi', rating: 4.6, reviewCount: 145, verified: true, pricing: 'KSh 2,000/hr', responseTime: '< 2 hrs', availability: 'Mon-Sat 8AM-6PM', phone: '+254 767 890 123', email: 'info@craftycarpenters.co.ke' },
  { id: 'sp7', name: 'Steel Master Welders', logo: 'https://i.pravatar.cc/150?u=welder', banner: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200', description: 'Professional welding services for gates, railings, and metal structures.', category: 'Home Maintenance', subcategory: 'Welders', location: 'Nairobi', rating: 4.5, reviewCount: 98, verified: true, pricing: 'KSh 1,800/hr', responseTime: '< 3 hrs', availability: 'Mon-Sat 8AM-6PM', phone: '+254 778 901 234', email: 'info@steelmaster.co.ke' },
  // Cleaning
  { id: 'sp8', name: 'Elite Cleaners', logo: 'https://i.pravatar.cc/150?u=elitecleaners', banner: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200', description: 'Deep cleaning services for homes and offices. Eco-friendly products used.', category: 'Cleaning', subcategory: 'Deep Cleaning', location: 'Nairobi', rating: 4.9, reviewCount: 312, verified: true, pricing: 'KSh 3,000/session', responseTime: '< 1 hr', availability: 'Daily 6AM-6PM', phone: '+254 789 012 345', email: 'book@elitecleaners.co.ke' },
  { id: 'sp9', name: 'FreshZone Pest Control', logo: 'https://i.pravatar.cc/150?u=pestcontrol', banner: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200', description: 'Comprehensive pest control services for homes and businesses. Safe and effective treatments.', category: 'Cleaning', subcategory: 'Pest Control', location: 'Nairobi', rating: 4.4, reviewCount: 167, verified: true, pricing: 'From KSh 3,500', responseTime: '< 2 hrs', availability: 'Mon-Sat 7AM-7PM', phone: '+254 790 123 456', email: 'info@freshzone.co.ke' },
  { id: 'sp19', name: 'Sparkle House Cleaners', logo: 'https://i.pravatar.cc/150?u=sparkle', banner: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200', description: 'Regular house cleaning and maintenance services. Reliable, thorough, and affordable.', category: 'Cleaning', subcategory: 'House Cleaners', location: 'Nairobi', rating: 4.6, reviewCount: 234, verified: true, pricing: 'KSh 1,500/session', responseTime: '< 2 hrs', availability: 'Daily 6AM-6PM', phone: '+254 701 111 222', email: 'hello@sparklecleaners.co.ke' },
  { id: 'sp20', name: 'FreshFold Laundry', logo: 'https://i.pravatar.cc/150?u=freshfold', banner: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200', description: 'Professional laundry and dry cleaning services with free pickup and delivery.', category: 'Cleaning', subcategory: 'Laundry Services', location: 'Nairobi', rating: 4.5, reviewCount: 345, verified: true, pricing: 'From KSh 500/kg', responseTime: '< 3 hrs', availability: 'Daily 8AM-8PM', phone: '+254 702 222 333', email: 'info@freshfold.co.ke' },
  // Technology
  { id: 'sp10', name: 'SafeNet CCTV', logo: 'https://i.pravatar.cc/150?u=safenet', banner: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200', description: 'Professional CCTV installation and smart home security solutions.', category: 'Technology', subcategory: 'CCTV Installers', location: 'Nairobi', rating: 4.6, reviewCount: 134, verified: true, pricing: 'From KSh 8,000', responseTime: '< 1 hr', availability: 'Mon-Sat 8AM-7PM', phone: '+254 701 234 567', email: 'sales@safenet.co.ke' },
  { id: 'sp11', name: 'FibreKE Internet', logo: 'https://i.pravatar.cc/150?u=fibreke', banner: 'https://images.unsplash.com/photo-1468495244123-6c4c332eeece?w=1200', description: 'High-speed fibre optic internet installation and WiFi setup for homes and offices.', category: 'Technology', subcategory: 'WiFi Installation', location: 'Nairobi', rating: 4.5, reviewCount: 234, verified: true, pricing: 'From KSh 3,000', responseTime: '< 4 hrs', availability: 'Mon-Sat 8AM-8PM', phone: '+254 712 345 678', email: 'sales@fibreke.co.ke' },
  { id: 'sp12', name: 'Smart Home Solutions', logo: 'https://i.pravatar.cc/150?u=smarthome', banner: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200', description: 'Complete smart home automation including lighting, security, and entertainment systems.', category: 'Technology', subcategory: 'Smart Home Setup', location: 'Nairobi', rating: 4.7, reviewCount: 89, verified: true, pricing: 'From KSh 15,000', responseTime: '< 2 hrs', availability: 'Mon-Fri 9AM-6PM', phone: '+254 723 456 789', email: 'info@smarthomesolutions.co.ke' },
  // Construction & Home Improvement
  { id: 'sp13', name: 'BuildRight Contractors', logo: 'https://i.pravatar.cc/150?u=buildright', banner: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200', description: 'General contracting for home construction, renovations, and extensions.', category: 'Construction', subcategory: 'Contractors', location: 'Nairobi', rating: 4.6, reviewCount: 178, verified: true, pricing: 'Project-based', responseTime: '< 3 hrs', availability: 'Mon-Sat 7AM-6PM', phone: '+254 734 567 890', email: 'info@buildright.co.ke' },
  { id: 'sp21', name: 'Skyline Architects', logo: 'https://i.pravatar.cc/150?u=skylinearch', banner: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200', description: 'Innovative architectural design for residential and commercial projects. Specializing in modern African architecture.', category: 'Construction', subcategory: 'Architects', location: 'Nairobi', rating: 4.8, reviewCount: 67, verified: true, pricing: 'From KSh 10,000/hr', responseTime: '< 4 hrs', availability: 'Mon-Fri 8AM-5PM', phone: '+254 703 333 444', email: 'studio@skylinearchitects.co.ke' },
  { id: 'sp14', name: 'DesignHome Interiors', logo: 'https://i.pravatar.cc/150?u=designhome', banner: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200', description: 'Award-winning interior designers creating beautiful spaces for modern living.', category: 'Home Improvement', subcategory: 'Interior Designers', location: 'Nairobi', rating: 4.9, reviewCount: 87, verified: true, pricing: 'KSh 5,000/hr', responseTime: '< 2 hrs', availability: 'Mon-Fri 9AM-5PM', phone: '+254 745 678 901', email: 'studio@designhome.co.ke' },
  { id: 'sp15', name: 'SpaceMax Renovators', logo: 'https://i.pravatar.cc/150?u=renovator', banner: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1200', description: 'Home renovation specialists for kitchens, bathrooms, and complete home makeovers.', category: 'Home Improvement', subcategory: 'Renovators', location: 'Nairobi', rating: 4.5, reviewCount: 156, verified: true, pricing: 'Project-based', responseTime: '< 2 hrs', availability: 'Mon-Sat 7AM-6PM', phone: '+254 756 789 012', email: 'info@spacemax.co.ke' },
  // Household
  { id: 'sp16', name: 'CareLink Nannies', logo: 'https://i.pravatar.cc/150?u=carelink', banner: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200', description: 'Trusted nanny placement agency. All caregivers are vetted, trained, and insured.', category: 'Household', subcategory: 'Nannies', location: 'Nairobi', rating: 4.7, reviewCount: 267, verified: true, pricing: 'From KSh 1,500/hr', responseTime: '< 24 hrs', availability: 'Bookings required', phone: '+254 767 890 123', email: 'hello@carelink.co.ke' },
  { id: 'sp17', name: 'GreenScape Gardeners', logo: 'https://i.pravatar.cc/150?u=greenscape', banner: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=1200', description: 'Professional gardening and landscaping services for residential and commercial properties.', category: 'Household', subcategory: 'Gardeners', location: 'Nairobi', rating: 4.5, reviewCount: 123, verified: true, pricing: 'KSh 1,200/hr', responseTime: '< 2 hrs', availability: 'Mon-Sat 6AM-6PM', phone: '+254 778 901 234', email: 'info@greenscape.co.ke' },
  { id: 'sp18', name: 'SecureGuard Services', logo: 'https://i.pravatar.cc/150?u=secureguard', banner: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200', description: 'Professional security guard services for residences, estates, and commercial properties.', category: 'Household', subcategory: 'Security Guards', location: 'Nairobi', rating: 4.4, reviewCount: 345, verified: true, pricing: 'From KSh 35,000/mo', responseTime: '< 1 hr', availability: '24/7', phone: '+254 789 012 345', email: 'info@secureguard.co.ke' },
];

// ============ COMMUNITY POSTS ============

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  { id: 'c1', user: MOCK_USERS[0], type: 'photo', content: 'Just finished setting up my new living room! The L-shaped sofa from Urban Nest is absolutely stunning. Love how it turned out! 🛋️✨', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', likes: 245, comments: 34, shares: 12, bookmarks: 56, views: 1284, isLiked: false, isBookmarked: false, createdAt: '2024-06-15T10:30:00Z', tags: ['interiordesign', 'homesetup', 'furniture'] },
  { id: 'c2', user: MOCK_USERS[2], type: 'tip', content: 'Pro tip: Always check the water pressure before renting a house. Low pressure can be a nightmare! Here\'s how to test it with a simple bottle method. 🚿', likes: 567, comments: 89, shares: 234, bookmarks: 178, views: 3420, isLiked: false, isBookmarked: false, createdAt: '2024-06-14T15:45:00Z', tags: ['housingtips', 'renting', 'diytips'] },
  { id: 'c3', user: MOCK_USERS[1], type: 'video', content: 'Neighborhood tour of Westlands, Nairobi - the ultimate guide for young professionals looking to relocate! 🏙️', video: 'https://www.w3schools.com/html/mov_bbb.mp4', likes: 892, comments: 145, shares: 67, bookmarks: 234, views: 5210, isLiked: true, isBookmarked: false, createdAt: '2024-06-13T09:20:00Z', tags: ['neighborhoodguide', 'nairobi', 'relocation'] },
  { id: 'c4', user: MOCK_USERS[4], type: 'experience', content: 'My experience moving from Kisumu to Nairobi for work. The Hamisha Squad made it so easy! Here\'s everything you need to know about relocating. 🚚', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', likes: 423, comments: 67, shares: 89, bookmarks: 145, views: 2310, isLiked: false, isBookmarked: true, createdAt: '2024-06-12T14:00:00Z', tags: ['relocation', 'experience', 'hamishasquad'] },
  { id: 'c5', user: MOCK_USERS[5], type: 'review', content: 'Just reviewed my neighborhood in Kilimani. Overall rating: 4.5/5 - Great security, excellent amenities, and fantastic restaurants nearby! ⭐', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', likes: 178, comments: 45, shares: 23, bookmarks: 67, views: 987, isLiked: false, isBookmarked: false, createdAt: '2024-06-11T11:15:00Z', tags: ['neighborhoodreview', 'kilimani', 'nairobi'] },
  { id: 'c6', user: MOCK_USERS[3], type: 'advice', content: 'Student housing tips: 5 things I wish I knew before renting near the university. Save money and avoid common mistakes! 🎓', likes: 678, comments: 156, shares: 345, bookmarks: 267, views: 4100, isLiked: true, isBookmarked: true, createdAt: '2024-06-10T08:30:00Z', tags: ['studenthousing', 'tips', 'university'] },
];

// ============ LANDLORD ============

const MOCK_LANDLORD: Landlord = {
  id: 'u4',
  name: 'Grace Wanjiku',
  avatar: 'https://i.pravatar.cc/150?u=grace',
  verified: true,
  responseRate: '98%',
  properties: 4,
};

// ============ PROPERTIES ============

export const MOCK_PROPERTIES: Property[] = [
  { id: 'pr1', title: 'Modern 2-Bedroom Apartment in Westlands', description: 'Beautiful modern apartment with stunning city views. Open-plan living, fully fitted kitchen, and spacious balcony.', price: 45000, images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'], bedrooms: 2, bathrooms: 2, size: 85, location: 'Westlands, Nairobi', landlord: MOCK_LANDLORD, rating: 4.6, reviewCount: 28, amenities: ['Parking', 'Gym', 'Security', 'Water Tank', 'Generator'], furnished: true, available: true },
  { id: 'pr2', title: 'Cozy 1-Bedroom in Kilimani', description: 'Charming ground-floor apartment with private garden. Perfect for young professionals. Walking distance to malls and restaurants.', price: 28000, images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'], bedrooms: 1, bathrooms: 1, size: 55, location: 'Kilimani, Nairobi', landlord: MOCK_LANDLORD, rating: 4.4, reviewCount: 15, amenities: ['Security', 'Water', 'Parking'], furnished: true, available: true },
  { id: 'pr3', title: 'Spacious 3-Bedroom House in Lavington', description: 'Family home with large compound, servant quarters, and beautiful garden. Quiet neighborhood with excellent security.', price: 85000, images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'], bedrooms: 3, bathrooms: 3, size: 150, location: 'Lavington, Nairobi', landlord: MOCK_LANDLORD, rating: 4.8, reviewCount: 42, amenities: ['Parking', 'Garden', 'Security', 'Servant Quarters', 'Water Tank', 'Generator', 'CCTV'], furnished: false, available: true },
  { id: 'pr4', title: 'Student Studio near University of Nairobi', description: 'Affordable studio apartment walking distance to main campus. Ideal for students. All utilities included.', price: 12000, images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600'], bedrooms: 0, bathrooms: 1, size: 25, location: 'Ngara, Nairobi', landlord: MOCK_LANDLORD, rating: 4.2, reviewCount: 38, amenities: ['Water', 'Electricity', 'Security', 'WiFi'], furnished: true, available: true },
];

// ============ PROPERTY REVIEWS ============

export const MOCK_PROPERTY_REVIEWS: PropertyReview[] = [
  { id: 'prv1', propertyId: 'pr1', user: MOCK_USERS[0], rating: 4.5, security: 5, cleanliness: 4, accessibility: 4, amenities: 5, valueForMoney: 4, content: 'Great apartment in a prime location. The security is excellent and the amenities are top-notch. Would definitely recommend!', createdAt: '2024-06-10', helpful: 23 },
  { id: 'prv2', propertyId: 'pr1', user: MOCK_USERS[4], rating: 4, security: 4, cleanliness: 5, accessibility: 3, amenities: 4, valueForMoney: 4, content: 'Good value for money. The gym and security are great. Parking can be tight sometimes.', createdAt: '2024-06-08', helpful: 12 },
  { id: 'prv3', propertyId: 'pr3', user: MOCK_USERS[5], rating: 5, security: 5, cleanliness: 5, accessibility: 4, amenities: 5, valueForMoney: 5, content: 'Beautiful family home! The garden is perfect for kids. Very secure neighborhood.', createdAt: '2024-06-05', helpful: 45 },
  { id: 'prv4', propertyId: 'pr4', user: MOCK_USERS[1], rating: 4, security: 3, cleanliness: 4, accessibility: 5, amenities: 4, valueForMoney: 5, content: 'Perfect for a student. Affordable and close to campus. The WiFi is reliable.', createdAt: '2024-06-01', helpful: 34 },
];

// ============ NEIGHBORHOODS ============

export const MOCK_NEIGHBORHOODS: Neighborhood[] = [
  // ====== Premium Areas ======
  { id: 'n1', name: 'Westlands', city: 'Nairobi', description: 'Upscale business district with excellent amenities, restaurants, and nightlife.', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', rating: 4.5, security: 4, amenities: 5, transport: 4, avgRent: 55000, propertyCount: 234, reviews: 567 },
  { id: 'n2', name: 'Kilimani', city: 'Nairobi', description: 'Popular residential area with great schools, malls, and restaurants.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 4.3, security: 4, amenities: 4, transport: 3, avgRent: 40000, propertyCount: 189, reviews: 423 },
  { id: 'n3', name: 'Lavington', city: 'Nairobi', description: 'Quiet, leafy suburb popular with families. Excellent security and large homes.', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', rating: 4.7, security: 5, amenities: 4, transport: 3, avgRent: 80000, propertyCount: 145, reviews: 345 },
  { id: 'n4', name: 'Ngara', city: 'Nairobi', description: 'Affordable area popular with students. Walking distance to major universities.', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', rating: 3.8, security: 3, amenities: 3, transport: 5, avgRent: 15000, propertyCount: 312, reviews: 678 },
  { id: 'n5', name: 'Karen', city: 'Nairobi', description: 'Expansive leafy suburb with large homes, wildlife, and premium shopping. One of Nairobi most affluent areas.', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', rating: 4.8, security: 5, amenities: 4, transport: 2, avgRent: 120000, propertyCount: 198, reviews: 432 },
  { id: 'n6', name: 'Runda', city: 'Nairobi', description: 'Exclusive gated community popular with diplomats and executives. Top-tier security.', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600', rating: 4.9, security: 5, amenities: 5, transport: 3, avgRent: 150000, propertyCount: 112, reviews: 289 },
  { id: 'n7', name: 'Muthaiga', city: 'Nairobi', description: 'Prestigious neighborhood with embassies, golf club, and luxury homes.', image: 'https://images.unsplash.com/photo-1600566753086-00f18f6bae45?w=600', rating: 4.8, security: 5, amenities: 5, transport: 3, avgRent: 140000, propertyCount: 98, reviews: 234 },
  { id: 'n8', name: 'Kileleshwa', city: 'Nairobi', description: 'Trendy residential area popular with young professionals. Great restaurants and cafes.', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600', rating: 4.4, security: 4, amenities: 4, transport: 4, avgRent: 50000, propertyCount: 178, reviews: 389 },
  { id: 'n9', name: 'Riverside', city: 'Nairobi', description: 'Prime riverside location with luxury apartments, hotels, and excellent security.', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600', rating: 4.6, security: 5, amenities: 4, transport: 4, avgRent: 70000, propertyCount: 156, reviews: 312 },

  // ====== Middle-Income Areas ======
  { id: 'n10', name: 'South B', city: 'Nairobi', description: 'Established residential area close to city center. Good schools and amenities.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 4.0, security: 3, amenities: 4, transport: 4, avgRent: 25000, propertyCount: 267, reviews: 456 },
  { id: 'n11', name: 'South C', city: 'Nairobi', description: 'Peaceful residential area near Wilson Airport. Popular with middle-class families.', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', rating: 4.1, security: 4, amenities: 3, transport: 3, avgRent: 30000, propertyCount: 234, reviews: 378 },
  { id: 'n12', name: 'Langata', city: 'Nairobi', description: 'Sprawling suburb near Nairobi National Park. Popular with nature lovers.', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', rating: 4.2, security: 4, amenities: 3, transport: 3, avgRent: 35000, propertyCount: 289, reviews: 512 },
  { id: 'n13', name: 'Kasarani', city: 'Nairobi', description: 'Vibrant residential area with sports facilities, malls, and good transport links.', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', rating: 3.8, security: 3, amenities: 3, transport: 4, avgRent: 18000, propertyCount: 345, reviews: 567 },
  { id: 'n14', name: 'Roysambu', city: 'Nairobi', description: 'Growing residential area near Thika Road. Modern apartments and shopping centers.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 3.9, security: 3, amenities: 3, transport: 4, avgRent: 20000, propertyCount: 312, reviews: 445 },
  { id: 'n15', name: 'Ruaka', city: 'Nairobi', description: 'Rapidly developing area with modern apartments and excellent shopping at Two Rivers Mall.', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', rating: 4.0, security: 3, amenities: 4, transport: 3, avgRent: 28000, propertyCount: 278, reviews: 389 },
  { id: 'n16', name: 'Syokimau', city: 'Nairobi', description: 'Popular residential area near JKIA airport. Good for frequent travelers.', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', rating: 3.9, security: 3, amenities: 3, transport: 4, avgRent: 22000, propertyCount: 198, reviews: 334 },
  { id: 'n17', name: 'Athi River', city: 'Nairobi', description: 'Industrial and residential area with affordable housing options.', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', rating: 3.5, security: 3, amenities: 2, transport: 3, avgRent: 15000, propertyCount: 267, reviews: 289 },
  { id: 'n18', name: 'Kitengela', city: 'Nairobi', description: 'Fast-growing satellite town with affordable housing and land for purchase.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 3.6, security: 3, amenities: 3, transport: 3, avgRent: 12000, propertyCount: 356, reviews: 423 },

  // ====== Affordable Areas ======
  { id: 'n19', name: 'Embakasi', city: 'Nairobi', description: 'Large residential area near JKIA. Diverse housing options from flats to bungalows.', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', rating: 3.4, security: 2, amenities: 3, transport: 4, avgRent: 10000, propertyCount: 456, reviews: 678 },
  { id: 'n20', name: 'Umoja', city: 'Nairobi', description: 'Established middle-income estate with good community amenities and schools.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 3.5, security: 3, amenities: 3, transport: 4, avgRent: 12000, propertyCount: 389, reviews: 534 },
  { id: 'n21', name: 'Donholm', city: 'Nairobi', description: 'Popular residential estate with easy access to city center and industrial area.', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', rating: 3.6, security: 3, amenities: 3, transport: 4, avgRent: 13000, propertyCount: 312, reviews: 445 },
  { id: 'n22', name: 'Pipeline', city: 'Nairobi', description: 'Bustling residential estate with vibrant local markets and transport links.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 3.2, security: 2, amenities: 3, transport: 4, avgRent: 8000, propertyCount: 423, reviews: 567 },
  { id: 'n23', name: 'Kayole', city: 'Nairobi', description: 'High-density residential estate with affordable housing and strong community feel.', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', rating: 3.0, security: 2, amenities: 2, transport: 3, avgRent: 7000, propertyCount: 512, reviews: 623 },
  { id: 'n24', name: 'Zimmerman', city: 'Nairobi', description: 'Growing residential area along Thika Road with modern apartments.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 3.5, security: 3, amenities: 3, transport: 4, avgRent: 14000, propertyCount: 267, reviews: 345 },
  { id: 'n25', name: 'Githurai', city: 'Nairobi', description: 'Lively residential area near Kenyatta University. Popular with students.', image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600', rating: 3.3, security: 2, amenities: 3, transport: 4, avgRent: 9000, propertyCount: 378, reviews: 489 },
  { id: 'n26', name: 'Kahawa West', city: 'Nairobi', description: 'Residential area near Kenyatta University with student-friendly housing options.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 3.4, security: 3, amenities: 3, transport: 4, avgRent: 10000, propertyCount: 298, reviews: 412 },
  { id: 'n27', name: 'Rongai', city: 'Nairobi', description: 'Sprawling satellite town with rapid development, affordable housing, and good schools.', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', rating: 3.7, security: 3, amenities: 3, transport: 3, avgRent: 16000, propertyCount: 412, reviews: 567 },

  // ====== Tier 1 Cities ======
  { id: 'n28', name: 'Nyali', city: 'Mombasa', description: 'Upscale coastal suburb with beautiful beaches, hotels, and premium residential areas.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', rating: 4.5, security: 4, amenities: 5, transport: 3, avgRent: 45000, propertyCount: 189, reviews: 345 },
  { id: 'n29', name: 'Milimani', city: 'Kisumu', description: 'Prime residential area in Kisumu with lake views, good security, and executive homes.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', rating: 4.3, security: 4, amenities: 4, transport: 3, avgRent: 35000, propertyCount: 156, reviews: 278 },
  { id: 'n30', name: 'Milimani', city: 'Nakuru', description: 'Prestigious residential area in Nakuru with gardens, good schools, and secure environment.', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', rating: 4.2, security: 4, amenities: 4, transport: 3, avgRent: 30000, propertyCount: 134, reviews: 256 },
  { id: 'n31', name: 'Kapsoya', city: 'Eldoret', description: 'Growing residential area in Eldoret with modern housing, schools, and shopping centers.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', rating: 4.0, security: 3, amenities: 3, transport: 3, avgRent: 22000, propertyCount: 178, reviews: 223 },
];

// ============ SUBSCRIPTION PLANS ============

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // House Seekers
  { id: 'sub1', userType: 'seeker', tier: 'Free', price: 0, currency: 'KSh', features: ['Basic search', 'Save up to 20 properties', 'Standard recommendations'] },
  { id: 'sub2', userType: 'seeker', tier: 'Premium', price: 299, currency: 'KSh', features: ['Unlimited saves', 'AI recommendations', 'Advanced filters', 'Student housing tools', 'Priority notifications'], highlighted: true },
  { id: 'sub3', userType: 'seeker', tier: 'Pro', price: 699, currency: 'KSh', features: ['Premium listings first', 'Advanced neighborhood reports', 'Relocation discounts', 'Priority support', 'Exclusive deals'] },
  // Landlords
  { id: 'sub4', userType: 'landlord', tier: 'Basic', price: 999, currency: 'KSh', features: ['10 active listings'] },
  { id: 'sub5', userType: 'landlord', tier: 'Premium', price: 2999, currency: 'KSh', features: ['50 listings', 'Featured properties'], highlighted: true },
  { id: 'sub6', userType: 'landlord', tier: 'Pro', price: 6999, currency: 'KSh', features: ['Unlimited listings', 'Analytics dashboard', 'Priority placement', 'Marketing tools'] },
  // Sellers
  { id: 'sub7', userType: 'seller', tier: 'Basic', price: 499, currency: 'KSh', features: ['25 products'] },
  { id: 'sub8', userType: 'seller', tier: 'Premium', price: 1999, currency: 'KSh', features: ['250 products', 'Featured store'], highlighted: true },
  { id: 'sub9', userType: 'seller', tier: 'Pro', price: 4999, currency: 'KSh', features: ['Unlimited products', 'Store analytics', 'Homepage promotion'] },
  // Service Providers
  { id: 'sub10', userType: 'service_provider', tier: 'Basic', price: 499, currency: 'KSh', features: ['List your services'] },
  { id: 'sub11', userType: 'service_provider', tier: 'Premium', price: 1499, currency: 'KSh', features: ['Priority ranking', 'Lead generation', 'Verified badge'], highlighted: true },
  { id: 'sub12', userType: 'service_provider', tier: 'Pro', price: 3999, currency: 'KSh', features: ['Top ranking', 'Premium leads', 'Verified badge', 'Analytics'] },
];

// ============ NOTIFICATIONS ============

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'property', title: '🏠 New Property Match', message: 'A new property matching your budget was listed in Kilimani.', icon: 'home', read: false, createdAt: '2024-06-15T10:30:00Z' },
  { id: 'n2', type: 'marketplace', title: '🛋️ New Arrivals', message: 'New furniture has arrived near your location from Urban Nest.', icon: 'shopping-bag', read: false, createdAt: '2024-06-15T09:15:00Z' },
  { id: 'n3', type: 'discount', title: '🚚 Hamisha Squad Discount', message: 'Hamisha Squad discounts available this week! Save 15% on relocation.', icon: 'truck', read: false, createdAt: '2024-06-14T16:00:00Z' },
  { id: 'n4', type: 'message', title: '⭐ Landlord Response', message: 'A landlord replied to your inquiry about the Westlands apartment.', icon: 'message-square', read: false, createdAt: '2024-06-14T14:30:00Z' },
  { id: 'n5', type: 'student', title: '🎓 Student Housing Available', message: 'Student housing near your university is now available from KSh 8,000.', icon: 'graduation-cap', read: true, createdAt: '2024-06-13T11:00:00Z' },
  { id: 'n6', type: 'review', title: '⭐ New Review', message: 'Someone reviewed your property "Modern 2-Bedroom Apartment".', icon: 'star', read: true, createdAt: '2024-06-12T08:45:00Z' },
  { id: 'n7', type: 'follow', title: '👋 New Follower', message: 'Sarah Akinyi started following your store Urban Nest Furniture.', icon: 'user-plus', read: true, createdAt: '2024-06-11T19:20:00Z' },
  { id: 'n8', type: 'booking', title: '✅ Service Booked', message: 'Your booking with QuickFix Plumbers has been confirmed for tomorrow.', icon: 'calendar-check', read: true, createdAt: '2024-06-10T15:00:00Z' },
];

// ============ CATEGORIES ============

export const PRODUCT_CATEGORIES: { name: string; icon: string; subcategories: string[] }[] = [
  { name: 'Furniture', icon: 'sofa', subcategories: ['Sofas', 'Beds', 'Mattresses', 'Wardrobes', 'Dining Tables', 'Office Desks', 'Office Furniture'] },
  { name: 'Appliances', icon: 'tv', subcategories: ['TVs', 'Refrigerators', 'Cookers', 'Microwaves', 'Washing Machines', 'Water Dispensers', 'Air Conditioners'] },
  { name: 'Electronics', icon: 'laptop', subcategories: ['Computers', 'Laptops', 'Printers', 'Networking Devices', 'Routers', 'CCTV'] },
  { name: 'Home Essentials', icon: 'home', subcategories: ['Curtains', 'Carpets', 'Utensils', 'Storage Boxes', 'Bedding', 'Kitchenware'] },
  { name: 'Utilities', icon: 'flash', subcategories: ['Water Tanks', 'Solar Systems', 'Inverters', 'Generators'] },
  { name: 'Student Starter Packs', icon: 'school', subcategories: ['Starter Kits', 'Dorm Essentials'] },
];

// ============ CONVERSATIONS / CHAT ============

export const MOCK_CONVERSATIONS: import('./types').Conversation[] = [
  {
    id: 'conv1',
    participants: [MOCK_USERS[3], MOCK_USERS[0]],
    lastMessage: 'Yes, the apartment is still available. Would you like to schedule a viewing?',
    lastMessageTime: '2024-06-15T14:30:00Z',
    unreadCount: 2,
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Hi Grace! I\'m interested in the Modern 2-Bedroom Apartment in Westlands.', timestamp: '2024-06-15T10:00:00Z', read: true },
      { id: 'm2', senderId: 'u4', text: 'Hello James! Great choice. What would you like to know?', timestamp: '2024-06-15T10:15:00Z', read: true },
      { id: 'm3', senderId: 'u1', text: 'Is the apartment still available? And can I schedule a viewing this weekend?', timestamp: '2024-06-15T12:00:00Z', read: true },
      { id: 'm4', senderId: 'u4', text: 'Yes, the apartment is still available. Would you like to schedule a viewing?', timestamp: '2024-06-15T14:30:00Z', read: false },
      { id: 'm5', senderId: 'u4', text: 'I\'m free on Saturday morning if that works for you!', timestamp: '2024-06-15T14:31:00Z', read: false },
    ],
  },
  {
    id: 'conv2',
    participants: [MOCK_USERS[2], MOCK_USERS[0]],
    lastMessage: 'Sure, I can come by tomorrow afternoon to take a look.',
    lastMessageTime: '2024-06-14T16:00:00Z',
    unreadCount: 0,
    messages: [
      { id: 'm6', senderId: 'u1', text: 'Hi Peter! I need an electrician to fix some wiring in my new place.', timestamp: '2024-06-14T09:00:00Z', read: true },
      { id: 'm7', senderId: 'u3', text: 'Sure, I can help with that. What\'s the issue?', timestamp: '2024-06-14T09:30:00Z', read: true },
      { id: 'm8', senderId: 'u1', text: 'The living room lights keep flickering and one outlet stopped working.', timestamp: '2024-06-14T10:00:00Z', read: true },
      { id: 'm9', senderId: 'u3', text: 'Sure, I can come by tomorrow afternoon to take a look.', timestamp: '2024-06-14T16:00:00Z', read: true },
    ],
  },
  {
    id: 'conv3',
    participants: [MOCK_USERS[0], MOCK_USERS[1]],
    lastMessage: 'Hey! The L-shaped sofa I bought from Urban Nest is amazing!',
    lastMessageTime: '2024-06-13T11:00:00Z',
    unreadCount: 0,
    messages: [
      { id: 'm10', senderId: 'u1', text: 'Hey Sarah! How are you settling into your new place?', timestamp: '2024-06-13T10:00:00Z', read: true },
      { id: 'm11', senderId: 'u2', text: 'Hey! The L-shaped sofa I bought from Urban Nest is amazing!', timestamp: '2024-06-13T11:00:00Z', read: true },
    ],
  },
];

// ============ SAVED / FAVORITES ============

/** Per-user saved items keyed by userId. Real backend will replace this. */
interface SavedItems {
  propertyIds: string[];
  productIds: string[];
  postIds: string[];
}

export const MOCK_SAVED_ITEMS: Record<string, SavedItems> = {
  'u1': { propertyIds: ['pr1', 'pr3'], productIds: ['p1', 'p3', 'p6', 'p10'], postIds: ['c4', 'c6'] },
  'u2': { propertyIds: ['pr2'], productIds: ['p5', 'p8'], postIds: ['c1'] },
  'u3': { propertyIds: ['pr4'], productIds: ['p2'], postIds: ['c3', 'c5'] },
  'u4': { propertyIds: ['pr3'], productIds: ['p7', 'p9'], postIds: ['c2'] },
  'u5': { propertyIds: [], productIds: ['p6'], postIds: [] },
  'u6': { propertyIds: ['pr1'], productIds: ['p1', 'p10'], postIds: ['c6'] },
  'default': { propertyIds: [], productIds: [], postIds: [] },
};

// ============ PAYMENT METHODS ============

/** Mock saved payment methods */
export const MOCK_PAYMENT_METHODS: import('./types').SavedPaymentMethod[] = [
  {
    id: 'pm1',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2027,
    isDefault: true,
    createdAt: '2024-04-15T10:00:00Z',
  },
  {
    id: 'pm2',
    brand: 'mastercard',
    last4: '8888',
    expMonth: 8,
    expYear: 2026,
    isDefault: false,
    createdAt: '2024-05-20T14:30:00Z',
  },
];

/** Mock billing history */
export const MOCK_BILLING_HISTORY: import('./types').BillingEntry[] = [
  {
    id: 'bill1',
    date: '2024-06-15T10:30:00Z',
    description: 'Premium Subscription - Seeker',
    planName: 'Premium',
    amount: 299,
    currency: 'KSh',
    status: 'paid',
    paymentMethod: 'mpesa',
    mpesaReceipt: 'SGR1234567',
  },
  {
    id: 'bill2',
    date: '2024-06-01T09:00:00Z',
    description: 'Pro Subscription - Landlord',
    planName: 'Pro',
    amount: 6999,
    currency: 'KSh',
    status: 'paid',
    paymentMethod: 'card',
  },
  {
    id: 'bill3',
    date: '2024-05-15T14:00:00Z',
    description: 'Premium Subscription - Seller',
    planName: 'Premium',
    amount: 1999,
    currency: 'KSh',
    status: 'paid',
    paymentMethod: 'paystack',
    paystackReference: 'HAMA-A1B2C3D4',
  },
  {
    id: 'bill4',
    date: '2024-05-10T11:00:00Z',
    description: 'Basic Subscription - Landlord',
    planName: 'Basic',
    amount: 999,
    currency: 'KSh',
    status: 'failed',
    paymentMethod: 'mpesa',
  },
  {
    id: 'bill5',
    date: '2024-04-20T16:00:00Z',
    description: 'Premium Subscription - Seeker',
    planName: 'Premium',
    amount: 299,
    currency: 'KSh',
    status: 'refunded',
    paymentMethod: 'card',
  },
  {
    id: 'bill6',
    date: '2024-04-10T08:00:00Z',
    description: 'Free Plan Activation',
    planName: 'Free',
    amount: 0,
    currency: 'KSh',
    status: 'paid',
    paymentMethod: 'mpesa',
  },
  {
    id: 'bill7',
    date: '2024-03-28T12:00:00Z',
    description: 'Pro Subscription - Service Provider',
    planName: 'Pro',
    amount: 3999,
    currency: 'KSh',
    status: 'paid',
    paymentMethod: 'paystack',
    paystackReference: 'HAMA-E5F6G7H8',
  },
];

export const SERVICE_CATEGORIES: { name: string; icon: string; subcategories: string[] }[] = [
  { name: 'Relocation', icon: 'car', subcategories: ['Hamisha Squad', 'Movers', 'Packers'] },
  { name: 'Home Maintenance', icon: 'wrench', subcategories: ['Plumbers', 'Electricians', 'Painters', 'Carpenters', 'Handymen', 'Welders'] },
  { name: 'Cleaning', icon: 'sparkles', subcategories: ['House Cleaners', 'Deep Cleaning', 'Laundry Services', 'Pest Control'] },
  { name: 'Technology', icon: 'cpu', subcategories: ['WiFi Installation', 'CCTV Installers', 'Smart Home Setup', 'Internet Installers'] },
  { name: 'Construction', icon: 'hard-hat', subcategories: ['Contractors', 'Architects'] },
  { name: 'Home Improvement', icon: 'palette', subcategories: ['Interior Designers', 'Renovators'] },
  { name: 'Household', icon: 'people', subcategories: ['Nannies', 'Gardeners', 'Security Guards'] },
];
