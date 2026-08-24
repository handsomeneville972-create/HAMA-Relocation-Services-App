const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const baseUrl = `https://hamanasi.space`;

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase.from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('blog_categories')
      .select('slug'),
  ]);

  const urls = [];

  urls.push(`  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  urls.push(`  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);

  urls.push(`  <url>
    <loc>${baseUrl}/search</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

  urls.push(`  <url>
    <loc>${baseUrl}/marketplace</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

  urls.push(`  <url>
    <loc>${baseUrl}/services</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

  if (categories) {
    for (const c of categories) {
      urls.push(`  <url>
    <loc>${baseUrl}/blog/category/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  }

  if (posts) {
    for (const p of posts) {
      const lastmod = (p.updated_at || p.published_at || '').split('T')[0];
      urls.push(`  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=36000');
  res.status(200).send(xml);
};
