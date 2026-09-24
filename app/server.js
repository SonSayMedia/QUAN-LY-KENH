// Server cho app Quản lý Kênh — Node thuần, không cần npm install.
// Phục vụ giao diện tĩnh + API cài đặt (lưu khóa API cục bộ, kiểm tra kết nối YouTube).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 4400;
const ROOT = path.join(__dirname, 'public');
const DATA_DIR = process.env.QLK_DATA_DIR || path.join(__dirname, 'data'); // QLK_DATA_DIR chỉ dùng khi kiểm thử
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// ---------- Cài đặt (khóa nằm trong app/data/settings.json, không bao giờ gửi ngược ra giao diện) ----------
function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (e) { return {}; }
}
function writeSettings(s) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2), 'utf8');
}
const mask = (v) => (v ? '•'.repeat(8) + v.slice(-4) : '');
const core = require('./core.js')({ DATA_DIR, readSettings, writeSettings });
const google = require('./google.js')({ readSettings, writeSettings, dataDir: DATA_DIR, port: PORT, quotaAdd: core.quotaAdd, pickApiKey: core.pickApiKey, fixMojibake: core.fixMojibake });
google.migrateClients();
const scanMod = require('./scan.js')(core, { aiChat });
const rivalsMod = require('./rivals.js')(core, scanMod);
const exploreMod = require('./explore.js')(core, scanMod, rivalsMod, { aiChat });

// ---------- Hồ sơ kênh (lưu file, dùng chung mọi trình duyệt) ----------
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
function readProfiles() {
  try { return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8')); } catch (e) { return {}; }
}
function writeProfiles(p) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(p, null, 2), 'utf8');
}
const PROFILE_FIELDS = ['lang', 'audience', 'tone', 'focus', 'avoid', 'samples', 'cta'];

