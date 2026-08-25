const blogImages: Record<string, number> = {
  // Banners
  'banner-1-family-moving.jpg': require('../../assets/blog/banner-1-family-moving.jpg'),
  'banner-2-family-new-home.jpg': require('../../assets/blog/banner-2-family-new-home.jpg'),
  'banner-3-hamisha-squad.jpg': require('../../assets/blog/banner-3-hamisha-squad.jpg'),
  'banner-4-estate-courtyard.jpg': require('../../assets/blog/banner-4-estate-courtyard.jpg'),
  'banner-5-shopping-mall.jpg': require('../../assets/blog/banner-5-shopping-mall.jpg'),
  // Featured
  'featured-1-modern-kitchen.jpg': require('../../assets/blog/featured-1-modern-kitchen.jpg'),
  'featured-2-dining-living.jpg': require('../../assets/blog/featured-2-dining-living.jpg'),
  'featured-3-cozy-living.jpg': require('../../assets/blog/featured-3-cozy-living.jpg'),
  // Services
  'service-electrician-1.jpg': require('../../assets/blog/service-electrician-1.jpg'),
  'service-electrician-2.jpg': require('../../assets/blog/service-electrician-2.jpg'),
  'service-cleaner.jpg': require('../../assets/blog/service-cleaner.jpg'),
  // Neighbourhoods
  'hood-1-karen-houses.jpg': require('../../assets/blog/hood-1-karen-houses.jpg'),
  'hood-2-nairobi-skyline.jpg': require('../../assets/blog/hood-2-nairobi-skyline.jpg'),
  'hood-3-apartments-aerial.jpg': require('../../assets/blog/hood-3-apartments-aerial.jpg'),
  'hood-4-kileleshwa-jacarandas.jpg': require('../../assets/blog/hood-4-kileleshwa-jacarandas.jpg'),
  'hood-5-leafy-suburb.jpg': require('../../assets/blog/hood-5-leafy-suburb.jpg'),
  'hood-6-modern-highrise.jpg': require('../../assets/blog/hood-6-modern-highrise.jpg'),
  // Guides
  'guide-moving-checklist-hand.jpg': require('../../assets/blog/guide-moving-checklist-hand.jpg'),
  'guide-moving-checklist-desk.jpg': require('../../assets/blog/guide-moving-checklist-desk.jpg'),
};

export const resolveBlogImage = (filename?: string | null): number | null =>
  filename && blogImages[filename] ? blogImages[filename] : null;
