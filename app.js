// OhMyBias 皮膚設計器 — 狀態、設定面板、匯出入。
// 匯出的 .cskin（zip 內 jsonnet/settings.json，扁平 schema）可直接餵給
// ohmybias-android / ohmybias-ios 的「匯入皮膚（.cskin）」。

import {
  COLOR_KEYS, BORDER_SIZE_DEFAULT, FONT_KEYS, TOOLBAR_ITEMS, DEFAULT_TOOLBAR,
} from './data.js';
import { renderPreview, DESIGN_WIDTH } from './preview.js';
import { zipStore, extractSettingsJson } from './zip.js';
import { glyphNode } from './icons.js';

const STORAGE_KEY = 'ohmybias-skin-designer-v1';

// MARK: - 狀態

function defaultPalette(mode) {
  const p = {};
  for (const c of COLOR_KEYS) p[c.key] = c[mode];
  p.borderSize = BORDER_SIZE_DEFAULT;
  return p;
}

function defaultGroups() {
  const g = {};
  for (const f of FONT_KEYS) g[f.key] = f.def;
  return g;
}

function detectPlatform() {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios';
  return 'android';
}

function defaultState() {
  return {
    platform: detectPlatform(),
    skinName: '我的皮膚',
    keyboardLayout: 'panel',
    longPressLayout: '2',
    toolbarButtons: [...DEFAULT_TOOLBAR],
    swipe: { swipeUp: true, swipeDown: true, longPress: true, showSwipeUpText: true, showSwipeDownText: true },
    palette: { light: defaultPalette('light'), dark: defaultPalette('dark') },
    groups: defaultGroups(),
  };
}

let state = loadState();
const ui = { page: 'letters', dark: false, barMode: 'toolbar', bubble: false, editTheme: 'light', slot: 0 };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const s = defaultState();
    Object.assign(s, saved);
    // 舊存檔缺鍵時補預設
    s.palette = {
      light: { ...defaultPalette('light'), ...(saved.palette?.light || {}) },
      dark: { ...defaultPalette('dark'), ...(saved.palette?.dark || {}) },
    };
    s.groups = { ...defaultGroups(), ...(saved.groups || {}) };
    s.swipe = { ...defaultState().swipe, ...(saved.swipe || {}) };
    return s;
  } catch { return defaultState(); }
}

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), 300);
}

// MARK: - 匯入解析（對照兩個 App 的 SkinSettings.apply：扁平新 schema ＋ 舊版巢狀）

function materializePalette(imported, mode) {
  const src = imported || {};
  const out = {};
  for (const c of COLOR_KEYS) {
    let v = typeof src[c.key] === 'string' && src[c.key] ? src[c.key] : null;
    if (!v && c.alias) {
      for (const a of c.alias) {
        if (typeof src[a] === 'string' && src[a]) { v = src[a]; break; }
      }
    }
    out[c.key] = v || c[mode];
  }
  out.borderSize = typeof src.borderSize === 'number' ? src.borderSize : BORDER_SIZE_DEFAULT;
  return out;
}

