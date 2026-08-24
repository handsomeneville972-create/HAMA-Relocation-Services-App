const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const baseUrl = `https://hamanasi.space`;

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, published_at, cover_image_url, author:blog_authors(name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  const items = (posts || []).map(p => {
    const author = p.author ? escapeXml(p.author.name) : 'HAMA';
    const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : '';
    return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${baseUrl}/blog/${escapeXml(p.slug)}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${escapeXml(p.slug)}</guid>
      <description>${escapeXml(p.excerpt || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${author}</dc:creator>${p.cover_image_url ? `
      <enclosure url="${escapeXml(p.cover_image_url)}" length="0" type="image/jpeg"/>` : ''}
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HAMA Blog - Discover</title>
    <link>${baseUrl}/blog</link>
    <description>Your housing knowledge hub. Guides, tips, and insights for renting, moving, and living in Nairobi.</description>
    <language>en-KE</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=36000');
  res.status(200).send(rss);
};
