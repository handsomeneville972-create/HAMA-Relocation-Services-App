function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInlineContent(node) {
  if (!node) return '';
  if (typeof node === 'string') return escapeHtml(node);
  if (node.text !== undefined) {
    let text = escapeHtml(node.text);
    if (node.bold) text = `<strong>${text}</strong>`;
    if (node.italic) text = `<em>${text}</em>`;
    if (node.underline) text = `<u>${text}</u>`;
    if (node.strikethrough) text = `<s>${text}</s>`;
    if (node.code) {
      text = `<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:0.9em;">${text}</code>`;
    }
    return text;
  }
  if (node.type === 'link') {
    const href = escapeHtml(node.url || node.fields?.url || '#');
    return `<a href="${href}" target="_blank" rel="noopener" style="color:#FF8A33;text-decoration:underline;text-underline-offset:2px;">${(node.children || []).map(renderInlineContent).join('')}</a>`;
  }
  if (node.children) {
    return node.children.map(renderInlineContent).join('');
  }
  return '';
}

function renderTextBlock(block) {
  if (!block.children) return '';
  return block.children.map(inline => renderInlineContent(inline)).join('');
}

function renderBlocks(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return '<p style="color:rgba(255,255,255,0.4);font-style:italic;">No content available.</p>';
  }

  return blocks.map(block => {
    switch (block.type) {
      case 'heading': {
        const level = block.level || 2;
        const tag = `h${level}`;
        const sizes = { 1: '32px', 2: '26px', 3: '21px', 4: '18px' };
        return `<${tag} style="font-size:${sizes[level] || '22px'};font-weight:700;margin:40px 0 16px;line-height:1.3;letter-spacing:-0.01em;">${renderTextBlock(block)}</${tag}>`;
      }

      case 'paragraph':
        return `<p style="margin-bottom:18px;color:rgba(255,255,255,0.85);font-size:16px;line-height:1.8;">${renderTextBlock(block)}</p>`;

      case 'image': {
        const src = escapeHtml(block.url || block.src || block.fields?.url || '');
        const alt = escapeHtml(block.alt || block.altText || block.fields?.alt || '');
        const caption = block.caption || block.fields?.caption || '';
        return `<figure style="margin:28px 0;">
          <img src="${src}" alt="${alt}" style="width:100%;border-radius:12px;display:block;" loading="lazy">
          ${caption ? `<figcaption style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.45);text-align:center;font-style:italic;">${escapeHtml(caption)}</figcaption>` : ''}
        </figure>`;
      }

      case 'quote':
        return `<blockquote style="border-left:3px solid #FF6B00;padding:16px 20px;margin:24px 0;background:rgba(255,107,0,0.05);border-radius:0 12px 12px 0;color:rgba(255,255,255,0.7);font-style:italic;font-size:16px;line-height:1.7;">${renderTextBlock(block)}</blockquote>`;

      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        const items = (block.items || block.children || []).map(item => {
          const content = typeof item === 'string' ? escapeHtml(item) : renderTextBlock(item);
          return `<li style="margin-bottom:8px;color:rgba(255,255,255,0.85);font-size:16px;line-height:1.7;">${content}</li>`;
        }).join('');
        return `<${tag} style="margin:20px 0;padding-left:24px;">${items}</${tag}>`;
      }

      case 'callout': {
        const tones = {
          info: { bg: 'rgba(59,130,246,0.08)', border: '#3b82f6', icon: 'ℹ️' },
          tip: { bg: 'rgba(16,185,129,0.08)', border: '#10b981', icon: '💡' },
          warning: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', icon: '⚠️' },
          success: { bg: 'rgba(20,184,166,0.08)', border: '#14b8a6', icon: '✅' },
        };
        const tone = tones[block.tone] || tones.info;
        return `<div class="callout callout-${block.tone || 'info'}" style="padding:16px 20px;border-radius:12px;margin:24px 0;border-left:3px solid ${tone.border};background:${tone.bg};color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;">
          <span style="margin-right:6px;">${tone.icon}</span>
          ${renderTextBlock(block)}
        </div>`;
      }

      case 'divider':
        return `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0;">`;

      case 'faq': {
        const question = escapeHtml(block.question || block.title || '');
        const answer = renderTextBlock(block);
        return `<details style="margin:16px 0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
          <summary style="padding:16px 20px;font-weight:600;font-size:16px;cursor:pointer;color:#fff;list-style:none;display:flex;align-items:center;justify-content:space-between;">
            <span>${question}</span>
            <span style="color:#FF6B00;font-size:18px;">+</span>
          </summary>
          <div style="padding:0 20px 16px;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;">${answer}</div>
        </details>`;
      }

      case 'table': {
        const headers = block.headers || [];
        const rows = block.rows || [];
        const headerCells = headers.map(h =>
          `<th style="padding:12px 16px;text-align:left;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);">${escapeHtml(h)}</th>`
        ).join('');
        const bodyRows = rows.map(row => {
          const cells = row.map(cell =>
            `<td style="padding:12px 16px;font-size:14px;color:rgba(255,255,255,0.8);border-bottom:1px solid rgba(255,255,255,0.05);">${escapeHtml(cell)}</td>`
          ).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
        return `<div style="margin:24px 0;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`;
      }

      case 'checklist': {
        const items = (block.items || []).map(item => {
          const checked = item.checked ? '#10b981' : 'rgba(255,255,255,0.2)';
          const check = item.checked ? '✓' : '';
          const content = typeof item.text === 'string' ? escapeHtml(item.text) : renderTextBlock(item);
          return `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;list-style:none;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;border:2px solid ${checked};color:${checked};font-size:12px;flex-shrink:0;margin-top:2px;font-weight:700;">${check}</span>
            <span>${content}</span>
          </li>`;
        }).join('');
        return `<ul style="margin:20px 0;padding:0;">${items}</ul>`;
      }

      default:
        if (block.children) return renderTextBlock(block);
        if (block.text) return `<p style="margin-bottom:18px;color:rgba(255,255,255,0.85);font-size:16px;line-height:1.8;">${renderInlineContent(block)}</p>`;
        return '';
    }
  }).join('');
}

module.exports = { renderBlocks, escapeHtml, renderInlineContent };
