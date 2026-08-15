// 鍵盤預覽 — 幾何與取色演算法逐行對照 App 端：
// KeyboardView.onLayout（padding 6/6/3、列距 8、鍵距 5、圓角 8、字母頁第二列置中、
// 含空白鍵的列以前列單位寬定寬、空白吃剩餘）、KeyButton.onDraw、CandidateBar、
// CollectionPanelView、LongPressPopup。設計寬 393dp、鍵盤本體 224dp、候選列 46dp。
// --u CSS 變數 = 實際像素/393，全部尺寸以 calc(var(--u) * N) 縮放。

import {
  SWIPE_UP, SWIPE_DOWN, TOOLBAR_ITEMS, PANEL_SYMBOLS, PANEL_EMOJIS,
  BUBBLE_SAMPLE_UPPER_FIRST, BUBBLE_SAMPLE_LOWER_FIRST,
} from './data.js';
import { glyphNode } from './icons.js';

const W = 393, BODY_H = 224, BAR_H = 46;
const PAD_TOP = 6, PAD_BOTTOM = 6, PAD_SIDE = 3, ROW_SPACING = 8, KEY_SPACING = 5;
const RADIUS = 8;

function u(n) { return `calc(var(--u) * ${n})`; }

function el(cls, text) {
  const d = document.createElement('div');
  d.className = cls;
  if (text !== undefined) d.textContent = text;
  return d;
}

/// 調色 — state.palette 已於載入時補滿所有鍵，直接取用（#RRGGBBAA 尾端 alpha 與 CSS 相同）
function pal(state, dark, key) {
  return state.palette[dark ? 'dark' : 'light'][key];
}
function borderSize(state, dark) {
  const v = state.palette[dark ? 'dark' : 'light'].borderSize;
  return typeof v === 'number' ? v : 1;
}

// MARK: - 版面定義（對照 KeyboardView letterRows/numberRows/numeric9Rows）

function letterRows(state) {
  const hint = (m, on) => (on ? m : null);
  const upOn = state.swipe.swipeUp && state.swipe.showSwipeUpText;
  const downOn = state.swipe.swipeDown && state.swipe.showSwipeDownText;
  const key = (s) => ({ label: s, up: hint(SWIPE_UP[s], upOn), down: hint(SWIPE_DOWN[s], downOn) });
  const r1 = [...'qwertyuiop'].map(key);
  const r2 = [...'asdfghjkl'].map(key);
  const r3 = [{ label: '英', special: true, mult: 1 }, ...[...'zxcvbnm'].map(key),
    { label: '⌫', special: true, mult: 1.4 }];
  const show123 = !state.toolbarButtons.includes(9) && !state.toolbarButtons.includes(29);
  const r4 = [];
  if (show123) r4.push({ label: '123', special: true });
  r4.push({ label: '🌐', special: true });
  r4.push({ label: ',' });
  r4.push({ label: '', space: true });
  r4.push({ label: '。' });
  r4.push({ label: '⏎', special: true, mult: 1.4, up: upOn ? 'ㄅ' : null });
  return [r1, r2, r3, r4];
}

function numberRows() {
  const r1 = [...'1234567890'].map(s => ({ label: s, number: true }));
  const r2 = ['-', '/', ':', ';', '(', ')', '$', '&', '@', '※'].map(s => ({ label: s, number: true }));
  const r3 = [{ label: '#+=', special: true, mult: 1.4 },
    ...['+', '*', '.', ',', '?', '!', "'"].map(s => ({ label: s, number: true })),
    { label: '⌫', special: true, mult: 1.4 }];
  const r4 = [
    { label: '返回', special: true, mult: 1.4 },
    { label: '=', number: true },
    { label: '空格', space: true },
    { label: '"', number: true },
    { label: '⏎', special: true, mult: 1.5 },
  ];
  return [r1, r2, r3, r4];
}

function numeric9Rows() {
  const sym = s => ({ label: s, special: true, number: true });
  const digit = s => ({ label: s, number: true });
  return [
    [sym('@'), digit('1'), digit('2'), digit('3'), { label: '⌫', special: true }],
    [sym('%'), digit('4'), digit('5'), digit('6'), sym('.')],
    [sym('-'), digit('7'), digit('8'), digit('9'), sym('+')],
    [{ label: '返回', special: true }, { label: '#+=', special: true }, digit('0'),
      { label: '空格', space: true }, { label: '⏎', special: true }],
  ];
}

// MARK: - 幾何（對照 KeyboardView.onLayout）

