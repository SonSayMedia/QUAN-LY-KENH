// Kết nối Google OAuth cho từng kênh + lấy số liệu chính xác (YouTube Data API + YouTube Analytics API).
// Một bộ Client ID/Secret dùng chung; mỗi kênh cấp quyền riêng và có refresh token riêng (lưu file trên máy, không đưa ra giao diện).
// Địa chỉ Google có thể đổi bằng biến môi trường QLK_GOOGLE_* để kiểm thử với máy chủ giả.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function makeGoogle(ctx) {
  const { readSettings, dataDir, port } = ctx;
  const fixMojibake = ctx.fixMojibake || ((s) => s); // phòng vệ nếu chạy tách rời không có core (kiểm thử)
  const AUTH = process.env.QLK_GOOGLE_AUTH || 'https://accounts.google.com/o/oauth2/v2/auth';
  const TOKEN = process.env.QLK_GOOGLE_TOKEN || 'https://oauth2.googleapis.com/token';
  const REVOKE = process.env.QLK_GOOGLE_REVOKE || 'https://oauth2.googleapis.com/revoke';
  const YT = process.env.QLK_GOOGLE_YT || 'https://www.googleapis.com/youtube/v3';
  const YTA = process.env.QLK_GOOGLE_YTA || 'https://youtubeanalytics.googleapis.com/v2';
  const MONETARY = 'https://www.googleapis.com/auth/yt-analytics-monetary.readonly';
  const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/yt-analytics.readonly', MONETARY];
  const FILE = path.join(dataDir, 'channels.json');
  const redirectUri = `http://localhost:${port}/oauth/callback`;
  const DAYS = 90;

  const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return { connections: {} }; } };
  const write = (o) => { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2), 'utf8'); };
  const snapFile = (id) => path.join(dataDir, `snap-${id}.json`);
  const readSnap = (id) => { try { return JSON.parse(fs.readFileSync(snapFile(id), 'utf8')); } catch (e) { return null; } };
  const okId = (id) => /^[A-Za-z0-9_\-]{1,60}$/.test(String(id || ''));

  const states = new Map(); // nonce -> thời điểm tạo (chống giả mạo callback)
  const tokens = new Map(); // channelId -> { token, exp }
  let syncing = false;

  // ---- Nhiều bộ OAuth (Client ID + Secret): mỗi kênh nhớ nó được kết nối bằng bộ nào ----
  // "lifetime" = số tài khoản đã dùng suất của bộ này (tính cả kênh đã xoá) — Google giới hạn 100 suất suốt vòng đời project chưa xác minh.
  function clients() {
    const s = readSettings();
    if (Array.isArray(s.oauthClients)) return s.oauthClients;
    const o = s.oauth; // dữ liệu cũ (một bộ duy nhất) → coi là "Bộ 1"
    return o && o.clientId ? [{ key: 'c1', label: 'Bộ 1', clientId: o.clientId, clientSecret: o.clientSecret || '', lifetime: Object.keys(read().connections).length, addedAt: new Date().toISOString() }] : [];
  }
  function saveClients(list) { const s = readSettings(); s.oauthClients = list; delete s.oauth; ctx.writeSettings(s); }
  const connClient = (c) => c.clientKey || (clients()[0] || {}).key || '';
  function creds(key) {
    const list = clients();
    const c = list.find((x) => x.key === key) || (key ? null : list[0]) || null;
    return c ? { id: c.clientId, secret: c.clientSecret, key: c.key } : { id: '', secret: '', key: '' };
  }
  function addClient({ label, clientId, clientSecret }) {
    const id = String(clientId || '').trim(), secret = String(clientSecret || '').trim();
    if (!/\.apps\.googleusercontent\.com$/.test(id)) throw new Error('Client ID phải kết thúc bằng .apps.googleusercontent.com');
    if (!secret) throw new Error('Hãy nhập Client Secret.');
    const list = clients().slice();
    if (list.some((c) => c.clientId === id)) throw new Error('Bộ OAuth này đã có trong danh sách.');
    const n = list.reduce((m, c) => Math.max(m, +String(c.key).replace(/\D/g, '') || 0), 0) + 1;
    list.push({ key: 'c' + n, label: String(label || '').trim().slice(0, 40) || `Bộ ${n}`, clientId: id, clientSecret: secret, lifetime: 0, addedAt: new Date().toISOString() });
    saveClients(list);
    return list[list.length - 1].key;
  }
  function removeClient(key) {
    const using = Object.values(read().connections).filter((c) => connClient(c) === key).length;
    if (using) throw new Error(`Còn ${using} kênh đang dùng bộ này — hãy xoá theo dõi các kênh đó trước.`);
    saveClients(clients().filter((c) => c.key !== key));
  }
  function clientsPublic() {
    const conns = Object.values(read().connections);
    return clients().map((c) => ({ key: c.key, label: c.label, clientIdMasked: String(c.clientId).slice(0, 14) + '…', secretSet: !!c.clientSecret, channels: conns.filter((x) => connClient(x) === c.key).length, lifetime: c.lifetime || 0, published: !!c.published }));
  }
  // Anh đã bấm "Publish app" cho dự án này → quyền kênh không hết hạn 7 ngày nữa (Dashboard thôi đếm ngược)
  function setClientPublished(key, published) {
    const list = clients();
    if (!list.some((c) => c.key === key)) throw new Error('Không tìm thấy bộ OAuth này.');
    saveClients(list.map((c) => (c.key === key ? { ...c, published: !!published, publishedAt: published ? new Date().toISOString() : null } : c)));
  }
  function bumpLifetime(key) { const list = clients().map((c) => (c.key === key ? { ...c, lifetime: (c.lifetime || 0) + 1 } : c)); saveClients(list); }

  // ---- Danh sách CỐ ĐỊNH "Người quản lý" (anh giao kênh cho nhân sự nào) — chọn từ dropdown, không gõ tự do, để lọc/so sánh chính xác ----
  // Mỗi người tự động nhận 1 màu (xoay vòng bảng màu) ngay lúc thêm, để nhận ra nhanh trong bảng.
  const MANAGER_COLORS = ['#7c5cff', '#22c1a5', '#f5a524', '#ef5b7b', '#4aa3ff', '#9bd23c', '#c26bff', '#ff8a4c'];
  function managers() {
    const s = readSettings();
    const list = Array.isArray(s.managers) ? s.managers : [];
    // Dữ liệu cũ lưu tên trần (chuỗi) trước khi có màu tự động — nâng cấp 1 lần thành {name,color} rồi lưu lại, giữ nguyên thứ tự.
    if (list.some((m) => typeof m === 'string')) {
      const migrated = list.map((m, i) => (typeof m === 'string' ? { name: m, color: MANAGER_COLORS[i % MANAGER_COLORS.length] } : m));
      saveManagers(migrated);
      return migrated;
    }
    return list;
  }
  function saveManagers(list) { const s = readSettings(); s.managers = list; ctx.writeSettings(s); }
  function addManager(name) {
    const n = String(name || '').trim().slice(0, 60);
    if (!n) throw new Error('Hãy nhập tên người quản lý.');
    const list = managers();
    if (list.some((m) => m.name.toLowerCase() === n.toLowerCase())) throw new Error('Người quản lý này đã có trong danh sách.');
    list.push({ name: n, color: MANAGER_COLORS[list.length % MANAGER_COLORS.length] });
    saveManagers(list);
    return list;
  }
  function removeManager(name) {
    const using = Object.values(read().connections).filter((c) => c.manager === name).length;
    if (using) throw new Error(`Còn ${using} kênh đang gán người quản lý "${name}" — đổi người quản lý cho các kênh đó trước.`);
    saveManagers(managers().filter((m) => m.name !== name));
    return managers();
  }
  // Chọn bộ còn nhiều suất nhất khi anh không chỉ định
  const pickClient = () => { const l = clients().slice().sort((a, b) => (a.lifetime || 0) - (b.lifetime || 0)); return l.length ? l[0].key : ''; };

  function authUrl(key, hint) {
    const c = creds(key || pickClient());
    if (!c.id || !c.secret) throw new Error('Chưa nhập Client ID và Client Secret trong Cài đặt.');
    const state = crypto.randomBytes(16).toString('hex');
    states.set(state, { t: Date.now(), key: c.key });
    for (const [k, v] of states) if (Date.now() - v.t > 60 * 60000) states.delete(k);
    const q = new URLSearchParams({
      client_id: c.id, redirect_uri: redirectUri, response_type: 'code', scope: SCOPES.join(' '),
      access_type: 'offline', prompt: 'consent select_account', include_granted_scopes: 'false', state,
    });
    // Gmail dự kiến: Google chọn sẵn đúng tài khoản này nếu trình duyệt đang đăng nhập nó (chỉ là gợi ý, không ép được)
    if (hint && /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(String(hint).trim())) q.set('login_hint', String(hint).trim());
    return `${AUTH}?${q}`;
  }

  async function form(url, params) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params), signal: AbortSignal.timeout(20000) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.error) throw Object.assign(new Error(j.error_description || j.error || `Lỗi ${res.status}`), { code: j.error });
    return j;
  }
  async function get(url, token) {
    if (ctx.quotaAdd && String(url).startsWith(YT)) ctx.quotaAdd('oauth', 'OAuth (kênh của anh)', /\/search\?/.test(url) ? 100 : 1);
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(30000) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = String((j.error && (j.error.message || j.error)) || `Lỗi ${res.status}`);
      if (/has not been used in project|it is disabled/i.test(msg)) {
        const api = (msg.match(/YouTube [A-Za-z ]+?API( v3)?/) || ['API YouTube'])[0];
        const proj = (msg.match(/project (\d+)/) || [])[1];
        const link = (msg.match(/https:\/\/console\.[^\s]+/) || [])[0];
        throw Object.assign(new Error(`Project Google Cloud${proj ? ' ' + proj : ''} chưa bật “${api}”. Hãy bật nó (Library → ${api} → Enable) trong ĐÚNG project này${link ? ', hoặc mở: ' + link : ''}, chờ vài phút rồi thử lại.`), { status: res.status });
      }
      throw Object.assign(new Error(msg), { status: res.status });
    }
    return j;
  }

  async function accessToken(id) {
    const cached = tokens.get(id);
    if (cached && cached.exp > Date.now() + 60000) return cached.token;
    const conn = read().connections[id];
    if (!conn) throw new Error('Kênh chưa được kết nối');
    const c = creds(connClient(conn));
    try {
      const j = await form(TOKEN, { client_id: c.id, client_secret: c.secret, refresh_token: conn.refreshToken, grant_type: 'refresh_token' });
      tokens.set(id, { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 });
      return j.access_token;
    } catch (e) {
      if (e.code === 'invalid_grant') { const all = read(); if (all.connections[id]) { all.connections[id].needsReauth = true; write(all); } throw new Error('Quyền truy cập đã hết hạn hoặc bị thu hồi — hãy kết nối lại kênh này'); }
      throw e;
    }
  }

  async function handleCallback(code, state) {
    const st = states.get(state);
    if (!st) throw new Error('Phiên kết nối không hợp lệ hoặc đã hết hạn. Hãy bấm “Kết nối kênh” lại từ app.');
    if (Date.now() - st.t > 60 * 60000) { states.delete(state); throw new Error('Link kết nối đã quá 60 phút. Hãy bấm “Sao chép link Google” để lấy link mới.'); }
    states.delete(state);
    const c = creds(st.key);
    const t = await form(TOKEN, { code, client_id: c.id, client_secret: c.secret, redirect_uri: redirectUri, grant_type: 'authorization_code' });
    if (!t.refresh_token) throw new Error('Google không trả mã làm mới (refresh token). Hãy thử kết nối lại.');
    const me = await get(`${YT}/channels?part=id,snippet,statistics,contentDetails&mine=true`, t.access_token);
    const ch = me.items && me.items[0];
    if (!ch) throw new Error('Không thấy kênh YouTube nào của tài khoản này. Hãy kết nối bằng Gmail CHỦ SỞ HỮU CHÍNH của kênh (Gmail chỉ là Quản lý thường không được) và chọn đúng danh tính kênh ở màn chọn tài khoản của Google.');
    const all = read();
    const old = all.connections[ch.id] || {};
    all.connections[ch.id] = {
      title: fixMojibake(ch.snippet.title), handle: ch.snippet.customUrl || '', thumb: (ch.snippet.thumbnails && (ch.snippet.thumbnails.default || {}).url) || '',
      country: old.country || ch.snippet.country || '', niche: old.niche || '', market: old.market || '', gmail: old.gmail || '', where: old.where || '',
      refreshToken: t.refresh_token, clientKey: st.key, revenueScope: String(t.scope || '').split(/\s+/).includes(MONETARY),
      grantedAt: new Date().toISOString(),
      connectedAt: old.connectedAt || new Date().toISOString(), lastSync: old.lastSync || null, lastError: '', needsReauth: false,
    };
    write(all);
    if (!old.title) bumpLifetime(st.key); // kênh mới = tiêu hao thêm 1 suất của bộ này
    tokens.set(ch.id, { token: t.access_token, exp: Date.now() + (t.expires_in || 3600) * 1000 });
    await sync(ch.id).catch(() => {});
    return { id: ch.id, title: fixMojibake(ch.snippet.title) };
  }

  const isoDay = (d) => d.toISOString().slice(0, 10);
  const rowsOf = (a) => { const names = (a.columnHeaders || []).map((h) => h.name); return (a.rows || []).map((r) => Object.fromEntries(names.map((n, i) => [n, r[i]]))); };
  // Doanh thu ước tính (USD) qua YouTube Analytics: theo ngày (90 ngày) và theo từng video (28 ngày + từ trước tới nay).
  // Cần quyền yt-analytics-monetary.readonly và kênh đã bật kiếm tiền; thiếu thì trả trạng thái để giao diện báo rõ, không làm hỏng đồng bộ.
  async function fetchRevenue(id, token, start, end) {
    const conn = read().connections[id] || {};
    if (!conn.revenueScope) return { state: 'noscope', msg: 'Kênh chưa cấp quyền xem doanh thu — hãy kết nối lại kênh này để cấp quyền.' };
    const q = (extra) => `${YTA}/reports?ids=channel==MINE&metrics=estimatedRevenue&${extra}`;
    try {
      const d = await get(q(`startDate=${isoDay(start)}&endDate=${isoDay(end)}&dimensions=day&sort=day`), token);
      const daily = rowsOf(d).map((r) => ({ day: r.day, rev: +r.estimatedRevenue || 0 }));
      const perVideo = async (from) => {
        const a = await get(q(`startDate=${from}&endDate=${isoDay(end)}&dimensions=video&sort=-estimatedRevenue&maxResults=200`), token);
        return Object.fromEntries(rowsOf(a).map((r) => [r.video, +r.estimatedRevenue || 0]));
      };
      let perVideo28 = {}, perVideoAll = {};
      try { perVideo28 = await perVideo(isoDay(new Date(Date.now() - 28 * 86400000))); perVideoAll = await perVideo('2015-10-01'); } catch (e) { /* có tổng theo ngày là đủ; doanh thu theo video có thể thiếu */ }
      return { state: 'ok', currency: 'USD', daily, perVideo28, perVideoAll };
    } catch (e) {
      const m = String(e.message || '');
      if (e.status === 403 || e.status === 401) return { state: 'denied', msg: 'Google không cho xem doanh thu của kênh này: kênh chưa bật kiếm tiền (YPP), hoặc chưa cấp quyền doanh thu — kết nối lại kênh để cấp.' };
      return { state: 'error', msg: 'Không lấy được doanh thu: ' + m.slice(0, 140) };
    }
  }
  // Tổng thời gian xem (phút) của từng video từ trước tới nay (bảng video ở trang kênh)
  async function fetchVideoWatch(token, end) {
    try {
      const a = await get(`${YTA}/reports?ids=channel==MINE&startDate=2015-10-01&endDate=${isoDay(end)}&metrics=estimatedMinutesWatched,averageViewPercentage,averageViewDuration&dimensions=video&sort=-estimatedMinutesWatched&maxResults=200`, token);
      return Object.fromEntries(rowsOf(a).map((r) => [r.video, { min: +r.estimatedMinutesWatched || 0, pct: r.averageViewPercentage != null ? +r.averageViewPercentage : null, avg: r.averageViewDuration != null ? +r.averageViewDuration : null }]));
    } catch (e) { return null; }
  }

  // Bình luận CHƯA TRẢ LỜI: bỏ bình luận do chính chủ kênh viết và bình luận mà chủ kênh đã có phản hồi.
  // Đọc bình luận công khai bằng KHOÁ API (không cần OAuth): đọc bình luận qua OAuth đòi quyền youtube.force-ssl (quyền quản lý kênh), rộng hơn mức cần thiết.
  async function getKey(url) {
    const picked = ctx.pickApiKey ? ctx.pickApiKey(1) : { key: 'legacy', value: (readSettings().apiKey || {}).value };
    if (!picked || !picked.value) throw new Error('Chưa cài khoá YouTube Data API v3, hoặc đã hết hạn mức mọi khoá hôm nay (Cài đặt).');
    const res = await fetch(`${url}&key=${encodeURIComponent(picked.value)}`, { signal: AbortSignal.timeout(30000) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(String((j.error && (j.error.message || j.error)) || `Lỗi ${res.status}`)), { status: res.status });
    if (ctx.quotaAdd) ctx.quotaAdd(picked.key, 'bình luận', 1);
    return j;
  }
  // query: "videoId=..." (một video) hoặc "allThreadsRelatedToChannelId=..." (cả kênh). Quét tối đa 3 trang x 100 bình luận gần nhất;
  // bình luận có nhiều hơn 5 phản hồi thì hỏi thêm danh sách đầy đủ để không bỏ sót phản hồi của chủ kênh.
  async function scanComments(channelId, query, titles) {
    const mine = (c) => c && c.snippet && c.snippet.authorChannelId && c.snippet.authorChannelId.value === channelId;
    const items = [];
    let scanned = 0, page = '', more = false, extra = 0;
    for (let i = 0; i < 3; i++) {
      const j = await getKey(`${YT}/commentThreads?part=snippet,replies&${query}&maxResults=100&order=time&textFormat=plainText${page ? '&pageToken=' + encodeURIComponent(page) : ''}`);
      for (const th of j.items || []) {
        scanned++;
        const top = th.snippet && th.snippet.topLevelComment;
        if (!top || mine(top)) continue;
        const shown = (th.replies && th.replies.comments) || [];
        const total = (th.snippet && th.snippet.totalReplyCount) || 0;
        let answered = shown.some(mine);
        if (!answered && total > shown.length && extra < 60) {
          extra++;
          try { answered = ((await getKey(`${YT}/comments?part=snippet&parentId=${encodeURIComponent(top.id)}&maxResults=100&textFormat=plainText`)).items || []).some(mine); } catch (e) { /* không kiểm tra được thì coi như chưa trả lời */ }
        }
        if (answered) continue;
        const s = top.snippet, vid = s.videoId || (th.snippet && th.snippet.videoId) || '';
        items.push({ id: top.id, author: fixMojibake(s.authorDisplayName || ''), text: fixMojibake(String(s.textDisplay || s.textOriginal || '').slice(0, 800)), likes: s.likeCount || 0, publishedAt: s.publishedAt, replies: total, videoId: vid, videoTitle: fixMojibake((titles && titles[vid]) || ''), url: `https://www.youtube.com/watch?v=${vid}&lc=${top.id}` });
      }
      page = j.nextPageToken || '';
      if (!page) break;
      if (i === 2) more = true;
    }
    return { items, scanned, more };
  }
  const ccache = new Map();
  async function videoComments(id, videoId, refresh) {
    if (!okId(id) || !/^[A-Za-z0-9_-]{6,20}$/.test(String(videoId || ''))) throw new Error('Video không hợp lệ');
    const ck = `${id}|${videoId}`;
    const hit = ccache.get(ck);
    if (!refresh && hit && Date.now() - hit.t < 3 * 60000) return hit.data;
    if (!read().connections[id]) throw new Error('Kênh chưa được kết nối');
    const vid = ((readSnap(id) || {}).videos || []).find((v) => v.id === videoId) || {};
    let data;
    try {
      const r = await scanComments(id, `videoId=${videoId}`, { [videoId]: vid.title || '' });
      data = { video: { id: videoId, title: vid.title || '' }, unanswered: r.items, scanned: r.scanned, more: r.more };
    } catch (e) {
      if (!/disabled comments|commentsDisabled/i.test(String(e.message))) throw e;
      data = { video: { id: videoId, title: vid.title || '' }, disabled: true, unanswered: [], scanned: 0 };
    }
    ccache.set(ck, { t: Date.now(), data });
    for (const [k, v] of ccache) if (Date.now() - v.t > 15 * 60000) ccache.delete(k);
    return data;
  }

  // Bình luận chưa trả lời của CẢ KÊNH (cột "Tương tác"): quét khi đồng bộ (tối đa mỗi 20 giờ/kênh để tiết kiệm hạn mức) hoặc khi anh bấm quét lại
  const cmtFile = (id) => path.join(dataDir, `cmt-${id}.json`);
  const readCmt = (id) => { try { return JSON.parse(fs.readFileSync(cmtFile(id), 'utf8')); } catch (e) { return null; } };
  const cmtFail = new Map(); // kênh -> lúc quét lỗi gần nhất (tránh thử lại mỗi giờ khi đồng bộ)
  const isoSec = (d) => { const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d || ''); return m ? (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : null; };
  async function channelComments(id, refresh, fromSync) {
    if (!okId(id)) throw new Error('Kênh không hợp lệ');
    if (!read().connections[id]) throw new Error('Kênh chưa được kết nối');
    const old = readCmt(id);
    if (old && !refresh && Date.now() - new Date(old.at) < 20 * 3600e3) return old;
    if (fromSync && cmtFail.get(id) && Date.now() - cmtFail.get(id) < 3 * 3600e3) return old || null; // đồng bộ tự động: lỗi thì lùi 3 giờ mới thử lại
    try { return await scanChannelComments(id, old); } catch (e) { cmtFail.set(id, Date.now()); throw e; }
  }
  async function scanChannelComments(id, old) {
    const titles = Object.fromEntries(((readSnap(id) || {}).videos || []).map((v) => [v.id, v.title]));
    const r = await scanComments(id, `allThreadsRelatedToChannelId=${id}`, titles);
    const data = { at: new Date().toISOString(), count: r.items.length, scanned: r.scanned, more: r.more, items: r.items.slice(0, 100) };
    fs.writeFileSync(cmtFile(id), JSON.stringify(data), 'utf8');
    return data;
  }

  // Lượt xem từng video trong 7 ngày gần nhất và 7 ngày trước đó (để Dashboard tìm video đang bứt phá)
  async function fetchVideoRecent(token, end) {
    const one = async (from, to) => {
      const a = await get(`${YTA}/reports?ids=channel==MINE&startDate=${isoDay(from)}&endDate=${isoDay(to)}&metrics=views&dimensions=video&sort=-views&maxResults=200`, token);
      return Object.fromEntries(rowsOf(a).map((r) => [r.video, +r.views || 0]));
    };
    try {
      const day = 86400000;
      const cur = await one(new Date(end.getTime() - 6 * day), end);
      const prev = await one(new Date(end.getTime() - 13 * day), new Date(end.getTime() - 7 * day));
      const out = {};
      for (const id of new Set([...Object.keys(cur), ...Object.keys(prev)])) out[id] = { v7: cur[id] || 0, p7: prev[id] || 0 };
      return out;
    } catch (e) { return null; }
  }

  // Báo cáo chi tiết MỘT video (mở khi bấm vào video): số tổng, theo ngày, nguồn truy cập, từ khoá tìm kiếm, quốc gia, tuổi/giới tính, thiết bị, giữ chân người xem.
  // Mỗi phần hỏi Google riêng; phần nào lỗi thì trả kèm lý do, các phần còn lại vẫn hiện. Nhớ tạm 10 phút để đỡ gọi lại.
  const vcache = new Map();
  async function videoReport(id, videoId, range) {
    if (!okId(id) || !/^[A-Za-z0-9_-]{6,20}$/.test(String(videoId || ''))) throw new Error('Video không hợp lệ');
    range = ['7', '28', '90', 'all'].includes(String(range)) ? String(range) : '28';
    const ck = `${id}|${videoId}|${range}`;
    const hit = vcache.get(ck);
    if (hit && Date.now() - hit.t < 10 * 60000) return hit.data;
    const conn = read().connections[id];
    if (!conn) throw new Error('Kênh chưa được kết nối');
    const token = await accessToken(id);
    const snap = readSnap(id) || {};
    const vid = (snap.videos || []).find((v) => v.id === videoId) || {};
    const end = new Date(Date.now() - 86400000);
    const pub = vid.date ? new Date(vid.date) : null;
    let start = range === 'all' ? (pub || new Date('2015-10-01')) : new Date(Date.now() - Number(range) * 86400000);
    if (pub && pub > start) start = pub;
    if (start > end) start = end;
    const hasRev = !!conn.revenueScope;
    const F = `filters=video==${videoId}`;
    const q = (metrics, extra) => `${YTA}/reports?ids=channel==MINE&startDate=${isoDay(start)}&endDate=${isoDay(end)}&metrics=${metrics}&${extra}`;
    const run = async (url) => { try { return rowsOf(await get(url, token)); } catch (e) { return { error: String(e.message || e).slice(0, 160) }; } };
    const rev = hasRev ? ',estimatedRevenue' : '';
    const [totals, daily, traffic, search, country, age, device, retention] = await Promise.all([
      run(q('views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost' + rev, F)),
      run(q('views,estimatedMinutesWatched,averageViewDuration,likes,comments,subscribersGained' + rev, `dimensions=day&sort=day&${F}`)),
      run(q('views,estimatedMinutesWatched', `dimensions=insightTrafficSourceType&sort=-views&${F}`)),
      run(q('views', `dimensions=insightTrafficSourceDetail&sort=-views&maxResults=25&filters=video==${videoId};insightTrafficSourceType==YT_SEARCH`)),
      run(q('views,estimatedMinutesWatched', `dimensions=country&sort=-views&maxResults=15&${F}`)),
      run(q('viewerPercentage', `dimensions=ageGroup,gender&${F}`)),
      run(q('views,estimatedMinutesWatched', `dimensions=deviceType&sort=-views&${F}`)),
      run(q('audienceWatchRatio', `dimensions=elapsedVideoTimeRatio&sort=elapsedVideoTimeRatio&${F}`)),
    ]);
    // Phần bổ sung cho giao diện kiểu YouTube Studio: tiếp cận (hiển thị thumbnail + CTR), chi tiết nguồn truy cập, doanh thu chi tiết, thời lượng video
    const src = (type) => run(q('views', `dimensions=insightTrafficSourceDetail&sort=-views&maxResults=15&filters=video==${videoId};insightTrafficSourceType==${type}`));
    // Lượt hiển thị thumbnail / CTR / người xem riêng biệt: Google API không hỗ trợ (đã thử với kênh thật) nên không hỏi; chi tiết danh sách phát cũng không hỗ trợ.
    const [ext, sugg, revTotals, meta] = await Promise.all([
      src('EXT_URL'), src('RELATED_VIDEO'),
      hasRev ? run(q('estimatedRevenue,estimatedAdRevenue,monetizedPlaybacks,adImpressions,cpm,playbackBasedCpm', F)) : Promise.resolve({ error: 'Chưa cấp quyền doanh thu' }),
      get(`${YT}/videos?part=contentDetails&id=${videoId}`, token).catch(() => null),
    ]);
    // Tên video / danh sách phát cho các nguồn "Video đề xuất" và "Danh sách phát" (Google chỉ trả mã)
    const titleMap = async (rows, kind) => {
      if (!Array.isArray(rows) || !rows.length) return;
      const ids = rows.map((r) => r.insightTrafficSourceDetail).filter((x) => /^[A-Za-z0-9_-]{6,40}$/.test(String(x || '')));
      if (!ids.length) return;
      try {
        const j = await get(`${YT}/${kind}?part=snippet&id=${ids.join(',')}&maxResults=50`, token);
        const m = Object.fromEntries((j.items || []).map((x) => [x.id, x.snippet.title]));
        rows.forEach((r) => { r.title = m[r.insightTrafficSourceDetail] || ''; });
      } catch (e) { /* không lấy được tên thì hiện mã */ }
    };
    await titleMap(sugg, 'videos');
    const dur = meta && meta.items && meta.items[0] && (meta.items[0].contentDetails || {}).duration;
    const dm = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(dur || '');
    const durationSec = dm ? (+dm[1] || 0) * 3600 + (+dm[2] || 0) * 60 + (+dm[3] || 0) : 0;
    const data = {
      video: { id: videoId, title: vid.title || '', date: vid.date || '', url: `https://www.youtube.com/watch?v=${videoId}`, durationSec },
      channelId: id, range, from: isoDay(start), to: isoDay(end), hasRevenue: hasRev,
      totals: Array.isArray(totals) ? totals[0] || null : totals, daily, traffic, search, country, age, device, retention,
      sources: { ext, sugg },
      revTotals: Array.isArray(revTotals) ? revTotals[0] || null : revTotals,
    };
    vcache.set(ck, { t: Date.now(), data });
    for (const [k, v] of vcache) if (Date.now() - v.t > 30 * 60000) vcache.delete(k);
    return data;
  }

  async function sync(id) {
    const token = await accessToken(id);
    const me = await get(`${YT}/channels?part=id,snippet,statistics,contentDetails&mine=true`, token);
    const ch = me.items && me.items[0];
    if (!ch) throw new Error('Không đọc được kênh');
    const st = ch.statistics || {};
    // Video: tối đa 200 video mới nhất (4 trang playlist "uploads")
    const uploads = ch.contentDetails && ch.contentDetails.relatedPlaylists && ch.contentDetails.relatedPlaylists.uploads;
    const ids = [];
    let page = '';
    for (let i = 0; i < 4 && uploads; i++) {
      const p = await get(`${YT}/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}${page ? '&pageToken=' + page : ''}`, token);
      (p.items || []).forEach((x) => ids.push(x.contentDetails.videoId));
      page = p.nextPageToken || '';
      if (!page) break;
    }
    const videos = [];
    for (let i = 0; i < ids.length; i += 50) {
      const v = await get(`${YT}/videos?part=snippet,statistics,status,contentDetails&id=${ids.slice(i, i + 50).join(',')}`, token);
      (v.items || []).forEach((x) => videos.push({ id: x.id, seconds: isoSec((x.contentDetails || {}).duration), title: fixMojibake(x.snippet.title), date: x.snippet.publishedAt, views: +x.statistics.viewCount || 0, likes: +x.statistics.likeCount || 0, comments: +x.statistics.commentCount || 0, privacy: (x.status || {}).privacyStatus || '', upload: (x.status || {}).uploadStatus || '', rejection: (x.status || {}).rejectionReason || '', publishAt: (x.status || {}).publishAt || '' }));
    }
    // Analytics: số liệu theo ngày 90 ngày gần nhất (đến hôm qua)
    const end = new Date(Date.now() - 86400000), start = new Date(Date.now() - DAYS * 86400000);
    let daily = [];
    try {
      const a = await get(`${YTA}/reports?ids=channel==MINE&startDate=${isoDay(start)}&endDate=${isoDay(end)}&metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost,comments,likes&dimensions=day&sort=day`, token);
      const names = (a.columnHeaders || []).map((h) => h.name);
      daily = (a.rows || []).map((r) => Object.fromEntries(names.map((n, i) => [n, r[i]])));
    } catch (e) { daily = []; }
    const revenue = await fetchRevenue(id, token, start, end);
    const videoStats = await fetchVideoWatch(token, end);
    const videoRecent = await fetchVideoRecent(token, end);
    const prev = readSnap(id) || { hourly: [] };
    const now = new Date().toISOString();
    const hourly = (prev.hourly || []).concat({ t: now, subs: +st.subscriberCount || 0, views: +st.viewCount || 0, videos: +st.videoCount || 0 }).slice(-720);
    fs.writeFileSync(snapFile(id), JSON.stringify({
      syncedAt: now, hiddenSubs: !!st.hiddenSubscriberCount,
      channel: { subs: +st.subscriberCount || 0, views: +st.viewCount || 0, videos: +st.videoCount || 0 },
      commentsTotal: videos.reduce((t, v) => t + v.comments, 0), videosFetched: videos.length, daily, videos, hourly, revenue, videoStats, videoRecent,
    }), 'utf8');
    const all = read();
    if (all.connections[id]) { all.connections[id].lastSync = now; all.connections[id].lastError = ''; all.connections[id].title = ch.snippet.title; write(all); }
    await channelComments(id, false, true).catch(() => {}); // bình luận chưa trả lời (quét tối đa mỗi 20 giờ)
  }

  async function syncAll() {
    if (syncing) return { done: 0, failed: 0, total: 0, busy: true };
    syncing = true;
    let done = 0, failed = 0;
    const ids = Object.keys(read().connections);
    try {
      for (const id of ids) {
        try { await sync(id); done++; }
        catch (e) { failed++; const all = read(); if (all.connections[id]) { all.connections[id].lastError = String(e.message).slice(0, 160); write(all); } }
      }
    } finally { syncing = false; }
    return { done, failed, total: ids.length };
  }

  // Dựng chuỗi tích luỹ 90 ngày (phần tử cuối = hôm nay) từ tổng hiện tại + số tăng theo ngày của Analytics.
  function cumulative(current, gainsByDayDesc, todayDelta) {
    const out = new Array(DAYS);
    out[DAYS - 1] = current;
    out[DAYS - 2] = Math.max(0, Math.round(current - Math.max(0, todayDelta)));
    for (let i = DAYS - 3, j = 0; i >= 0; i--, j++) out[i] = Math.max(0, Math.round(out[i + 1] - (gainsByDayDesc[j] || 0)));
    return out;
  }
  // Nếu tổng số tăng theo ngày (Analytics) lớn hơn tổng hiện tại (Data API) thì thu nhỏ cho khớp, tránh chuỗi bị cắt về 0.
  function fit(current, gains) {
    const sum = gains.reduce((t, g) => t + Math.max(0, g), 0);
    return sum > current && sum > 0 ? gains.map((g) => (g > 0 ? (g * current) / sum : g)) : gains;
  }
  function todayDelta(hourly, key, current) {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const before = (hourly || []).filter((h) => new Date(h.t) < midnight).pop();
    return before ? current - before[key] : 0;
  }

  // Tóm tắt doanh thu cho giao diện: hôm qua / 7 ngày / 28 ngày / 90 ngày (Google báo trễ 1–2 ngày nên "hôm qua" có thể chưa đủ)
  function revenueOf(r, dailyViews) {
    if (!r) return { state: 'none', msg: 'Chưa đồng bộ doanh thu.' };
    if (r.state !== 'ok') return { state: r.state, msg: r.msg || '' };
    const d = (r.daily || []).slice().reverse();
    const sum = (n) => Math.round(d.slice(0, n).reduce((t, x) => t + x.rev, 0) * 100) / 100;
    // RPM = doanh thu ước tính trên 1.000 lượt xem, cùng các ngày với doanh thu để hai số khớp nhau
    const vmap = dailyViews || {};
    const rpm = (n) => { const v = d.slice(0, n).reduce((t, x) => t + (vmap[x.day] || 0), 0); return v > 0 ? Math.round((sum(n) / v) * 1000 * 100) / 100 : null; };
    const prev7 = Math.round(d.slice(7, 14).reduce((t, x) => t + x.rev, 0) * 100) / 100;
    // "Kỳ trước" của mốc 28 ngày vẫn nằm trong 90 ngày đã lấy (28-55 ngày trước); mốc 90 ngày thì không đủ dữ liệu 180 ngày để so, giao diện tự bỏ qua % khi thiếu.
    const prev28 = Math.round(d.slice(28, 56).reduce((t, x) => t + x.rev, 0) * 100) / 100;
    const vw = (n) => d.slice(0, n).reduce((t, x) => t + (vmap[x.day] || 0), 0);
    return { state: 'ok', currency: r.currency || 'USD', d1: sum(1), d7: sum(7), prev7, d28: sum(28), prev28, d90: sum(90), rpm7: rpm(7), rpm28: rpm(28), rpm90: rpm(90), vw7: vw(7), vw28: vw(28), lastDay: d[0] ? d[0].day : '' };
  }

  function ownData() {
    const conns = read().connections;
    return Object.entries(conns).map(([id, c]) => {
      const s = readSnap(id);
      if (!s) return null;
      const dailyDesc = (s.daily || []).slice().reverse();
      const net = dailyDesc.map((d) => (d.subscribersGained || 0) - (d.subscribersLost || 0));
      const cViews = dailyDesc.map((d) => d.views || 0);
      const cComments = dailyDesc.map((d) => d.comments || 0);
      const cur = s.channel;
      return {
        id, name: c.title, handle: c.handle, niche: c.niche || 'Chưa đặt ngách', country: c.country || '', market: c.market || '', gmail: c.gmail || '', where: c.where || '', manager: c.manager || '', syncedAt: s.syncedAt, hiddenSubs: s.hiddenSubs,
        videos: cur.videos, videosFetched: s.videosFetched,
        subs: cumulative(cur.subs, fit(cur.subs, net), todayDelta(s.hourly, 'subs', cur.subs)),
        views: cumulative(cur.views, fit(cur.views, cViews), todayDelta(s.hourly, 'views', cur.views)),
        comments: cumulative(s.commentsTotal, fit(s.commentsTotal, cComments), 0),
        watchMinutes28: dailyDesc.slice(0, 28).reduce((t, d) => t + (d.estimatedMinutesWatched || 0), 0),
        revenue: c.revenueScope ? revenueOf(s.revenue, Object.fromEntries((s.daily || []).map((x) => [x.day, +x.views || 0]))) : { state: 'noscope', msg: 'Kênh này kết nối trước khi có quyền doanh thu — hãy kết nối lại kênh (cấp quyền xem báo cáo tiền).' },
        videoList: (s.videos || []).slice(0, 50).map((v) => ({ id: v.id, title: v.title, views: v.views, likes: v.likes, comments: v.comments, date: v.date, url: `https://www.youtube.com/watch?v=${v.id}`, seconds: v.seconds != null ? v.seconds : null, v7: s.videoRecent && s.videoRecent[v.id] ? s.videoRecent[v.id].v7 : null, p7: s.videoRecent && s.videoRecent[v.id] ? s.videoRecent[v.id].p7 : null, privacy: v.privacy || '', upload: v.upload || '', rejection: v.rejection || '', publishAt: v.publishAt || '', watchMin: s.videoStats ? ((s.videoStats[v.id] || {}).min || 0) : null, avgDur: s.videoStats && s.videoStats[v.id] && s.videoStats[v.id].avg != null ? s.videoStats[v.id].avg : null, avgPct: s.videoStats &&s.videoStats[v.id] && s.videoStats[v.id].pct != null ? s.videoStats[v.id].pct : null, rev28: s.revenue && s.revenue.state === 'ok' ? (s.revenue.perVideo28[v.id] || 0) : null, revAll: s.revenue && s.revenue.state === 'ok' ? (s.revenue.perVideoAll[v.id] || 0) : null })),
        unansweredComments: (readCmt(id) || {}).count != null ? (readCmt(id) || {}).count : null, commentsScanAt: (readCmt(id) || {}).at || null,
        needsReauth: !!c.needsReauth, lastError: c.lastError || '', noPost: !!c.noPost,
      };
    }).filter(Boolean);
  }

  // Dự án còn ở chế độ Testing thì quyền kênh hết hạn sau 7 ngày kể từ lúc cấp; đã Publish (anh đánh dấu) thì không hết hạn
  function tokenExpiry(conn) {
    const cl = clients().find((c) => c.key === connClient(conn));
    const t = conn.grantedAt || conn.connectedAt;
    // Quyền cấp TRƯỚC lúc Publish vẫn là quyền của chế độ Testing (hết hạn 7 ngày) → cần kết nối lại một lần; quyền cấp SAU Publish thì không hết hạn
    if (cl && cl.published && !(t && cl.publishedAt && new Date(t) < new Date(cl.publishedAt))) return null;
    return t ? new Date(new Date(t).getTime() + 7 * 86400000).toISOString() : null;
  }

  function list() {
    const c = read().connections;
    return Object.entries(c).map(([id, x]) => ({ id, title: x.title, handle: x.handle, thumb: x.thumb, niche: x.niche, country: x.country, market: x.market || '', gmail: x.gmail || '', where: x.where || '', manager: x.manager || '', clientKey: connClient(x), connectedAt: x.connectedAt, lastSync: x.lastSync, lastError: x.lastError, needsReauth: !!x.needsReauth, revenueScope: !!x.revenueScope, expiresAt: tokenExpiry(x), noPost: !!x.noPost }));
  }
  function setMeta(id, niche, country, market, gmail, where, manager) {
    if (!okId(id)) throw new Error('Kênh không hợp lệ');
    const all = read();
    if (!all.connections[id]) throw new Error('Kênh chưa kết nối');
    all.connections[id].niche = String(niche || '').slice(0, 60);
    all.connections[id].country = String(country || '').slice(0, 60);
    if (market !== undefined) all.connections[id].market = ['en', 'es', 'pt', 'ja', 'ko', 'vi'].includes(market) ? market : '';
    if (gmail !== undefined) all.connections[id].gmail = String(gmail || '').trim().slice(0, 80);
    if (where !== undefined) all.connections[id].where = String(where || '').trim().slice(0, 80);
    // Người quản lý chỉ nhận giá trị nằm trong danh sách cố định (Cài đặt) — chọn dropdown, không gõ tự do, để lọc/so sánh chính xác.
    if (manager !== undefined) {
      const m = String(manager || '').trim();
      if (m && !managers().some((mm) => mm.name === m)) throw new Error('Người quản lý không có trong danh sách — hãy thêm ở Cài đặt trước.');
      all.connections[id].manager = m;
    }
    write(all);
  }
  // Kênh không còn đăng bài nhưng vẫn muốn theo dõi số liệu: tắt cảnh báo "chưa có video mới" và bỏ khỏi Trạm đăng bài.
  function setNoPost(id, val) {
    if (!okId(id)) throw new Error('Kênh không hợp lệ');
    const all = read();
    if (!all.connections[id]) throw new Error('Kênh chưa kết nối');
    all.connections[id].noPost = !!val;
    write(all);
  }
  async function disconnect(id) {
    if (!okId(id)) throw new Error('Kênh không hợp lệ');
    const all = read();
    const conn = all.connections[id];
    if (!conn) return;
    try { await form(REVOKE, { token: conn.refreshToken }); } catch (e) { /* không sao, vẫn xoá trên máy */ }
    delete all.connections[id];
    write(all);
    tokens.delete(id);
    try { fs.unlinkSync(snapFile(id)); } catch (e) { /* bỏ qua */ }
    try { fs.unlinkSync(cmtFile(id)); } catch (e) { /* bỏ qua */ }
  }

  // Chuyển dữ liệu cũ (một bộ OAuth) sang danh sách bộ ngay khi khởi động để đếm suất không bị lệch khi xoá kênh.
  function migrateClients() { const s = readSettings(); if (!Array.isArray(s.oauthClients) && s.oauth && s.oauth.clientId) saveClients(clients()); }
  return { videoReport, videoComments, channelComments, readCmt, setClientPublished, migrateClients, clientsPublic, addClient, removeClient, redirectUri, authUrl, handleCallback, sync, syncAll, ownData, list, setMeta, setNoPost, disconnect, managers, addManager, removeManager, count: () => Object.keys(read().connections).length, lastSyncAt: () => Object.values(read().connections).map((c) => c.lastSync).filter(Boolean).sort().pop() || null };
};