function parseSettings(jsonText) {
  let root;
  try { root = JSON.parse(jsonText); } catch { return null; }
  if (typeof root !== 'object' || root === null) return null;
  const s = defaultState();
  s.platform = state.platform;
  if (typeof root.skinInfo?.name === 'string' && root.skinInfo.name) s.skinName = root.skinInfo.name;

  const buttons = Array.isArray(root.toolbarButtons) ? root.toolbarButtons
    : Array.isArray(root.toolbar?.toolbarButtons) ? root.toolbar.toolbarButtons : null;
  if (buttons) {
    const ids = buttons.filter(v => typeof v === 'number').map(v => Math.trunc(v));
    if (ids.length) s.toolbarButtons = ids.slice(0, 10);
    while (s.toolbarButtons.length < 10) s.toolbarButtons.push(0);
  }

  for (const key of ['keyboardLayout', 'longPressLayout']) {
    const flat = root[key], nested = root.layout?.[key];
    if (typeof flat === 'string' && flat) s[key] = flat;
    if (typeof nested === 'string' && nested) s[key] = nested;
  }

  if ('enableSwipeUpActions' in root || 'enableSwipeDownActions' in root || 'enableLongPressActions' in root) {
    s.swipe = {
      swipeUp: root.enableSwipeUpActions !== false,
      swipeDown: root.enableSwipeDownActions !== false,
      longPress: root.enableLongPressActions !== false,
      showSwipeUpText: root.showSwipeUpText !== false,
      showSwipeDownText: root.showSwipeDownText !== false,
    };
  } else if (Array.isArray(root.swipe?.globalEnabledFeatures)) {
    const f = root.swipe.globalEnabledFeatures;
    s.swipe = {
      swipeUp: f.includes('swipeUp'), swipeDown: f.includes('swipeDown'),
      longPress: f.includes('longPress'),
      showSwipeUpText: f.includes('showSwipeUpText'), showSwipeDownText: f.includes('showSwipeDownText'),
    };
  }

  const palette = root.palette || root.globalSettings?.palette;
  s.palette = {
    light: materializePalette(palette?.light, 'light'),
    dark: materializePalette(palette?.dark, 'dark'),
  };

  const groups = root.groups || root.globalSettings?.groups;
  if (groups) {
    for (const f of FONT_KEYS) {
      if (typeof groups[f.key] === 'number') s.groups[f.key] = groups[f.key];
    }
  }
  return s;
}

// MARK: - 匯出

function settingsJson() {
  return JSON.stringify({
    skinInfo: { name: state.skinName },
    keyboardLayout: state.keyboardLayout,
    longPressLayout: state.longPressLayout,
    toolbarButtons: state.toolbarButtons,
    enableSwipeUpActions: state.swipe.swipeUp,
    enableSwipeDownActions: state.swipe.swipeDown,
    enableLongPressActions: state.swipe.longPress,
    showSwipeUpText: state.swipe.showSwipeUpText,
    showSwipeDownText: state.swipe.showSwipeDownText,
    palette: state.palette,
    groups: state.groups,
  }, null, 2);
}

