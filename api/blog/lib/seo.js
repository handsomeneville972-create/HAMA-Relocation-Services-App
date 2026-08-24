const SITE_NAME = 'HAMA';
const SITE_URL = 'https://hamanasi.space';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateMeta(post) {
  const baseUrl = SITE_URL;
  const url = `${baseUrl}/blog/${post.slug}`;
  const title = escapeHtml(post.seo_title || `${post.title} | HAMA Blog`);
  const description = escapeHtml(post.seo_description || post.excerpt || '');
  const image = post.og_image_url || post.cover_image_url || '';
  const authorName = post.author ? escapeHtml(post.author.name) : 'HAMA Editorial';
  const published = post.published_at || '';
  const modified = post.updated_at || published;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seo_description || post.excerpt || '',
    image: image,
    url: url,
    datePublished: published,
    dateModified: modified,
    author: post.author
      ? { '@type': 'Person', name: post.author.name }
      : { '@type': 'Organization', name: 'HAMA' },
    publisher: {
      '@type': 'Organization',
      name: 'HAMA',
      logo: { '@type': 'ImageObject', url: `${baseUrl}/icon.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });

  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <script type="application/ld+json">${jsonLd}</script>`;
}

function generateBreadcrumbJsonLd(items) {
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
  return `<script type="application/ld+json">${jsonLd}</script>`;
}

function generateSiteMeta() {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#000000">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">`;
}

module.exports = { generateMeta, generateBreadcrumbJsonLd, generateSiteMeta, SITE_URL };
