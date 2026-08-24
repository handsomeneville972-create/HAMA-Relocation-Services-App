const { createClient } = require('@supabase/supabase-js');
const { generateSiteMeta } = require('./lib/seo');
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

const readingTime = (p) => p.reading_time ? `${p.reading_time} min read` : '5 min read';

function articleCard(p) {
  const img = p.cover_image_url
    ? `<img src="${escape(p.cover_image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;" loading="lazy">`
    : '<span style="color:rgba(255,255,255,0.1);font-size:48px;">H</span>';
  const cat = p.category
    ? `<span style="position:absolute;top:12px;left:12px;background:#FF6B00;color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${escape(p.category.name)}</span>`
    : '';
  return `
    <a href="/blog/${escape(p.slug)}" style="display:block;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;text-decoration:none;color:#fff;transition:transform 0.2s ease-out,box-shadow 0.2s ease-out;"
       onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 32px rgba(255,107,0,0.15)'"
       onmouseout="this.style.transform='none';this.style.boxShadow='none'">
      <div style="height:180px;background:linear-gradient(135deg,#1a1a1a,#0a0a0a);display:flex;align-items:center;justify-content:center;position:relative;">
        ${img}
        ${cat}
      </div>
      <div style="padding:16px;">
        <h3 style="margin:0 0 8px;font-size:17px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escape(p.title)}</h3>
        ${p.excerpt ? `<p style="margin:0 0 12px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escape(p.excerpt)}</p>` : ''}
        <div style="display:flex;align-items:center;gap:12px;font-size:12px;color:rgba(255,255,255,0.4);">
          <span>${readingTime(p)}</span>
          <span>${formatDate(p.published_at)}</span>
        </div>
      </div>
    </a>`;
}

function neighbourhoodCard(title, subtitle, icon) {
  return `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center;transition:transform 0.2s ease-out,box-shadow 0.2s ease-out;cursor:pointer;"
         onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(255,107,0,0.1)'"
         onmouseout="this.style.transform='none';this.style.boxShadow='none'">
      <div style="font-size:32px;margin-bottom:8px;">${icon}</div>
      <h3 style="font-size:16px;font-weight:600;margin:0 0 4px;">${escape(title)}</h3>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;">${escape(subtitle)}</p>
    </div>`;
}

function serviceCard(title, desc, icon) {
  return `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;transition:transform 0.2s ease-out,box-shadow 0.2s ease-out;cursor:pointer;"
         onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(255,107,0,0.1)'"
         onmouseout="this.style.transform='none';this.style.boxShadow='none'">
      <div style="font-size:28px;margin-bottom:12px;">${icon}</div>
      <h3 style="font-size:16px;font-weight:600;margin:0 0 8px;">${escape(title)}</h3>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0;">${escape(desc)}</p>
    </div>`;
}

function movingGuideCard(title, desc) {
  return `
    <div style="background:linear-gradient(135deg,rgba(255,107,0,0.08),rgba(255,107,0,0.02));border:1px solid rgba(255,107,0,0.15);border-radius:12px;padding:24px;transition:transform 0.2s ease-out,box-shadow 0.2s ease-out;cursor:pointer;"
         onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(255,107,0,0.12)'"
         onmouseout="this.style.transform='none';this.style.boxShadow='none'">
      <h3 style="font-size:16px;font-weight:600;margin:0 0 8px;color:#FF6B00;">${escape(title)}</h3>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0;">${escape(desc)}</p>
    </div>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  setCacheHeaders(res, 60);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const baseUrl = `https://${req.headers.host}`;

  let posts = [];
  let categories = [];
  let featured = null;

  try {
    const [postsResult, categoriesResult, featuredResult] = await Promise.all([
      supabase.from('blog_posts')
        .select('*, category:blog_categories(*), author:blog_authors(*)')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20),
      supabase.from('blog_categories')
        .select('*')
        .order('position'),
      supabase.from('blog_posts')
        .select('*, category:blog_categories(*), author:blog_authors(*)')
        .eq('status', 'published')
        .eq('featured', true)
        .limit(1),
    ]);
    posts = postsResult.data || [];
    categories = categoriesResult.data || [];
    featured = featuredResult.data?.[0] || null;
  } catch (e) {
    // Supabase table may not exist yet — use fallback content
  }

  if (!featured && posts.length > 0) featured = posts[0];

  const fallbackCategories = categories.length ? categories : [
    { name: 'Renting', slug: 'renting' },
    { name: 'Moving', slug: 'moving' },
    { name: 'Neighbourhoods', slug: 'neighbourhoods' },
    { name: 'Home Design', slug: 'home-design' },
    { name: 'Legal', slug: 'legal' },
  ];

  const neighbourhoods = [
    { title: 'Westlands', subtitle: 'Business & nightlife hub', icon: '🏙️' },
    { title: 'Kilimani', subtitle: 'Family-friendly & central', icon: '🏡' },
    { title: 'Lavington', subtitle: 'Quiet & leafy suburb', icon: '🌳' },
    { title: 'Karen', subtitle: 'Upscale & spacious', icon: '🌿' },
    { title: 'Kasarani', subtitle: 'Affordable & growing', icon: '🏗️' },
    { title: 'Runda', subtitle: 'Secure & exclusive', icon: '🔒' },
  ];

  const services = [
    { title: 'Find Properties', desc: 'Browse verified rental listings across Nairobi with photos, prices, and agent details.', icon: '🏠' },
    { title: 'Home Services', desc: 'Connect with trusted cleaners, movers, plumbers, and electricians in your area.', icon: '🔧' },
    { title: 'Marketplace', desc: 'Buy and sell furniture, appliances, and household items from verified sellers.', icon: '🛒' },
  ];

  const movingGuides = [
    { title: 'First-Time Renter\'s Guide', desc: 'Everything you need to know before signing your first lease in Nairobi.' },
    { title: 'Moving Checklist', desc: 'A step-by-step checklist to make your move stress-free and organised.' },
  ];

  const bannerImages = [
    '/blog-images/banner1.jpg',
    '/blog-images/banner2.jpg',
    '/blog-images/banner3.jpg',
    '/blog-images/banner4.jpg',
    '/blog-images/banner5.jpg',
  ];

  const featuredSection = featured ? `
    <section style="padding:0 0 48px;">
      <a href="/blog/${escape(featured.slug)}" style="text-decoration:none;color:#fff;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;transition:box-shadow 0.2s ease-out;"
             onmouseover="this.style.boxShadow='0 8px 40px rgba(255,107,0,0.12)'"
             onmouseout="this.style.boxShadow='none'">
          <div style="min-height:300px;background:linear-gradient(135deg,#1a1a1a,#0a0a0a);display:flex;align-items:center;justify-content:center;">
            ${featured.cover_image_url
              ? `<img src="${escape(featured.cover_image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`
              : '<span style="color:rgba(255,255,255,0.1);font-size:80px;">H</span>'}
          </div>
          <div style="padding:32px;display:flex;flex-direction:column;justify-content:center;">
            ${featured.category ? `<span style="display:inline-block;background:#FF6B00;color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px;width:fit-content;">${escape(featured.category.name)}</span>` : ''}
            <h2 style="font-size:28px;font-weight:700;line-height:1.2;margin-bottom:12px;letter-spacing:-0.02em;">${escape(featured.title)}</h2>
            ${featured.excerpt ? `<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin-bottom:20px;">${escape(featured.excerpt)}</p>` : ''}
            <div style="display:flex;gap:16px;font-size:13px;color:rgba(255,255,255,0.4);">
              <span>${featured.author ? escape(featured.author.name) : 'HAMA'}</span>
              <span>·</span>
              <span>${readingTime(featured)}</span>
              <span>·</span>
              <span>${formatDate(featured.published_at)}</span>
            </div>
          </div>
        </div>
      </a>
    </section>` : '';

  const otherPosts = featured ? posts.filter(p => p.id !== featured.id) : posts;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  ${generateSiteMeta()}
  <title>Discover | HAMA - Housing Knowledge Hub</title>
  <meta name="description" content="Your housing knowledge hub. Guides, tips, and insights for renting, moving, and living in Nairobi.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Discover | HAMA">
  <meta property="og:description" content="Your housing knowledge hub.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}/blog">
  <link rel="canonical" href="${baseUrl}/blog">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; line-height: 1.6; -webkit-font-smoothing: antialiased; }
    a { color: #FF6B00; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    nav { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 16px 0; }
    nav .container { display: flex; align-items: center; justify-content: space-between; }
    .nav-logo { font-size: 20px; font-weight: 800; color: #FF6B00; text-decoration: none; }
    .nav-links { display: flex; gap: 28px; }
    .nav-links a { color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 500; transition: color 0.15s; text-decoration: none; }
    .nav-links a:hover { color: #fff; }
    .nav-links a.active { color: #FF6B00; }

    .hero { padding: 60px 0 48px; text-align: center; background: linear-gradient(180deg, rgba(255,107,0,0.06) 0%, #000 100%); }
    .hero h1 { font-size: clamp(32px, 5vw, 52px); font-weight: 800; margin-bottom: 12px; letter-spacing: -0.03em; }
    .hero h1 span { color: #FF6B00; }
    .hero p { font-size: 18px; color: rgba(255,255,255,0.6); margin-bottom: 32px; max-width: 520px; margin-left: auto; margin-right: auto; }

    .banner-carousel { position: relative; height: 280px; border-radius: 16px; overflow: hidden; margin-bottom: 48px; background: linear-gradient(135deg,#1a1a1a,#0a0a0a); }
    .banner-carousel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.8s ease-in-out; }
    .banner-carousel img.active { opacity: 1; }
    .banner-dots { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 2; }
    .banner-dots span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); transition: background 0.3s; }
    .banner-dots span.active { background: #FF6B00; width: 24px; border-radius: 4px; }

    .categories { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 48px; justify-content: center; }
    .cat-pill { padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 500; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.15s; text-decoration: none; }
    .cat-pill:hover { background: #FF6B00; color: #fff; border-color: #FF6B00; text-decoration: none; }

    .section { padding: 48px 0; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .section-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .section-link { font-size: 14px; color: #FF6B00; font-weight: 500; text-decoration: none; }
    .section-link:hover { text-decoration: underline; }

    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .grid-6 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }

    .newsletter { background: linear-gradient(135deg, rgba(255,107,0,0.1), rgba(255,107,0,0.02)); border: 1px solid rgba(255,107,0,0.2); border-radius: 16px; padding: 48px; text-align: center; margin: 48px 0; }
    .newsletter h2 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .newsletter p { color: rgba(255,255,255,0.6); margin-bottom: 24px; }
    .newsletter-form { display: flex; gap: 12px; max-width: 460px; margin: 0 auto; }
    .newsletter-form input { flex: 1; padding: 14px 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #fff; font-size: 15px; outline: none; transition: border-color 0.2s; }
    .newsletter-form input:focus { border-color: #FF6B00; }
    .newsletter-form input::placeholder { color: rgba(255,255,255,0.35); }
    .newsletter-form button { padding: 14px 28px; background: #FF6B00; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
    .newsletter-form button:hover { opacity: 0.9; }

    .footer { padding: 48px 0 32px; border-top: 1px solid rgba(255,255,255,0.08); }
    .footer-grid { display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 40px; margin-bottom: 32px; }
    .footer-brand { font-size: 20px; font-weight: 800; color: #FF6B00; margin-bottom: 8px; }
    .footer-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.6; }
    .footer-col h4 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
    .footer-col a { display: block; font-size: 14px; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 10px; transition: color 0.15s; }
    .footer-col a:hover { color: #FF6B00; }
    .footer-bottom { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); font-size: 13px; }

    @media (max-width: 1024px) {
      .grid-6 { grid-template-columns: repeat(3, 1fr); }
      .footer-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
      .grid-3 { grid-template-columns: repeat(2, 1fr); }
      .grid-6 { grid-template-columns: repeat(2, 1fr); }
      .banner-carousel { height: 200px; }
      .featured-card-mobile { grid-template-columns: 1fr !important; }
      .nav-links { display: none; }
      .newsletter { padding: 32px 20px; }
      .newsletter-form { flex-direction: column; }
      .footer-grid { grid-template-columns: 1fr; gap: 32px; }
    }
    @media (max-width: 480px) {
      .grid-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <nav><div class="container">
    <a href="/" class="nav-logo">HAMA</a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/blog" class="active">Discover</a>
      <a href="/search">Properties</a>
      <a href="/marketplace">Marketplace</a>
      <a href="/services">Services</a>
    </div>
  </div></nav>

  <section class="hero"><div class="container">
    <h1>Discover <span>Housing Insights</span></h1>
    <p>Guides, tips, and insights for renting, moving, and living in Nairobi.</p>
  </div></section>

  <div class="container">
    <div class="banner-carousel" id="bannerCarousel">
      ${bannerImages.map((src, i) => `<img src="${src}" alt="HAMA blog banner ${i + 1}" class="${i === 0 ? 'active' : ''}" onerror="this.style.display='none'">`).join('')}
      <div class="banner-dots">
        ${bannerImages.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('')}
      </div>
    </div>

    <div class="categories">
      ${fallbackCategories.map(c => `<a href="/blog/category/${escape(c.slug)}" class="cat-pill">${escape(c.name)}</a>`).join('')}
    </div>

    ${featuredSection}

    ${otherPosts.length ? `
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Latest Articles</h2>
      </div>
      <div class="grid-2">
        ${otherPosts.map(articleCard).join('')}
      </div>
    </section>` : ''}

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Explore Neighbourhoods</h2>
        <a href="/search" class="section-link">View all →</a>
      </div>
      <div class="grid-6">
        ${neighbourhoods.map(n => neighbourhoodCard(n.title, n.subtitle, n.icon)).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Home Services</h2>
        <a href="/services" class="section-link">View all →</a>
      </div>
      <div class="grid-3">
        ${services.map(s => serviceCard(s.title, s.desc, s.icon)).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Moving Guides</h2>
      </div>
      <div class="grid-2">
        ${movingGuides.map(g => movingGuideCard(g.title, g.desc)).join('')}
      </div>
    </section>

    <div class="newsletter">
      <h2>Stay in the loop</h2>
      <p>Get the latest housing tips and Nairobi living insights delivered to your inbox.</p>
      <form class="newsletter-form" onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed!';this.querySelector('button').style.background='#10b981';">
        <input type="email" placeholder="your@email.com" required>
        <button type="submit">Subscribe</button>
      </form>
    </div>
  </div>

  <footer class="footer"><div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">HAMA</div>
        <p class="footer-desc">Your housing knowledge hub. Find properties, services, and everything you need to thrive in Nairobi.</p>
      </div>
      <div class="footer-col">
        <h4>Discover</h4>
        <a href="/blog">Blog</a>
        <a href="/blog/category/renting">Renting Guides</a>
        <a href="/blog/category/moving">Moving Tips</a>
        <a href="/blog/category/neighbourhoods">Neighbourhoods</a>
      </div>
      <div class="footer-col">
        <h4>Platform</h4>
        <a href="/search">Find Properties</a>
        <a href="/marketplace">Marketplace</a>
        <a href="/services">Services</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="/">Home</a>
        <a href="/blog">Blog</a>
      </div>
    </div>
    <div class="footer-bottom">
      &copy; ${new Date().getFullYear()} HAMA. All rights reserved. Made with care in Nairobi.
    </div>
  </div></footer>

  <script>
    (function() {
      const carousel = document.getElementById('bannerCarousel');
      if (!carousel) return;
      const slides = carousel.querySelectorAll('img');
      const dots = carousel.querySelectorAll('.banner-dots span');
      if (slides.length < 2) return;
      let current = 0;
      setInterval(() => {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
      }, 4000);
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
