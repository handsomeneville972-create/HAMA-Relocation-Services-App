function setCacheHeaders(res, maxAge = 60) {
  const staleWhileRevalidate = maxAge * 10;
  res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

module.exports = { setCacheHeaders };