// ---------- AI viết bài qua 9router (OpenAI-compatible) ----------
const AI_DEFAULT = { baseUrl: 'http://127.0.0.1:20128/v1', model: 'ag/gemini-3.8-flash' };
async function aiChat(messages, maxTokens) {
  const s = (readSettings().ai) || {};
  if (!s.apiKey) throw new Error('Chưa cài khoá AI');
  const res = await fetch(String(s.baseUrl || AI_DEFAULT.baseUrl).replace(/\/+$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.apiKey },
    body: JSON.stringify({ model: s.model || AI_DEFAULT.model, messages, temperature: 0.9, max_tokens: maxTokens || 2048, stream: false }),
    signal: AbortSignal.timeout(60000),
  });
  const rawText = await res.text();
  let body = null;
  try { body = JSON.parse(rawText); } catch (e) { /* không phải JSON */ }
  // 9router có thể trả luồng SSE (text/event-stream) dù không xin stream: ghép các mảnh "delta" lại thành một câu trả lời.
  if (!body && /^\s*data:/m.test(rawText)) {
    let content = '', finish = null;
    for (const line of rawText.split(/\r?\n/)) {
      const m = line.match(/^data:\s*(.*)$/);
      if (!m || m[1] === '[DONE]') continue;
      try {
        const j = JSON.parse(m[1]);
        if (j.error) throw new Error(j.error.message || 'Lỗi từ 9router');
        const c = j.choices && j.choices[0];
        if (c) { const piece = (c.delta && c.delta.content) || (c.message && c.message.content) || ''; content += typeof piece === 'string' ? piece : ''; if (c.finish_reason) finish = c.finish_reason; }
      } catch (e) { if (/9router|Lỗi/.test(e.message)) throw e; }
    }
    body = { choices: [{ message: { content }, finish_reason: finish }] };
  }
  if (!res.ok) throw new Error((body && body.error && (body.error.message || body.error)) || `Lỗi ${res.status}: ${rawText.slice(0, 120)}`);
  if (!body) throw new Error(`9router trả về không phải JSON (mã ${res.status}, ${res.headers.get('content-type') || 'không rõ loại'}): ${rawText.slice(0, 120).replace(/\s+/g, ' ')}`);
  const ch = (body.choices && body.choices[0]) || {};
  let text = ch.message && ch.message.content;
  if (Array.isArray(text)) text = text.map((p) => (p && p.text) || '').join('');
  if (!text || !String(text).trim()) {
    const why = ch.finish_reason ? ` (finish_reason=${ch.finish_reason})` : '';
    const raw = why ? '' : ' — phản hồi: ' + JSON.stringify(body).slice(0, 180);
    throw new Error('AI không trả nội dung' + why + (ch.finish_reason === 'length' ? ' — model dùng hết token để “nghĩ”' : '') + raw);
  }
  return core.fixMojibake(String(text));
}
// ---------- Bình luận chưa trả lời: bản dịch tiếng Việt + gợi ý trả lời theo ngôn ngữ của kênh (AI, có nhớ để khỏi gọi lại) ----------
const CMT_AI_FILE = path.join(DATA_DIR, 'comment-ai.json');
const readCmtAi = () => { try { return JSON.parse(fs.readFileSync(CMT_AI_FILE, 'utf8')); } catch (e) { return {}; } };
const LANG_NAME = { en: 'English', es: 'Spanish (neutral Latin American)', pt: 'Brazilian Portuguese', ja: 'Japanese', ko: 'Korean', vi: 'Vietnamese' };
// Dùng chung cho bình luận cấp KÊNH và cấp VIDEO: nhận sẵn danh sách bình luận (id/author/text), dịch + soạn gợi ý trả lời bằng AI, có nhớ theo id để khỏi gọi lại.
async function assistComments(conn, keepIds, want) {
  const lang = conn.market || 'en';
  const cache = readCmtAi();
  const todo = want.filter((i) => !(cache[i.id] && cache[i.id].lang === lang));
  if (todo.length) {
    const prof = readProfiles()[conn.id] || {};
    const sys = `You help a YouTube channel manager reply to viewer comments. Channel: "${conn.title}"${conn.niche ? ` (niche: ${conn.niche})` : ''}. Reply language: ${LANG_NAME[lang] || 'English'}. Tone: ${prof.tone || 'warm, friendly, natural'}.${prof.avoid ? ` Avoid: ${prof.avoid}.` : ''}`;
    const user = `For each comment return an object {"id","vi","reply","replyVi"}.
- vi: Vietnamese translation of the comment (if it is already Vietnamese, repeat it).
- reply: a short (1-3 sentences) natural reply written in ${LANG_NAME[lang] || 'English'} that responds to what the commenter actually said; thank them when fitting; no links, no hashtags, no promises, do not invent facts about the channel.
- If the comment is spam, a link, self-promotion or abusive: reply = "" and replyVi = "Bỏ qua (spam hoặc không cần trả lời)".
- replyVi: Vietnamese translation of reply.
Output ONLY a JSON array, no markdown fences.
Comments: ${JSON.stringify(todo.map((i) => ({ id: i.id, author: i.author, text: i.text })))}`;
    const raw = await aiChat([{ role: 'system', content: sys }, { role: 'user', content: user }], 8000);
    const s = String(raw).replace(/```(?:json)?/gi, ''), a = s.indexOf('['), z = s.lastIndexOf(']');
    let arr;
    try { arr = JSON.parse(s.slice(a, z + 1)); } catch (e) { throw new Error('AI trả về sai định dạng, hãy thử lại.'); }
    const asked = new Set(todo.map((i) => i.id)); // chỉ nhận đúng các bình luận đã hỏi (AI có thể trả thừa/sai mã)
    (Array.isArray(arr) ? arr : []).forEach((o) => { if (o && o.id && asked.has(o.id)) cache[o.id] = { lang, vi: String(o.vi || ''), reply: String(o.reply || ''), replyVi: String(o.replyVi || '') }; });
    Object.keys(cache).forEach((k) => { if (!keepIds.has(k) && Object.keys(cache).length > 600) delete cache[k]; });
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CMT_AI_FILE, JSON.stringify(cache), 'utf8');
  }
  // chỉ trả các bình luận đã có kết quả (AI bỏ sót thì để giao diện giữ trạng thái "đang chờ" và thử lại lần sau)
  return want.filter((i) => cache[i.id]).map((i) => ({ id: i.id, lang, ...cache[i.id] }));
}
async function commentAssist(channelId, ids) {
  const conn = google.list().find((c) => c.id === channelId);
  if (!conn) throw new Error('Kênh chưa được kết nối');
  const data = google.readCmt(channelId);
  if (!data) throw new Error('Chưa quét bình luận của kênh này — bấm "Quét lại" trước.');
  const want = data.items.filter((i) => ids.includes(i.id)).slice(0, 10);
  return assistComments(conn, new Set(data.items.map((i) => i.id)), want);
}
// Gợi ý trả lời cho bình luận của MỘT VIDEO (bấm số bình luận trong bảng video của kênh)
async function videoCommentAssist(channelId, videoId, ids) {
  const conn = google.list().find((c) => c.id === channelId);
  if (!conn) throw new Error('Kênh chưa được kết nối');
  const data = await google.videoComments(channelId, videoId);
  const items = data.unanswered || [];
  const want = items.filter((i) => ids.includes(i.id)).slice(0, 10);
  return assistComments(conn, new Set(items.map((i) => i.id)), want);
}
// Sửa lỗi chính tả RÕ RÀNG của từ khoá trước khi quét (học từ tool YT DNA): YouTube API không tự sửa nên gõ sai là tốn hạn mức vô ích.
// Không dịch, không thêm bớt từ; AI lỗi hoặc chưa cài thì giữ nguyên từ khoá.
async function correctKeywords(list, market) {
  const same = list.map((k) => ({ from: k, to: k, changed: false }));
  const s = readSettings().ai;
  if (!list.length || !s || !s.apiKey) return same;
  try {
    const raw = await aiChat([
      { role: 'system', content: `Bạn là bộ sửa chính tả cho từ khoá tìm kiếm YouTube (ngôn ngữ: ${LANG_NAME[market] || 'English'}). CHỈ sửa lỗi chính tả/đánh máy RÕ RÀNG. GIỮ nguyên ngôn ngữ gốc, giữ nguyên ý nghĩa, KHÔNG dịch, KHÔNG thêm hay bớt từ, KHÔNG mở rộng. Nếu từ khoá đã đúng thì giữ nguyên. Chỉ trả về một mảng JSON các chuỗi, cùng thứ tự và cùng số lượng với danh sách.` },
      { role: 'user', content: 'Danh sách: ' + JSON.stringify(list) },
    ], 2000);
    const m = /\[[\s\S]*\]/.exec(raw);
    const arr = m ? JSON.parse(m[0]) : null;
    if (!Array.isArray(arr) || arr.length !== list.length) return same;
    return list.map((k, i) => { const to = String(arr[i] || '').trim().slice(0, 100) || k; return { from: k, to, changed: to.toLowerCase() !== k.toLowerCase() }; });
  } catch (e) { return same; }
}
async function testAi() {
  const s = readSettings();
  if (!s.ai || !s.ai.apiKey) return publicStatus();
  let state = 'error', message = '';
  try {
    // Model kiểu “thinking” cần dư token; đặt thấp (vài token) sẽ ra nội dung rỗng.
    await aiChat([{ role: 'user', content: 'Reply with the single word: OK' }], 1024);
    state = 'ok'; message = 'Kết nối tốt';
  } catch (e) {
    message = /fetch failed|ECONNREFUSED|timeout|aborted/i.test(String(e.message)) ? 'Không kết nối được 9router (kiểm tra 9router đang chạy và địa chỉ)' : String(e.message).slice(0, 160);
  }
  s.ai.state = state; s.ai.message = message; s.ai.checkedAt = new Date().toISOString();
  writeSettings(s);
  return publicStatus();
}
function buildCommunityPrompt(b) {
  const p = b.profile || {};
  const lang = p.lang || b.lang || 'tiếng Anh';
  return [
    { role: 'system', content: 'Bạn là biên tập viên mạng xã hội giàu kinh nghiệm cho kênh YouTube. Bạn viết bài đăng tab Cộng đồng ngắn, tự nhiên, đúng ngách, khuyến khích người xem bình luận. Không dùng hashtag thừa, không hứa hẹn điều kênh không làm, không bịa số liệu hay trích dẫn sai người. Chỉ trả về JSON hợp lệ, không giải thích thêm.' },
    { role: 'user', content: [
      `Kênh: ${b.name} — ngách: ${b.niche}.`,
      `Ngôn ngữ bài đăng: ${lang}.`,
      p.audience ? `Khán giả: ${p.audience}.` : '',
      p.tone ? `Giọng điệu: ${p.tone}.` : '',
      p.focus ? `Chủ đề/series trọng tâm: ${p.focus}.` : '',
      p.avoid ? `TUYỆT ĐỐI tránh: ${p.avoid}.` : '',
      p.cta ? `Lời kêu gọi ưa thích: ${p.cta}.` : '',
      p.samples ? `Bài mẫu kênh tâm đắc (học giọng, đừng chép):\n${p.samples}` : '',
      b.wantType ? `Loại bài yêu cầu: ${b.wantType}.` : 'Chọn loại bài phù hợp nhất hôm nay.',
      Array.isArray(b.recent) && b.recent.length ? `Các bài gần đây (KHÔNG lặp ý):\n- ${b.recent.slice(0, 7).join('\n- ')}` : '',
      `Hôm nay: ${b.date}.`,
      b.imgStyle ? `Phong cách hình ảnh của kênh: ${b.imgStyle}.` : '',
      'Trả về JSON đúng dạng: {"type":"Câu hỏi|Bình chọn|Văn bản|Video / teaser|Hình ảnh","text":"nội dung bài bằng ngôn ngữ trên, tối đa 280 ký tự","options":["chỉ khi là Bình chọn, 2–4 lựa chọn ngắn"],"vi":"ý chính bằng tiếng Việt, tối đa 15 từ","scene":"CHỈ khi type là Câu hỏi hoặc Hình ảnh: mô tả cảnh minh hoạ bằng tiếng Anh, 1 câu, hợp ngách, KHÔNG chứa chữ trong ảnh; các loại khác để chuỗi rỗng"}',
    ].filter(Boolean).join('\n') },
  ];
}
function parseAiJson(raw) {
  const m = String(raw).match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI trả về sai định dạng');
  const o = JSON.parse(m[0]);
  const types = ['Câu hỏi', 'Bình chọn', 'Văn bản', 'Video / teaser', 'Hình ảnh'];
  return {
    scene: String(o.scene || '').slice(0, 300),
    type: types.includes(o.type) ? o.type : 'Văn bản',
    text: String(o.text || '').slice(0, 600),
    options: Array.isArray(o.options) && o.options.length ? o.options.slice(0, 4).map((x) => String(x).slice(0, 60)) : null,
    vi: String(o.vi || '').slice(0, 160),
  };
}

function publicStatus() {
  const s = readSettings();
  const o = s.oauth || {};
  const a = s.ai || {};
  const keys = core.apiKeys();
  const anyOk = keys.some((k) => k.state === 'ok');
  const worst = keys.find((k) => k.state === 'error') || keys[0];
  return {
    update: updateStatus(),
    quota: core.quotaState(), // .keys = từng khoá API riêng (label, đã dùng/10K, trạng thái) để Cài đặt hiện danh sách xoay vòng
    ai: {
      set: !!a.apiKey,
      masked: mask(a.apiKey),
      baseUrl: a.baseUrl || AI_DEFAULT.baseUrl,
      model: a.model || AI_DEFAULT.model,
      state: a.apiKey ? a.state || 'unchecked' : 'unset',
      message: a.message || '',
      checkedAt: a.checkedAt || null,
    },
    // Tóm tắt chung cho các chỗ chỉ cần biết "có ít nhất 1 khoá dùng được không" (đèn góc phải, banner…). Chi tiết từng khoá ở quota.keys.
    apiKey: {
      set: keys.length > 0,
      count: keys.length,
      masked: keys[0] ? mask(keys[0].value) : '',
      state: keys.length === 0 ? 'unset' : anyOk ? 'ok' : (worst ? worst.state || 'unchecked' : 'unchecked'),
      message: keys.length === 0 ? '' : anyOk ? 'Kết nối tốt' : (worst ? worst.message || '' : ''),
      checkedAt: keys.reduce((t, k) => (k.checkedAt && (!t || k.checkedAt > t) ? k.checkedAt : t), null),
    },
    oauth: {
      clients: google.clientsPublic(), // danh sách các bộ OAuth (Client ID + Secret) — không bao giờ gửi secret ra giao diện
      clientIdSet: google.clientsPublic().length > 0,
      secretSet: google.clientsPublic().some((c) => c.secretSet),
      connected: google.count() > 0,
      channels: google.count(),
      lastSync: google.lastSyncAt(),
      redirectUri: google.redirectUri,
    },
    managers: google.managers(), // danh sách cố định "Người quản lý" để chọn dropdown khi gán cho kênh
    pausedNiches: rivalsMod.pausedNiches(), // các ngách đối thủ đang tạm dừng theo dõi (không đồng bộ, không báo video nổ)
  };
}

// Gọi thử MỘT khoá YouTube Data API cụ thể (1 đơn vị hạn mức, tính vào đúng khoá đó).
async function testOneApiKey(id) {
  const k = core.apiKeys().find((x) => x.key === id);
  if (!k || !k.value) return publicStatus();
  const url = (process.env.QLK_GOOGLE_YT || 'https://www.googleapis.com/youtube/v3') + '/channels?part=id&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=' + encodeURIComponent(k.value);
  core.quotaAdd(id, 'kiểm tra khoá', 1);
  let state = 'error', message = '';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const body = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(body.items)) {
      state = 'ok';
      message = 'Kết nối tốt';
    } else {
      const err = (body.error && body.error.errors && body.error.errors[0]) || {};
      const reason = err.reason || '';
      if (reason === 'keyInvalid' || /API key not valid/i.test((body.error && body.error.message) || '')) message = 'Khóa API không hợp lệ';
      else if (reason === 'accessNotConfigured' || reason === 'forbidden') message = 'Chưa bật YouTube Data API v3 cho project này';
      else if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') message = 'Đã hết hạn mức trong ngày';
      else message = (body.error && body.error.message) || `Lỗi ${res.status}`;
    }
  } catch (e) {
    message = 'Không kết nối được tới Google (kiểm tra mạng)';
  }
  core.setApiKeyState(id, { state, message, checkedAt: new Date().toISOString() });
  return publicStatus();
}
// Định dạng khoá YouTube API hợp lệ, và gợi ý đúng ô nếu anh lỡ dán nhầm Client ID/Secret của OAuth vào đây.
function checkApiKeyFormat(v) {
  if (/^GOCSPX-/.test(v)) throw new Error('Đây là Client Secret của OAuth, không phải khoá API. Dán nó vào ô Client Secret ở mục Google OAuth.');
  if (/\.apps\.googleusercontent\.com$/.test(v)) throw new Error('Đây là Client ID của OAuth, không phải khoá API. Dán nó vào ô Client ID ở mục Google OAuth.');
  if (!/^AIza[0-9A-Za-z_-]{35}$/.test(v)) throw new Error('Khoá API của Google có dạng AIza… và dài 39 ký tự. Khoá anh dán không đúng dạng — hãy tạo khoá ở Google Cloud → Credentials → API key.');
}

// ---------- Lịch cập nhật tự động: 08:30 hằng ngày GIỜ VIỆT NAM ----------
// Việt Nam là UTC+7 và không đổi giờ mùa hè, nên 08:30 ICT = 01:30 UTC mỗi ngày.
const UPDATE_FILE = path.join(DATA_DIR, 'update-log.json');
const RUN_MINUTE_UTC = 1 * 60 + 30;
const vnDay = (d) => new Date((d || new Date()).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
function readUpdateLog() {
  try { return JSON.parse(fs.readFileSync(UPDATE_FILE, 'utf8')); } catch (e) { return { lastScheduledDay: null, runs: [] }; }
}
function nextRunISO() {
  const n = new Date();
  let t = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 1, 30);
  if (t <= n.getTime()) t += 86400000;
  return new Date(t).toISOString();
}
let updating = false;
function updateStatus() {
  const log = readUpdateLog();
  const last = log.runs[0] || null;
  return {
    running: updating,
    nextRunAt: nextRunISO(),
    last: last ? { at: last.at, trigger: last.trigger, steps: last.steps } : null,
    history: log.runs.slice(0, 7).map((r) => ({ at: r.at, trigger: r.trigger, state: r.steps.some((s) => s.state === 'error') ? 'error' : 'ok' })),
  };
}
async function runUpdate(trigger) {
  if (updating) return updateStatus();
  updating = true;
  const steps = [];
  const step = async (name, fn) => {
    try { const r = await fn(); steps.push({ name, state: r.skip ? 'skip' : 'ok', msg: r.msg }); }
    catch (e) { steps.push({ name, state: 'error', msg: String(e.message || e).slice(0, 160) }); }
  };
  try {
    await step('Kiểm tra YouTube Data API v3', async () => {
      const keys = core.apiKeys();
      if (!keys.length) return { skip: true, msg: 'Chưa cài khoá API' };
      let ok = 0, lastMsg = '';
      for (const k of keys) {
        const st = await testOneApiKey(k.key);
        const found = st.quota.keys.find((x) => x.key === k.key);
        if (found && found.state === 'ok') ok++; else lastMsg = found ? found.message : '';
      }
      if (!ok) throw new Error(keys.length > 1 ? `Không khoá nào trong ${keys.length} khoá kết nối được — ${lastMsg}` : lastMsg || 'Không kết nối được');
      return { msg: keys.length > 1 ? `${ok}/${keys.length} khoá kết nối tốt` : 'Kết nối tốt' };
    });
    await step('Kiểm tra API 9Router', async () => {
      const s = readSettings();
      if (!s.ai || !s.ai.apiKey) return { skip: true, msg: 'Chưa cài khoá 9Router' };
      const st = await testAi();
      if (st.ai.state !== 'ok') throw new Error(st.ai.message);
      return { msg: 'Kết nối tốt' };
    });
    // Các bước lấy số liệu thật sẽ nối vào đây khi có OAuth và dữ liệu YouTube.
    await step('Cập nhật số liệu các kênh của anh (OAuth)', async () => {
      if (!google.count()) return { skip: true, msg: 'Chưa kết nối kênh nào — đang dùng dữ liệu mẫu' };
      const r = await google.syncAll();
      if (r.failed) throw new Error(`Đồng bộ ${r.done}/${r.total} kênh, ${r.failed} kênh lỗi — xem ở Cài đặt`);
      return { msg: `Đã đồng bộ ${r.done}/${r.total} kênh` };
    });
    await step('Cập nhật đối thủ (số liệu + video mới)', async () => {
      if (!core.apiKeys().length) return { skip: true, msg: 'Chưa cài khoá YouTube API' };
      if (!rivalsMod.load().rivals.length) return { skip: true, msg: 'Chưa có đối thủ nào — quét Title Trends rồi bấm “Thêm đối thủ”' };
      const r = await rivalsMod.refresh(null, {});
      return { msg: `Đã kiểm tra ${r.checked} đối thủ · ${r.newVideos} video mới · ${r.hits} video nổ` };
    });
    await step('Quét Title Trends tự động (mốc 1 ngày, video dài)', async () => {
      if (!core.apiKeys().length) return { skip: true, msg: 'Chưa cài khoá YouTube API' };
      const pairs = autoPairs();
      if (!pairs.length) return { skip: true, msg: 'Chưa có cặp (ngách, thị trường) nào — đặt ngách và thị trường cho kênh của anh' };
      let done = 0;
      for (const p of pairs) {
        const res = await scanMod.runScan({ niche: p.niche, market: p.market, keyword: p.keyword, type: 'long', days: 1, force: true });
        done++;
        const day = vnDay();
        core.notifUpsert([{ key: `trend:${p.niche}:${p.market}:${day}`, section: 'trend', kind: 'trend', severity: 'info',
          title: `Trend sáng nay — ${p.niche} · ${core.MARKETS[p.market].label}`,
          body: `${res.poolSize} video trong 24 giờ · ${res.outliers.length} video nổ ≥5x` + (res.keywords[0] ? ` · cụm từ lên: ${res.keywords.slice(0, 3).map((k) => k.kw).join(', ')}` : ''),
          link: { type: 'hash', href: `#/tracker/trend/${res.id}` } }]);
        // Video đang lên mạnh trong ngách này (nổ ≥5x so mức thường của kênh): báo riêng từng video để anh bắt trend sớm.
        // Mỗi video chỉ báo MỘT lần (key không theo ngày), tối đa 5 video mạnh nhất mỗi cặp ngách/thị trường mỗi lần quét.
        res.outliers.slice(0, 5).forEach((v) => {
          core.notifUpsert([{ key: `trendhit:${v.id}`, section: 'trend', kind: 'trend-hit', severity: 'warn',
            title: `${p.niche}: video đang lên ×${v.outlier.score.toFixed(1)} — ${v.title}`,
            body: `${v.channelTitle} · ${v.views.toLocaleString('vi-VN')} lượt xem${v.vi ? ' · ' + v.vi : ''}`,
            link: { type: 'url', href: v.url } }]);
        });
      }
      return { msg: `Đã quét ${done} cặp (ngách, thị trường)` };
    });
    core.backupUserdata();
  } finally {
    const log = readUpdateLog();
    log.runs.unshift({ at: new Date().toISOString(), trigger, steps });
    log.runs = log.runs.slice(0, 30);
    if (trigger !== 'manual') log.lastScheduledDay = vnDay();
    writeSettingsFile(UPDATE_FILE, log);
    updating = false;
  }
  return updateStatus();
}
function writeSettingsFile(file, obj) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
}
// Kiểm tra mỗi 30 giây: từ 08:30 giờ VN, nếu hôm nay chưa chạy thì chạy. Nếu app mở muộn thì chạy bù ngay khi mở.
function tickSchedule() {
  const now = new Date();
  if (now.getUTCHours() * 60 + now.getUTCMinutes() < RUN_MINUTE_UTC) return;
  const log = readUpdateLog();
  if (log.lastScheduledDay === vnDay()) return;
  const onTime = now.getUTCHours() * 60 + now.getUTCMinutes() < RUN_MINUTE_UTC + 10;
  runUpdate(onTime ? 'schedule' : 'catchup').catch(() => {});
}

