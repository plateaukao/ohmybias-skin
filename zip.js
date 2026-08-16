// 迷你 ZIP 讀寫 — 供 .cskin（zip 容器）匯出/匯入用。零依賴。
// 寫出：STORE（不壓縮）＋ CRC32，兩個 App 的解 zip 皆支援。
// 讀取：解析 central directory；STORE 直接切片、DEFLATE 用瀏覽器內建 DecompressionStream。

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u16(v) { return [v & 0xff, (v >>> 8) & 0xff]; }
function u32(v) { return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]; }

/// entries: [{ name: string, data: Uint8Array }] → zip 位元組（STORE）
export function zipStore(entries) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBytes = enc.encode(name);
    const crc = crc32(data);
    const local = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(0x0800 /* UTF-8 名稱 */), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(nameBytes.length), ...u16(0),
    ]);
    parts.push(local, nameBytes, data);
    central.push(new Uint8Array([
      0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(offset),
    ]), nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const centralStart = offset;
  let centralSize = 0;
  for (const c of central) centralSize += c.length;
  const eocd = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length),
    ...u32(centralSize), ...u32(centralStart), ...u16(0),
  ]);
  const total = new Uint8Array(offset + centralSize + eocd.length);
  let p = 0;
  for (const part of [...parts, ...central, eocd]) { total.set(part, p); p += part.length; }
  return total;
}

function readU16(b, i) { return b[i] | (b[i + 1] << 8); }
function readU32(b, i) { return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0; }

/// 列出 zip 內所有 entry（同 App 端 ZipReader：從檔尾找 EOCD）
export function zipEntries(bytes) {
  const searchStart = Math.max(0, bytes.length - 65557);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= searchStart; i--) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) { eocd = i; break; }
  }
  if (eocd < 0) return [];
  const count = readU16(bytes, eocd + 10);
  let off = readU32(bytes, eocd + 16);
  const dec = new TextDecoder();
  const entries = [];
  for (let n = 0; n < count; n++) {
    if (off + 46 > bytes.length || readU32(bytes, off) !== 0x02014b50) break;
    const method = readU16(bytes, off + 10);
    const compSize = readU32(bytes, off + 20);
    const nameLen = readU16(bytes, off + 28);
    const extraLen = readU16(bytes, off + 30);
    const commentLen = readU16(bytes, off + 32);
    const localOffset = readU32(bytes, off + 42);
    const name = dec.decode(bytes.subarray(off + 46, off + 46 + nameLen));
    entries.push({ name, method, compSize, localOffset });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/// 取出單一 entry 的內容位元組
export async function zipExtract(bytes, entry) {
  const off = entry.localOffset;
  if (readU32(bytes, off) !== 0x04034b50) return null;
  const nameLen = readU16(bytes, off + 26);
  const extraLen = readU16(bytes, off + 28);
  const start = off + 30 + nameLen + extraLen;
  const comp = bytes.subarray(start, start + entry.compSize);
  if (entry.method === 0) return comp;
  if (entry.method === 8) {
    // 舊瀏覽器（Chrome < 103）沒有 DecompressionStream — 只影響匯入
    // DEFLATE 壓縮的 .cskin（本編輯器匯出的是 STORE，不受影響）
    if (typeof DecompressionStream === 'undefined') return null;
    const ds = new DecompressionStream('deflate-raw');
    const blob = new Blob([comp]);
    const out = await new Response(blob.stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(out);
  }
  return null;
}

/// 依 App 端邏輯找 settings.json：優先 jsonnet/settings.json，其次任何 settings.json
export async function extractSettingsJson(bytes) {
  const entries = zipEntries(bytes);
  const primary = entries.find(e => e.name.endsWith('jsonnet/settings.json'));
  const fallback = entries.find(e => e.name.endsWith('settings.json'));
  const entry = primary || fallback;
  if (!entry) return null;
  const data = await zipExtract(bytes, entry);
  return data ? new TextDecoder().decode(data) : null;
}