function layoutRows(rows, isLetters) {
  const rowCount = rows.length;
  const rowHeight = (BODY_H - PAD_TOP - PAD_BOTTOM - ROW_SPACING * (rowCount - 1)) / rowCount;
  const innerW = W - PAD_SIDE * 2;
  let prevUnit = 0;
  const out = [];
  rows.forEach((row, rowIndex) => {
    const y = PAD_TOP + rowIndex * (rowHeight + ROW_SPACING);
    const n = row.length;
    const spacingTotal = KEY_SPACING * (n - 1);
    const hasSpace = row.some(k => k.space);
    const widths = new Array(n).fill(0);
    let startX = PAD_SIDE;
    if (isLetters && rowIndex === 1 && prevUnit > 0) {
      widths.fill(prevUnit);
      startX = PAD_SIDE + (innerW - (prevUnit * n + spacingTotal)) / 2;
    } else if (hasSpace) {
      const multSum = row.reduce((s, k) => s + (k.mult || 1), 0);
      const unit = prevUnit > 0 ? prevUnit : (innerW - spacingTotal) / multSum;
      let fixed = 0;
      row.forEach((k, i) => {
        if (!k.space) { widths[i] = unit * (k.mult || 1); fixed += widths[i]; }
      });
      const spaceW = Math.max(40, innerW - spacingTotal - fixed);
      row.forEach((k, i) => { if (k.space) widths[i] = spaceW; });
    } else {
      const multSum = row.reduce((s, k) => s + (k.mult || 1), 0);
      const unit = (innerW - spacingTotal) / multSum;
      row.forEach((k, i) => { widths[i] = unit * (k.mult || 1); });
      const refIdx = row.findIndex(k => (k.mult || 1) === 1 && !k.space);
      if (refIdx >= 0) prevUnit = widths[refIdx];
    }
    let x = startX;
    row.forEach((k, i) => {
      out.push({ x, y, w: widths[i], h: rowHeight, spec: k });
      x += widths[i] + KEY_SPACING;
    });
  });
  return out;
}

// MARK: - 按鍵繪製（對照 KeyButton.onDraw）

function buildKey(state, dark, k) {
  const d = el('pv-key' + (k.spec.special ? ' special' : ''));
  d.style.left = u(k.x); d.style.top = u(k.y);
  d.style.width = u(k.w); d.style.height = u(k.h);
  const bw = borderSize(state, dark);
  d.style.borderWidth = u(bw);
  d.style.borderRadius = u(RADIUS);
  d.style.background = pal(state, dark, k.spec.special ? 'keySystem' : 'keyNormal');
  d.style.borderColor = pal(state, dark, k.spec.special ? 'systemBorder' : 'border');
  if (k.spec.label) {
    const g = state.groups;
    const size = k.spec.label.length > 1 ? g.systemSize
      : k.spec.special ? g.systemSize + 4
      : k.spec.number ? g.numberSize
      : g.lowercaseSize;
    const t = el('pv-key-label', k.spec.label);
    t.style.fontSize = u(size);
    t.style.color = pal(state, dark, k.spec.special ? 'textSystem' : 'textMain');
    d.appendChild(t);
  }
  if (k.spec.up) {
    const t = el('pv-hint up', k.spec.up);
    t.style.fontSize = u(state.groups.swipeSize);
    t.style.color = pal(state, dark, 'textSub');
    d.appendChild(t);
  }
  if (k.spec.down) {
    const t = el('pv-hint down', k.spec.down);
    t.style.fontSize = u(state.groups.swipeSize);
    t.style.color = pal(state, dark, 'textSub');
    d.appendChild(t);
  }
  return d;
}

// MARK: - 候選列（對照 CandidateBar：空閒＝工具列、組字＝composing + 候選）

function buildBar(state, dark, ui) {
  const bar = el('pv-bar');
  bar.style.height = u(BAR_H);
  bar.style.background = pal(state, dark, 'toolbarBg');
  if (ui.barMode === 'composing') {
    const composing = el('pv-composing', 'vfk');
    composing.style.color = pal(state, dark, 'textSub');
    composing.style.fontSize = u(15);
    bar.appendChild(composing);
    const cands = ['惠', '慧', '匯', '彗', '晦'];
    cands.forEach((c, i) => {
      const b = el('pv-cand', `${i + 1} ${c}`);
      b.style.fontSize = u(20);
      b.style.padding = `${u(4)} ${u(9)}`;
      if (i === 0) {
        b.style.color = pal(state, dark, 'candidateSelectedText');
        b.style.background = pal(state, dark, 'candidateSelectedBg');
        b.style.borderRadius = u(6);
        b.style.border = `${u(Math.max(borderSize(state, dark), 1))} solid ${pal(state, dark, 'border')}`;
      } else {
        b.style.color = pal(state, dark, 'candidateUnselectedText');
      }
      bar.appendChild(b);
    });
  } else {
    const items = TOOLBAR_ITEMS.reduce((m, it) => (m[it.id] = it, m), {});
    state.toolbarButtons.forEach(id => {
      const it = items[id];
      const glyph = it ? it[state.platform] : null;
      const b = el('pv-tool');
      b.appendChild(glyphNode(glyph));
      b.style.fontSize = u(19);
      b.style.color = pal(state, dark, 'toolbarColor');
      bar.appendChild(b);
    });
  }
  return bar;
}

// MARK: - 面板（對照 CollectionPanelView）

