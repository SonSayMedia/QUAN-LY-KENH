// Lõi dùng chung: lưu file (ghi an toàn), dữ liệu người dùng, hạn mức YouTube, gọi YouTube Data API bằng khoá,
// gợi ý từ khoá, thư viện ngách, thông báo. Mọi dữ liệu nằm trong app/data/ trên máy anh.
const fs = require('fs');
const path = require('path');

const MARKETS = {
  en: { label: 'Tiếng Anh', hl: 'en', gl: 'US' },
  es: { label: 'Tiếng Tây Ban Nha', hl: 'es', gl: 'ES' },
  pt: { label: 'Tiếng Bồ Đào Nha', hl: 'pt', gl: 'BR' },
  ja: { label: 'Tiếng Nhật', hl: 'ja', gl: 'JP' },
  ko: { label: 'Tiếng Hàn', hl: 'ko', gl: 'KR' },
  vi: { label: 'Tiếng Việt', hl: 'vi', gl: 'VN' },
};
const QUOTA_LIMIT = 10000;
const COST = { search: 100, videos: 1, channels: 1, playlistItems: 1 };

// ---------- Sửa lỗi ký tự "mojibake" (chuỗi UTF-8 đúng bị đọc nhầm thành CP1252/Latin-1 rồi ghi lại UTF-8) ----------
// Gặp thật: tiêu đề video/kênh từ YouTube hoặc chữ do AI (9router) trả về thỉnh thoảng bị lỗi kiểu "Isnâ€™t", "tÃ² mÃ²".
// Đã kiểm chứng bằng dữ liệu thật: video vẫn ĐÚNG trên YouTube, lỗi phát sinh trong đường truyền lúc lấy dữ liệu — không tái hiện được ổn định để bắt tận gốc,
// nên sửa phòng vệ tại đây: đảo ngược đúng bảng CP1252 (không phải Latin-1, vì có ký tự như €/™ nằm ngoài Latin-1). Chuỗi bình thường không đổi.
const CP1252_HIGH = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e,
  0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};
function fixMojibake(str) {
  if (typeof str !== 'string' || !str || !/[-ɏ -⁯]/.test(str)) return str;
  const bytes = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xff) bytes.push(cp);
    else if (CP1252_HIGH[cp] != null) bytes.push(CP1252_HIGH[cp]);
    else return str; // có ký tự ngoài phạm vi CP1252 -> không phải lỗi này, giữ nguyên để tránh sửa nhầm
  }
  try {
    const repaired = Buffer.from(bytes).toString('utf8');
    if (repaired && !repaired.includes('�') && repaired !== str) return repaired;
  } catch (e) { /* giữ nguyên nếu không sửa được */ }
  return str;
}

