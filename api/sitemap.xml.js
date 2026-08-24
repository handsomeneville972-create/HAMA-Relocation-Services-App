const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

module.exports = async function handler(req, res) {
  const baseUrl = `https://${req.headers.host}`;
  const urls = [];

  // ── Static Pages ──────────────────────────────────────────────
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/About', priority: '0.7', changefreq: 'monthly' },
    { path: '/Faq', priority: '0.6', changefreq: 'monthly' },
    { path: '/Legal', priority: '0.5', changefreq: 'yearly' },
    { path: '/PrivacyPolicy', priority: '0.5', changefreq: 'yearly' },
    { path: '/Search', priority: '0.8', changefreq: 'daily' },
    { path: '/Blog', priority: '0.9', changefreq: 'daily' },
    { path: '/ExploreNeighborhoods', priority: '0.8', changefreq: 'weekly' },
  ];

  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${baseUrl}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // ── Blog Posts (by slug) ──────────────────────────────────────
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (posts) {
      for (const p of posts) {
        const lastmod = (p.updated_at || p.published_at || '').split('T')[0];
        urls.push(`  <url>
    <loc>${baseUrl}/BlogPost?slug=${p.slug}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }
  } catch (e) {
    // Skip blog posts if query fails
  }

  // ── Blog Categories (by slug) ────────────────────────────────
  try {
    const { data: categories } = await supabase
      .from('blog_categories')
      .select('slug');

    if (categories) {
      for (const c of categories) {
        urls.push(`  <url>
    <loc>${baseUrl}/BlogCategory?slug=${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }
  } catch (e) {
    // Skip categories if query fails
  }

  // ── Properties (by id) ───────────────────────────────────────
  try {
    const { data: properties } = await supabase
      .from('properties')
      .select('id, updated_at')
      .order('created_at', { ascending: false });

    if (properties) {
      for (const p of properties) {
        const lastmod = p.updated_at ? p.updated_at.split('T')[0] : '';
        urls.push(`  <url>
    <loc>${baseUrl}/PropertyDetail?propertyId=${p.id}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }
  } catch (e) {
    // Skip properties if query fails
  }

  // ── Products (by id) ─────────────────────────────────────────
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at')
      .order('created_at', { ascending: false });

    if (products) {
      for (const p of products) {
        const lastmod = p.updated_at ? p.updated_at.split('T')[0] : '';
        urls.push(`  <url>
    <loc>${baseUrl}/ProductDetail?productId=${p.id}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }
  } catch (e) {
    // Skip products if query fails
  }

  // ── Service Providers (by id) ────────────────────────────────
  try {
    const { data: providers } = await supabase
      .from('service_providers')
      .select('id, updated_at')
      .order('created_at', { ascending: false });

    if (providers) {
      for (const sp of providers) {
        const lastmod = sp.updated_at ? sp.updated_at.split('T')[0] : '';
        urls.push(`  <url>
    <loc>${baseUrl}/ServiceProviderProfile?providerId=${sp.id}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }
  } catch (e) {
    // Skip service providers if query fails
  }

  // ── Neighborhoods (by id) ────────────────────────────────────
  try {
    const { data: neighborhoods } = await supabase
      .from('neighborhoods')
      .select('id')
      .order('rating', { ascending: false });

    if (neighborhoods) {
      for (const n of neighborhoods) {
        urls.push(`  <url>
    <loc>${baseUrl}/NeighborhoodDetail?id=${n.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }
  } catch (e) {
    // Skip neighborhoods if query fails
  }

  // ── Build XML ────────────────────────────────────────────────
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(xml);
};