function buildPanel(state, dark, sections, fontSize) {
  const body = el('pv-body');
  body.style.height = u(BODY_H);
  body.style.background = pal(state, dark, 'panelRightBg');

  const left = el('pv-panel-left');
  left.style.width = u(64);
  left.style.background = pal(state, dark, 'panelLeftBg');
  left.style.padding = `${u(4)} ${u(4)}`;
  sections.forEach(([name], i) => {
    const c = el('pv-panel-cat', name);
    c.style.height = u(34);
    c.style.fontSize = u(15);
    c.style.marginBottom = u(2);
    if (i === 0) {
      c.style.background = pal(state, dark, 'panelCategoryHighlight');
      c.style.color = pal(state, dark, 'panelCategorySelectedText');
      c.style.borderRadius = u(6);
    } else {
      c.style.color = pal(state, dark, 'panelLeftText');
    }
    left.appendChild(c);
  });
  body.appendChild(left);

  const flow = el('pv-panel-flow');
  flow.style.left = u(64);
  flow.style.padding = u(6);
  flow.style.gap = u(4);
  sections[0][1].forEach(item => {
    const c = el('pv-panel-item', item);
    c.style.fontSize = u(fontSize);
    c.style.color = pal(state, dark, 'panelLeftText');
    c.style.padding = `${u(4)} ${u(8)}`;
    c.style.minWidth = u(40);
    c.style.minHeight = u(40);
    flow.appendChild(c);
  });
  body.appendChild(flow);

  const bw = Math.max(borderSize(state, dark), 1);
  for (const [name, cls] of [['返回', 'back'], ['⌫', 'bksp']]) {
    const b = el('pv-panel-btn ' + cls, name);
    b.style.width = u(56); b.style.height = u(40);
    b.style.fontSize = u(state.groups.systemSize + 2);
    b.style.color = pal(state, dark, 'textSystem');
    b.style.background = pal(state, dark, 'keySystem');
    b.style.borderRadius = u(RADIUS);
    b.style.border = `${u(bw)} solid ${pal(state, dark, 'systemBorder')}`;
    body.appendChild(b);
  }
  return body;
}

// MARK: - 長按氣泡（對照 LongPressPopup）

function buildBubble(state, dark, keys) {
  // 錨在字母頁第一列的 e 鍵上方
  const anchor = keys.find(k => k.spec.label === 'e');
  if (!anchor) return null;
  const options = state.longPressLayout === '1' ? BUBBLE_SAMPLE_LOWER_FIRST : BUBBLE_SAMPLE_UPPER_FIRST;
  const itemW = 40, h = 44;
  const pw = itemW * options.length + 8;
  let x = anchor.x + anchor.w / 2 - pw / 2;
  x = Math.max(4, Math.min(W - pw - 4, x));
  const y = anchor.y - h - 6;
  const bubble = el('pv-bubble');
  bubble.style.left = u(x); bubble.style.top = u(y);
  bubble.style.width = u(pw); bubble.style.height = u(h);
  bubble.style.borderRadius = u(RADIUS);
  bubble.style.background = pal(state, dark, 'bubbleShellBg');
  bubble.style.border = `${u(borderSize(state, dark))} solid ${pal(state, dark, 'border')}`;
  bubble.style.padding = u(4);
  options.forEach((opt, i) => {
    const o = el('pv-bubble-item', opt);
    o.style.width = u(itemW);
    o.style.fontSize = u(opt.length > 1 ? 15 : 22);
    if (i === 0) {
      o.style.background = pal(state, dark, 'bubbleSelectedBg');
      o.style.color = pal(state, dark, 'bubbleTextSelected');
      o.style.borderRadius = u(6);
    } else {
      o.style.color = pal(state, dark, 'bubbleTextUnselected');
    }
    bubble.appendChild(o);
  });
  return bubble;
}

// MARK: - 入口

/// ui: { page: 'letters'|'numeric'|'symbolPanel'|'emoji', dark, barMode: 'toolbar'|'composing', bubble }
export function renderPreview(frame, state, ui) {
  frame.textContent = '';
  const dark = ui.dark;
  frame.appendChild(buildBar(state, dark, ui));

  if (ui.page === 'symbolPanel' || ui.page === 'emoji') {
    const sections = ui.page === 'emoji' ? PANEL_EMOJIS : PANEL_SYMBOLS;
    const size = ui.page === 'emoji' ? state.groups.panelLargeEmojiSize : state.groups.panelLargeSymbolSize;
    frame.appendChild(buildPanel(state, dark, sections, size));
    return;
  }

  const isLetters = ui.page === 'letters';
  const rows = isLetters ? letterRows(state)
    : state.keyboardLayout === 'row' ? numberRows() : numeric9Rows();
  const keys = layoutRows(rows, isLetters);
  const body = el('pv-body');
  body.style.height = u(BODY_H);
  body.style.background = pal(state, dark, 'bg');
  keys.forEach(k => body.appendChild(buildKey(state, dark, k)));
  if (isLetters && ui.bubble && state.swipe.longPress) {
    const bubble = buildBubble(state, dark, keys);
    if (bubble) body.appendChild(bubble);
  }
  frame.appendChild(body);
}

export const DESIGN_WIDTH = W;
export const TOTAL_HEIGHT = BAR_H + BODY_H;