module.exports = function makeCore(ctx) {
  const { DATA_DIR, readSettings, writeSettings } = ctx;
  const YT_BASE = process.env.QLK_GOOGLE_YT || 'https://www.googleapis.com/youtube/v3';
  const SUGGEST_URL = process.env.QLK_SUGGEST_URL || 'https://suggestqueries.google.com/complete/search';
  const P = (n) => path.join(DATA_DIR, n);

  // ---------- Ghi/đọc JSON an toàn (ghi file tạm rồi đổi tên để không hỏng nếu tắt máy giữa chừng) ----------
  function readJson(name, def) {
    try { return JSON.parse(fs.readFileSync(P(name), 'utf8')); } catch (e) { return typeof def === 'function' ? def() : def; }
  }
  function writeJson(name, obj) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = P(name) + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
    fs.renameSync(tmp, P(name));
  }

  // ---------- Dữ liệu người dùng (thay localStorage): ghim, ghi chú, lịch đăng, nháp, đánh dấu đã đăng… ----------
  const userdata = () => readJson('userdata.json', {});
  function userdataPatch(set, del) {
    const u = userdata();
    Object.entries(set || {}).forEach(([k, v]) => { u[k] = v; });
    (del || []).forEach((k) => { delete u[k]; });
    writeJson('userdata.json', u);
  }
  // Sao lưu userdata mỗi ngày, giữ 14 bản.
  function backupUserdata() {
    try {
      const dir = P('backup');
      fs.mkdirSync(dir, { recursive: true });
      const day = new Date().toISOString().slice(0, 10);
      if (fs.existsSync(P('userdata.json'))) fs.copyFileSync(P('userdata.json'), path.join(dir, `userdata-${day}.json`));
      const files = fs.readdirSync(dir).filter((f) => f.startsWith('userdata-')).sort();
      files.slice(0, Math.max(0, files.length - 14)).forEach((f) => fs.unlinkSync(path.join(dir, f)));
    } catch (e) { /* bỏ qua */ }
  }

  // ---------- Hạn mức YouTube (10.000 đơn vị/ngày, làm mới 0h giờ Thái Bình Dương) ----------
  const ptDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  function ptSecondsToday() {
    const p = new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Los_Angeles', hour12: false }).split(':').map(Number);
    return p[0] * 3600 + p[1] * 60 + p[2];
  }
  const resetAtISO = () => new Date(Date.now() + (86400 - ptSecondsToday()) * 1000).toISOString();
  const fmtVNTime = (iso) => new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: false });
  const maskVal = (v) => (v ? '•'.repeat(8) + String(v).slice(-4) : '');

  // ---------- Nhiều khoá YouTube Data API (xoay vòng khi khoá hiện tại gần hết hạn mức) ----------
  // Mỗi khoá coi như một project Google Cloud riêng -> có hạn mức 10.000 đơn vị/ngày RIÊNG. Hạn mức đếm theo TỪNG khoá
  // trong quota.json (byKey), cộng thêm mục giả "oauth" cho lượt gọi qua tài khoản Google (google.js) — không tính vào khoá nào.
  function apiKeys() {
    const s = readSettings();
    if (Array.isArray(s.apiKeys)) return s.apiKeys;
    // Nâng cấp dữ liệu cũ (1 khoá duy nhất, field "apiKey") thành mảng 1 phần tử, giữ nguyên trạng thái đã kiểm tra.
    if (s.apiKey && s.apiKey.value) {
      const migrated = [{ key: 'k1', label: 'Khoá 1', value: s.apiKey.value, state: s.apiKey.state || 'unchecked', message: s.apiKey.message || '', checkedAt: s.apiKey.checkedAt || null, addedAt: new Date().toISOString() }];
      s.apiKeys = migrated;
      writeSettings(s);
      return migrated;
    }
    return [];
  }
  function saveApiKeys(list) { const s = readSettings(); s.apiKeys = list; delete s.apiKey; writeSettings(s); }
  function addApiKey({ label, value }) {
    const v = String(value || '').trim();
    if (!v) throw new Error('Hãy nhập khoá API.');
    const list = apiKeys();
    if (list.some((k) => k.value === v)) throw new Error('Khoá này đã có trong danh sách.');
    const n = list.reduce((m, k) => Math.max(m, +String(k.key).replace(/\D/g, '') || 0), 0) + 1;
    list.push({ key: 'k' + n, label: String(label || '').trim().slice(0, 40) || `Khoá ${n}`, value: v, state: 'unchecked', message: '', checkedAt: null, addedAt: new Date().toISOString() });
    saveApiKeys(list);
    return list[list.length - 1].key;
  }
  function removeApiKey(id) { saveApiKeys(apiKeys().filter((k) => k.key !== id)); }
  function setApiKeyState(id, patch) { saveApiKeys(apiKeys().map((k) => (k.key === id ? { ...k, ...patch } : k))); }

  function readQuota() {
    const q = readJson('quota.json', {});
    if (q.day !== ptDay()) return { day: ptDay(), byKey: {} };
    // Dữ liệu cũ trước khi có nhiều khoá (used/byKind ở cấp cao nhất, chưa có byKey) — gán hết cho khoá đầu (k1),
    // vì lúc đó chỉ có đúng 1 khoá, để không mất số liệu hạn mức đã dùng hôm nay.
    if (!q.byKey && (q.used != null || q.byKind)) {
      const migrated = { day: q.day, byKey: { k1: { used: q.used || 0, byKind: q.byKind || {} } } };
      writeJson('quota.json', migrated);
      return migrated;
    }
    return { day: q.day, byKey: q.byKey || {} };
  }
  function usedOfKey(id) { return ((readQuota().byKey || {})[id] || {}).used || 0; }
  // XOAY VÒNG TUẦN TỰ (không chạy song song): dùng đúng thứ tự đã thêm — khoá 1 tới khi gần hết mới chuyển sang khoá 2, v.v.
  // Không chọn "khoá ít dùng nhất" (sẽ làm các khoá cùng tăng song song xen kẽ nhau, không đúng ý muốn dùng cạn từng khoá).
  function pickApiKey(need) {
    const list = apiKeys().filter((k) => k.value);
    for (const k of list) { if (usedOfKey(k.key) + (need || 1) <= QUOTA_LIMIT) return k; }
    return null;
  }
  function quotaAdd(keyId, kind, units) {
    const q = readQuota();
    const byKey = q.byKey || {};
    const entry = byKey[keyId] || { used: 0, byKind: {} };
    entry.used += units;
    entry.byKind[kind] = (entry.byKind[kind] || 0) + units;
    byKey[keyId] = entry;
    writeJson('quota.json', { day: q.day, byKey });
  }
  // Tổng hạn mức của TẤT CẢ khoá API cộng lại (không tính "oauth"), để Dashboard/Cài đặt hiện một con số chung dễ nhìn.
  function quotaState() {
    const q = readQuota();
    const byKey = q.byKey || {};
    const list = apiKeys();
    const byKindMerged = {};
    Object.values(byKey).forEach((e) => Object.entries(e.byKind || {}).forEach(([kind, n]) => { byKindMerged[kind] = (byKindMerged[kind] || 0) + n; }));
    const usedTotal = list.reduce((t, k) => t + usedOfKey(k.key), 0) + ((byKey.oauth || {}).used || 0);
    return {
      day: q.day, used: usedTotal, byKind: byKindMerged, limit: Math.max(1, list.length) * QUOTA_LIMIT, resetAt: resetAtISO(),
      keys: list.map((k) => ({ key: k.key, label: k.label, masked: maskVal(k.value), used: usedOfKey(k.key), limit: QUOTA_LIMIT, state: k.state || 'unchecked', message: k.message || '', checkedAt: k.checkedAt || null })),
    };
  }
  // Kiểm tra trước khi làm cả loạt lệnh gọi (Title Trends, Tìm Niche…): còn đủ hạn mức CỘNG DỒN qua các khoá không.
  function quotaCheck(need) {
    const list = apiKeys();
    if (!list.length) throw new Error('Chưa cài khoá YouTube Data API v3 (vào Cài đặt).');
    const remain = list.reduce((t, k) => t + Math.max(0, QUOTA_LIMIT - usedOfKey(k.key)), 0);
    if (remain < need) {
      const resetAt = resetAtISO();
      throw Object.assign(new Error(`Không đủ hạn mức YouTube hôm nay ở ${list.length > 1 ? 'cả ' + list.length + ' khoá' : 'khoá đang có'} (còn ${remain}, lần này cần khoảng ${need}). Hạn mức làm mới lúc ${fmtVNTime(resetAt)} (giờ VN).`), { code: 'QUOTA' });
    }
  }

  // ---------- Gọi YouTube Data API bằng khoá API (tự chọn khoá còn nhiều hạn mức nhất, có đếm hạn mức riêng từng khoá) ----------
  async function yt(endpoint, params, kind) {
    const units = COST[kind || endpoint] != null ? COST[kind || endpoint] : 1;
    if (!apiKeys().length) throw new Error('Chưa cài khoá YouTube Data API v3 (vào Cài đặt).');
    const picked = pickApiKey(units);
    if (!picked) {
      const resetAt = resetAtISO();
      throw Object.assign(new Error(`Đã hết hạn mức YouTube hôm nay ở mọi khoá đang có. Sẽ có lại lúc ${fmtVNTime(resetAt)} (giờ VN).`), { code: 'QUOTA' });
    }
    const u = new URL(`${YT_BASE}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v); });
    u.searchParams.set('key', picked.value);
    const res = await fetch(u, { signal: AbortSignal.timeout(30000) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason;
      const msg = (j.error && j.error.message) || `Lỗi ${res.status}`;
      if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
        // Khoá này báo hết dù ta tưởng còn chỗ (lệch số liệu) -> đánh dấu hết luôn để lần sau tự chọn khoá khác.
        quotaAdd(picked.key, kind || endpoint, Math.max(0, QUOTA_LIMIT - usedOfKey(picked.key)));
        const resetAt = resetAtISO();
        throw Object.assign(new Error(`Khoá "${picked.label}" đã hết hạn mức hôm nay. ${apiKeys().length > 1 ? 'Lần gọi sau sẽ tự dùng khoá khác.' : `Sẽ có lại lúc ${fmtVNTime(resetAt)} (giờ VN), hoặc thêm khoá dự phòng ở Cài đặt.`}`), { code: 'QUOTA' });
      }
      throw new Error(msg);
    }
    quotaAdd(picked.key, kind || endpoint, units);
    return j;
  }
  const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
  // "PT1H2M3S" → giây
  function isoSeconds(d) {
    const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d || '');
    return m ? (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : 0;
  }
  async function videoDetails(ids) {
    const out = [];
    for (const c of chunk([...new Set(ids)], 50)) {
      const j = await yt('videos', { part: 'snippet,statistics,contentDetails', id: c.join(',') }, 'videos');
      (j.items || []).forEach((v) => out.push({
        id: v.id, title: fixMojibake(v.snippet.title), channelId: v.snippet.channelId, channelTitle: fixMojibake(v.snippet.channelTitle), publishedAt: v.snippet.publishedAt,
        views: +((v.statistics || {}).viewCount) || 0, likes: +((v.statistics || {}).likeCount) || 0, comments: +((v.statistics || {}).commentCount) || 0,
        lang: v.snippet.defaultAudioLanguage || v.snippet.defaultLanguage || '',
        seconds: isoSeconds((v.contentDetails || {}).duration), thumb: (v.snippet.thumbnails && (v.snippet.thumbnails.medium || v.snippet.thumbnails.default) || {}).url || '',
      }));
    }
    return out;
  }
  async function channelDetails(ids) {
    const out = {};
    for (const c of chunk([...new Set(ids)], 50)) {
      const j = await yt('channels', { part: 'snippet,statistics,contentDetails', id: c.join(',') }, 'channels');
      (j.items || []).forEach((ch) => {
        const st = ch.statistics || {};
        out[ch.id] = {
          id: ch.id, title: fixMojibake(ch.snippet.title), handle: ch.snippet.customUrl || '', country: ch.snippet.country || '',
          subs: st.hiddenSubscriberCount ? null : +st.subscriberCount || 0, views: +st.viewCount || 0, videos: +st.videoCount || 0,
          uploads: ch.contentDetails && ch.contentDetails.relatedPlaylists && ch.contentDetails.relatedPlaylists.uploads,
        };
      });
    }
    return out;
  }

  // ---------- Gợi ý từ khoá như ô tìm kiếm của YouTube (điểm KHÔNG chính thức; lỗi thì trả rỗng) ----------
  const sugCache = new Map();
  async function suggest(q, market) {
    const m = MARKETS[market] || MARKETS.en;
    const k = `${m.hl}|${m.gl}|${q}`;
    const hit = sugCache.get(k);
    if (hit && Date.now() - hit.t < 3600e3) return hit.v;
    let v = [];
    try {
      const res = await fetch(`${SUGGEST_URL}?client=youtube&ds=yt&hl=${m.hl}&gl=${m.gl}&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(6000) });
      // suggestqueries trả mã hoá theo header (thường ISO-8859-1 với tiếng Tây Ban Nha/Bồ Đào Nha): giải mã đúng để không lỗi chữ có dấu
      const buf = await res.arrayBuffer();
      const cs = (/charset=([\w-]+)/i.exec(res.headers.get('content-type') || '') || [])[1] || 'utf-8';
      let txt;
      try { txt = new TextDecoder(cs).decode(buf); } catch (e) { txt = Buffer.from(buf).toString('utf8'); }
      const mm = /\((\[[\s\S]*\])\)\s*$/.exec(txt);
      if (mm) v = (JSON.parse(mm[1])[1] || []).map((x) => (Array.isArray(x) ? x[0] : x)).filter(Boolean).slice(0, 10);
    } catch (e) { v = []; }
    if (sugCache.size > 500) sugCache.clear();
    sugCache.set(k, { t: Date.now(), v });
    return v;
  }

  // Mở rộng ý tưởng từ khoá kiểu "alphabet soup" (học từ tool YT DNA): ghép từ khoá gốc với a–z và các từ hỏi rồi gom gợi ý của YouTube. Miễn phí, không tốn hạn mức.
  const EXPAND_MODS = {
    en: ['how', 'why', 'what', 'best', 'for', 'without', 'vs', 'explained', 'tips', 'guide'],
    es: ['cómo', 'por qué', 'qué es', 'mejor', 'para', 'sin', 'vs', 'explicado', 'consejos', 'guía'],
    pt: ['como', 'por que', 'o que é', 'melhor', 'para', 'sem', 'vs', 'explicado', 'dicas', 'guia'],
    vi: ['cách', 'tại sao', 'làm sao', 'là gì', 'có nên', 'khi nào', 'ở đâu', 'cho người mới', 'thực chiến', 'ví dụ'],
    ja: ['とは', 'やり方', 'おすすめ', '方法', '比較'], ko: ['방법', '이란', '추천', '비교', '이유'],
  };
  async function suggestExpand(q, market) {
    q = String(q || '').trim();
    if (!q) return [];
    const mods = EXPAND_MODS[market] || EXPAND_MODS.en;
    const queries = [q, ...'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => `${q} ${c}`), ...mods.map((x) => `${q} ${x}`), ...mods.map((x) => `${x} ${q}`)];
    const seen = new Set([q.toLowerCase()]), out = [];
    let i = 0;
    const worker = async () => {
      while (i < queries.length) {
        const r = await suggest(queries[i++], market);
        r.forEach((s) => { const t = String(s).trim(), k = t.toLowerCase(); if (t && !seen.has(k)) { seen.add(k); out.push(t); } });
      }
    };
    await Promise.all(Array.from({ length: 5 }, worker));
    return out.slice(0, 60);
  }

  // ---------- Thư viện ngách: ngách → thị trường → từ khoá ----------
  const library = () => readJson('library.json', { niches: {} });
  function libSetKeyword(niche, market, keyword) {
    if (!niche || !MARKETS[market]) return;
    const l = library();
    l.niches[niche] = l.niches[niche] || { markets: {} };
    l.niches[niche].markets[market] = { keyword: String(keyword || '').slice(0, 120) };
    writeJson('library.json', l);
  }
  function libAddNiche(niche) {
    if (!niche) return;
    const l = library();
    l.niches[niche] = l.niches[niche] || { markets: {} };
    writeJson('library.json', l);
  }

  // ---------- Thông báo + lịch sử (mỗi thông báo có khoá riêng; nhấp vào = đã đọc; đã đọc vẫn nằm trong lịch sử) ----------
  const notifs = () => readJson('notifications.json', { items: [] });
  function notifUpsert(items) {
    const n = notifs();
    const have = new Set(n.items.map((x) => x.key));
    let added = 0;
    (items || []).forEach((it) => {
      if (!it || !it.key) return;
      if (have.has(it.key)) {
        // it.update = cho phép cập nhật nội dung thông báo CHƯA đọc (ví dụ đối thủ đăng thêm video trong ngày)
        const ex = n.items.find((x) => x.key === it.key);
        if (it.update && ex && !ex.readAt && (ex.title !== it.title || ex.body !== it.body)) { ex.title = String(it.title || '').slice(0, 300); ex.body = String(it.body || '').slice(0, 1000); ex.link = it.link || ex.link; added++; }
        return;
      }
      have.add(it.key);
      n.items.push({ key: String(it.key).slice(0, 200), section: it.section || 'system', kind: it.kind || '', severity: it.severity || 'info', title: String(it.title || '').slice(0, 300), body: String(it.body || '').slice(0, 1000), link: it.link || null, createdAt: new Date().toISOString(), readAt: null });
      added++;
    });
    if (n.items.length > 3000) n.items = n.items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 3000);
    if (added) writeJson('notifications.json', n);
    return added;
  }
  function notifRead(key) {
    const n = notifs();
    const it = n.items.find((x) => x.key === key);
    if (it && !it.readAt) { it.readAt = new Date().toISOString(); writeJson('notifications.json', n); }
  }

  return {
    MARKETS, QUOTA_LIMIT, P, readJson, writeJson, userdata, userdataPatch, backupUserdata,
    quotaState, quotaAdd, quotaCheck, yt, chunk, isoSeconds, videoDetails, channelDetails, suggest, suggestExpand, fixMojibake,
    library, libSetKeyword, libAddNiche, notifs, notifUpsert, notifRead, fmtVNTime, readSettings, writeSettings,
    apiKeys, addApiKey, removeApiKey, setApiKeyState, pickApiKey,
  };
};
