import type { BlogBlock, BlogPost } from '../constants/types';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface PropertyData {
  id: string;
  title: string;
  description?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  price?: number;
  location?: string;
  neighborhood?: string;
  amenities?: string[];
  imageUrl?: string;
}

export interface AIDraftResult {
  title: string;
  excerpt: string;
  content: BlogBlock[];
  tags: string[];
  suggestedCategory: string;
  seoTitle: string;
  seoDescription: string;
  readingTime: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function calculateReadingTime(blocks: BlogBlock[]): number {
  let wordCount = 0;
  for (const block of blocks) {
    if (block.text) {
      wordCount += block.text.split(/\s+/).filter(Boolean).length;
    }
    if (block.items) {
      for (const item of block.items) {
        wordCount += item.split(/\s+/).filter(Boolean).length;
      }
    }
  }
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

function generateSeoTitle(title: string): string {
  return `${title} | HAMA`;
}

function generateSeoDescription(excerpt: string): string {
  if (excerpt.length <= 160) return excerpt;
  return excerpt.slice(0, 157).replace(/\s+\S*$/, '') + '...';
}

function buildPropertyDescription(property: PropertyData): string {
  const parts: string[] = [];
  if (property.description) {
    parts.push(property.description);
  } else {
    const intro = property.type
      ? `This ${property.type}`
      : 'This property';
    const details: string[] = [];
    if (property.bedrooms) details.push(`${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`);
    if (property.bathrooms) details.push(`${property.bathrooms} bathroom${property.bathrooms > 1 ? 's' : ''}`);
    if (details.length) {
      parts.push(`${intro} features ${details.join(' and ')}.`);
    } else {
      parts.push(`${intro} is a great place to call home.`);
    }
    if (property.price) {
      parts.push(`Listed at KES ${property.price.toLocaleString()}.`);
    }
    if (property.location) {
      parts.push(`Located in ${property.location}.`);
    }
  }
  return parts.join(' ');
}

function buildExcerpt(property: PropertyData): string {
  const desc = property.description || '';
  if (desc) {
    const firstSentence = desc.split(/[.!?]+/)[0];
    if (firstSentence && firstSentence.trim().length > 10) {
      return firstSentence.trim() + '.';
    }
    return desc.slice(0, 160);
  }
  const parts: string[] = [];
  if (property.title) parts.push(property.title);
  if (property.location) parts.push(`in ${property.location}`);
  if (property.type) parts.push(`— a ${property.type}`);
  if (parts.length === 0) return 'Explore this property listing on HAMA.';
  return parts.join(' ');
}

function buildNeighbourhoodDescription(location: string): string {
  return `${location} is a vibrant neighbourhood known for its convenience and community feel. From local dining and shopping to green spaces and cultural attractions, there is always something to explore. The area offers excellent connectivity and a range of amenities that make daily life effortless.`;
}

function generateTags(property: PropertyData): string[] {
  const tags: string[] = [];
  if (property.type) tags.push(property.type);
  if (property.location) tags.push(property.location.toLowerCase());
  if (property.neighborhood) tags.push(property.neighborhood.toLowerCase());
  if (property.bedrooms) tags.push(`${property.bedrooms}-bedroom`);
  if (property.amenities && property.amenities.length > 0) {
    const topAmenities = property.amenities.slice(0, 3).map(a => a.toLowerCase());
    tags.push(...topAmenities);
  }
  return [...new Set(tags)];
}

function uniqueWords(text: string, count: number): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'are', 'was',
    'be', 'has', 'have', 'had', 'not', 'no', 'all', 'any', 'each', 'every',
    'your', 'our', 'we', 'you', 'they', 'their', 'its', 'his', 'her', 'my',
    'can', 'will', 'just', 'also', 'about', 'up', 'out', 'if', 'when',
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  return [...new Set(words)].slice(0, count);
}

function derivedCategoryFromTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('rent') || lower.includes('leasing')) return 'renting';
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('invest')) return 'buying';
  if (lower.includes('neighbourhood') || lower.includes('neighborhood') || lower.includes('area') || lower.includes('living in')) return 'neighbourhoods';
  if (lower.includes('moving') || lower.includes('checklist') || lower.includes('relocat')) return 'moving';
  if (lower.includes('tip') || lower.includes('guide') || lower.includes('how to')) return 'guides';
  if (lower.includes('top') || lower.includes('best') || lower.includes('list')) return 'guides';
  return 'guides';
}

// ── Public functions ────────────────────────────────────────────────────────

/**
 * Generate a blog draft from a single property listing.
 */