// Các cặp (ngách, thị trường) mà kênh của anh đang dùng → tự quét mỗi ngày.
function autoPairs() {
  const seen = new Set();
  const out = [];
  google.list().forEach((c) => {
    if (!c.niche || !c.market || !core.MARKETS[c.market]) return;
    const k = c.niche + '|' + c.market;
    if (seen.has(k)) return;
    seen.add(k);
    const kw = ((core.library().niches[c.niche] || { markets: {} }).markets[c.market] || {}).keyword || c.niche;
    out.push({ niche: c.niche, market: c.market, keyword: kw });
  });
  return out;
}

function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8'); // tránh vỡ chữ có dấu khi dữ liệu bị cắt giữa ký tự nhiều byte
    req.on('data', (c) => { raw += c; if (raw.length > (max || 20000)) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
  });
}
function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
const sameOrigin = (req) => {
  const o = req.headers.origin;
  return !o || o === `http://localhost:${PORT}` || o === `http://127.0.0.1:${PORT}`;
};

async function handleApi(req, res, url) {
  if (req.method !== 'GET' && !sameOrigin(req)) return sendJson(res, 403, { error: 'Nguồn không hợp lệ' });
  try {
    if (url.pathname === '/api/status' && req.method === 'GET') {
      const chk = url.searchParams.get('check');
      if (chk === '1' || chk === 'true') { for (const k of core.apiKeys()) await testOneApiKey(k.key); return sendJson(res, 200, publicStatus()); }
      if (chk) { await testOneApiKey(chk); return sendJson(res, 200, publicStatus()); }
      return sendJson(res, 200, publicStatus());
    }
    // ----- Nhiều khoá YouTube Data API v3: thêm / xoá / kiểm tra (xoay vòng khi khoá gần hết hạn mức) -----
    if (url.pathname === '/api/keys' && req.method === 'POST') {
      const b = await readBody(req);
      let id;
      try { checkApiKeyFormat(String(b.value || '').trim()); id = core.addApiKey({ label: b.label, value: b.value }); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      return sendJson(res, 200, { ...publicStatus(), addedKey: id });
    }
    if (url.pathname === '/api/keys/remove' && req.method === 'POST') {
      const b = await readBody(req);
      core.removeApiKey(String(b.key || ''));
      return sendJson(res, 200, publicStatus());
    }
    // ----- Nhiều bộ OAuth: thêm / xoá -----
    if (url.pathname === '/api/oauth/clients' && req.method === 'POST') {
      const b = await readBody(req);
      try { google.addClient({ label: b.label, clientId: b.clientId, clientSecret: b.clientSecret }); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      return sendJson(res, 200, publicStatus());
    }
    if (url.pathname === '/api/oauth/clients/published' && req.method === 'POST') {
      const b = await readBody(req);
      try { google.setClientPublished(String(b.key || ''), !!b.published); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      return sendJson(res, 200, publicStatus());
    }
    if (url.pathname === '/api/oauth/clients/remove' && req.method === 'POST') {
      const b = await readBody(req);
      try { google.removeClient(String(b.key || '')); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      return sendJson(res, 200, publicStatus());
    }
    if (url.pathname === '/api/settings/ai' && req.method === 'POST') {
      const b = await readBody(req);
      const s = readSettings();
      if (b.clear) delete s.ai;
      else {
        const base = String(b.baseUrl || AI_DEFAULT.baseUrl).trim();
        if (!/^https?:\/\/[^\s]+$/i.test(base)) return sendJson(res, 400, { error: 'Địa chỉ 9router phải bắt đầu bằng http:// hoặc https://' });
        const model = String(b.model || AI_DEFAULT.model).trim().slice(0, 100);
        const prev = s.ai || {};
        const key = String(b.apiKey || '').trim() || prev.apiKey;
        if (!key) return sendJson(res, 400, { error: 'Hãy nhập khoá API của 9router.' });
        s.ai = { baseUrl: base, model, apiKey: key, state: 'unchecked', message: '', checkedAt: null };
      }
      writeSettings(s);
      return sendJson(res, 200, b.test && !b.clear ? await testAi() : publicStatus());
    }
    // ----- Dữ liệu người dùng lưu FILE (thay localStorage) -----
    if (url.pathname === '/api/store' && req.method === 'GET') return sendJson(res, 200, core.userdata());
    if (url.pathname === '/api/store' && req.method === 'POST') {
      const b = await readBody(req, 5000000);
      core.userdataPatch(b.set, b.del);
      return sendJson(res, 200, { ok: true });
    }
    // ----- Hạn mức, thư viện ngách, gợi ý từ khoá -----
    if (url.pathname === '/api/quota' && req.method === 'GET') return sendJson(res, 200, core.quotaState());
    if (url.pathname === '/api/library' && req.method === 'GET') return sendJson(res, 200, { markets: core.MARKETS, library: core.library(), channels: google.list() });
    if (url.pathname === '/api/library/keyword' && req.method === 'POST') {
      const b = await readBody(req);
      core.libSetKeyword(String(b.niche || '').slice(0, 60), String(b.market || ''), b.keyword);
      return sendJson(res, 200, { library: core.library() });
    }
    if (url.pathname === '/api/suggest' && req.method === 'GET') {
      const q = String(url.searchParams.get('q') || '').slice(0, 80);
      return sendJson(res, 200, { suggestions: q.length >= 2 ? await core.suggest(q, url.searchParams.get('market')) : [] });
    }
    // ----- Quét Title Trends -----
    if (url.pathname === '/api/scan' && req.method === 'POST') {
      const b = await readBody(req);
      let corrections = [];
      if (b.autocorrect !== false && b.keyword && String(b.keyword).trim() && String(b.keyword).trim() !== String(b.niche || '').trim()) {
        const cs = await correctKeywords([String(b.keyword).trim().slice(0, 100)], core.MARKETS[b.market] ? b.market : 'en');
        b.keyword = cs[0].to; corrections = cs.filter((c) => c.changed);
      }
      try {
        const res2 = { ...(await scanMod.runScan(b)), corrections };
        if (b.niche && b.market && b.keyword && String(b.keyword).trim() !== String(b.niche).trim()) core.libSetKeyword(String(b.niche), String(b.market), b.keyword);
        else if (b.niche) core.libAddNiche(String(b.niche));
        return sendJson(res, 200, res2);
      } catch (e) { return sendJson(res, e.code === 'QUOTA' ? 429 : 502, { error: e.message, code: e.code || '' }); }
    }
    if (url.pathname === '/api/scan/get' && req.method === 'GET') {
      const s = scanMod.getScan(String(url.searchParams.get('id') || ''));
      return s ? sendJson(res, 200, s) : sendJson(res, 404, { error: 'Không tìm thấy kết quả quét (có thể đã bị xoá khỏi bộ nhớ đệm).' });
    }
    if (url.pathname === '/api/scan/estimate' && req.method === 'GET') return sendJson(res, 200, { units: scanMod.estimateUnits(url.searchParams.get('type')), quota: core.quotaState() });
    // ----- Quét kênh bất kỳ + Tìm ngách -----
    if (url.pathname === '/api/channel-scan' && req.method === 'POST') {
      const b = await readBody(req);
      try { return sendJson(res, 200, await exploreMod.scanChannel(String(b.link || ''))); }
      catch (e) { return sendJson(res, e.code === 'QUOTA' ? 429 : 502, { error: e.message, code: e.code || '' }); }
    }
    if (url.pathname === '/api/suggest/expand' && req.method === 'GET') {
      const q = String(url.searchParams.get('q') || '').slice(0, 80);
      const mk = core.MARKETS[url.searchParams.get('market')] ? url.searchParams.get('market') : 'en';
      return sendJson(res, 200, { suggestions: q.length >= 2 ? await core.suggestExpand(q, mk) : [] });
    }
    if (url.pathname === '/api/keyword/correct' && req.method === 'POST') {
      const b = await readBody(req);
      const list = (Array.isArray(b.keywords) ? b.keywords : []).map((k) => String(k || '').trim().slice(0, 100)).filter(Boolean).slice(0, 6);
      return sendJson(res, 200, { corrections: await correctKeywords(list, core.MARKETS[b.market] ? b.market : 'en') });
    }
    if (url.pathname === '/api/niche/scan' && req.method === 'POST') {
      const b = await readBody(req);
      let corrections = [];
      if (b.autocorrect !== false && Array.isArray(b.keywords)) {
        const cs = await correctKeywords(b.keywords.map((k) => String(k || '').trim().slice(0, 100)).filter(Boolean).slice(0, 6), core.MARKETS[b.market] ? b.market : 'en');
        b.keywords = cs.map((c) => c.to); corrections = cs.filter((c) => c.changed);
      }
      try { return sendJson(res, 200, { ...(await exploreMod.nicheScan(b)), corrections }); }
      catch (e) { return sendJson(res, e.code === 'QUOTA' ? 429 : 502, { error: e.message, code: e.code || '' }); }
    }
    if (url.pathname === '/api/keyword/pulse' && req.method === 'POST') {
      const b = await readBody(req);
      try { return sendJson(res, 200, await exploreMod.keywordPulse(b)); }
      catch (e) { return sendJson(res, e.code === 'QUOTA' ? 429 : 502, { error: e.message, code: e.code || '' }); }
    }
    if (url.pathname === '/api/niche/estimate' && req.method === 'GET') return sendJson(res, 200, { perKeyword: exploreMod.NICHE_UNITS, quota: core.quotaState() });
    // ----- Đối thủ thật -----
    if (url.pathname === '/api/rivals' && req.method === 'GET') return sendJson(res, 200, rivalsMod.forClient());
    if (url.pathname === '/api/rivals/add' && req.method === 'POST') {
      const b = await readBody(req);
      try { const r = await rivalsMod.addById(String(b.channelId || ''), String(b.niche || ''), String(b.market || 'en'), 'scan'); return sendJson(res, 200, { existed: r.existed, title: r.rival && r.rival.title }); }
      catch (e) { return sendJson(res, e.code === 'QUOTA' ? 429 : 502, { error: e.message }); }
    }
    if (url.pathname === '/api/rivals/add-links' && req.method === 'POST') {
      const b = await readBody(req);
      const links = (Array.isArray(b.links) ? b.links : []).map(String).filter(Boolean).slice(0, 30);
      return sendJson(res, 200, { results: await rivalsMod.addLinks(links, String(b.niche || ''), String(b.market || 'en')) });
    }
    if (url.pathname === '/api/rivals/remove' && req.method === 'POST') { const b = await readBody(req); rivalsMod.remove(String(b.id || '')); return sendJson(res, 200, { ok: true }); }
    if (url.pathname === '/api/rivals/meta' && req.method === 'POST') {
      const b = await readBody(req);
      try { rivalsMod.setMeta(String(b.id || ''), b.niche, b.market); return sendJson(res, 200, { ok: true }); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    }
    if (url.pathname === '/api/rivals/refresh' && req.method === 'POST') {
      try { return sendJson(res, 200, await rivalsMod.refresh(null, {})); } catch (e) { return sendJson(res, e.code === 'QUOTA' ? 429 : 502, { error: e.message }); }
    }
    if (url.pathname === '/api/niches/pause' && req.method === 'POST') {
      const b = await readBody(req);
      try { return sendJson(res, 200, { pausedNiches: rivalsMod.setNichePaused(String(b.niche || ''), true) }); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    }
    if (url.pathname === '/api/niches/unpause' && req.method === 'POST') {
      const b = await readBody(req);
      try { return sendJson(res, 200, { pausedNiches: rivalsMod.setNichePaused(String(b.niche || ''), false) }); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    }
    // ----- Thông báo + lịch sử -----
    if (url.pathname === '/api/notifications' && req.method === 'GET') return sendJson(res, 200, { items: core.notifs().items });
    if (url.pathname === '/api/notifications/sync' && req.method === 'POST') { const b = await readBody(req, 1000000); return sendJson(res, 200, { added: core.notifUpsert(b.items), items: core.notifs().items }); }
    if (url.pathname === '/api/notifications/read' && req.method === 'POST') { const b = await readBody(req); core.notifRead(String(b.key || '')); return sendJson(res, 200, { ok: true }); }
    // ----- Kết nối kênh nằm ở MÁY KHÁC / VPS: lấy link Google, mở ở đó, rồi dán lại địa chỉ trang callback -----
    if (url.pathname === '/api/oauth/link' && req.method === 'GET') {
      try { return sendJson(res, 200, { url: google.authUrl(url.searchParams.get('client') || '', url.searchParams.get('hint') || ''), local: `http://localhost:${PORT}/oauth/start?client=${encodeURIComponent(url.searchParams.get('client') || '')}&hint=${encodeURIComponent(url.searchParams.get('hint') || '')}` }); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    }
    if (url.pathname === '/api/oauth/complete' && req.method === 'POST') {
      const b = await readBody(req);
      let u;
      try { u = new URL(String(b.url || '').trim()); } catch (e) { return sendJson(res, 400, { error: 'Địa chỉ dán vào không đúng. Phải là địa chỉ đầy đủ bắt đầu bằng http://localhost:… và có chữ code= ở trong.' }); }
      try {
        if (u.searchParams.get('error')) throw new Error('Google báo: ' + u.searchParams.get('error') + ' (có thể anh đã bấm Huỷ).');
        if (!u.searchParams.get('code')) throw new Error('Địa chỉ này không có mã code=. Hãy copy đúng địa chỉ trên thanh địa chỉ SAU KHI bấm cho phép.');
        return sendJson(res, 200, await google.handleCallback(u.searchParams.get('code'), u.searchParams.get('state') || ''));
      } catch (e) { return sendJson(res, 400, { error: e.message }); }
    }
    if (url.pathname === '/api/channels' && req.method === 'GET') return sendJson(res, 200, { redirectUri: google.redirectUri, list: google.list() });
    if (url.pathname === '/api/own' && req.method === 'GET') return sendJson(res, 200, google.ownData());
    if (url.pathname === '/api/channel-comments' && req.method === 'GET') {
      try { return sendJson(res, 200, await google.channelComments(String(url.searchParams.get('channel') || ''), url.searchParams.get('refresh') === '1')); }
      catch (e) { return sendJson(res, 400, { error: String(e.message).slice(0, 200) }); }
    }
    if (url.pathname === '/api/comments/assist' && req.method === 'POST') {
      const b = await readBody(req);
      try { return sendJson(res, 200, { results: await commentAssist(String(b.channel || ''), Array.isArray(b.ids) ? b.ids.map(String) : []) }); }
      catch (e) { return sendJson(res, 502, { error: String(e.message).slice(0, 220) }); }
    }
    if (url.pathname === '/api/video-comments' && req.method === 'GET') {
      try { return sendJson(res, 200, await google.videoComments(String(url.searchParams.get('channel') || ''), String(url.searchParams.get('video') || ''), url.searchParams.get('refresh') === '1')); }
      catch (e) { return sendJson(res, 400, { error: String(e.message).slice(0, 200) }); }
    }
    if (url.pathname === '/api/video-comments/assist' && req.method === 'POST') {
      const b = await readBody(req);
      try { return sendJson(res, 200, { results: await videoCommentAssist(String(b.channel || ''), String(b.video || ''), Array.isArray(b.ids) ? b.ids.map(String) : []) }); }
      catch (e) { return sendJson(res, 502, { error: String(e.message).slice(0, 220) }); }
    }
    if (url.pathname === '/api/video-report' && req.method === 'GET') {
      try { return sendJson(res, 200, await google.videoReport(String(url.searchParams.get('channel') || ''), String(url.searchParams.get('video') || ''), url.searchParams.get('range'))); }
      catch (e) { return sendJson(res, 400, { error: String(e.message).slice(0, 200) }); }
    }
    if (url.pathname === '/api/channels/sync' && req.method === 'POST') {
      const b = await readBody(req);
      if (b.id) { try { await google.sync(String(b.id)); } catch (e) { return sendJson(res, 502, { error: String(e.message).slice(0, 200) }); } }
      else await google.syncAll();
      return sendJson(res, 200, { list: google.list() });
    }
    if (url.pathname === '/api/channels/nopost' && req.method === 'POST') {
      const b = await readBody(req);
      try { google.setNoPost(String(b.id || ''), !!b.noPost); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      return sendJson(res, 200, { list: google.list() });
    }
    if (url.pathname === '/api/channels/meta' && req.method === 'POST') {
      const b = await readBody(req);
      try { google.setMeta(String(b.id), b.niche, b.country, b.market, b.gmail, b.where, b.manager); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      return sendJson(res, 200, { list: google.list() });
    }
    if (url.pathname === '/api/managers' && req.method === 'POST') {
      const b = await readBody(req);
      try { return sendJson(res, 200, { managers: google.addManager(b.name) }); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    }
    if (url.pathname === '/api/managers/remove' && req.method === 'POST') {
      const b = await readBody(req);
      try { return sendJson(res, 200, { managers: google.removeManager(String(b.name || '')) }); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    }
    if (url.pathname === '/api/channels/disconnect' && req.method === 'POST') {
      const b = await readBody(req);
      try {
        // xoá bản dịch/gợi ý trả lời bình luận đã nhớ của kênh này (theo mã bình luận trong danh sách đã quét) trước khi xoá danh sách
        const cm = google.readCmt(String(b.id));
        if (cm && cm.items && fs.existsSync(CMT_AI_FILE)) {
          const cache = readCmtAi();
          cm.items.forEach((i) => { delete cache[i.id]; });
          fs.writeFileSync(CMT_AI_FILE, JSON.stringify(cache), 'utf8');
        }
        await google.disconnect(String(b.id));
        const prof = readProfiles(); // xoá luôn hồ sơ kênh (giọng điệu, khán giả…) của kênh này
        if (prof[String(b.id)]) { delete prof[String(b.id)]; writeProfiles(prof); }
      } catch (e) { return sendJson(res, 400, { error: e.message }); }
      return sendJson(res, 200, { list: google.list() });
    }
    if (url.pathname === '/api/update/run' && req.method === 'POST') {
      await runUpdate('manual');
      return sendJson(res, 200, publicStatus());
    }
    if (url.pathname === '/api/ai/test' && req.method === 'POST') return sendJson(res, 200, await testAi());
    if (url.pathname === '/api/ai/community' && req.method === 'POST') {
      const b = await readBody(req);
      try {
        const raw = await aiChat(buildCommunityPrompt(b), 3000);
        return sendJson(res, 200, parseAiJson(raw));
      } catch (e) {
        return sendJson(res, 502, { error: 'AI chưa viết được: ' + String(e.message).slice(0, 160) });
      }
    }
    if (url.pathname === '/api/profiles' && req.method === 'GET') return sendJson(res, 200, readProfiles());
    if (url.pathname === '/api/profiles' && req.method === 'POST') {
      const b = await readBody(req);
      const id = String(b.id || '');
      if (!/^[A-Za-z0-9_\-]{1,60}$/.test(id) || typeof b.profile !== 'object' || !b.profile) return sendJson(res, 400, { error: 'Dữ liệu hồ sơ không hợp lệ' });
      const all = readProfiles();
      const clean = {};
      PROFILE_FIELDS.forEach((f) => { clean[f] = String(b.profile[f] || '').slice(0, 2000); });
      all[id] = clean;
      writeProfiles(all);
      return sendJson(res, 200, all);
    }
    return sendJson(res, 404, { error: 'Không có API này' });
  } catch (e) {
    return sendJson(res, 500, { error: 'Lỗi máy chủ' });
  }
}

const pageHtml = (title, body, ok) => `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font:16px/1.6 Segoe UI,sans-serif;background:#0a0a0f;color:#ececf3;display:grid;place-items:center;min-height:100vh;margin:0"><div style="max-width:520px;padding:28px;border:1px solid ${ok ? '#2a6' : '#a34'};border-radius:14px;background:#101017"><h2 style="margin-top:0">${title}</h2>${body}<p><a style="color:#b8a6ff" href="/#/settings">← Về Cài đặt của app</a></p></div>`;
const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function handleOauth(req, res, url) {
  try {
    if (url.pathname === '/oauth/start') {
      res.writeHead(302, { Location: google.authUrl(url.searchParams.get('client') || '', url.searchParams.get('hint') || '') });
      return res.end();
    }
    // /oauth/callback
    if (url.searchParams.get('error')) throw new Error('Google báo: ' + url.searchParams.get('error') + ' (anh có thể đã bấm Huỷ).');
    const r = await google.handleCallback(url.searchParams.get('code') || '', url.searchParams.get('state') || '');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const form = `<p style="margin-bottom:6px"><b>Đặt ngách cho kênh này</b> (có thể để sau, sửa trong app):</p>
      <input id="n" list="l" placeholder="Ví dụ: Stoic, Bible, Hidden Science, Phật Pháp, English…" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid #33334a;background:#14141d;color:#ececf3;font:inherit">
      <datalist id="l"><option value="Stoic"><option value="Bible"><option value="Hidden Science"><option value="Phật Pháp"><option value="English"><option value="History"><option value="Tâm lý học"><option value="Tài chính"><option value="Thần thoại"><option value="Sức khoẻ"><option value="Sinh tồn"><option value="Vũ trụ"></datalist>
      <button id="b" style="margin-top:10px;padding:8px 16px;border-radius:8px;border:0;background:#7c5cff;color:#fff;font:inherit;cursor:pointer">Lưu ngách</button> <span id="m" style="margin-left:8px"></span>
      <script>document.getElementById('b').onclick=async()=>{const r=await fetch('/api/channels/meta',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:${JSON.stringify(r.id)},niche:document.getElementById('n').value})});document.getElementById('m').textContent=r.ok?'✓ Đã lưu':'Không lưu được';};</script>`;
    return res.end(pageHtml('✓ Đã kết nối kênh', `<p>Kênh <b>${escHtml(r.title)}</b> đã được kết nối.</p>${form}<p>Xong thì anh đóng tab này và quay lại app.</p>`, true));
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(pageHtml('Chưa kết nối được', `<p>${escHtml(e.message)}</p>`, false));
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  if (url.pathname === '/oauth/start' || url.pathname === '/oauth/callback') return handleOauth(req, res, url);
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Không tìm thấy');
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Cổng ${PORT} đã có app đang chạy.`);
    process.exit(0);
  }
  throw e;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Quản lý Kênh chạy tại http://localhost:${PORT}`);
  setTimeout(tickSchedule, 4000);
  setInterval(tickSchedule, 30000);
  // Tự lấy lại số liệu các kênh đã kết nối mỗi 1 giờ (và sau khi mở app nếu lần gần nhất đã cũ).
  setTimeout(() => { const last = google.lastSyncAt(); if (google.count() && (!last || Date.now() - new Date(last) > 50 * 60000)) google.syncAll().catch(() => {}); }, 20000);
  setInterval(() => { if (google.count()) google.syncAll().catch(() => {}); }, 3600000);
  // Đối thủ: kiểm tra số liệu + video mới mỗi 3 giờ (rất rẻ: khoảng 2 đơn vị/đối thủ)
  setInterval(() => {
    if (core.apiKeys().length && rivalsMod.load().rivals.length) rivalsMod.refresh(null, {}).catch(() => {});
  }, 3 * 3600000);
});
