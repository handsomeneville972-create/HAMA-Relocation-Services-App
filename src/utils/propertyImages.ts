const PROPERTY_FALLBACK_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600',
  'https://images.unsplash.com/photo-1600566753086-00f18f6bae45?w=600',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600',
];

export const getPropertyFallbackImage = (index: number = 0): string =>
  PROPERTY_FALLBACK_IMAGES[index % PROPERTY_FALLBACK_IMAGES.length];

export const getPropertyImage = (images?: string[], index: number = 0): string =>
  images?.[0] ?? getPropertyFallbackImage(index);