export function generatePropertyDraft(property: PropertyData): AIDraftResult {
  const title = `Everything You Need to Know About ${property.title}`;
  const excerpt = buildExcerpt(property);
  const location = property.location || property.neighborhood || 'the area';

  const content: BlogBlock[] = [];

  // 1. About
  content.push({ type: 'heading', text: 'About This Property', level: 2 });
  content.push({ type: 'paragraph', text: buildPropertyDescription(property) });

  // 2. Key Features
  content.push({ type: 'heading', text: 'Key Features', level: 2 });
  const features: string[] = [];
  if (property.type) features.push(`Type: ${property.type}`);
  if (property.bedrooms) features.push(`${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`);
  if (property.bathrooms) features.push(`${property.bathrooms} bathroom${property.bathrooms > 1 ? 's' : ''}`);
  if (property.price) features.push(`Price: KES ${property.price.toLocaleString()}`);
  if (property.location) features.push(`Location: ${property.location}`);
  if (features.length === 0) features.push('Modern living space in a convenient location');
  content.push({ type: 'list', items: features });

  // 3. Neighbourhood
  content.push({ type: 'heading', text: 'Neighbourhood', level: 2 });
  content.push({ type: 'paragraph', text: buildNeighbourhoodDescription(location) });

  // 4. Amenities
  if (property.amenities && property.amenities.length > 0) {
    content.push({ type: 'heading', text: 'Amenities', level: 2 });
    content.push({ type: 'list', items: property.amenities });
  }

  // 5. CTA
  content.push({
    type: 'callout',
    text: 'Schedule a viewing through HAMA to see this property in person.',
    tone: 'tip',
  });

  const tags = generateTags(property);
  const suggestedCategory = property.type === 'apartment' || property.type === 'house' ? 'renting' : 'buying';
  const readingTime = calculateReadingTime(content);

  return {
    title,
    excerpt,
    content,
    tags,
    suggestedCategory,
    seoTitle: generateSeoTitle(title),
    seoDescription: generateSeoDescription(excerpt),
    readingTime,
  };
}

/**
 * Generate a neighbourhood guide draft.
 */
export function generateNeighbourhoodDraft(
  neighbourhood: string,
  properties: PropertyData[],
): AIDraftResult {
  const title = `Living in ${neighbourhood}: A Complete Guide`;
  const excerpt = `Discover everything about living in ${neighbourhood}. From available properties to local amenities, this guide covers what makes this area a great place to call home.`;

  const content: BlogBlock[] = [];

  // 1. Why this neighbourhood
  content.push({ type: 'heading', text: `Why ${neighbourhood}?`, level: 2 });
  content.push({
    type: 'paragraph',
    text: `${neighbourhood} has become one of the most sought-after areas for residents and renters alike. With a growing selection of properties, excellent local amenities, and a strong sense of community, it offers the perfect balance of convenience and comfort. Whether you are a young professional or looking for a family-friendly neighbourhood, ${neighbourhood} has something for everyone.`,
  });

  // 2. Available Properties
  const apartmentCount = properties.filter(p => p.type === 'apartment').length;
  const houseCount = properties.filter(p => p.type === 'house').length;
  const otherCount = properties.length - apartmentCount - houseCount;

  content.push({ type: 'heading', text: 'Available Properties', level: 2 });
  const propertySummaryParts: string[] = [];
  if (apartmentCount > 0) propertySummaryParts.push(`${apartmentCount} apartment${apartmentCount !== 1 ? 's' : ''}`);
  if (houseCount > 0) propertySummaryParts.push(`${houseCount} house${houseCount !== 1 ? 's' : ''}`);
  if (otherCount > 0) propertySummaryParts.push(`${otherCount} other listing${otherCount !== 1 ? 's' : ''}`);
  const propertySummary = propertySummaryParts.length > 0
    ? propertySummaryParts.join(', ')
    : 'a range of options';
  content.push({
    type: 'paragraph',
    text: `At present, HAMA features ${propertySummary} in ${neighbourhood}. Browse our listings to find the perfect fit for your lifestyle and budget.`,
  });

  // 3. Amenities & Lifestyle
  const allAmenities = new Set<string>();
  for (const p of properties) {
    if (p.amenities) {
      for (const a of p.amenities) allAmenities.add(a);
    }
  }
  content.push({ type: 'heading', text: 'Amenities & Lifestyle', level: 2 });
  if (allAmenities.size > 0) {
    content.push({ type: 'list', items: [...allAmenities].slice(0, 10) });
  } else {
    content.push({
      type: 'paragraph',
      text: `${neighbourhood} offers access to shopping centres, restaurants, parks, and essential services. The area continues to develop with new amenities opening regularly.`,
    });
  }

  // 4. Getting Around
  content.push({ type: 'heading', text: 'Getting Around', level: 2 });
  content.push({
    type: 'paragraph',
    text: `${neighbourhood} benefits from good transport links and road access. Commuting to the city centre is straightforward, and ride-hailing services are widely available. Major roads and public transport routes connect the area to other parts of Nairobi efficiently.`,
  });

  // 5. CTA
  content.push({
    type: 'callout',
    text: `Use HAMA to explore available properties in ${neighbourhood}.`,
    tone: 'info',
  });

  const tags = ['neighbourhoods', neighbourhood.toLowerCase(), 'nairobi'];
  const readingTime = calculateReadingTime(content);

  return {
    title,
    excerpt,
    content,
    tags,
    suggestedCategory: 'neighbourhoods',
    seoTitle: generateSeoTitle(title),
    seoDescription: generateSeoDescription(excerpt),
    readingTime,
  };
}

