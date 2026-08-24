const fs = require('fs');
const path = require('path');

const output = path.join(__dirname, 'src', 'constants', 'blogMockData.ts');

const content = `import type { BlogCategory, BlogAuthor, BlogPost, BlogBlock } from './types';

export const MOCK_BLOG_CATEGORIES: BlogCategory[] = [
  { id: 'cat-renting', slug: 'renting', name: 'Renting', icon: 'home', position: 0, description: 'Tips and guides for finding your next rental.' },
  { id: 'cat-moving', slug: 'moving', name: 'Moving', icon: 'car', position: 1, description: 'Everything you need to know about relocating.' },
  { id: 'cat-home-decor', slug: 'home-decor', name: 'Home Decor', icon: 'color-palette', position: 2, description: 'Ideas and inspiration for decorating your home.' },
  { id: 'cat-neighbourhoods', slug: 'neighbourhoods', name: 'Neighbourhoods', icon: 'map', position: 3, description: 'In-depth guides to Nairobi\\'s best estates.' },
  { id: 'cat-landlord-advice', slug: 'landlord-advice', name: 'Landlord Advice', icon: 'people', position: 4, description: 'Best practices for managing rental properties.' },
  { id: 'cat-finance', slug: 'finance', name: 'Finance', icon: 'cash', position: 5, description: 'Budgeting, saving, and financial planning for housing.' },
  { id: 'cat-marketplace', slug: 'marketplace', name: 'Marketplace', icon: 'cart', position: 6, description: 'Buy and sell home essentials.' },
  { id: 'cat-hama-news', slug: 'hama-news', name: 'HAMA News', icon: 'megaphone', position: 7, description: 'Latest updates and announcements from HAMA.' },
  { id: 'cat-success-stories', slug: 'success-stories', name: 'Success Stories', icon: 'trophy', position: 8, description: 'Real stories from real HAMA users.' },
  { id: 'cat-security', slug: 'security', name: 'Security', icon: 'shield-checkmark', position: 9, description: 'Keeping your home and family safe.' },
  { id: 'cat-utilities', slug: 'utilities', name: 'Utilities', icon: 'flash', position: 10, description: 'Managing water, electricity, and internet.' },
  { id: 'cat-interior-design', slug: 'interior-design', name: 'Interior Design', icon: 'brush', position: 11, description: 'Professional design tips for every budget.' },
  { id: 'cat-property-investment', slug: 'property-investment', name: 'Property Investment', icon: 'trending-up', position: 12, description: 'Grow your wealth through real estate.' },
  { id: 'cat-tenant-advice', slug: 'tenant-advice', name: 'Tenant Advice', icon: 'person', position: 13, description: 'Know your rights and responsibilities as a tenant.' },
  { id: 'cat-buying', slug: 'buying', name: 'Buying', icon: 'key', position: 14, description: 'Guides for purchasing your first or next home.' },
];

export const MOCK_BLOG_AUTHORS: BlogAuthor[] = [
  {
    id: 'author-editorial',
    slug: 'hama-editorial',
    name: 'HAMA Editorial',
    avatarUrl: '/avatars/hama-editorial.jpg',
    bio: 'The HAMA content team brings you expert advice, market insights, and practical tips to help you navigate the Kenyan housing market with confidence.',
  },
  {
    id: 'author-wanjiku',
    slug: 'wanjiku-mwangi',
    name: 'Wanjiku Mwangi',
    avatarUrl: '/avatars/wanjiku-mwangi.jpg',
    bio: 'Wanjiku is a Nairobi-based housing writer with over eight years of experience covering the Kenyan real estate market. She helps renters and homeowners make smarter decisions.',
  },
];

const CATS: Record<string, number> = {
  renting: 0, moving: 1, 'home-decor': 2, neighbourhoods: 3,
  'landlord-advice': 4, finance: 5, marketplace: 6, 'hama-news': 7,
  'success-stories': 8, security: 9, utilities: 10, 'interior-design': 11,
  'property-investment': 12, 'tenant-advice': 13, buying: 14,
};

function cat(slug: string) { return `MOCK_BLOG_CATEGORIES[${CATS[slug]}]`; }
function auth(slug: string) { return slug === 'hama-editorial' ? 'MOCK_BLOG_AUTHORS[0]' : 'MOCK_BLOG_AUTHORS[1]'; }

const posts: string[] = [];

// Post 1
posts.push(`{
    id: 'post-1',
    slug: 'how-to-find-affordable-rentals-in-nairobi',
    title: 'How to Find Affordable Rentals in Nairobi',
    excerpt: 'Finding an affordable rental in Nairobi doesn\\'t have to be a nightmare. Here\\'s your step-by-step guide to scoring a great deal without compromising on quality.',
    content: [
      { type: 'heading', level: 2, text: 'Understanding the Nairobi Rental Market' },
      { type: 'paragraph', text: 'Nairobi\\'s rental market is as diverse as the city itself. From the bustling streets of Pipeline to the quiet lanes of Donholm, prices vary wildly depending on location and amenities.' },
      { type: 'paragraph', text: 'Popular budget-friendly areas include Pipeline, Donholm, Umoja, Kahawa, and Kitengela. Each neighbourhood offers a distinct mix of transport links, security, and lifestyle.' },
      { type: 'callout', tone: 'tip', text: 'Always calculate your total monthly cost before signing a lease. Add rent plus water, electricity, service charge, internet, and garbage collection. A KSh 15,000 unit can easily become KSh 22,000 once all bills are factored in.' },
      { type: 'heading', level: 2, text: 'Where to Start Your Search' },
      { type: 'list', ordered: false, items: [
        'Use the HAMA app to filter by price, location, and amenities — our verified listings save you time and keep you safe.',
        'Visit estates in person at different times of day to check water pressure, security, and noise levels.',
        'Talk to current tenants about their experience with the landlord and neighbourhood.',
        'Negotiate your rent by offering a longer lease or setting up timely direct debits.',
      ] },
      { type: 'heading', level: 2, text: 'Hidden Costs to Watch For' },
      { type: 'paragraph', text: 'Many first-time renters are surprised by additional fees. Service charges, parking fees, and move-in costs can add up quickly. Budget at least four months\\' rent upfront to cover deposit, advance rent, and furnishing essentials.' },
      { type: 'callout', tone: 'tip', text: 'Start your search on HAMA. Our advanced filters let you set a maximum budget and only show verified listings in your preferred neighbourhoods. Download the app today and find your perfect home.' },
    ],
    coverImageUrl: 'hood-2-nairobi-skyline.jpg',
    category: ${cat('renting')},
    author: ${auth('wanjiku-mwangi')},
    tags: ['renting', 'nairobi', 'affordable housing', 'budget', 'rental guide'],
    status: 'published',
    publishedAt: '2026-08-10T08:00:00Z',
    featured: true,
    pinned: false,
    views: 3420,
    shares: 187,
    readingTime: 8,
    seoTitle: 'How to Find Affordable Rentals in Nairobi | HAMA',
    seoDescription: 'Discover practical tips for finding affordable rental apartments in Nairobi. From budgeting to negotiation, HAMA helps you find the perfect home.',
  }`);

// Post 2
posts.push(`{
    id: 'post-2',
    slug: 'how-to-avoid-rental-scams-in-nairobi',
    title: 'How to Avoid Rental Scams in Nairobi',
    excerpt: 'Rental scams are unfortunately common in Kenya. Learn how to spot the red flags and protect yourself from losing your hard-earned money.',
    content: [
      { type: 'heading', level: 2, text: 'Common Rental Scams to Watch Out For' },
      { type: 'paragraph', text: 'Every year, thousands of Kenyans lose money to rental scams. Fraudsters create fake listings with stolen photos and pose as landlords, pressuring victims into quick payments before they can verify the property.' },
      { type: 'callout', tone: 'warning', text: 'Never send money for a rental property you haven\\'t physically visited. Legitimate landlords will always allow you to view the property before making any payment. If someone pressures you to pay a deposit immediately, it\\'s almost certainly a scam.' },
      { type: 'heading', level: 2, text: '5 Warning Signs of a Rental Scam' },
      { type: 'list', ordered: false, items: [
        'The rent price is significantly below market rate for the area — if it seems too good to be true, it probably is.',
        'The landlord refuses to meet in person or show you the property, often claiming to be out of the country.',
        'They demand payment via M-Pesa to a personal number rather than a business account, or ask for cash with no receipt.',
        'The listing uses professional stock photos instead of actual property photos taken on-site.',
        'You feel pressured to pay immediately with phrases like "someone else is interested" or "the price goes up tomorrow".',
      ] },
      { type: 'heading', level: 2, text: '5 Steps to Protect Yourself' },
      { type: 'list', ordered: true, items: [
        'Always visit the property in person before paying any money.',
        'Verify the landlord\\'s identity by cross-referencing their name with the title deed or KRA PIN certificate.',
        'Use HAMA\\'s Verified Listings — every property has been physically inspected and the landlord\\'s identity confirmed.',
        'Never pay a deposit without a signed tenancy agreement that clearly states refund terms.',
        'Report suspicious listings to HAMA immediately so we can investigate and protect other users.',
      ] },
      { type: 'heading', level: 2, text: 'What to Do If You\\'ve Been Scammed' },
      { type: 'paragraph', text: 'If you\\'ve fallen victim to a rental scam, file a report with the nearest police station and provide all evidence including M-Pesa messages and communication records. You can also report the incident to the Directorate of Criminal Investigations (DCI) online portal.' },
      { type: 'callout', tone: 'warning', text: 'Stay vigilant and always trust your instincts. If something feels off about a listing or a landlord, walk away. Your safety and finances are worth more than any deal.' },
    ],
    coverImageUrl: 'hood-1-karen-houses.jpg',
    category: ${cat('security')},
    author: ${auth('hama-editorial')},
    tags: ['security', 'scams', 'safety', 'nairobi', 'renting'],
    status: 'published',
    publishedAt: '2026-08-05T10:00:00Z',
    featured: false,
    pinned: false,
    views: 2150,
    shares: 134,
    readingTime: 7,
    seoTitle: 'How to Avoid Rental Scams in Nairobi | HAMA',
    seoDescription: 'Learn how to identify and avoid common rental scams in Kenya. Protect your money with HAMA\\'s verified listings and expert tips.',
  }`);

// Post 3
posts.push(`{
    id: 'post-3',
    slug: 'complete-moving-checklist-nairobi',
    title: 'The Complete Moving Checklist for Nairobi',
    excerpt: 'Moving house doesn\\'t have to be stressful. Follow this comprehensive checklist to stay organized from two months before your move to moving day itself.',
    content: [
      { type: 'heading', level: 2, text: '2 Months Before Your Move' },
      { type: 'paragraph', text: 'Starting early is the key to a stress-free move. Two months gives you time to sort through your belongings, arrange logistics, and handle paperwork without rushing.' },
      { type: 'list', ordered: true, items: [
        'Create a moving folder to keep all important documents — lease agreements, utility transfer forms, and moving company quotes.',
        'Declutter room by room. Sort items into three piles: keep, donate, and discard.',
        'Research and get quotes from at least three moving companies. Check reviews and confirm insurance coverage.',
        'Notify your current landlord of your move-out date per your tenancy agreement requirements.',
        'Start collecting packing supplies — boxes, bubble wrap, packing tape, and markers for labeling.',
      ] },
      { type: 'heading', level: 2, text: '1 Month Before Your Move' },
      { type: 'list', ordered: true, items: [
        'Begin packing non-essential items — books, seasonal clothing, and decorative items.',
        'Arrange utility transfers for Kenya Power, Nairobi Water, and any internet providers.',
        'Update your address with your bank, employer, and insurance provider.',
        'Confirm your new home\\'s readiness — check that water and electricity are connected.',
        'Label every box clearly with its contents and the room it belongs to.',
      ] },
      { type: 'heading', level: 2, text: '1 Week Before Your Move' },
      { type: 'list', ordered: true, items: [
        'Pack a "moving day essentials" box with toiletries, a change of clothes, phone chargers, and snacks.',
        'Confirm arrival time and contact details with your moving company.',
        'Defrost your fridge and freezer at least 24 hours before moving day.',
        'Do a final walkthrough of your current property to check for damage.',
      ] },
      { type: 'callout', tone: 'tip', text: 'Label every box with both the room name and a brief list of contents. This saves hours of confusion on moving day and helps movers place boxes in the right rooms immediately.' },
      { type: 'heading', level: 2, text: 'Moving Day' },
      { type: 'list', ordered: true, items: [
        'Be present when movers arrive to answer questions and direct placement.',
        'Keep valuables and important documents with you — never put them on the truck.',
        'Take photos of your empty old property for deposit records.',
        'Do a final check of every room, cupboard, and drawer before locking up.',
        'Inspect your new property as items are unloaded and verify box counts.',
      ] },
    ],
    coverImageUrl: 'guide-moving-checklist-hand.jpg',
    category: ${cat('moving')},
    author: ${auth('wanjiku-mwangi')},
    tags: ['moving', 'checklist', 'nairobi', 'hamisha squad', 'relocation'],
    status: 'published',
    publishedAt: '2026-07-28T09:00:00Z',
    featured: false,
    pinned: false,
    views: 5200,
    shares: 312,
    readingTime: 10,
    seoTitle: 'The Complete Moving Checklist for Nairobi | HAMA',
    seoDescription: 'Stay organized with our comprehensive moving checklist. From packing tips to Hamisha Squad, HAMA makes your Nairobi move stress-free.',
  }`);

// Post 4
posts.push(`{
    id: 'post-4',
    slug: 'best-estates-in-nairobi-under-20000',
    title: 'Best Estates in Nairobi Under KSh 20,000',
    excerpt: 'You don\\'t need to break the bank to find a decent place to live in Nairobi. Here are the best estates where you can get a quality rental for under KSh 20,000.',
    content: [
      { type: 'heading', level: 2, text: 'Budget-Friendly Estates in Nairobi' },
      { type: 'paragraph', text: 'Nairobi\\'s reputation as an expensive city is partly deserved, but there are plenty of neighbourhoods where you can find clean, secure, and well-connected housing for under KSh 20,000 per month.' },
      { type: 'heading', level: 2, text: 'Top Estates to Consider' },
      { type: 'list', ordered: true, items: [
        'Pipeline — High-rise apartment blocks with one-bedrooms from KSh 10,000 to 16,000. The area is growing fast with new amenities appearing regularly.',
        'Donholm — A large estate along Jogoo Road with bedsitters from KSh 8,000 and one-bedrooms up to KSh 18,000. Well-served by matatus.',
        'Umoja — Popular budget estate with bedsitters from KSh 8,000 to 12,000 and one-bedrooms from KSh 12,000 to 18,000. Reliable water and electricity.',
        'Kahawa — Located near Kenyatta University, offering affordable one-bedrooms from KSh 10,000 to 15,000 with good access to Thika Road.',
        'Buruburu — Well-established estate with self-contained one-bedrooms from KSh 12,000 to 18,000. Close to Jogoo Road and supermarkets.',
        'Kitengela — Just outside Nairobi in Kajiado County with one-bedrooms from KSh 8,000 to 15,000. The trade-off is a longer commute but significant savings.',
      ] },
      { type: 'callout', tone: 'info', text: 'Use the HAMA app\\'s advanced search filters to narrow down properties by price range, location, and amenities. Set a maximum budget of KSh 20,000 and filter by self-contained units, parking, or CCTV security.' },
      { type: 'heading', level: 2, text: 'What to Look For in a Budget Estate' },
      { type: 'paragraph', text: 'Price isn\\'t everything. Check for security (gated compounds with guards), water reliability (boreholes or tanks), electricity stability, and proximity to your workplace or school. Also inspect road conditions, especially during rainy season.' },
      { type: 'callout', tone: 'tip', text: 'Visit HAMA\\'s Neighbourhood profiles to compare safety ratings, amenities, transport options, and average rents across these estates before making your decision.' },
    ],
    coverImageUrl: 'hood-4-kileleshwa-jacarandas.jpg',
    category: ${cat('neighbourhoods')},
    author: ${auth('wanjiku-mwangi')},
    tags: ['neighbourhoods', 'budget', 'nairobi', 'estates', 'affordable housing'],
    status: 'published',
    publishedAt: '2026-08-12T07:30:00Z',
    featured: false,
    pinned: false,
    views: 8900,
    shares: 456,
    readingTime: 7,
    seoTitle: 'Best Estates in Nairobi Under KSh 20,000 | HAMA',
    seoDescription: 'Discover the best budget-friendly estates in Nairobi. Find quality rentals under KSh 20,000 with HAMA\\'s search filters.',
  }`);

// Post 5
posts.push(`{
    id: 'post-5',
    slug: 'first-apartment-guide-nairobi',
    title: 'Your First Apartment in Nairobi',
    excerpt: 'Moving into your first apartment is exciting but overwhelming. Here\\'s everything you need to know to make the transition smooth and stress-free.',
    content: [
      { type: 'heading', level: 2, text: 'Lease Tips for First-Time Renters' },
      { type: 'paragraph', text: 'Read every clause of your tenancy agreement before signing. Pay close attention to the notice period, maintenance responsibilities, and any restrictions on subletting or renovations.' },
      { type: 'list', ordered: false, items: [
        'Ensure the deposit and refund terms are clearly stated in writing.',
        'Confirm who is responsible for minor repairs like taps and light bulbs.',
        'Check if there are restrictions on guests, pets, or running a home business.',
      ] },
      { type: 'heading', level: 2, text: 'Setup Checklist for Your New Home' },
      { type: 'list', ordered: true, items: [
        'Connect Kenya Power and Nairobi Water in your name before move-in day.',
        'Install secure locks on all doors and windows if the existing ones feel inadequate.',
        'Buy essential items first — mattress, cooker, fridge, bedding, and basic kitchenware.',
        'Set up internet — compare Safaricom Home, Zuku, and Faiba for the best deal in your area.',
      ] },
      { type: 'heading', level: 2, text: 'Budgeting Basics' },
      { type: 'paragraph', text: 'Most Nairobi rentals require two months\\' deposit plus one month in advance. Have at least four months\\' rent saved before you start looking. Don\\'t forget to budget for curtains, a cooker, and basic kitchenware.' },
      { type: 'callout', tone: 'tip', text: 'Always keep an emergency fund of at least KSh 20,000 after moving. Unexpected expenses — medical bills, appliance repairs, or job changes — happen to everyone. Having a buffer keeps you stress-free.' },
      { type: 'callout', tone: 'info', text: 'Browse the HAMA Marketplace for affordable second-hand furniture and home essentials when you\\'re setting up your first apartment. You can find quality items at a fraction of retail price.' },
    ],
    coverImageUrl: 'guide-moving-checklist-desk.jpg',
    category: ${cat('tenant-advice')},
    author: ${auth('hama-editorial')},
    tags: ['first apartment', 'tenant advice', 'nairobi', 'renting', 'budgeting'],
    status: 'published',
    publishedAt: '2026-07-20T08:00:00Z',
    featured: false,
    pinned: false,
    views: 4100,
    shares: 198,
    readingTime: 9,
    seoTitle: 'Your First Apartment in Nairobi | HAMA',
    seoDescription: 'Your complete guide to moving into your first apartment in Nairobi. From lease tips to budgeting, HAMA has you covered.',
  }`);

// Post 6
posts.push(`{
    id: 'post-6',
    slug: 'landlord-best-practices',
    title: 'Landlord Best Practices: Managing Your Rental Property',
    excerpt: 'Being a good landlord means happy tenants and a profitable investment. Here are the best practices every Kenyan property owner should follow.',
    content: [
      { type: 'heading', level: 2, text: 'Tenant Screening: Finding the Right People' },
      { type: 'paragraph', text: 'Your tenants are the backbone of your rental business. A thorough screening process saves you from unpaid rent, property damage, and legal fees down the road.' },
      { type: 'list', ordered: false, items: [
        'Request and verify references from previous landlords — a quick call reveals payment history and behaviour.',
        'Check employment and income stability with recent payslips or an employment letter.',
        'Meet the tenant in person to gauge whether they\\'ll be a good fit for your property.',
        'Always use a written tenancy agreement that clearly outlines expectations and responsibilities.',
      ] },
      { type: 'heading', level: 2, text: 'Property Maintenance' },
      { type: 'paragraph', text: 'Regular maintenance keeps your property in good condition and shows tenants you care. Small issues like leaking taps can escalate into costly repairs if left unattended.' },
      { type: 'heading', level: 2, text: 'Pricing Your Rental Competitively' },
      { type: 'paragraph', text: 'Research comparable properties in your area before setting rent. Overpriced units sit vacant longer, costing you more in lost income than a modest reduction would.' },
      { type: 'heading', level: 2, text: 'Communication and Professionalism' },
      { type: 'paragraph', text: 'Respond to tenant concerns promptly and professionally. Happy tenants stay longer, pay on time, and treat your property with respect. Consider setting up a WhatsApp group for maintenance requests and announcements.' },
      { type: 'callout', tone: 'tip', text: 'Use HAMA\\'s landlord tools to manage listings, communicate with tenants, track rent payments, and handle maintenance requests all in one place. Our platform makes property management simple and efficient.' },
    ],
    coverImageUrl: 'featured-1-modern-kitchen.jpg',
    category: ${cat('landlord-advice')},
    author: ${auth('hama-editorial')},
    tags: ['landlord', 'property management', 'tenant screening', 'maintenance', 'nairobi'],
    status: 'published',
    publishedAt: '2026-08-01T09:00:00Z',
    featured: false,
    pinned: false,
    views: 1800,
    shares: 89,
    readingTime: 8,
    seoTitle: 'Landlord Best Practices: Managing Your Rental Property | HAMA',
    seoDescription: 'Learn the best practices for managing your rental property in Kenya. From tenant screening to maintenance, HAMA helps landlords succeed.',
  }`);

// Post 7
posts.push(`{
    id: 'post-7',
    slug: 'furniture-buying-guide',
    title: 'Furniture Buying Guide: Furnishing Your New Home',
    excerpt: 'Furnishing a new home can be overwhelming and expensive. Here\\'s how to prioritize what you need and where to find the best deals.',
    content: [
      { type: 'heading', level: 2, text: 'Essential Furniture for Every Room' },
      { type: 'paragraph', text: 'When you\\'re furnishing a new home, it\\'s tempting to buy everything at once. But that\\'s a fast track to emptying your savings. The smart approach is to prioritize — start with the essentials and build your collection over time.' },
      { type: 'heading', level: 2, text: 'Priority Items to Buy First' },
      { type: 'list', ordered: false, items: [
        'Bedroom — A quality mattress and bed frame should be your top investment. Add a wardrobe or clothing organizer as budget allows.',
        'Living room — A comfortable sofa is worth spending more on. Add a coffee table, TV stand, and curtains over time.',
        'Kitchen — Start with essential appliances: a cooker or hot plate, a fridge, and basic cookware. You can add a microwave and blender later.',
        'Bathroom — Towel racks, a bathroom mirror, a shower caddy, and good-quality towels make your bathroom functional and comfortable.',
        'Dining — A small dining table with two to four chairs. A wall-mounted drop-leaf table is a great space-saving option.',
      ] },
      { type: 'heading', level: 2, text: 'Where to Shop for Furniture in Nairobi' },
      { type: 'paragraph', text: 'Nairobi has a wide range of furniture options to suit every budget. For brand-new pieces, stores along Mombasa Road and in Westlands offer modern designs at competitive prices. For second-hand bargains, Tom Mboya Street is a treasure trove.' },
      { type: 'callout', tone: 'tip', text: 'The HAMA Marketplace is a great place to find quality second-hand furniture at a fraction of the retail price. Users regularly list items like sofas, dining sets, and appliances when they\\'re moving or upgrading.' },
      { type: 'heading', level: 2, text: 'Budget Tips for First-Time Buyers' },
      { type: 'paragraph', text: 'Set a realistic furnishing budget and stick to it. Focus on quality for items you use daily — mattress, sofa, cooker — and save on decorative pieces. Buy multi-purpose furniture to maximize value and space.' },
      { type: 'callout', tone: 'info', text: 'Visit HAMA Marketplace to browse hundreds of furniture listings from verified sellers across Nairobi. Filter by category, price range, and condition to find exactly what you need.' },
    ],
    coverImageUrl: 'featured-2-dining-living.jpg',
    category: ${cat('marketplace')},
    author: ${auth('wanjiku-mwangi')},
    tags: ['furniture', 'marketplace', 'nairobi', 'home decor', 'buying guide'],
    status: 'published',
    publishedAt: '2026-08-08T08:30:00Z',
    featured: false,
    pinned: false,
    views: 2700,
    shares: 145,
    readingTime: 6,
    seoTitle: 'Furniture Buying Guide: Furnishing Your New Home | HAMA',
    seoDescription: 'Discover where to find affordable furniture in Nairobi. From essential pieces to HAMA Marketplace deals, furnish your home smartly.',
  }`);

// Post 8
posts.push(`{
    id: 'post-8',
    slug: 'neighbourhood-guide-what-to-look-for',
    title: 'Neighbourhood Guide: What to Look For',
    excerpt: 'The right neighbourhood can make or break your living experience. Here\\'s what to evaluate before committing to a new area in Nairobi.',
    content: [
      { type: 'heading', level: 2, text: 'Safety Should Be Your Top Priority' },
      { type: 'paragraph', text: 'Before you fall in love with a beautiful apartment, take a hard look at the neighbourhood\\'s safety record. Visit the area at different times of the day — what feels safe at noon might feel different at 9 PM. Look for well-lit streets, visible security presence, and gated compounds with guard services.' },
      { type: 'heading', level: 2, text: 'Transport and Connectivity' },
      { type: 'paragraph', text: 'Consider your daily commute. How far is the neighbourhood from your workplace, and what are the transport options? Areas near major roads like Mombasa Road, Thika Road, or Ngong Road offer better connectivity. Check if matatus or buses operate reliably.' },
      { type: 'heading', level: 2, text: 'Essential Amenities to Check For' },
      { type: 'list', ordered: false, items: [
        'Water supply — Is there a borehole or communal water tank? Water rationing is common in some Nairobi estates.',
        'Electricity — Check if the area experiences frequent power outages. Some neighbourhoods have backup generators.',
        'Shopping — Proximity to supermarkets, markets, and pharmacies makes daily life much easier.',
        'Healthcare — A nearby hospital or clinic is important, especially if you have children or elderly family members.',
        'Schools — If you have kids, research the quality and proximity of schools in the area before committing.',
      ] },
      { type: 'callout', tone: 'info', text: 'HAMA\\'s neighbourhood profiles provide detailed information about each area, including safety ratings, nearby amenities, transport options, and average rental prices. Use these profiles to compare different neighbourhoods before making your decision.' },
      { type: 'heading', level: 2, text: 'Schools and Hospitals' },
      { type: 'paragraph', text: 'Proximity to quality schools and healthcare facilities significantly impacts your quality of life. Research school ratings, hospital access, and pharmacy availability in the area. These factors are especially important for families with children or elderly relatives.' },
    ],
    coverImageUrl: 'hood-6-modern-highrise.jpg',
    category: ${cat('neighbourhoods')},
    author: ${auth('hama-editorial')},
    tags: ['neighbourhoods', 'nairobi', 'safety', 'amenities', 'transport'],
    status: 'published',
    publishedAt: '2026-07-25T07:00:00Z',
    featured: false,
    pinned: false,
    views: 3200,
    shares: 167,
    readingTime: 7,
    seoTitle: 'Neighbourhood Guide: What to Look For | HAMA',
    seoDescription: 'Find the perfect neighbourhood in Nairobi with our comprehensive guide. Learn what to look for in safety, amenities, and transport.',
  }`);

// Post 9
posts.push(`{
    id: 'post-9',
    slug: 'buying-vs-renting-kenya',
    title: 'Buying vs Renting in Kenya: What\\'s Right for You?',
    excerpt: 'Should you buy or rent in Kenya? We break down the pros and cons of each option to help you make the right financial decision.',
    content: [
      { type: 'heading', level: 2, text: 'The Pros and Cons of Buying' },
      { type: 'paragraph', text: 'Owning a home is a deeply ingrained aspiration for many Kenyans. There\\'s something powerful about having a place that\\'s truly yours — no landlord to answer to, no annual rent increases, and the freedom to renovate as you please.' },
      { type: 'heading', level: 2, text: 'Pros of Buying a Home' },
      { type: 'list', ordered: false, items: [
        'Equity building — Every mortgage payment increases your ownership stake. Over time, you\\'re building an asset that appreciates in value.',
        'Stability — You don\\'t have to worry about rent increases, lease expirations, or being asked to vacate.',
        'Freedom to customize — Renovate, paint, landscape, and modify your space however you want without needing permission.',
        'Potential rental income — If you move or buy a second property, you can rent out your home for passive income.',
      ] },
      { type: 'heading', level: 2, text: 'Pros of Renting a Home' },
      { type: 'list', ordered: false, items: [
        'Flexibility — Renting allows you to relocate easily for work, family, or lifestyle changes without the burden of selling a property.',
        'Lower upfront costs — You only need a deposit and advance rent, compared to the substantial down payment required for a mortgage.',
        'No maintenance responsibility — Repairs, plumbing issues, and structural maintenance are typically the landlord\\'s responsibility.',
        'Investment flexibility — The money you save by not paying a mortgage can be invested in other assets with potentially higher returns.',
      ] },
      { type: 'heading', level: 2, text: 'Financial Comparison' },
      { type: 'paragraph', text: 'In Kenya, mortgage interest rates typically range from 10-14%, meaning you\\'ll pay significantly more than the property\\'s value over the life of a 20-year mortgage. Meanwhile, the stock market, Saccos, or Treasury bills might offer better returns on your money. Run the numbers carefully before making this life-changing decision.' },
      { type: 'callout', tone: 'tip', text: 'Consult a financial advisor before making your decision. A professional can help you assess your financial readiness, compare mortgage options, and determine whether buying or renting aligns better with your long-term goals and current circumstances.' },
      { type: 'callout', tone: 'info', text: 'Whether you\\'re buying or renting, HAMA has you covered. Browse our verified rental listings or explore properties for sale across Nairobi and beyond.' },
    ],
    coverImageUrl: 'hood-5-leafy-suburb.jpg',
    category: ${cat('finance')},
    author: ${auth('wanjiku-mwangi')},
    tags: ['finance', 'buying vs renting', 'kenya', 'real estate', 'mortgage'],
    status: 'published',
    publishedAt: '2026-08-14T08:00:00Z',
    featured: false,
    pinned: false,
    views: 5600,
    shares: 378,
    readingTime: 11,
    seoTitle: 'Buying vs Renting in Kenya: What\\'s Right for You? | HAMA',
    seoDescription: 'Should you buy or rent in Kenya? Compare the pros and cons of each option with our detailed financial analysis.',
  }`);

// Post 10
posts.push(`{
    id: 'post-10',
    slug: 'hama-success-story-finding-my-home',
    title: 'How HAMA Helped Me Find My Dream Home',
    excerpt: 'A personal story of how one renter used HAMA to navigate Nairobi\\'s tricky housing market and find their perfect home.',
    content: [
      { type: 'heading', level: 2, text: 'My Story' },
      { type: 'paragraph', text: 'My name is Amina, and when I moved to Nairobi for a new job at a tech startup in Westlands, I had no idea where to start looking for a place to live. I had heard horror stories about rental scams and terrible landlords, and I was genuinely anxious about the whole process.' },
      { type: 'paragraph', text: 'A colleague mentioned HAMA, and I decided to give it a try. Within the first ten minutes of browsing the app, I was impressed by how clean and organised everything was. Every listing had real photos, verified landlord details, and reviews from previous tenants.' },
      { type: 'heading', level: 2, text: 'The Search' },
      { type: 'paragraph', text: 'I set my budget at KSh 18,000 and filtered for one-bedroom apartments near Westlands. The app showed me options in Kileleshwa, Kilimani, and Lavington — all areas I hadn\\'t considered but were actually within my commute range. I scheduled three viewings in one afternoon.' },
      { type: 'heading', level: 2, text: 'Finding the One' },
      { type: 'paragraph', text: 'The second viewing was the winner. A bright, self-contained one-bedroom in Kileleshwa with a borehole, backup generator, and 24-hour security. The landlord responded to my messages within an hour, and the tenancy agreement was straightforward and fair.' },
      { type: 'callout', tone: 'tip', text: 'If you\\'re new to Nairobi or just looking for a better way to find a home, start with HAMA. Our verified listings, transparent reviews, and powerful search filters take the stress out of house hunting.' },
      { type: 'heading', level: 2, text: 'My Advice' },
      { type: 'paragraph', text: 'Don\\'t rush the process. Use HAMA to shortlist properties, visit them in person, talk to current tenants, and always read the tenancy agreement carefully. The right home is out there — HAMA just makes it easier to find.' },
      { type: 'paragraph', text: 'I\\'ve now been in my Kileleshwa apartment for eight months, and I couldn\\'t be happier. Thank you, HAMA, for making my Nairobi housing experience a positive one. I recommend the platform to everyone I know who\\'s looking for a new place.' },
    ],
    coverImageUrl: 'banner-3-hamisha-squad.jpg',
    category: ${cat('success-stories')},
    author: ${auth('hama-editorial')},
    tags: ['success story', 'personal experience', 'nairobi', 'kileleshwa', 'tenant advice'],
    status: 'published',
    publishedAt: '2026-08-15T06:00:00Z',
    featured: false,
    pinned: false,
    views: 1200,
    shares: 67,
    readingTime: 5,
    seoTitle: 'How HAMA Helped Me Find My Dream Home | HAMA',
    seoDescription: 'Read Amina\\'s story of finding her dream home in Nairobi using HAMA\\'s verified listings and powerful search tools.',
  }`);

const final = content + '\nexport const MOCK_BLOG_POSTS: BlogPost[] = [\n' + posts.join(',\n\n') + ',\n];\n';

fs.writeFileSync(output, final, 'utf8');
console.log('blogMockData.ts written successfully');
console.log('Lines:', final.split('\n').length);
