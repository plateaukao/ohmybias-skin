// SF Symbols 風格 inline SVG — iOS 版工具列圖示（對應 ohmybias-ios CandidateBar.swift
// 使用的 SF Symbol 名稱）。SF Symbols 字型有授權限制不能內嵌，改以手繪 SVG 模擬；
// stroke/fill 走 currentColor，跟著 toolbarColor 變色。

const S = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

export const SF_ICONS = {
  'gearshape':
    `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="12" r="5.6"/><circle cx="12" cy="12" r="2"/>` +
    ['M12 6.4 12 3.6', 'M12 17.6 12 20.4', 'M6.4 12 3.6 12', 'M17.6 12 20.4 12',
      'M8 8 6 6', 'M16 16 18 18', 'M16 8 18 6', 'M8 16 6 18']
      .map(d => `<path d="${d}"/>`).join('') + '</svg>',
  'chevron.down':
    `<svg viewBox="0 0 24 24" ${S}><path d="M6.5 9.5 12 15 17.5 9.5"/></svg>`,
  'heart.fill':
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.2C5.2 15 4.1 9.9 7.4 7.3c2-1.5 3.8-.7 4.6 1 .8-1.7 2.6-2.5 4.6-1 3.3 2.6 2.2 7.7-4.6 12.9Z"/></svg>',
  'curlybraces':
    `<svg viewBox="0 0 24 24" ${S}>` +
    '<path d="M9.2 3.8c-2 0-2 1.6-2 3.4 0 2.6-1.7 2.6-1.7 4.8 0 2.2 1.7 2.2 1.7 4.8 0 1.8 0 3.4 2 3.4"/>' +
    '<path d="M14.8 3.8c2 0 2 1.6 2 3.4 0 2.6 1.7 2.6 1.7 4.8 0 2.2-1.7 2.2-1.7 4.8 0 1.8 0 3.4-2 3.4"/></svg>',
  'face.smiling':
    `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="12" r="8.3"/>` +
    '<circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>' +
    '<circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>' +
    '<path d="M8.3 14.2c1 1.7 2.4 2.3 3.7 2.3s2.7-.6 3.7-2.3"/></svg>',
  'doc.on.clipboard':
    `<svg viewBox="0 0 24 24" ${S}>` +
    '<rect x="5" y="4.5" width="11" height="15.5" rx="2"/>' +
    '<path d="M8.2 4.5v-1a1 1 0 0 1 1-1h2.6a1 1 0 0 1 1 1v1"/>' +
    '<path d="M16 8h1.8a1.2 1.2 0 0 1 1.2 1.2V19a1.2 1.2 0 0 1-1.2 1.2h-6"/></svg>',
  'arrow.left':
    `<svg viewBox="0 0 24 24" ${S}><path d="M19 12H5.5"/><path d="M11 6 5 12l6 6"/></svg>`,
  'arrow.right':
    `<svg viewBox="0 0 24 24" ${S}><path d="M5 12h13.5"/><path d="M13 6l6 6-6 6"/></svg>`,
};

/// glyph 定義：字串（純文字，如 '米'）或 { icon: 'gearshape' }；回傳可 append 的節點
export function glyphNode(glyph) {
  if (glyph && typeof glyph === 'object' && glyph.icon) {
    const span = document.createElement('span');
    span.className = 'sf-icon';
    span.innerHTML = SF_ICONS[glyph.icon] || '';
    return span;
  }
  return document.createTextNode(typeof glyph === 'string' ? glyph : '');
}
