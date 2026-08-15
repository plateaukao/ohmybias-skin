// 資料定義 — 一切以兩個 App 實際讀取的鍵為準：
// Android: app/src/main/java/.../keyboard/KeyboardTheme.kt
// iOS:     OhMyBiasKeyboard/KeyboardTheme.swift
// 預設值 = 內建 sweetlime 皮膚常數（手繪線稿風：淺色白鍵黑框、深色黑鍵灰框、功能鍵反白）。

/// 調色盤鍵 — group 供編輯器分組；alias = App 端 fallback 鏈（皮膚未定義該鍵時依序找）
export const COLOR_KEYS = [
  { key: 'bg',                       group: '整體',   label: '鍵盤背景',     light: '#FFFFFF', dark: '#000000' },
  { key: 'keyNormal',                group: '一般鍵', label: '鍵底',         light: '#FFFFFF', dark: '#000000' },
  { key: 'keyNormalHighlight',       group: '一般鍵', label: '按下鍵底',     light: '#EBEBEB', dark: '#1A1A1A' },
  { key: 'border',                   group: '一般鍵', label: '邊框',         light: '#000000', dark: '#BBBBBB' },
  { key: 'textMain',                 group: '一般鍵', label: '主文字',       light: '#000000', dark: '#BBBBBB' },
  { key: 'textSub',                  group: '一般鍵', label: '角標文字',     light: '#666666', dark: '#555555' },
  { key: 'keySystem',                group: '功能鍵', label: '鍵底',         light: '#D6D6D696', dark: '#CCCCCC' },
  { key: 'keySystemHighlight',       group: '功能鍵', label: '按下鍵底',     light: '#C7C7C7', dark: '#BBBBBB' },
  { key: 'systemBorder',             group: '功能鍵', label: '邊框',         light: '#000000', dark: '#333333', alias: ['border'] },
  { key: 'textSystem',               group: '功能鍵', label: '文字',         light: '#000000', dark: '#1A1A1A', alias: ['textMain'] },
  { key: 'toolbarBg',                group: '工具列', label: '背景',         light: '#F0F0F0', dark: '#000000', alias: ['bg'] },
  { key: 'toolbarColor',             group: '工具列', label: '圖示文字',     light: '#000000', dark: '#CCCCCC' },
  { key: 'candidateUnselectedText',  group: '候選列', label: '候選文字',     light: '#000000', dark: '#CCCCCC' },
  { key: 'candidateSelectedText',    group: '候選列', label: '選中文字',     light: '#000000', dark: '#000000' },
  { key: 'candidateSelectedBg',      group: '候選列', label: '選中底色',     light: '#FFFFFF', dark: '#CCCCCC' },
  { key: 'panelLeftBg',              group: '面板',   label: '分類欄背景',   light: '#F0F0F0', dark: '#1C1C1E' },
  { key: 'panelRightBg',             group: '面板',   label: '內容背景',     light: '#FFFFFF', dark: '#000000' },
  { key: 'panelLeftText',            group: '面板',   label: '文字',         light: '#000000', dark: '#F2F2F7', alias: ['textSub'] },
  { key: 'panelCategoryHighlight',   group: '面板',   label: '選中分類底',   light: '#000000', dark: '#F2F2F7', alias: ['candidateSelectedBg'] },
  { key: 'panelCategorySelectedText', group: '面板',  label: '選中分類文字', light: '#F0F0F0', dark: '#1C1C1E', alias: ['candidateSelectedText'] },
  { key: 'bubbleShellBg',            group: '長按氣泡', label: '外殼',       light: '#E9E2E2', dark: '#FFFFFF', alias: ['keySystemHighlight'] },
  { key: 'bubbleSelectedBg',         group: '長按氣泡', label: '選中底色',   light: '#000000', dark: '#1A1A1A', alias: ['keySystem'] },
  { key: 'bubbleTextSelected',       group: '長按氣泡', label: '選中文字',   light: '#FFFFFF', dark: '#FFFFFF' },
  { key: 'bubbleTextUnselected',     group: '長按氣泡', label: '文字',       light: '#000000', dark: '#1A1A1A' },
];

/// 邊框寬（dp）— palette 內的數值鍵
export const BORDER_SIZE_DEFAULT = 1;

/// 字級（groups）— 只留兩個 App 都會讀的鍵
export const FONT_KEYS = [
  { key: 'lowercaseSize',        label: '字母鍵',           def: 23, min: 14, max: 32 },
  { key: 'systemSize',           label: '功能鍵',           def: 16, min: 10, max: 24 },
  { key: 'numberSize',           label: '數字鍵盤',         def: 24, min: 14, max: 34 },
  { key: 'swipeSize',            label: '滑動角標',         def: 10, min: 6,  max: 16 },
  { key: 'panelLargeSymbolSize', label: '符號面板',         def: 26, min: 14, max: 40 },
  { key: 'panelLargeEmojiSize',  label: 'Emoji 面板',       def: 30, min: 18, max: 44 },
  { key: 'panelLargeKaomojiSize', label: '顏文字／常用語面板', def: 20, min: 12, max: 30 },
];