/**
 * Generate a "Top 10" or listicle draft.
 */
export function generateListicleDraft(
  title: string,
  items: { name: string; description: string; imageUrl?: string }[],
): AIDraftResult {
  const excerpt = `Discover our curated list of ${items.length} top picks. ${title.replace(/[:!?]+/g, '').trim()} — here is everything you need to know.`;

  const content: BlogBlock[] = [];

  // Introduction
  content.push({
    type: 'paragraph',
    text: `Finding the right option can feel overwhelming with so many choices available. We have narrowed it down to ${items.length} standout picks that are worth your attention. Each one has been selected for its quality, value, and overall experience.`,
  });

  // Items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    content.push({
      type: 'heading',
      text: `${i + 1}. ${item.name}`,
      level: 2,
    });
    content.push({ type: 'paragraph', text: item.description });
    if (item.imageUrl) {
      content.push({
        type: 'image',
        src: item.imageUrl,
        alt: item.name,
        caption: item.name,
      });
    }
  }

  // Closing CTA
  content.push({
    type: 'callout',
    text: 'Found something you like? Visit HAMA to learn more and connect directly with the right people.',
    tone: 'tip',
  });

  const tags = uniqueWords(title, 5);
  const suggestedCategory = derivedCategoryFromTitle(title);
  const readingTime = calculateReadingTime(content);

  return {
    title,
    excerpt,
    content,
    tags,
    suggestedCategory,
    seoTitle: generateSeoTitle(title),
    seoDescription: generateSeoDescription(excerpt),
    readingTime,
  };
}

/**
 * Generate a moving tips draft.
 */
export function generateMovingTipsDraft(
  neighbourhood?: string,
): AIDraftResult {
  const title = neighbourhood
    ? `Moving to ${neighbourhood}: Tips & Checklist`
    : 'The Complete Moving Checklist for Nairobi';
  const locationPhrase = neighbourhood ? ` in ${neighbourhood}` : '';
  const excerpt = `Planning a move${locationPhrase}? Use this step-by-step checklist to stay organised from four weeks out to settling into your new home.`;

  const content: BlogBlock[] = [];

  // Introduction
  content.push({
    type: 'paragraph',
    text: `Moving to a new home${locationPhrase} is exciting, but it can quickly become stressful without a plan. Whether this is your first move or your fifth, following a structured timeline helps you stay on top of tasks and avoid last-minute panic. Use the checklist below to make your transition as smooth as possible.`,
  });

  // 4 Weeks Before
  content.push({ type: 'heading', text: '4 Weeks Before', level: 2 });
  content.push({
    type: 'checklist',
    items: [
      'Declutter rooms and decide what to keep, donate, or discard',
      'Research and compare moving companies or transport options',
      'Create a folder for moving documents, contracts, and receipts',
      'Notify your landlord if you are currently renting',
      'Start collecting packing supplies: boxes, tape, bubble wrap, labels',
    ],
  });

  // 1 Week Before
  content.push({ type: 'heading', text: '1 Week Before', level: 2 });
  content.push({
    type: 'checklist',
    items: [
      'Confirm arrangements with your moving company or helpers',
      'Pack remaining items and label all boxes clearly',
      'Defrost the freezer and clean the kitchen',
      'Arrange for utility transfers or new accounts at your new address',
      'Notify important contacts of your change of address',
    ],
  });

  // Moving Day
  content.push({ type: 'heading', text: 'Moving Day', level: 2 });
  content.push({
    type: 'checklist',
    items: [
      'Do a final walkthrough of your old property',
      'Supervise loading and ensure fragile items are handled with care',
      'Keep essentials bag accessible: documents, chargers, toiletries, snacks',
      'Check meter readings and lock up after the last item is loaded',
      'Arrive at your new property and direct the placement of large items',
    ],
  });

  // After Moving In
  content.push({ type: 'heading', text: 'After Moving In', level: 2 });
  content.push({
    type: 'checklist',
    items: [
      'Unpack essentials first: kitchen, bathroom, bedroom',
      'Set up utilities and confirm everything is working',
      'Update your address on important accounts and subscriptions',
      'Meet your neighbours and explore the local area',
      'Register with a local clinic or doctor if you have moved to a new area',
    ],
  });

  // CTA
  content.push({
    type: 'callout',
    text: "HAMA's verified service providers can help with every step of your move.",
    tone: 'tip',
  });

  const tags = ['moving', 'checklist', 'relocation'];
  if (neighbourhood) tags.push(neighbourhood.toLowerCase());
  const suggestedCategory = 'moving';
  const readingTime = calculateReadingTime(content);

  return {
    title,
    excerpt,
    content,
    tags,
    suggestedCategory,
    seoTitle: generateSeoTitle(title),
    seoDescription: generateSeoDescription(excerpt),
    readingTime,
  };
}