function exportCskin() {
  const data = new TextEncoder().encode(settingsJson());
  const bytes = zipStore([{ name: 'jsonnet/settings.json', data }]);
  const name = (state.skinName.trim() || 'ohmybias-skin').replace(/[\\/:*?"<>|]/g, '_');
  const blob = new Blob([bytes], { type: 'application/zip' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.cskin`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  toast(`已匯出 ${name}.cskin — 到 App「匯入皮膚」選這個檔`);
}

async function importFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let jsonText = null;
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    jsonText = await extractSettingsJson(bytes);
    if (!jsonText) { toast('找不到 settings.json — 請確認是有效的 .cskin 檔'); return; }
  } else {
    jsonText = new TextDecoder().decode(bytes);
  }
  const s = parseSettings(jsonText);
  if (!s) { toast('settings.json 格式無法解析'); return; }
  state = s;
  scheduleSave();
  renderAll();
  toast(`已匯入「${state.skinName}」`);
}

// MARK: - 小工具

const $ = sel => document.querySelector(sel);

function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

function segmented(options, value, onChange) {
  const wrap = h('div', 'seg');
  for (const opt of options) {
    const b = h('button', 'seg-item' + (opt.value === value ? ' on' : ''), opt.label);
    b.type = 'button';
    b.addEventListener('click', () => onChange(opt.value));
    wrap.appendChild(b);
  }
  return wrap;
}

function toggleRow(label, value, onChange) {
  const row = h('label', 'toggle-row');
  row.appendChild(h('span', 'toggle-label', label));
  const input = h('input');
  input.type = 'checkbox';
  input.checked = value;
  input.addEventListener('change', () => onChange(input.checked));
  const knob = h('span', 'toggle');
  row.appendChild(input);
  row.appendChild(knob);
  return row;
}

// MARK: - 預覽

function renderPreviewNow() {
  renderPreview($('#pv-frame'), state, ui);
}

function renderPreviewChrome() {
  const tabs = $('#pv-tabs');
  tabs.textContent = '';
  const pages = [
    ['letters', '蝦米'],
    ['numeric', state.keyboardLayout === 'row' ? '數字（Row）' : '數字（九宮格）'],
    ['symbolPanel', '符號面板'],
    ['emoji', 'Emoji'],
  ];
  for (const [id, label] of pages) {
    const b = h('button', 'keycap-tab' + (ui.page === id ? ' on' : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => { ui.page = id; renderPreviewChrome(); renderPreviewNow(); });
    tabs.appendChild(b);
  }

  const opts = $('#pv-opts');
  opts.textContent = '';
  const darkBtn = h('button', 'chip' + (ui.dark ? ' on' : ''), ui.dark ? '☾ 深色' : '☀︎ 淺色');
  darkBtn.type = 'button';
  darkBtn.addEventListener('click', () => { ui.dark = !ui.dark; renderPreviewChrome(); renderPreviewNow(); });
  opts.appendChild(darkBtn);
  const compBtn = h('button', 'chip' + (ui.barMode === 'composing' ? ' on' : ''), '組字中');
  compBtn.type = 'button';
  compBtn.title = '候選列顯示組字＋候選字狀態';
  compBtn.addEventListener('click', () => {
    ui.barMode = ui.barMode === 'composing' ? 'toolbar' : 'composing';
    renderPreviewChrome(); renderPreviewNow();
  });
  opts.appendChild(compBtn);
  if (ui.page === 'letters') {
    const bubbleBtn = h('button', 'chip' + (ui.bubble ? ' on' : ''), '長按氣泡');
    bubbleBtn.type = 'button';
    bubbleBtn.addEventListener('click', () => { ui.bubble = !ui.bubble; renderPreviewChrome(); renderPreviewNow(); });
    opts.appendChild(bubbleBtn);
  }
}

// MARK: - 設定面板：佈局

function renderLayoutPanel() {
  const root = $('#panel-layout');
  root.textContent = '';

  root.appendChild(h('h3', 'field-title', '數字／符號鍵盤形式'));
  root.appendChild(h('p', 'field-note', '工具列的「123」會開對應形式；字母頁沒有 123 鍵時亦同。'));
  root.appendChild(segmented([
    { value: 'panel', label: '九宮格數字' },
    { value: 'row', label: 'Row 數字＋符號' },
  ], state.keyboardLayout, v => { state.keyboardLayout = v; onStateChanged(); renderLayoutPanel(); }));

  root.appendChild(h('h3', 'field-title', '長按選單排序'));
  root.appendChild(h('p', 'field-note', '長按字母鍵時，選單第一項是大寫還是小寫。'));
  root.appendChild(segmented([
    { value: '2', label: '大寫在首（預設）' },
    { value: '1', label: '小寫在首' },
  ], state.longPressLayout, v => { state.longPressLayout = v; onStateChanged(); renderLayoutPanel(); }));
}

// MARK: - 設定面板：工具列

function toolbarGlyph(id) {
  const it = TOOLBAR_ITEMS.find(t => t.id === id);
  if (!it) return { glyph: '', supported: false, label: `#${id}` };
  const glyph = it[state.platform];
  return { glyph: glyph ?? '', supported: glyph !== null, label: it.label };
}

function renderToolbarPanel() {
  const root = $('#panel-toolbar');
  root.textContent = '';

  root.appendChild(h('h3', 'field-title', '工具列（10 格）'));
  root.appendChild(h('p', 'field-note', '點一格，再從下方選要放的按鈕。空白佔位＝留空格。'));

  const strip = h('div', 'tb-strip');
  state.toolbarButtons.forEach((id, i) => {
    const { glyph, supported, label } = toolbarGlyph(id);
    const cell = h('button', 'tb-slot' + (ui.slot === i ? ' on' : '') + (supported ? '' : ' unsupported'));
    cell.appendChild(glyph ? glyphNode(glyph) : document.createTextNode('·'));
    cell.type = 'button';
    cell.title = label;
    cell.addEventListener('click', () => { ui.slot = i; renderToolbarPanel(); });
    strip.appendChild(cell);
  });
  root.appendChild(strip);

  const grid = h('div', 'tb-grid');
  for (const it of TOOLBAR_ITEMS) {
    const supported = it[state.platform] !== null;
    const b = h('button', 'tb-option' + (supported ? '' : ' unsupported'));
    b.type = 'button';
    const glyphSpan = h('span', 'tb-option-glyph');
    const optGlyph = supported ? it[state.platform] : it.android;
    glyphSpan.appendChild(optGlyph ? glyphNode(optGlyph) : document.createTextNode('·'));
    b.appendChild(glyphSpan);
    b.appendChild(h('span', 'tb-option-label', it.label));
    if (!supported) b.appendChild(h('span', 'badge', '僅 Android'));
    b.addEventListener('click', () => {
      state.toolbarButtons[ui.slot] = it.id;
      ui.slot = Math.min(ui.slot + 1, 9);
      onStateChanged();
      renderToolbarPanel();
    });
    grid.appendChild(b);
  }
  root.appendChild(grid);

  const reset = h('button', 'btn subtle', '還原預設工具列');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    state.toolbarButtons = [...DEFAULT_TOOLBAR];
    onStateChanged();
    renderToolbarPanel();
  });
  root.appendChild(reset);
}

// MARK: - 設定面板：滑動與長按

function renderSwipePanel() {
  const root = $('#panel-swipe');
  root.textContent = '';
  root.appendChild(h('h3', 'field-title', '全域開關'));
  root.appendChild(h('p', 'field-note', '套用到整個鍵盤（App 只讀全域開關，無分行設定）。'));
  const defs = [
    ['swipeUp', '上滑動作（符號）'],
    ['swipeDown', '下滑動作（數字／編輯）'],
    ['longPress', '長按選單'],
    ['showSwipeUpText', '顯示上滑角標'],
    ['showSwipeDownText', '顯示下滑角標'],
  ];
  for (const [key, label] of defs) {
    root.appendChild(toggleRow(label, state.swipe[key], v => {
      state.swipe[key] = v;
      onStateChanged();
    }));
  }
}

// MARK: - 設定面板：配色

function splitColor(hex) {
  const m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(hex || '');
  if (!m) return { rgb: '#000000', alpha: 255 };
  return { rgb: '#' + m[1].toUpperCase(), alpha: m[2] ? parseInt(m[2], 16) : 255 };
}

function joinColor(rgb, alpha) {
  const base = rgb.toUpperCase();
  if (alpha >= 255) return base;
  return base + alpha.toString(16).padStart(2, '0').toUpperCase();
}

function renderColorPanel() {
  const root = $('#panel-colors');
  root.textContent = '';

  const head = h('div', 'color-head');
  head.appendChild(segmented([
    { value: 'light', label: '☀︎ 淺色' },
    { value: 'dark', label: '☾ 深色' },
  ], ui.editTheme, v => {
    ui.editTheme = v;
    ui.dark = v === 'dark';   // 編哪套就預覽哪套
    renderPreviewChrome(); renderColorPanel(); renderPreviewNow();
  }));
  root.appendChild(head);

  const palette = state.palette[ui.editTheme];
  let group = null;
  for (const c of COLOR_KEYS) {
    if (c.group !== group) {
      group = c.group;
      root.appendChild(h('h3', 'field-title', group));
      if (group === '功能鍵') root.appendChild(h('p', 'field-note', 'shift／⌫／123／返回／⏎ 等鍵。'));
    }
    const { rgb, alpha } = splitColor(palette[c.key]);
    const row = h('div', 'color-row');

    const swatchWrap = h('label', 'swatch-wrap');
    const swatch = h('span', 'swatch');
    swatch.style.setProperty('--sw', palette[c.key]);
    const picker = h('input');
    picker.type = 'color';
    picker.value = rgb;
    picker.addEventListener('input', () => {
      palette[c.key] = joinColor(picker.value, splitColor(palette[c.key]).alpha);
      onStateChanged();
      swatch.style.setProperty('--sw', palette[c.key]);
      hex.value = palette[c.key];
    });
    swatchWrap.appendChild(picker);
    swatchWrap.appendChild(swatch);
    row.appendChild(swatchWrap);

    const meta = h('div', 'color-meta');
    meta.appendChild(h('span', 'color-label', c.label));
    const hex = h('input', 'hex-input');
    hex.type = 'text';
    hex.value = palette[c.key];
    hex.spellcheck = false;
    hex.addEventListener('change', () => {
      const v = hex.value.trim();
      if (/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v)) {
        palette[c.key] = v.toUpperCase();
        onStateChanged();
        renderColorPanel();
      } else {
        hex.value = palette[c.key];
      }
    });
    meta.appendChild(hex);
    row.appendChild(meta);

    const alphaWrap = h('div', 'alpha-wrap');
    const slider = h('input');
    slider.type = 'range';
    slider.min = '0'; slider.max = '255'; slider.value = String(alpha);
    const pct = h('span', 'alpha-value', Math.round(alpha / 255 * 100) + '%');
    slider.addEventListener('input', () => {
      palette[c.key] = joinColor(splitColor(palette[c.key]).rgb, Number(slider.value));
      pct.textContent = Math.round(Number(slider.value) / 255 * 100) + '%';
      onStateChanged();
      swatch.style.setProperty('--sw', palette[c.key]);
      hex.value = palette[c.key];
    });
    alphaWrap.appendChild(slider);
    alphaWrap.appendChild(pct);
    row.appendChild(alphaWrap);

    root.appendChild(row);
  }

  root.appendChild(h('h3', 'field-title', '邊框寬'));
  const bwRow = h('div', 'font-row');
  const bwSlider = h('input');
  bwSlider.type = 'range';
  bwSlider.min = '0'; bwSlider.max = '3'; bwSlider.step = '0.5';
  bwSlider.value = String(palette.borderSize);
  const bwVal = h('span', 'font-value', palette.borderSize + ' dp');
  bwSlider.addEventListener('input', () => {
    palette.borderSize = Number(bwSlider.value);
    bwVal.textContent = palette.borderSize + ' dp';
    onStateChanged();
  });
  bwRow.appendChild(h('span', 'font-label', '按鍵邊框'));
  bwRow.appendChild(bwSlider);
  bwRow.appendChild(bwVal);
  root.appendChild(bwRow);

  root.appendChild(h('h3', 'field-title', '雙模式覆寫'));
  const copyWrap = h('div', 'copy-wrap');
  const c1 = h('button', 'btn subtle', '淺色 → 深色');
  const c2 = h('button', 'btn subtle', '深色 → 淺色');
  c1.type = c2.type = 'button';
  c1.addEventListener('click', () => {
    state.palette.dark = { ...state.palette.light };
    onStateChanged(); renderColorPanel();
    toast('已把淺色整組複製到深色');
  });
  c2.addEventListener('click', () => {
    state.palette.light = { ...state.palette.dark };
    onStateChanged(); renderColorPanel();
    toast('已把深色整組複製到淺色');
  });
  copyWrap.appendChild(c1);
  copyWrap.appendChild(c2);
  root.appendChild(copyWrap);
}

// MARK: - 設定面板：字級

function renderFontPanel() {
  const root = $('#panel-fonts');
  root.textContent = '';
  root.appendChild(h('h3', 'field-title', '字級（dp／pt）'));
  root.appendChild(h('p', 'field-note', '淺色與深色共用同一組字級。'));
  for (const f of FONT_KEYS) {
    const row = h('div', 'font-row');
    row.appendChild(h('span', 'font-label', f.label));
    const slider = h('input');
    slider.type = 'range';
    slider.min = String(f.min); slider.max = String(f.max); slider.step = '1';
    slider.value = String(state.groups[f.key]);
    const val = h('span', 'font-value', String(state.groups[f.key]));
    slider.addEventListener('input', () => {
      state.groups[f.key] = Number(slider.value);
      val.textContent = slider.value;
      onStateChanged();
    });
    row.appendChild(slider);
    row.appendChild(val);
    root.appendChild(row);
  }
  const reset = h('button', 'btn subtle', '還原預設字級');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    state.groups = defaultGroups();
    onStateChanged(); renderFontPanel();
  });
  root.appendChild(reset);
}

