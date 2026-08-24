const { createClient } = require('@supabase/supabase-js');
const { renderBlocks } = require('./lib/renderBlocks');
const { generateMeta, generateBreadcrumbJsonLd, generateSiteMeta } = require('./lib/seo');
const { setCacheHeaders } = require('./lib/cache');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function escape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
  : '';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  setCacheHeaders(res, 300);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const { slug } = req.query;
  if (!slug) return res.status(400).send('Missing slug');

  const baseUrl = `https://${req.headers.host}`;

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*), author:blog_authors(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  ${generateSiteMeta()}
  <title>404 - Article Not Found | HAMA Blog</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
    .btn { display: inline-block; margin-top: 24px; padding: 14px 32px; background: #FF6B00; color: #fff; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.9; text-decoration: none; }
  </style>
</head>
<body>
  <div>
    <h1 style="font-size:72px;color:#FF6B00;margin:0;line-height:1;">404</h1>
    <p style="font-size:18px;margin:16px 0 4px;color:rgba(255,255,255,0.7);">Article not found</p>
    <p style="font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:8px;">The article you're looking for doesn't exist or has been removed.</p>
    <a href="/blog" class="btn">Back to Discover</a>
  </div>
</body>
</html>`);
  }

  // Increment view count (fire-and-forget)
  supabase.rpc('increment_post_views', { post_id: post.id }).catch(() => {});

  // Fetch related articles from same category
  let relatedPosts = [];
  if (post.category_id) {
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, cover_image_url, reading_time, published_at')
      .eq('category_id', post.category_id)
      .eq('status', 'published')
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(3);
    relatedPosts = data || [];
  }

  // Fetch prev/next
  let prevPost = null;
  let nextPost = null;
  {
    const { data: prev } = await supabase
      .from('blog_posts')
      .select('slug, title')
      .eq('status', 'published')
      .lt('published_at', post.published_at)
      .order('published_at', { ascending: false })
      .limit(1)
      .single();
    prevPost = prev;
  }
  {
    const { data: next } = await supabase
      .from('blog_posts')
      .select('slug, title')
      .eq('status', 'published')
      .gt('published_at', post.published_at)
      .order('published_at', { ascending: true })
      .limit(1)
      .single();
    nextPost = next;
  }

  const metaTags = generateMeta(post);
  const breadcrumbs = generateBreadcrumbJsonLd([
    { name: 'Home', url: baseUrl },
    { name: 'Discover', url: `${baseUrl}/blog` },
    ...(post.category ? [{ name: post.category.name, url: `${baseUrl}/blog/category/${post.category.slug}` }] : []),
    { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
  ]);

  const heroImage = post.cover_image_url
    ? `<div style="width:100%;max-width:1200px;margin:0 auto 32px;border-radius:16px;overflow:hidden;aspect-ratio:16/7;background:linear-gradient(135deg,#1a1a1a,#0a0a0a);">
        <img src="${escape(post.cover_image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>`
    : '';

  const authorAvatar = post.author && post.author.avatar_url
    ? `<img src="${escape(post.author.avatar_url)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
    : `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#FF6B00,#FF8A33);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;">${post.author ? post.author.name.charAt(0).toUpperCase() : 'H'}</div>`;

  const renderedContent = renderBlocks(post.content_blocks || []);

  const relatedSection = relatedPosts.length ? `
    <section style="padding:64px 0;border-top:1px solid rgba(255,255,255,0.08);">
      <h2 style="font-size:22px;font-weight:700;margin-bottom:24px;letter-spacing:-0.02em;">You might also like</h2>
      <div class="grid-3">
        ${relatedPosts.map(r => `
          <a href="/blog/${escape(r.slug)}" style="display:block;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;text-decoration:none;color:#fff;transition:transform 0.15s;"
             onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            ${r.cover_image_url
              ? `<img src="${escape(r.cover_image_url)}" alt="" style="width:100%;height:140px;object-fit:cover;display:block;">`
              : `<div style="height:140px;background:linear-gradient(135deg,#1a1a1a,#0a0a0a);display:flex;align-items:center;justify-content:center;"><span style="color:rgba(255,255,255,0.1);font-size:36px;">H</span></div>`}
            <div style="padding:16px;">
              <h4 style="font-size:15px;font-weight:600;line-height:1.3;margin:0 0 8px;">${escape(r.title)}</h4>
              ${r.excerpt ? `<p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escape(r.excerpt)}</p>` : ''}
              <span style="font-size:12px;color:rgba(255,255,255,0.4);">${r.reading_time || 5} min read</span>
            </div>
          </a>
        `).join('')}
      </div>
    </section>` : '';

  const prevNextNav = (prevPost || nextPost) ? `
    <nav style="display:flex;justify-content:space-between;gap:16px;padding:32px 0;border-top:1px solid rgba(255,255,255,0.08);margin-top:48px;">
      ${prevPost
        ? `<a href="/blog/${escape(prevPost.slug)}" style="flex:1;display:block;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;text-decoration:none;color:#fff;transition:border-color 0.15s;text-align:left;"
             onmouseover="this.style.borderColor='rgba(255,107,0,0.3)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
            <span style="display:block;font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:4px;">← Previous</span>
            <span style="font-size:15px;font-weight:600;">${escape(prevPost.title)}</span>
          </a>`
        : '<div style="flex:1;"></div>'}
      ${nextPost
        ? `<a href="/blog/${escape(nextPost.slug)}" style="flex:1;display:block;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;text-decoration:none;color:#fff;transition:border-color 0.15s;text-align:right;"
             onmouseover="this.style.borderColor='rgba(255,107,0,0.3)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
            <span style="display:block;font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:4px;">Next →</span>
            <span style="font-size:15px;font-weight:600;">${escape(nextPost.title)}</span>
          </a>`
        : '<div style="flex:1;"></div>'}
    </nav>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  ${generateSiteMeta()}
  ${metaTags}
  ${breadcrumbs}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; line-height: 1.7; -webkit-font-smoothing: antialiased; }
    a { color: #FF6B00; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 720px; margin: 0 auto; padding: 0 24px; }

    nav { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 16px 0; }
    nav .container { display: flex; align-items: center; gap: 16px; }
    .nav-logo { font-size: 20px; font-weight: 800; color: #FF6B00; text-decoration: none; }
    .nav-back { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 14px; display: flex; align-items: center; gap: 6px; }
    .nav-back:hover { color: #fff; text-decoration: none; }

    .progress-bar { position: fixed; top: 0; left: 0; height: 3px; background: #FF6B00; z-index: 200; width: 0; animation: fillProgress 0.8s ease-out 0.3s forwards; }
    @keyframes fillProgress { to { width: 100%; } }

    .hero { padding: 48px 0 32px; }
    .category-badge { display: inline-block; background: #FF6B00; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; text-decoration: none; margin-bottom: 16px; transition: opacity 0.15s; }
    .category-badge:hover { opacity: 0.9; text-decoration: none; }
    .hero h1 { font-size: clamp(28px, 4vw, 42px); font-weight: 800; line-height: 1.15; margin-bottom: 16px; letter-spacing: -0.03em; }
    .hero p { font-size: 18px; color: rgba(255,255,255,0.6); line-height: 1.6; }

    .author-row { display: flex; align-items: center; gap: 12px; padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 40px; font-size: 14px; color: rgba(255,255,255,0.5); }
    .author-row .dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.2); flex-shrink: 0; }

    .content h2 { font-size: 26px; font-weight: 700; margin: 40px 0 16px; letter-spacing: -0.02em; }
    .content h3 { font-size: 21px; font-weight: 600; margin: 32px 0 12px; }
    .content p { margin-bottom: 18px; color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.8; }
    .content img { max-width: 100%; border-radius: 12px; margin: 24px 0; display: block; }
    .content blockquote { border-left: 3px solid #FF6B00; padding: 16px 20px; margin: 24px 0; background: rgba(255,107,0,0.05); border-radius: 0 12px 12px 0; color: rgba(255,255,255,0.7); font-style: italic; }
    .content ul, .content ol { margin: 20px 0; padding-left: 24px; }
    .content li { margin-bottom: 8px; color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.7; }
    .content a { color: #FF6B00; text-decoration: underline; text-underline-offset: 2px; }
    .content code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    .content figure { margin: 28px 0; }
    .content figcaption { margin-top: 8px; font-size: 13px; color: rgba(255,255,255,0.45); text-align: center; font-style: italic; }

    .callout { padding: 16px 20px; border-radius: 12px; margin: 24px 0; border-left: 3px solid; }
    .callout-info { background: rgba(59,130,246,0.08); border-color: #3b82f6; }
    .callout-tip { background: rgba(16,185,129,0.08); border-color: #10b981; }
    .callout-warning { background: rgba(245,158,11,0.08); border-color: #f59e0b; }
    .callout-success { background: rgba(20,184,166,0.08); border-color: #14b8a6; }

    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

    .newsletter { background: linear-gradient(135deg, rgba(255,107,0,0.1), rgba(255,107,0,0.02)); border: 1px solid rgba(255,107,0,0.2); border-radius: 16px; padding: 48px; text-align: center; margin: 48px 0; }
    .newsletter h2 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .newsletter p { color: rgba(255,255,255,0.6); margin-bottom: 24px; }
    .newsletter-form { display: flex; gap: 12px; max-width: 460px; margin: 0 auto; }
    .newsletter-form input { flex: 1; padding: 14px 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #fff; font-size: 15px; outline: none; transition: border-color 0.2s; }
    .newsletter-form input:focus { border-color: #FF6B00; }
    .newsletter-form input::placeholder { color: rgba(255,255,255,0.35); }
    .newsletter-form button { padding: 14px 28px; background: #FF6B00; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
    .newsletter-form button:hover { opacity: 0.9; }

    .footer { padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; color: rgba(255,255,255,0.3); font-size: 13px; }

    @media (max-width: 768px) {
      .grid-3 { grid-template-columns: 1fr; }
      .newsletter { padding: 32px 20px; }
      .newsletter-form { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="progress-bar"></div>
  <nav><div class="container" style="max-width:1200px;">
    <a href="/" class="nav-logo">HAMA</a>
    <a href="/blog" class="nav-back">← Discover</a>
  </div></nav>

  <article class="container">
    ${heroImage}

    <div class="hero">
      ${post.category ? `<a href="/blog/category/${escape(post.category.slug)}" class="category-badge">${escape(post.category.name)}</a>` : ''}
      <h1>${escape(post.title)}</h1>
      ${post.excerpt ? `<p>${escape(post.excerpt)}</p>` : ''}
    </div>

    <div class="author-row">
      ${authorAvatar}
      <span>${post.author ? escape(post.author.name) : 'HAMA Editorial'}</span>
      <span class="dot"></span>
      <span>${formatDate(post.published_at)}</span>
      <span class="dot"></span>
      <span>${post.reading_time || 5} min read</span>
    </div>

    <div class="content">
      ${renderedContent}
    </div>
  </article>

  <div class="container" style="max-width:1200px;">
    ${relatedSection}

    <div class="newsletter">
      <h2>Enjoyed this article?</h2>
      <p>Get more housing tips and Nairobi living insights delivered to your inbox.</p>
      <form class="newsletter-form" onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed!';this.querySelector('button').style.background='#10b981';">
        <input type="email" placeholder="your@email.com" required>
        <button type="submit">Subscribe</button>
      </form>
    </div>

    ${prevNextNav}
  </div>

  <footer class="footer"><div class="container" style="max-width:1200px;">
    <p>&copy; ${new Date().getFullYear()} HAMA. All rights reserved. Made with care in Nairobi.</p>
  </div></footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