/// 工具列按鈕目錄 — 只列兩個 App 至少其一支援的 ID。
/// android / ios 欄：該平台的顯示字樣；null = 該平台不支援（App 會顯示空格）。
export const TOOLBAR_ITEMS = [
  { id: 0,  label: '空白佔位',   android: '',    ios: '' },
  { id: 1,  label: '設定',       android: '設',  ios: '⚙︎' },
  { id: 2,  label: '收折鍵盤',   android: '⌄',   ios: '⌄' },
  { id: 3,  label: '中英切換',   android: '米',  ios: '米' },
  { id: 4,  label: '簡繁切換',   android: '簡',  ios: null },
  { id: 5,  label: '常用語',     android: '♥︎',  ios: '♥︎' },
  { id: 7,  label: '符號面板',   android: '符',  ios: '{ }' },
  { id: 8,  label: 'Emoji',      android: '☺︎',  ios: '☺︎' },
  { id: 9,  label: '數字鍵盤',   android: '123', ios: '123' },
  { id: 10, label: '全選（Android）／常用語（iOS）', android: '全', ios: '♥︎' },
  { id: 11, label: '複製',       android: '複',  ios: null },
  { id: 12, label: '剪下',       android: '剪',  ios: null },
  { id: 13, label: '貼上',       android: '貼',  ios: '⎘' },
  { id: 14, label: '復原',       android: '↶',   ios: null },
  { id: 15, label: '重做',       android: '↷',   ios: null },
  { id: 16, label: '游標左移',   android: '←',   ios: '←' },
  { id: 17, label: '游標右移',   android: '→',   ios: '→' },
  { id: 26, label: '顏文字',     android: '顏',  ios: '顏' },
  { id: 27, label: '注音查碼',   android: 'ㄅ',  ios: 'ㄅ' },
  { id: 29, label: '九宮格數字', android: '123', ios: '123' },
  { id: 30, label: '符號面板',   android: '符',  ios: '{ }' },
];

/// 內建預設工具列（兩個 App 相同）
export const DEFAULT_TOOLBAR = [1, 3, 9, 7, 16, 17, 8, 5, 13, 2];

/// 字母頁上滑角標（SwipeData.up）
export const SWIPE_UP = {
  q: '!', w: '@', e: '#', r: '$', t: '%', y: '^', u: '&', i: '*', o: '(', p: ')',
  a: '`', s: '-', d: '=', f: '【', g: '】', h: '\\', j: '/', k: '；', l: "'",
  x: '[', c: ']', v: '<', b: '>', n: '2nd', m: '3rd',
};

/// 字母頁下滑角標（SwipeData.down）
export const SWIPE_DOWN = {
  q: '1', w: '2', e: '3', r: '4', t: '5', y: '6', u: '7', i: '8', o: '9', p: '0',
  a: '~', s: '_', d: '+', f: '{', g: '}', h: '|', j: '?', k: ':', l: '"',
  z: '句首', v: '貼上', b: 'Tab', m: '句尾',
};

/// 面板預覽樣本（取自 App 的 CollectionData 前幾個分類）
export const PANEL_SYMBOLS = [
  ['半標', [',', '.', ';', ':', '!', '?', '-', '_', '/', '\\', '|', '@', '#', '$', '%', '&', '*', '+', '=', "'", '"', '`', '~', '^', '·', '…', '•', '※', '§', '°']],
  ['全標', ['，', '。', '、', '；', '：', '！', '？', '…', '─', '—', '～', '／', '＼', '｜', '・', '．']],
  ['半括', ['<>', '()', '[]', '{}', '""', "''", '«»', '‹›', '「」']],
  ['全括', ['（）', '【】', '「」', '『』', '《》', '〈〉', '〔〕']],
  ['數學', ['+', '-', '×', '÷', '=', '≠', '±', '√', '≈', '≡', '≤', '≥', '∞', '∑', 'π']],
];

export const PANEL_EMOJIS = [
  ['表情', ['😀', '😃', '😄', '😁', '😆', '🥹', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋']],
  ['人物', ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👍', '👎']],
  ['動物', ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮']],
  ['飲食', ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒']],
];

/// 長按氣泡示意（字母 e 的長按選單；longPressLayout '2' 大寫在首、'1' 小寫在首）
export const BUBBLE_SAMPLE_UPPER_FIRST = ['E', 'e', 'è', 'é', 'ê', 'ě', 'ē'];
export const BUBBLE_SAMPLE_LOWER_FIRST = ['e', 'E', 'è', 'é', 'ê', 'ě', 'ē'];