// MARK: - 分頁切換

const PANELS = [
  ['layout', '佈局', renderLayoutPanel],
  ['toolbar', '工具列', renderToolbarPanel],
  ['swipe', '滑動長按', renderSwipePanel],
  ['colors', '配色', renderColorPanel],
  ['fonts', '字級', renderFontPanel],
];
let activePanel = 'colors';

function renderTabs() {
  const tabs = $('#settings-tabs');
  tabs.textContent = '';
  for (const [id, label, render] of PANELS) {
    const b = h('button', 'keycap-tab' + (activePanel === id ? ' on' : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => {
      activePanel = id;
      renderTabs();
      for (const [pid] of PANELS) $(`#panel-${pid}`).hidden = pid !== id;
      render();
    });
    tabs.appendChild(b);
  }
  for (const [pid, , render] of PANELS) {
    const elp = $(`#panel-${pid}`);
    elp.hidden = pid !== activePanel;
    if (pid === activePanel) render();
  }
}

// MARK: - 頂列

function renderHeader() {
  const name = $('#skin-name');
  name.value = state.skinName;
  name.onchange = () => { state.skinName = name.value; onStateChanged(); };

  const platWrap = $('#platform-seg');
  platWrap.textContent = '';
  platWrap.appendChild(segmented([
    { value: 'android', label: 'Android' },
    { value: 'ios', label: 'iOS' },
  ], state.platform, v => {
    state.platform = v;
    onStateChanged();
    renderHeader();
    if (activePanel === 'toolbar') renderToolbarPanel();
  }));
}

let resetArmed = false;
function setupActions() {
  $('#btn-export').addEventListener('click', exportCskin);

  const fileInput = $('#file-input');
  $('#btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) importFile(fileInput.files[0]);
    fileInput.value = '';
  });

  const resetBtn = $('#btn-reset');
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = '確定還原？';
      resetBtn.classList.add('danger');
      setTimeout(() => {
        resetArmed = false;
        resetBtn.textContent = '還原預設';
        resetBtn.classList.remove('danger');
      }, 2600);
      return;
    }
    resetArmed = false;
    resetBtn.textContent = '還原預設';
    resetBtn.classList.remove('danger');
    const platform = state.platform;
    state = defaultState();
    state.platform = platform;
    onStateChanged();
    renderAll();
    toast('已還原為內建 sweetlime 預設');
  });
}

// MARK: - 整體重繪

function onStateChanged() {
  scheduleSave();
  renderPreviewNow();
}

function renderAll() {
  renderHeader();
  renderPreviewChrome();
  renderTabs();
  renderPreviewNow();
}

// 預覽縮放：--u = 實際寬 / 設計寬 393
const frame = $('#pv-frame');
new ResizeObserver(entries => {
  const w = entries[0].contentRect.width;
  frame.style.setProperty('--u', `${w / DESIGN_WIDTH}px`);
}).observe(frame);

setupActions();
renderAll();
