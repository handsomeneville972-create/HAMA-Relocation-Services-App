const { createClient } = require('@supabase/supabase-js');
const { generateCategorySEO } = require('./lib/seo');
const { setCacheHeaders } = require('./lib/cache');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

module.exports = async function handler(req, res) {
  setCacheHeaders(res, 300);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const slug = req.query?.slug || (req.url || '').split('/category/')[1]?.split('?')[0];
  if (!slug) {
    res.setHeader('Location', '/blog');
    return res.status(302).end();
  }

  const baseUrl = `https://${req.headers.host}`;

  const { data: category } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404 | HAMA Blog</title><style>body{font-family:system-ui,sans-serif;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;}.btn{display:inline-block;margin-top:24px;padding:12px 28px;background:#FF6B00;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;}</style></head><body><div><h1 style="font-size:72px;color:#FF6B00;margin:0;">404</h1><p style="font-size:18px;margin:12px 0;">Category not found</p><a href="/blog" class="btn">Back to Discover</a></div></body></html>`);
  }

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, cover_image_url, reading_time, published_at, views')
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const seo = generateCategorySEO(category, baseUrl);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const articleCard = (p) => `
    <a href="/blog/${p.slug}" style="display:block;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;text-decoration:none;color:#fff;transition:transform 0.15s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'">
      <div style="height:160px;background:linear-gradient(135deg,#1a1a1a,#0a0a0a);display:flex;align-items:center;justify-content:center;">
        ${p.cover_image_url ? `<img src="${p.cover_image_url}" alt="" style="width:100%;height:100%;object-fit:cover;" loading="lazy">` : '<span style="color:rgba(255,255,255,0.1);font-size:40px;">H</span>'}
      </div>
      <div style="padding:16px;">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.title}</h3>
        ${p.excerpt ? `<p style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.excerpt}</p>` : ''}
        <div style="display:flex;gap:12px;font-size:12px;color:rgba(255,255,255,0.4);">
          <span>${p.reading_time || 5} min read</span>
          <span>${formatDate(p.published_at)}</span>
        </div>
      </div>
    </a>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seo.title}</title>
  <meta name="description" content="${seo.description}">
  <link rel="canonical" href="${seo.canonical}">
  <meta property="og:title" content="${seo.title}">
  <meta property="og:description" content="${seo.description}">
  <meta property="og:type" content="website">
  <script type="application/ld+json">${seo.jsonLd}</script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; line-height: 1.6; -webkit-font-smoothing: antialiased; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    nav { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 16px 0; }
    nav .container { display: flex; align-items: center; gap: 16px; }
    .nav-logo { font-size: 20px; font-weight: 800; color: #FF6B00; text-decoration: none; }
    .nav-back { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 14px; }
    .nav-back:hover { color: #fff; }
    .hero { padding: 48px 0 32px; }
    .hero h1 { font-size: clamp(28px, 4vw, 42px); font-weight: 700; margin-bottom: 8px; }
    .hero p { font-size: 16px; color: rgba(255,255,255,0.5); margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding-bottom: 64px; }
    .footer { padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; color: rgba(255,255,255,0.35); font-size: 13px; }
    @media (max-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <nav><div class="container">
    <a href="/" class="nav-logo">HAMA</a>
    <a href="/blog" class="nav-back">&larr; Discover</a>
  </div></nav>

  <div class="hero"><div class="container">
    <h1>${category.name}</h1>
    ${category.description ? `<p>${category.description}</p>` : ''}
    <p style="color:rgba(255,255,255,0.4);font-size:14px;">${posts ? posts.length : 0} articles</p>
  </div></div>

  <div class="container">
    <div class="grid">
      ${posts ? posts.map(articleCard).join('') : '<p style="color:rgba(255,255,255,0.4);grid-column:1/-1;text-align:center;padding:48px 0;">No articles in this category yet.</p>'}
    </div>
  </div>

  <div class="footer"><div class="container">
    <p>&copy; ${new Date().getFullYear()} HAMA. All rights reserved.</p>
  </div></div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
