(function () {
  const D = window.QLK_DATA;
  const N = D.DAYS;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmt = (n) => {
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return Math.round(n).toLocaleString('vi-VN');
  };
  const signed = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
  const last = (a) => a[a.length - 1];
  const gain = (a, days) => a[N - 1] - a[N - 1 - days];
  const dayLabel = (i) => {
    const d = new Date(Date.now() - (N - 1 - i) * 86400000);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  };
  const pct = (a, days) => { const b = a[N - 1 - days]; return b > 0 ? (gain(a, days) / b) * 100 : 0; };
  const fmtPct = (p) => (p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%';

  const ICON = {
    chart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>',
    tv: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    cal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    msg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    cog: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  };

  // ---------- Trạng thái ----------
  // Dữ liệu người dùng lưu FILE trên máy (app/data/userdata.json) qua /api/store; bộ nhớ trong được nạp sẵn ở index.html.
  const STORE = window.__QLK_STORE || (window.__QLK_STORE = {});
  const pendingSet = {};
  let flushTimer = null;
  function flushStore(keep) {
    const set = { ...pendingSet };
    Object.keys(pendingSet).forEach((k) => delete pendingSet[k]);
    if (!Object.keys(set).length) return;
    fetch('/api/store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ set }), keepalive: !!keep }).catch(() => { Object.assign(pendingSet, set); });
  }
  const store = {
    get(k, d) { const v = STORE[k]; return v === undefined || v === null ? d : v; },
    set(k, v) { STORE[k] = v; pendingSet[k] = v; clearTimeout(flushTimer); flushTimer = setTimeout(() => flushStore(false), 400); },
  };
  window.addEventListener('pagehide', () => flushStore(true));
  const state = {
    range: store.get('qlk_range', 28),
    tab: 'rivals',
    sort: 'gainSubs',
    chSort: 'attn',
    q: '',
    chNiche: 'all',
    chManager: 'all',
    rivalNiche: 'all',
    trendNiche: 'all',
    topicQ: '',
    topicSmall: false,
    topicRecent: false,
    scanUrl: '',
    scanName: '',
    vsort: 'views',
    detailRange: 28, detailMetric: 'views',
    dashNiche: 'all', dashSort: 'rev', dashRankAll: false, dashRange: 7,
    vidRange: '28', vidTab: 'over', vidMetric: 'views', vidTraffic: 'all', geoMore: false,
  };
  const MOCK_OWN = D.OWN.slice(); // bản sao 5 kênh mẫu, dùng khi chưa có kênh thật
  let addedRivals = store.get('qlk_added', []);
  let removedIds = store.get('qlk_removed', []);
  let pins = store.get('qlk_pins', []);
  let notes = store.get('qlk_notes', {});
  let dashClosed = store.get('qlk_dashClosed', {});
  // Thanh tiêu đề của 1 khối trên Dashboard, thu gọn/mở rộng được (nhớ trạng thái qua store)
  function dashSection(id, cls, summaryHtml, bodyHtml) {
    const closed = !!dashClosed[id];
    return `<details class="card ${cls} dashsec" data-dashid="${esc(id)}" ${closed ? '' : 'open'}><summary class="section-title">${summaryHtml}</summary>${bodyHtml}</details>`;
  }

  function allRivals() {
    if (realRivals) return serverRivals; // đối thủ thật (lưu file, theo dõi bằng khoá API)
    const added = addedRivals.map((d, i) => D.build({ ...d, id: d.id }, 'rival', D.RIVALS.length + i));
    return D.RIVALS.concat(added).filter((c) => !removedIds.includes(c.id));
  }
  // Ngách "tạm dừng theo dõi": đối thủ vẫn xem/lọc được, nhưng không tính vào các nơi phát hiện "đang nổ"/báo cáo tăng trưởng (đỡ nhiễu).
  const isNichePaused = (niche) => ((api && api.pausedNiches) || []).includes(niche);
  const activeRivals = () => allRivals().filter((c) => !isNichePaused(c.niche));
  const findChan = (id) => D.OWN.concat(allRivals()).find((c) => c.id === id);

  // ---------- Biểu đồ ----------
  const CHARTS = {};
  function areaChart(key, values, color, unit, fmtFn) {
    const W = 600, H = 170, pad = 6;
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (W - pad * 2), H - pad - ((v - min) / span) * (H - pad * 2 - 8)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ` L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`;
    CHARTS[key] = { values, unit, pts, W, H, color, fmt: fmtFn || fmt };
    const gid = 'g' + key;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-chart="${key}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${gid})"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    </svg>`;
  }
  function spark(values, color) {
    const W = 84, H = 26;
    const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    const d = values.map((v, i) => (i ? 'L' : 'M') + ((i / (values.length - 1)) * W).toFixed(1) + ' ' + (H - 3 - ((v - min) / span) * (H - 6)).toFixed(1)).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="none" stroke="${color}" stroke-width="1.6"/></svg>`;
  }

  // ---------- Thành phần dùng chung ----------
  const avatar = (c) => `<span class="av" style="background:${c.color}">${esc(c.name.trim()[0].toUpperCase())}</span>`;
  const deltaCell = (n) => `<span class="delta ${n > 0 ? '' : n < 0 ? 'neg' : 'zero'}">${n === 0 ? '0' : signed(n)}</span>`;
  const chips = (rangeKey, cur, action) => `<div class="chips">${[7, 28, 90].map((n) => `<button class="chip ${cur === n ? 'on' : ''}" data-act="${action}" data-v="${n}">${n} ngày</button>`).join('')}</div>`;
  const head = (icon, title, sub, right) => `<div class="head"><span class="ico">${icon}</span><div><h1>${title}</h1><div class="sub">${sub}</div></div><div class="right">${right || ''}</div></div>`;
  const VN_FMT = { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
  const fmtVN = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', VN_FMT) : '—');
  const TRIGGER = { schedule: 'theo lịch 08:30', catchup: 'chạy bù vì app mở muộn', manual: 'anh bấm tay' };
  const updateNote = () => {
    const u = api && api.update;
    return `<span class="note">Cập nhật gần nhất: ${u && u.last ? fmtVN(u.last.at) : 'chưa có'} · kế tiếp: ${u ? fmtVN(u.nextRunAt) : '08:30'} (giờ VN)</span>`;
  };
  // Thanh nhắc khi chưa gắn API: dẫn thẳng tới Cài đặt.
  const apiBanner = () => (api && api.apiKey.state === 'ok' ? '' : '<a class="apibanner" href="#/settings"><span>🔌 Chưa gắn API — đang hiển thị dữ liệu mẫu.</span><b>Cài đặt API →</b></a>');

  // ---------- Trang: Quản lý Kênh ----------
  // Ngưỡng cảnh báo (chỉnh ở đây). Mức: 0 = ổn, 1 = theo dõi, 2 = cần xử lý.
  const HEALTH = { dropRed: 0.5, dropAmber: 0.8, staleRed: 7, staleAmber: 4 };
  Object.assign(HEALTH, store.get('qlk_health', {}));
  function health(c) {
    const reasons = [];
    let level = 0;
    const add = (l, t) => { reasons.push({ l, t }); level = Math.max(level, l); };
    const v7 = gain(c.views, 7) / 7;
    const v21 = (c.views[N - 8] - c.views[N - 29]) / 21;
    if (v21 > 0) {
      const ratio = v7 / v21;
      const txt = `Lượt xem 7 ngày giảm ${Math.round((1 - ratio) * 100)}% so với 3 tuần trước`;
      if (ratio < HEALTH.dropRed) add(2, txt);
      else if (ratio < HEALTH.dropAmber) add(1, txt);
    }
    if (gain(c.subs, 7) <= 0) add(1, 'SUB không tăng trong 7 ngày');
    const days = Math.floor(Math.min(...c.videoList.map((v) => Date.now() - new Date(v.date))) / 86400000);
    // Kênh đã đánh dấu "ngừng đăng bài": không báo thiếu video mới nữa (vẫn theo dõi số liệu, lượt xem giảm/SUB không tăng)
    if (!c.noPost) {
      const stale = `${days} ngày chưa có video mới`;
      if (days >= HEALTH.staleRed) add(2, stale);
      else if (days >= HEALTH.staleAmber) add(1, stale);
    }
    reasons.sort((a, b) => b.l - a.l);
    return { level, reasons, days };
  }
  const HB = [['ok', 'Ổn', 'Kênh đang ổn định'], ['warn', 'Theo dõi', ''], ['bad', 'Cần xử lý', '']];
  const hBadge = (h) => `<span class="hb ${HB[h.level][0]}"><i></i>${HB[h.level][1]}</span>`;

  // Video nổ / chìm: so view của video với trung vị của chính kênh đó.
  function withMultiples(c) {
    const arr = c.videoList.map((v) => v.views).sort((a, b) => a - b);
    const med = arr[Math.floor(arr.length / 2)] || 1;
    return c.videoList.map((v) => ({ c, v, x: v.views / med }));
  }
  const ageDays = (v) => (Date.now() - new Date(v.date)) / 86400000;
  const VIRAL_X = 2, LOW_X = 0.5;
  function hits(chans, maxAge) {
    return chans.flatMap(withMultiples).filter((o) => o.x >= VIRAL_X && !o.v.isNew && ageDays(o.v) <= maxAge).sort((a, b) => b.x - a.x);
  }
  const xTag = (x) => (x >= 10 ? x.toFixed(0) : x.toFixed(1).replace('.0', ''));

  function rivalHitsCard() {
    const list = hits(activeRivals(), 14).slice(0, 8);
    const rows = list.map((o) => `<tr class="click" data-go="#/channel/${o.c.id}"><td class="l vt" title="${esc(o.v.title)}">${esc(o.v.title)}</td><td class="l note">${esc(o.c.name)}</td><td class="l"><span class="tag">${esc(o.c.niche)}</span></td><td class="big">${fmt(o.v.views)}</td><td><span class="hb ok"><i></i>×${xTag(o.x)}</span></td><td>${new Date(o.v.date).toLocaleDateString('vi-VN')}</td></tr>`).join('');
    window.__hitTitles = list.map((o) => o.v.title);
    return `<div class="card" style="margin-bottom:14px"><div class="section-title"><span>🔥 Video đối thủ đang nổ (14 ngày qua, từ ×${VIRAL_X} mức thường của kênh)</span><span class="r"><button class="btn sm" data-act="copyHits">Copy tiêu đề</button></span></div>
      ${list.length ? `<div class="tablewrap"><table><thead><tr><th class="l">Video</th><th class="l">Kênh</th><th class="l">Ngách</th><th>Lượt xem</th><th>So mức thường</th><th>Đăng</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="placeholder">Chưa có video đối thủ nào vượt ngưỡng trong 14 ngày qua.</div>'}</div>`;
  }

  function benchmarkCard(r) {
    const rivals = allRivals();
    const avg = (arr) => arr.reduce((t, c) => t + pct(c.views, r), 0) / arr.length;
    const rows = [...new Set(D.OWN.map((c) => c.niche))].map((n) => {
      const mine = D.OWN.filter((c) => c.niche === n), riv = rivals.filter((c) => c.niche === n);
      if (!riv.length) return `<tr><td class="l">${esc(n)}</td><td>${fmtPct(avg(mine))}</td><td class="note">—</td><td class="l"><span class="tag">Chưa có đối thủ cùng ngách</span></td></tr>`;
      const a = avg(mine), b = avg(riv);
      return `<tr><td class="l">${esc(n)}</td><td class="big">${fmtPct(a)}</td><td>${fmtPct(b)} <span class="note">(${riv.length} kênh)</span></td><td class="l">${a >= b ? '<span class="hb ok"><i></i>Nhanh hơn thị trường</span>' : '<span class="hb warn"><i></i>Chậm hơn thị trường</span>'}</td></tr>`;
    }).join('');
    return `<div class="card" style="margin-bottom:14px"><div class="section-title"><span>⚖️ So kênh mình với đối thủ cùng ngách</span><span class="r">tăng lượt xem ${r} ngày</span></div>
      <div class="tablewrap"><table><thead><tr><th class="l">Ngách</th><th>Kênh mình</th><th>Đối thủ (trung bình)</th><th class="l">Nhận xét</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function downloadCsv(name, rows) {
    const text = '﻿' + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const todayStamp = () => isoDateSafe(new Date());
  const isoDateSafe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Ô đặt ngách gõ thẳng trong bảng (kênh thật). Chọn từ gợi ý để có kho bài cộng đồng riêng của ngách đó.
  const NO_NICHE = 'Chưa đặt ngách';
  const noNicheBanner = () => {
    const n = realOwn ? D.OWN.filter((c) => c.niche === NO_NICHE).length : 0;
    return n ? `<div class="apibanner"><span>🏷️ ${n} kênh chưa có ngách — gõ hoặc chọn ngách ngay ở cột <b>Chủ đề</b> trong bảng bên dưới. Ngách giúp gợi ý bài cộng đồng đúng kênh, so sánh với đối thủ và bắt trend.</span></div>` : '';
  };
  // Màu ngách: gán tự động theo tên ngách (hash), không cần cấu hình tay — mỗi ngách luôn ra đúng 1 màu cố định.
  const NICHE_COLORS = ['#7c5cff', '#22c1a5', '#f5a524', '#ef5b7b', '#4aa3ff', '#9bd23c', '#c26bff', '#ff8a4c', '#2dd4bf', '#f43f5e'];
  const hexA = (hex, a) => { const n = parseInt(String(hex).replace('#', ''), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const nicheColor = (n) => { if (!n || n === NO_NICHE) return ''; let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return NICHE_COLORS[h % NICHE_COLORS.length]; };
  const nicheInput = (c) => {
    const nc = nicheColor(c.niche);
    const inStyle = nc ? `background:${hexA(nc, 0.28)};border-color:${hexA(nc, 0.6)};color:${nc};font-weight:600;` : '';
    return `<div class="nichecell"><input class="nichein ${c.niche === NO_NICHE ? 'empty' : ''}" style="${inStyle}" list="cniches" data-cmeta="niche" data-cid="${esc(c.id)}" value="${c.niche === NO_NICHE ? '' : esc(c.niche)}" placeholder="Đặt ngách…" title="Gõ hoặc chọn ngách của kênh rồi bấm ra ngoài để lưu"><select class="mktin ${c.market ? '' : 'empty'}" data-cmeta="market" data-cid="${esc(c.id)}" title="Thị trường (ngôn ngữ) của kênh">${marketOpts(c.market, true)}</select></div>`;
  };
  // Người quản lý: CHỈ chọn từ danh sách cố định (Cài đặt) — không gõ tự do, để lọc/so sánh chính xác giữa các người.
  // Mỗi người có 1 màu tự động gán lúc thêm (managers()/addManager ở google.js) — tô luôn cả ô chọn theo màu người đang gán, chữ cùng màu đó.
  const managerColor = (name) => (((api && api.managers) || []).find((m) => m.name === name) || {}).color || '';
  // Thẻ đọc (không chỉnh sửa) hiển thị người quản lý — dùng ở các bảng tóm tắt (Dashboard)
  const managerBadge = (c) => {
    if (!c.manager) return '';
    const col = managerColor(c.manager);
    const style = col ? `background:${hexA(col, 0.28)};border-color:${hexA(col, 0.6)};color:${col};` : '';
    return `<span class="tag" style="${style}">${esc(c.manager)}</span>`;
  };
  const nicheTag = (n) => { if (!n || n === NO_NICHE) return ''; const nc = nicheColor(n); return `<span class="tag" style="background:${hexA(nc, 0.28)};border:1px solid ${hexA(nc, 0.6)};color:${nc};">${esc(n)}</span>`; };
  const managerSelect = (c) => {
    const list = (api && api.managers) || [];
    const col = c.manager ? managerColor(c.manager) : '';
    const style = col ? `background:${hexA(col, 0.28)};border-color:${hexA(col, 0.6)};color:${col};font-weight:600;` : '';
    return `<select class="mktin ${c.manager ? '' : 'empty'}" style="${style}" data-cmeta="manager" data-cid="${esc(c.id)}" title="Người quản lý kênh này"><option value="" style="background:#101017;color:#e8e8ef;">— chưa gán —</option>${list.map((m) => `<option value="${esc(m.name)}" ${c.manager === m.name ? 'selected' : ''} style="background:#101017;color:#e8e8ef;">${esc(m.name)}</option>`).join('')}</select>`;
  };
  function nicheList() {
    return [...new Set([...(window.QLK_SUGG ? window.QLK_SUGG.niches : []), ...(window.QLK_TRENDS ? window.QLK_TRENDS.NICHES : []), ...D.OWN.map((c) => c.niche).filter((n) => n && n !== NO_NICHE)])];
  }
  // Doanh thu ước tính (USD) của kênh thật; kênh mẫu không có
  const money = (n) => '$' + (+n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fmtHours = (min) => { const h = (+min || 0) / 60; return h >= 100 ? Math.round(h).toLocaleString('vi-VN') + ' giờ' : h >= 1 ? h.toFixed(1).replace('.', ',') + ' giờ' : Math.round(+min || 0) + ' phút'; };
  const revOk = (c) => !!(c.revenue && c.revenue.state === 'ok');
  const revCell = (c) => {
    if (!realOwn || c.kind !== 'own') return '<span class="note">—</span>';
    if (revOk(c)) return `<span class="big" title="Ước tính, Google báo trễ 1–2 ngày${c.revenue.lastDay ? ' · số đến ' + c.revenue.lastDay : ''}">${money(c.revenue.d28)}</span><small class="note" style="display:block">7 ngày ${money(c.revenue.d7)}</small>`;
    return `<span class="note" title="${esc((c.revenue && c.revenue.msg) || '')}">${c.revenue && c.revenue.state === 'noscope' ? 'Cần kết nối lại' : 'Chưa có'}</span>`;
  };
  // Ô "+ mới theo ngày" (xanh, số to) và tổng (trắng, số nhỏ hơn) trong bảng Quản lý Kênh
  const newCell = (d, total) => `<span class="dnew ${d > 0 ? '' : d < 0 ? 'neg' : 'zero'}">${d === 0 ? '0' : signed(d)}</span><span class="dtot">${fmt(total)}</span>`;
  function pageChannels() {
    const hs =new Map(D.OWN.map((c) => [c.id, health(c)]));
    const counts = [0, 0, 0];
    hs.forEach((h) => counts[h.level]++);
    const q = state.q.trim().toLowerCase();
    const list = D.OWN.filter((c) => (state.chNiche === 'all' || c.niche === state.chNiche) && (state.chManager === 'all' || (state.chManager === '' ? !c.manager : c.manager === state.chManager)) && (!q || (c.name + ' ' + c.niche + ' ' + (c.gmail || '') + ' ' + (c.where || '')).toLowerCase().includes(q)));
    list.sort((a, b) => (pins.includes(b.id) - pins.includes(a.id)) || (state.chSort === 'attn' ? hs.get(b.id).level - hs.get(a.id).level : 0));
    const niches = [...new Set(D.OWN.map((c) => c.niche))];
    const rows = list.map((c) => `
      <tr class="click" data-go="#/channel/${c.id}">
        <td class="l"><div class="chan"><button class="pin ${pins.includes(c.id) ? 'on' : ''}" data-act="pin" data-v="${c.id}" title="Ghim lên đầu">${pins.includes(c.id) ? '★' : '☆'}</button>${avatar(c)}<div><div class="n">${esc(c.name)}${c.noPost ? ' <span class="tag" title="Đã ngừng đăng bài — không nhắc lịch đăng">⏸ Ngừng đăng</span>' : ''}${notes[c.id] ? ' <span title="' + esc(notes[c.id]) + '">📝</span>' : ''}</div><div class="s">${realOwn && (c.where || c.gmail) ? esc([c.where, c.gmail].filter(Boolean).join(' · ')) : (c.country ? esc(c.country) + ' · ' : '') + 'Đã kết nối'}</div></div></div></td>
        <td class="l">${realOwn ? nicheInput(c) : nicheTag(c.niche)}</td>
        <td class="l">${realOwn ? managerSelect(c) : managerBadge(c)}</td>
        <td class="big">${fmt(c.videos)}</td>
        <td>${newCell(gain(c.subs, 1), last(c.subs))}</td>
        <td>${newCell(gain(c.views, 1), last(c.views))}</td>
        <td title="Lượt xem 28 ngày: ${signed(gain(c.views, 28))}">${spark(c.views.slice(-29), '#22c1a5')}</td>
        <td>${realOwn ? (c.unanswered == null ? '<span class="note" title="Chưa quét bình luận">—</span>' : `<button class="inter cmtn ${c.unanswered ? 'has' : ''}" data-act="chanComments" data-v="${esc(c.id)}" title="Bình luận chưa trả lời — bấm để xem">${ICON.msg}<b>${fmt(c.unanswered)}</b></button>`) : `<span class="inter" title="Bình luận toàn kênh">${ICON.msg}<b>${fmt(last(c.comments))}</b></span>`}</td>
        <td>${revCell(c)}</td>
        <td class="l">${hBadge(hs.get(c.id))}<div class="why" title="${esc(hs.get(c.id).reasons.map((x) => x.t).join('; ') || 'Không có cảnh báo')}">${esc((hs.get(c.id).reasons[0] || {}).t || 'Không có cảnh báo')}</div></td>
        <td>${realOwn ? `<button class="x" data-act="toggleNoPost" data-v="${esc(c.id)}" title="${c.noPost ? 'Bật lại nhắc đăng bài cho kênh này' : 'Kênh không còn đăng bài — ngừng nhắc đăng video/bài cộng đồng, vẫn theo dõi số liệu'}">${c.noPost ? '▶' : '⏸'}</button><button class="x" data-act="delChan" data-v="${esc(c.id)}" title="Xoá theo dõi kênh này">🗑</button>` : ''}</td>
      </tr>`).join('');
    const strip = `<div class="card hstrip"><span class="hb bad"><i></i>${counts[2]} cần xử lý</span><span class="hb warn"><i></i>${counts[1]} cần theo dõi</span><span class="hb ok"><i></i>${counts[0]} ổn</span>
      <span class="gap"></span>
      <input id="ch-q" type="text" placeholder="Tìm kênh…" value="${esc(state.q)}" style="width:150px">
      <select data-act="chNiche"><option value="all" ${state.chNiche === 'all' ? 'selected' : ''}>Mọi ngách</option>${niches.map((n) => `<option value="${esc(n)}" ${state.chNiche === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      ${realOwn ? `<select data-act="chManager"><option value="all" ${state.chManager === 'all' ? 'selected' : ''}>Mọi người quản lý</option><option value="" ${state.chManager === '' ? 'selected' : ''}>— chưa gán —</option>${((api && api.managers) || []).map((m) => `<option value="${esc(m.name)}" ${state.chManager === m.name ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>` : ''}
      <select data-act="chSort"><option value="attn" ${state.chSort === 'attn' ? 'selected' : ''}>Cần chú ý lên đầu</option><option value="orig" ${state.chSort === 'orig' ? 'selected' : ''}>Thứ tự gốc</option></select>
      <button class="btn sm" data-act="csvOwn">Xuất CSV</button></div>`;
    return head(ICON.tv, 'Quản lý Kênh', `Danh sách kênh · ${D.OWN.length} kênh`, `${updateNote()}<button class="btn primary" data-act="addOwn">+ Thêm kênh</button>`) + apiBanner() + noNicheBanner() + strip + `<datalist id="cniches">${nicheList().map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
      <div class="card tablewrap"><table class="stk">
        <thead><tr><th class="l">Tên kênh</th><th class="l">Chủ đề</th><th class="l">Người quản lý</th><th>Tổng video</th><th>Tổng SUB<br><small>+ mới theo ngày</small></th><th>Tổng lượt xem<br><small>+ mới theo ngày</small></th><th>Xu hướng 28 ngày</th><th>Tương tác<br><small>bình luận chưa trả lời</small></th><th>Doanh thu 28 ngày<br><small>ước tính (USD)</small></th><th class="l">Tình trạng</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="11" class="l note">Không có kênh nào phù hợp bộ lọc.</td></tr>'}</tbody></table></div>
      <p class="note">“+ mới theo ngày” tính theo ngày dương lịch (0h–24h) như YouTube Studio. Cột Tình trạng: đỏ nếu lượt xem 7 ngày giảm quá ${Math.round(HEALTH.dropRed * 100)}% hoặc ${HEALTH.staleRed} ngày chưa có video; vàng nếu giảm quá ${Math.round((1 - HEALTH.dropAmber) * 100)}%, ${HEALTH.staleAmber} ngày chưa có video hoặc SUB không tăng 7 ngày.</p>`;
  }

  function healthCard(c) {
    const h = health(c);
    const items = h.reasons.length
      ? h.reasons.map((r) => `<li><span class="hb ${r.l === 2 ? 'bad' : 'warn'}"><i></i>${r.l === 2 ? 'Cần xử lý' : 'Theo dõi'}</span> ${esc(r.t)}</li>`).join('')
      : '<li class="note">Không có cảnh báo nào.</li>';
    const noPostNote = c.noPost ? '<li class="note">⏸ Kênh đã đánh dấu ngừng đăng bài — không báo thiếu video mới hay bài cộng đồng nữa.</li>' : '';
    return `<div class="card hcard"><div class="hh">${hBadge(h)}<b>Tình trạng kênh</b>${c.noPost ? ' <span class="tag">⏸ Ngừng đăng</span>' : ''}</div><ul>${noPostNote}${items}</ul></div>`;
  }

  // ---------- Trang: Chi tiết kênh ----------
  function pageDetail(id) {
    const c = findChan(id);
    if (!c) return `<div class="placeholder"><h2>Không tìm thấy kênh</h2><a class="btn" href="#/channels">Về danh sách</a></div>`;
    const r = state.detailRange;
    const own = c.kind === 'own';
    const backHref = own ? '#/channels' : '#/tracker';
    const stat = (k, arr, extra) => `<div class="card stat"><div class="k">${k}</div><div class="v">${fmt(last(arr))}<span class="d ${gain(arr, r) < 0 ? 'neg' : ''}">${signed(gain(arr, r))}</span></div>${extra || ''}</div>`;
    // Ô chỉ số bấm được để đổi biểu đồ bên dưới (như YouTube Studio) — số hiện ra đổi theo khoảng 7/28/90 ngày đang chọn.
    const metricCard = (key, innerHtml) => `<div class="card stat click ${state.detailMetric === key ? 'active' : ''}" data-act="detailMetric" data-v="${key}">${innerHtml}</div>`;
    const sumRange = (arr, days) => (arr || []).slice(N - 1 - days, N - 1).reduce((t, x) => t + x, 0);
    const avgRange = (arr, days) => { const seg = (arr || []).slice(N - 1 - days, N - 1); return seg.length ? seg.reduce((t, x) => t + x, 0) / seg.length : 0; };
    const revField = (base) => (r === 7 ? base + '7' : r === 28 ? base + '28' : base + '90');
    const hourFmt = (v) => fmt(Math.round(v * 10) / 10) + ' giờ';
    const METRICS = {
      views: { label: 'Số lượt xem', color: '#7c5cff', arr: c.views, value: () => (c.views ? gain(c.views, r) : null), fmt: fmt, tipFmt: fmt },
      watchtime: { label: 'Thời gian xem', color: '#4c8bf5', arr: c.watchMinutesDaily, value: () => (c.watchMinutesDaily ? sumRange(c.watchMinutesDaily, r) / 60 : null), fmt: hourFmt, tipFmt: (v) => hourFmt(v / 60) },
      subs: { label: 'Số người đăng ký', color: '#22c1a5', arr: c.subs, value: () => (c.subs ? gain(c.subs, r) : null), fmt: signed, tipFmt: fmt },
      avgdur: { label: 'Thời lượng xem trung bình', color: '#f5a524', arr: c.avgViewDuration, value: () => (c.avgViewDuration ? avgRange(c.avgViewDuration, r) : null), fmt: durTxt, tipFmt: durTxt },
      rpm: { label: 'RPM toàn kênh', color: '#ef5b7b', arr: c.rpmDaily, value: () => (revOk(c) ? c.revenue[revField('rpm')] : null), fmt: money, tipFmt: money },
      revenue: { label: 'Doanh thu ước tính', color: '#8bc34a', arr: c.revenueDaily, value: () => (revOk(c) ? c.revenue[revField('d')] : null), fmt: money, tipFmt: money },
    };
    const statInner = (key) => {
      const m = METRICS[key], v = m.value();
      return v == null
        ? `<div class="k">${m.label}</div><div class="v" style="font-size:14px">${c.revenue && c.revenue.state === 'noscope' ? 'Cần kết nối lại kênh' : 'Chưa có số liệu'}</div>`
        : `<div class="k">${m.label}</div><div class="v">${m.fmt(v)}</div>`;
    };
    const mult = new Map(withMultiples(c).map((o) => [o.v, o.x]));
    const vids = c.videoList.slice().sort((a, b) => (state.vsort === 'views' ? b.views - a.views : new Date(b.date) - new Date(a.date)));
    const nHit = vids.filter((v) => !v.isNew && mult.get(v) >= VIRAL_X).length;
    const nLow = vids.filter((v) => !v.isNew && mult.get(v) <= LOW_X).length;
    const showRev = own && realOwn; // cột doanh thu luôn hiện cho kênh thật; chưa có số thì hiện "—"
    const vRpm = (v) => (v.revAll != null && v.views > 0 ? money((v.revAll / v.views) * 1000) : '—');
    const badges = (v) => `${v.isNew ? '<span class="badge new">MỚI</span>' : ''}${v.isTop ? '<span class="badge top">NỔI NHẤT</span>' : ''}${!v.isNew && mult.get(v) >= VIRAL_X ? `<span class="badge hit">NỔ ×${xTag(mult.get(v))}</span>` : ''}${!v.isNew && mult.get(v) <= LOW_X ? '<span class="badge low">THẤP</span>' : ''}`;
    // Kênh thật: Video | Lượt xem | Bình luận | Thời lượng xem | Doanh thu tổng | Ngày đăng — bấm vào dòng để mở trang chi tiết video
    const vthumb = (v) => `<td>${v.thumb ? `<a href="${esc(v.url)}" target="_blank" rel="noopener"><img class="trthumb" style="width:64px;height:36px" src="${esc(v.thumb)}" alt="" loading="lazy"></a>` : ''}</td>`;
    const vrows = vids.map((v, i) => (showRev ? `
      <tr class="click" data-go="#/video/${esc(c.id)}/${esc(v.id)}"><td class="l"><input type="checkbox" data-vt="${i}" title="Chọn để copy"></td>
        ${vthumb(v)}
        <td class="l vt" title="${esc(v.title)}">${esc(v.title)}${badges(v)}${v.url ? ` <a href="${esc(v.url)}" target="_blank" rel="noopener" title="Mở video trên YouTube" class="note">↗</a>` : ''}</td>
        <td class="big">${fmt(v.views)}</td><td>${v.comments > 0 ? `<button class="cbtn" data-act="vidComments" data-v="${esc(c.id)}|${esc(v.id)}" title="Xem bình luận chưa trả lời của video này">💬 ${fmt(v.comments)}</button>` : '0'}</td>
        <td style="width:90px">${v.avgDur != null ? durTxt(v.avgDur) : '—'}</td><td>${v.avgPct != null ? v.avgPct.toFixed(1).replace('.', ',') + '%' : '—'}</td><td class="big" style="width:100px">${v.revAll != null ? money(v.revAll) : '—'}</td><td>${vRpm(v)}</td>
        <td>${new Date(v.date).toLocaleDateString('vi-VN')}</td></tr>` : `
      <tr><td class="l"><input type="checkbox" data-vt="${i}" title="Chọn để copy"></td>
        ${vthumb(v)}
        <td class="l vt" title="${esc(v.title)}">${v.url ? `<a href="${esc(v.url)}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(v.title)}</a>` : esc(v.title)}${badges(v)}</td>
        <td class="big">${fmt(v.views)}</td><td>${fmt(v.likes)}</td><td>${fmt(v.comments)}</td>
        <td>${new Date(v.date).toLocaleDateString('vi-VN')}</td></tr>`)).join('');
    window.__vids = vids;
    const sl = (a) => a.slice(-(r + 1));
    // Kênh thật (của mình hoặc đối thủ nạp từ YouTube thật) mới có ID thật để mở được trên YouTube; kênh mẫu thì không.
    const isReal = (own && realOwn) || (!own && realRivals);
    const chUrl = `https://www.youtube.com/channel/${encodeURIComponent(c.id)}`;
    return `<a class="back" href="${backHref}">← ${own ? 'Danh sách kênh' : 'Tracker đối thủ'}</a>
      <div class="card profile">${avatar(c)}<div><h2>${isReal ? `<a href="${esc(chUrl)}" target="_blank" rel="noopener" style="text-decoration:underline" title="Mở kênh trên YouTube">${esc(c.name)}</a>` : esc(c.name)} <span class="tag ${own ? 'mine' : 'amber'}">${own ? 'Của mình' : 'Đối thủ'}</span> ${nicheTag(c.niche)}</h2>
        <div class="sub note">${fmt(last(c.subs))} sub · ${fmt(last(c.views))} lượt xem · ${fmt(c.videos)} video</div></div>
        <div style="margin-left:auto;display:flex;gap:10px;align-items:center;flex-wrap:wrap">${chips('d', r, 'detailRange')}${isReal ? `<a class="btn sm" href="${esc(chUrl)}" target="_blank" rel="noopener">↗ Xem trên YouTube</a>` : ''}${own && realOwn ? `<button class="btn sm" data-act="toggleNoPost" data-v="${esc(c.id)}">${c.noPost ? '▶ Bật lại nhắc đăng bài' : '⏸ Kênh đã ngừng đăng bài'}</button>` : ''}${isReal ? `<button class="btn sm danger" data-act="delChan" data-v="${esc(c.id)}">🗑 Xoá theo dõi</button>` : ''}</div></div>
      ${own ? healthCard(c) : ''}${own ? profileCard(c) : ''}
      <div class="stats">${own
        ? ['views', 'watchtime', 'subs', 'avgdur', 'rpm', 'revenue'].map((k) => metricCard(k, statInner(k))).join('')
        : `${metricCard('subs', `<div class="k">Subscriber</div><div class="v">${fmt(last(c.subs))}<span class="d ${gain(c.subs, r) < 0 ? 'neg' : ''}">${signed(gain(c.subs, r))}</span></div>`)}${metricCard('views', `<div class="k">Lượt xem</div><div class="v">${fmt(last(c.views))}<span class="d ${gain(c.views, r) < 0 ? 'neg' : ''}">${signed(gain(c.views, r))}</span></div>`)}<div class="card stat"><div class="k">Video</div><div class="v">${fmt(c.videos)}</div></div>`}</div>
      ${(() => {
        const activeKey = METRICS[state.detailMetric] ? state.detailMetric : 'views';
        const am = METRICS[activeKey];
        const v = am.value();
        return `<div class="charts single">${am.arr && v != null ? `<div class="card chart"><div class="ct"><span>${am.label}</span><span><b>${am.fmt(v)}</b><span class="note" style="font-size:11px;margin-left:6px">${r} ngày qua</span></span></div>${areaChart('m' + c.id + r + activeKey, sl(am.arr), am.color, activeKey, am.tipFmt)}<div class="axis"><span>${dayLabel(N - 1 - r)}</span><span>${dayLabel(N - 1)}</span></div></div>` : `<div class="card chart"><div class="dempty">Chưa có dữ liệu theo ngày cho chỉ số này — cần kết nối lại kênh để cấp quyền doanh thu.</div></div>`}</div>`;
      })()}
      <div class="card">
        <div class="section-title"><span>Video (${c.videoList.length} gần nhất) <span class="note">· ${nHit} nổ (từ ×${VIRAL_X} mức thường) · ${nLow} thấp (dưới ×${LOW_X})</span></span><span class="r"><button class="btn sm" data-act="copyTitles">Copy tiêu đề</button>
          <button class="chip ${state.vsort === 'views' ? 'on' : ''}" data-act="vsort" data-v="views">View cao nhất</button><button class="chip ${state.vsort === 'new' ? 'on' : ''}" data-act="vsort" data-v="new">Mới nhất</button></span></div>
        <div class="tablewrap"><table><thead><tr><th class="l"></th><th class="l"></th><th class="l">Video</th><th>Lượt xem</th>${showRev ? '' : '<th>Like</th>'}<th>Bình luận</th>${showRev ? '<th style="width:90px">Thời lượng xem TB</th><th>% xem TB</th><th style="width:100px">Doanh thu tổng</th><th>RPM</th>' : ''}<th>${showRev ? 'Ngày đăng' : 'Đăng'}</th></tr></thead><tbody>${vrows}</tbody></table></div>${showRev ? `<p class="note" style="margin:8px 4px 0">${revOk(c) ? 'Doanh thu là số ước tính của YouTube Analytics (USD), thường trễ 1–2 ngày và có thể lệch nhẹ so với YouTube Studio. “Tổng” tính từ 10/2015 đến hôm qua, chỉ cho các video nằm trong danh sách này. “Thời lượng xem TB” là thời gian trung bình mỗi lượt xem (phút:giây), từ trước tới nay, giống “Thời lượng xem trung bình” trong YouTube Studio. “% xem TB” là tỷ lệ trung bình của video mà người xem đã xem. “RPM” là doanh thu ước tính trên 1.000 lượt xem (doanh thu tổng ÷ lượt xem × 1.000). Bấm vào một dòng để xem chi tiết video.' : 'Chưa có số doanh thu (“—”): ' + esc((c.revenue && c.revenue.msg) || 'chưa đồng bộ') + ' Sau khi kết nối lại kênh (cấp quyền doanh thu), bấm “Đồng bộ” để lấy số.'}</p>` : ''}
      </div>
      <div class="card notecard"><div class="section-title"><span>📝 Ghi chú riêng cho kênh</span><span class="r">tự lưu khi bấm ra ngoài</span></div>
        <textarea id="note-box" data-note="${c.id}" placeholder="Ví dụ: đang thử đổi thumbnail từ 15/9…">${esc(notes[c.id] || '')}</textarea></div>
      <p class="note">Danh sách video là dữ liệu mẫu; bản thật sẽ lấy từ YouTube. Để trống ô chọn nếu muốn copy tất cả tiêu đề. “Nổ/Thấp” so với mức thường (trung vị) của chính kênh; video mới đăng chưa được gắn nhãn.</p>`;
  }

  // ---------- Trang: Chi tiết một video (bố cục theo YouTube Studio, lấy số liệu khi mở trang) ----------
  const vrep = { key: '', loading: false, data: null, error: '' };
  // Trong API, loại "SUBSCRIBER" chính là "Các tính năng duyệt xem" của Studio (trang chủ, đăng ký); kiểm tra trên kênh thật
  const OTHER_YT = ['YT_OTHER_PAGE', 'NOTIFICATION', 'YT_CHANNEL', 'SHORTS', 'END_SCREEN', 'CAMPAIGN_CARD', 'HASHTAGS', 'LIVE_REDIRECT', 'SOUND_PAGE', 'VIDEO_REMIXES', 'ANNOTATION'];
  const TS_GROUP = (t) => ({ BROWSE: 'browse', SUBSCRIBER: 'browse', RELATED_VIDEO: 'sugg', SUGGESTED_VIDEO: 'sugg', YT_SEARCH: 'search', EXT_URL: 'ext', PLAYLIST: 'pl', NO_LINK_OTHER: 'direct', NO_LINK_EMBEDDED: 'direct' }[t] || (OTHER_YT.includes(t) ? 'yt' : 'other'));
  const GROUP_NAME = { browse: 'Các tính năng duyệt xem', yt: 'Các tính năng khác của YouTube', search: 'YouTube Tìm kiếm', sugg: 'Video đề xuất', pl: 'Danh sách phát', ext: 'Bên ngoài', direct: 'Trực tiếp hoặc không xác định', other: 'Khác' };
  const DEV_NAME = { MOBILE: 'Điện thoại di động', DESKTOP: 'Máy tính', TABLET: 'Máy tính bảng', TV: 'TV', GAME_CONSOLE: 'Máy chơi game', UNKNOWN_PLATFORM: 'Không rõ' };
  const DEV_COLOR = ['#2a0e4a', '#8a3fc2', '#c58af0', '#d92b7c', '#f5a524', '#5b5b6b'];
  const AGE_NAME = (a) => { const m = /^age(\d+)-(\d+)?$/.exec(a); return !m ? a : m[2] ? `${m[1]} — ${m[2]} tuổi` : `Trên ${m[1]} tuổi`; };
  const GENDER_NAME = { female: 'Nữ', male: 'Nam', user_specified: 'Theo như người dùng xác định' };
  const regionName = (() => { try { const dn = new Intl.DisplayNames(['vi'], { type: 'region' }); return (c) => { try { return dn.of(c) || c; } catch (e) { return c; } }; } catch (e) { return (c) => c; } })();
  const durTxt = (s) => { s = Math.round(+s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const ymd = (s) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '');
  const pc1 = (x) => (Math.round((+x || 0) * 10) / 10).toFixed(1).replace('.', ',') + '%';
  const errBox = (m) => `<div class="vnote">Không lấy được: ${esc(m)}</div>`;
  const okRows = (r) => Array.isArray(r);
  const vcard = (title, sub, body) => `<div class="card vcard"><div class="vh"><b>${title}</b>${sub ? `<span class="note">${sub}</span>` : ''}</div>${body}</div>`;
  const noData = '<div class="vnote">Chưa có dữ liệu trong khoảng này (video mới, ít lượt xem, hoặc Google ẩn khi số người xem quá ít).</div>';

  // Danh sách thanh ngang kiểu Studio: nhãn trái, thanh (dồn phải, số nhỏ thành chấm tròn), % bên phải
  function sList(items, color, total) {
    const max = Math.max(1e-9, ...items.map((i) => i.value)), tot = total || items.reduce((t, i) => t + i.value, 0) || 1;
    return `<div class="sl">${items.map((i) => `<div class="slr"><span class="sll" title="${esc(i.label)}">${esc(i.label)}</span><span class="slb"><i style="width:${Math.max(0, (i.value / max) * 100).toFixed(1)}%;background:${color}"></i></span><span class="slv">${pc1((i.value / tot) * 100)}</span></div>`).join('')}</div>`;
  }
  // Biểu đồ đường có trục (lưới ngang, nhãn trục dọc bên phải, nhãn trục ngang bên dưới)
  function axisChart(values, o) {
    if (!values || values.length < 2) return '<div class="vnote">Chưa đủ dữ liệu để vẽ biểu đồ.</div>';
    const W = 600, H = 200, max = o.yMax != null ? o.yMax : Math.max(1e-9, Math.max(...values) * 1.08);
    const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 4 - (Math.min(v, max) / max) * (H - 12)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const yf = o.yFmt || fmt, gid = 'ax' + Math.abs(String(o.color + values.length + max).split('').reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7));
    const ticks = [1, 2 / 3, 1 / 3, 0].map((f) => ({ f, t: yf(max * f) }));
    return `<div class="axc"><div class="axc-plot"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.color}" stop-opacity=".25"/><stop offset="1" stop-color="${o.color}" stop-opacity="0"/></linearGradient></defs>${ticks.map((k) => `<line x1="0" x2="${W}" y1="${(H - 4 - k.f * (H - 12)).toFixed(1)}" y2="${(H - 4 - k.f * (H - 12)).toFixed(1)}" stroke="#2a2a38" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}${o.fill === false ? '' : `<path d="${line} L${W} ${H} L0 ${H} Z" fill="url(#${gid})"/>`}<path d="${line}" fill="none" stroke="${o.color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div class="axc-y">${ticks.map((k) => `<span style="bottom:calc(${(k.f * 100).toFixed(1)}% - 7px)">${esc(k.t)}</span>`).join('')}</div></div><div class="axc-x">${(o.xLabels || []).map((l) => `<span>${esc(l)}</span>`).join('')}</div></div>`;
  }

  // ---------- Bình luận chưa trả lời của CẢ KÊNH (cột Tương tác): bản gốc + dịch Việt + gợi ý trả lời theo ngôn ngữ kênh + dịch Việt ----------
  const cmt = { cid: '', data: null, ai: {}, shown: 8, busy: false, err: '', aiErr: '' };
  function renderCmt() {
    const c = findChan(cmt.cid);
    const lang = c && c.market && MARKETS[c.market] ? MARKETS[c.market] : 'ngôn ngữ của kênh';
    let body;
    if (cmt.err) body = `<div class="vnote">Không lấy được bình luận: ${esc(cmt.err)}</div>`;
    else if (!cmt.data) body = '<div class="placeholder" style="padding:30px 10px">Đang quét bình luận của kênh…</div>';
    else {
      const items = cmt.data.items.slice(0, cmt.shown);
      const box = (lbl, txt, cls) => `<div class="cmcol"><div class="cmlbl">${lbl}</div><div class="cm-t ${cls || ''}">${txt}</div></div>`;
      const pend = '<span class="note">…đang dịch</span>';
      const cards = items.map((x) => {
        const a = cmt.ai[x.id];
        const skip = a && !a.reply;
        return `<div class="cm"><div class="cm-h"><b>${esc(x.author)}</b><span class="note">${fmtVN(x.publishedAt)}${x.likes ? ' · 👍 ' + fmt(x.likes) : ''} · ${esc(x.videoTitle || 'video')}</span></div>
          <div class="cmgrid"><div>${box('Bản gốc', esc(x.text).replace(/\n/g, '<br>'))}${box('Dịch sang tiếng Việt', a ? esc(a.vi || '—').replace(/\n/g, '<br>') : cmt.aiErr ? '<span class="note">chưa dịch được</span>' : pend)}</div>
          <div>${box(`Gợi ý trả lời (${esc(lang)})`, a ? (skip ? '<span class="note">— bỏ qua (spam hoặc không cần trả lời) —</span>' : esc(a.reply).replace(/\n/g, '<br>')) : cmt.aiErr ? '<span class="note">chưa soạn được</span>' : pend, 'reply')}${box('Dịch câu trả lời sang tiếng Việt', a ? (skip ? '—' : esc(a.replyVi || '—').replace(/\n/g, '<br>')) : cmt.aiErr ? '' : pend)}</div></div>
          <div class="cm-act">${a && a.reply ? `<button class="btn sm" data-act="cmtCopy" data-v="${esc(x.id)}">Copy câu trả lời</button>` : ''}</div></div>`;
      }).join('');
      const left = cmt.data.items.length - items.length;
      body = `<div class="note" style="margin-bottom:8px">${cmt.data.count} bình luận chưa trả lời · đã quét ${fmt(cmt.data.scanned)} bình luận gần nhất${cmt.data.more ? ' (còn bình luận cũ hơn chưa quét)' : ''} · quét lúc ${fmtVN(cmt.data.at)}. Bình luận đã có phản hồi của kênh không hiện.${cmt.aiErr ? ` <span style="color:var(--red)">AI lỗi: ${esc(cmt.aiErr)}</span>` : ''}</div>
        <div class="cmlist">${cards || '<div class="vnote">Không có bình luận nào chưa trả lời 🎉</div>'}</div>${left > 0 ? `<button class="btn sm pill" data-act="cmtMore">Dịch và soạn thêm ${Math.min(8, left)} bình luận (còn ${left})</button>` : ''}
        <div class="note" style="margin-top:10px">App chỉ đọc bình luận, không đăng trả lời thay anh (quyền kết nối chỉ để xem). Anh bấm “Copy câu trả lời”, rồi mở bình luận trên YouTube và dán vào.</div>`;
    }
    modal(`<div class="cmw"><h3>💬 Bình luận chưa trả lời — ${esc(c ? c.name : '')}</h3>${body}<div class="foot"><button class="btn" data-act="cmtRescan" ${cmt.busy ? 'disabled' : ''}>Quét lại</button><button class="btn" data-act="closeModal">Đóng</button></div></div>`);
  }
  async function cmtAssist() {
    const my = cmt.cid;
    const need = (cmt.data ? cmt.data.items.slice(0, cmt.shown) : []).filter((x) => !cmt.ai[x.id]).map((x) => x.id);
    if (!need.length || cmt.busy) return;
    cmt.busy = true; cmt.aiErr = ''; renderCmt();
    try {
      const r = await apiCall('/api/comments/assist', { channel: my, ids: need.slice(0, 10) });
      if (cmt.cid === my) (r.results || []).forEach((o) => { if (o && o.reply != null && o.vi != null && (o.vi || o.reply || o.replyVi)) cmt.ai[o.id] = o; });
    } catch (e) { if (cmt.cid === my) cmt.aiErr = e.message; }
    if (cmt.cid !== my) { cmt.busy = false; return; } // anh đã mở kênh khác trong lúc chờ: bỏ kết quả cũ
    cmt.busy = false; renderCmt();
  }
  async function openChannelComments(cid, refresh) {
    if (!refresh) cmt.ai = {};
    Object.assign(cmt, { cid, data: refresh ? cmt.data : null, shown: 8, err: '', aiErr: '', open: true });
    renderCmt();
    try {
      const d = await apiCall(`/api/channel-comments?channel=${encodeURIComponent(cid)}${refresh ? '&refresh=1' : ''}`);
      if (cmt.cid !== cid) return; // đã chuyển sang kênh khác
      cmt.data = d;
      const ch = findChan(cid); if (ch) ch.unanswered = cmt.data.count;
      render();
    } catch (e) { if (cmt.cid !== cid) return; cmt.err = e.message; }
    if (cmt.open) renderCmt();
    if (cmt.data && cmt.open) cmtAssist();
  }

  // ---------- Đo tiềm năng một từ khoá: 7/14/28 ngày so với cùng độ dài kỳ liền trước ----------
  const pulse = { key: '', kwLabel: '', data: null, err: '' };
  function renderPulse() {
    const d = pulse.data;
    let body;
    if (pulse.err) body = `<div class="vnote">${esc(pulse.err)}</div>`;
    else if (!d) body = '<div class="placeholder" style="padding:26px 10px">Đang đo…</div>';
    else {
      const V = { rising: ['ok', '▲ Đang lên'], falling: ['bad', '▼ Đang giảm'], stable: ['plain', '◆ Ổn định'], low: ['warn', 'Chưa đủ dữ liệu (dưới 4 video trong 56 ngày)'], saturated: ['warn', '🔥 Quá nhiều video mới — không đo được xu hướng'] };
      const gTag = (g, n) => (g != null ? dChip(g) : n > 0 ? '<span class="hb ok"><i></i>Mới</span>' : '<span class="note">—</span>');
      const rows = d.windows.map((w) => `<tr><td class="l">${w.days} ngày</td><td>${fmt(w.n)}</td><td>${fmt(w.prevN)}</td><td>${gTag(w.growthN, w.n)}</td><td>${fmt(w.velocity)}</td><td>${fmt(w.prevVelocity)}</td><td>${gTag(w.growthVelocity, w.velocity)}</td></tr>`).join('');
      body = `<div class="note" style="margin-bottom:8px">Mẫu ${fmt(d.sample)} video trong 56 ngày gần nhất, đúng ngôn ngữ ${esc(MARKETS[d.market] || d.market)}${d.cached ? ' · kết quả đã nhớ (24 giờ)' : ` · vừa dùng ${fmt(d.units)} đơn vị hạn mức`} · đo lúc ${fmtVN(d.at)}</div>
        <div class="hb ${V[d.verdict][0]}" style="margin-bottom:10px"><i></i>${V[d.verdict][1]}</div>
        ${d.uncovered && d.uncovered.length ? `<div class="vnote" style="margin-bottom:10px">Mốc ${d.uncovered.join(', ')} ngày: không có video nào ở kỳ liền trước trong mẫu 100 video — có thể vì từ khoá quá phổ biến (mẫu bị lấp đầy bởi video vài ngày gần nhất) nên chưa so sánh được, không phải vì không có video.</div>` : ''}
        <div class="tablewrap"><table><thead><tr><th class="l">Khoảng</th><th>Video kỳ này</th><th>Video kỳ trước</th><th>Tăng trưởng video</th><th>View/ngày TB kỳ này</th><th>View/ngày TB kỳ trước</th><th>Tăng trưởng view/ngày</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="note" style="margin-top:8px">“Kỳ trước” là khoảng liền trước, cùng độ dài (ví dụ 14 ngày so với 14 ngày liền trước đó). “View/ngày” = lượt xem chia số ngày kể từ khi đăng, để so công bằng video mới với video cũ hơn. Cần từ 2 khoảng trở lên cùng tăng mạnh (≥20%) mới tính là “Đang lên”.</p>`;
    }
    modal(`<h3>📈 Từ khoá tiềm năng — “${esc(pulse.kwLabel)}”</h3>${body}<div class="foot"><button class="btn" data-act="closeModal">Đóng</button></div>`);
  }
  async function openPulse(keyword, market, type) {
    const key = `${keyword}|${market}|${type}`;
    Object.assign(pulse, { key, kwLabel: keyword, data: null, err: '' });
    renderPulse();
    try { const d = await apiCall('/api/keyword/pulse', { keyword, market, type }); if (pulse.key === key) pulse.data = d; }
    catch (e) { if (pulse.key === key) pulse.err = e.message; }
    if (pulse.key === key) renderPulse();
  }

  // ---------- Bình luận chưa trả lời của MỘT VIDEO (bấm số bình luận trong bảng video): cùng cơ chế dịch + gợi ý trả lời AI như bình luận cả kênh ----------
  const vcmt = { cid: '', vid: '', data: null, ai: {}, shown: 8, busy: false, err: '', aiErr: '' };
  function renderVcmt() {
    const c = findChan(vcmt.cid), v = c && c.videoList.find((x) => x.id === vcmt.vid);
    const lang = c && c.market && MARKETS[c.market] ? MARKETS[c.market] : 'ngôn ngữ của kênh';
    let body;
    if (vcmt.err) body = `<div class="vnote">Không lấy được bình luận: ${esc(vcmt.err)}</div>`;
    else if (!vcmt.data) body = '<div class="placeholder" style="padding:30px 10px">Đang tải bình luận…</div>';
    else if (vcmt.data.disabled) body = '<div class="vnote">Video này đã tắt bình luận.</div>';
    else {
      const items = vcmt.data.unanswered.slice(0, vcmt.shown);
      const box = (lbl, txt, cls) => `<div class="cmcol"><div class="cmlbl">${lbl}</div><div class="cm-t ${cls || ''}">${txt}</div></div>`;
      const pend = '<span class="note">…đang dịch</span>';
      const cards = items.map((x) => {
        const a = vcmt.ai[x.id];
        const skip = a && !a.reply;
        return `<div class="cm"><div class="cm-h"><b>${esc(x.author)}</b><span class="note">${fmtVN(x.publishedAt)}${x.likes ? ' · 👍 ' + fmt(x.likes) : ''}${x.replies ? ' · ' + x.replies + ' phản hồi (không có của kênh)' : ''}</span></div>
          <div class="cmgrid"><div>${box('Bản gốc', esc(x.text).replace(/\n/g, '<br>'))}${box('Dịch sang tiếng Việt', a ? esc(a.vi || '—').replace(/\n/g, '<br>') : vcmt.aiErr ? '<span class="note">chưa dịch được</span>' : pend)}</div>
          <div>${box(`Gợi ý trả lời (${esc(lang)})`, a ? (skip ? '<span class="note">— bỏ qua (spam hoặc không cần trả lời) —</span>' : esc(a.reply).replace(/\n/g, '<br>')) : vcmt.aiErr ? '<span class="note">chưa soạn được</span>' : pend, 'reply')}${box('Dịch câu trả lời sang tiếng Việt', a ? (skip ? '—' : esc(a.replyVi || '—').replace(/\n/g, '<br>')) : vcmt.aiErr ? '' : pend)}</div></div>
          <div class="cm-act">${a && a.reply ? `<button class="btn sm" data-act="vcmtCopy" data-v="${esc(x.id)}">Copy câu trả lời</button>` : ''}</div></div>`;
      }).join('');
      const left = vcmt.data.unanswered.length - items.length;
      body = `<div class="note" style="margin-bottom:8px">${vcmt.data.unanswered.length} bình luận chưa trả lời · đã quét ${fmt(vcmt.data.scanned)} bình luận gần nhất${vcmt.data.more ? ' (còn bình luận cũ hơn chưa quét)' : ''}. Bình luận đã có phản hồi của kênh không hiện.${vcmt.aiErr ? ` <span style="color:var(--red)">AI lỗi: ${esc(vcmt.aiErr)}</span>` : ''}</div>
        <div class="cmlist">${cards || '<div class="vnote">Không có bình luận nào chưa trả lời 🎉</div>'}</div>${left > 0 ? `<button class="btn sm pill" data-act="vcmtMore">Dịch và soạn thêm ${Math.min(8, left)} bình luận (còn ${left})</button>` : ''}
        <div class="note" style="margin-top:10px">App chỉ đọc bình luận, không đăng trả lời thay anh (quyền kết nối chỉ để xem). Anh bấm “Copy câu trả lời”, rồi mở bình luận trên YouTube và dán vào.</div>`;
    }
    modal(`<div class="cmw"><h3>💬 Bình luận chưa trả lời</h3><div class="note" style="margin-bottom:8px">${esc(v ? v.title : '')}</div>${body}<div class="foot"><button class="btn" data-act="vcmtRescan" ${vcmt.busy ? 'disabled' : ''}>Quét lại</button><button class="btn" data-act="closeModal">Đóng</button></div></div>`);
  }
  async function vcmtAssist() {
    const my = vcmt.cid + '|' + vcmt.vid;
    const need = (vcmt.data && vcmt.data.unanswered ? vcmt.data.unanswered.slice(0, vcmt.shown) : []).filter((x) => !vcmt.ai[x.id]).map((x) => x.id);
    if (!need.length || vcmt.busy) return;
    vcmt.busy = true; vcmt.aiErr = ''; renderVcmt();
    try {
      const r = await apiCall('/api/video-comments/assist', { channel: vcmt.cid, video: vcmt.vid, ids: need.slice(0, 10) });
      if (vcmt.cid + '|' + vcmt.vid === my) (r.results || []).forEach((o) => { if (o && o.reply != null && o.vi != null && (o.vi || o.reply || o.replyVi)) vcmt.ai[o.id] = o; });
    } catch (e) { if (vcmt.cid + '|' + vcmt.vid === my) vcmt.aiErr = e.message; }
    if (vcmt.cid + '|' + vcmt.vid !== my) { vcmt.busy = false; return; } // anh đã mở video khác trong lúc chờ: bỏ kết quả cũ
    vcmt.busy = false; renderVcmt();
  }
  async function openComments(cid, vid, refresh) {
    if (!refresh) vcmt.ai = {};
    Object.assign(vcmt, { cid, vid, data: refresh ? vcmt.data : null, shown: 8, err: '', aiErr: '' });
    renderVcmt();
    try {
      const d = await apiCall(`/api/video-comments?channel=${encodeURIComponent(cid)}&video=${encodeURIComponent(vid)}${refresh ? '&refresh=1' : ''}`);
      if (vcmt.cid !== cid || vcmt.vid !== vid) return; // đã chuyển sang video khác
      vcmt.data = d;
    } catch (e) { if (vcmt.cid !== cid || vcmt.vid !== vid) return; vcmt.err = e.message; }
    renderVcmt();
    if (vcmt.data && !vcmt.data.disabled) vcmtAssist();
  }

  function ensureVideoReport(cid, vid) {
    const key = `${cid}|${vid}|${state.vidRange}`;
    if (vrep.key === key || vrep.loading) return;
    vrep.key = key; vrep.loading = true; vrep.data = null; vrep.error = '';
    apiCall(`/api/video-report?channel=${encodeURIComponent(cid)}&video=${encodeURIComponent(vid)}&range=${encodeURIComponent(state.vidRange)}`)
      .then((d) => { vrep.data = d; }).catch((e) => { vrep.error = e.message; })
      .finally(() => { vrep.loading = false; if ((location.hash || '').startsWith('#/video/')) render(); });
  }

  function trafficCard(d) {
    const tabs = [['all', 'Tổng quan'], ['ext', 'Bên ngoài'], ['search', 'YouTube Tìm kiếm'], ['sugg', 'Video đề xuất']];
    if (state.vidTraffic === 'pl') state.vidTraffic = 'all';
    const tabHtml = `<div class="ptabs">${tabs.map(([k, l]) => `<button class="ptab ${state.vidTraffic === k ? 'on' : ''}" data-act="vidTraffic" data-v="${k}">${l}</button>`).join('')}</div>`;
    if (!okRows(d.traffic)) return vcard('Cách người xem tìm thấy video', 'Lượt xem', errBox((d.traffic && d.traffic.error) || ''));
    const groups = {};
    d.traffic.forEach((r) => { const g = TS_GROUP(r.insightTrafficSourceType); groups[g] = (groups[g] || 0) + (+r.views || 0); });
    const total = Object.values(groups).reduce((t, x) => t + x, 0) || 1;
    let body;
    const share = (g) => `<div class="vshare"><span>Tỷ lệ trong tổng lưu lượng truy cập:</span><b>${pc1(((groups[g] || 0) / total) * 100)}</b></div>`;
    const tab = state.vidTraffic;
    if (tab === 'all') body = sList(Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([g, v]) => ({ label: GROUP_NAME[g], value: v })), '#5a4fd0');
    else if (tab === 'search') body = share('search') + (okRows(d.search) ? (d.search.length ? sList(d.search.slice(0, 10).map((r) => ({ label: r.insightTrafficSourceDetail, value: +r.views || 0 })), '#5a4fd0') : '<div class="vnote">Chưa có cụm từ tìm kiếm nào (Google chỉ trả các cụm từ đủ lượt tìm).</div>') : errBox(d.search && d.search.error));
    else if (tab === 'ext') body = share('ext') + (okRows(d.sources.ext) ? (d.sources.ext.length ? sList(d.sources.ext.slice(0, 10).map((r) => ({ label: r.insightTrafficSourceDetail, value: +r.views || 0 })), '#5a4fd0') : '<div class="vnote">Chưa có nguồn bên ngoài nào.</div>') : errBox(d.sources.ext && d.sources.ext.error));
    else if (tab === 'sugg') body = share('sugg') + (okRows(d.sources.sugg) ? (d.sources.sugg.length ? sList(d.sources.sugg.slice(0, 10).map((r) => ({ label: r.title || r.insightTrafficSourceDetail, value: +r.views || 0 })), '#5a4fd0') : '<div class="vnote">Chưa có video đề xuất nào.</div>') : errBox(d.sources.sugg && d.sources.sugg.error));
    else body = '';
    return vcard('Cách người xem tìm thấy video', 'Lượt xem', tabHtml + body);
  }

  function retentionCard(d) {
    const t = d.totals && !d.totals.error ? d.totals : null;
    const head = t ? `<div class="vkv"><span>Thời lượng xem trung bình</span><b>${durTxt(t.averageViewDuration)}</b></div><div class="vkv"><span>Tỷ lệ phần trăm đã xem trung bình</span><b>${pc1(t.averageViewPercentage)}</b></div>` : '';
    let body;
    if (!okRows(d.retention)) body = errBox(d.retention && d.retention.error);
    else if (!d.retention.length) body = '<div class="vnote">Chưa có biểu đồ giữ chân cho video này.</div>';
    else {
      const vals = d.retention.map((r) => (+r.audienceWatchRatio || 0) * 100), dur = d.video.durationSec || 0;
      const yMax = Math.max(100, Math.ceil(Math.max(...vals) / 10) * 10);
      const xl = dur ? [0, 0.25, 0.5, 0.75, 1].map((f) => durTxt(dur * f)) : ['0:00', '', '', '', 'Hết video'];
      body = axisChart(vals, { color: '#ec407a', yMax, yFmt: (x) => Math.round(x) + '%', xLabels: xl, fill: false });
    }
    return vcard('Tỷ lệ giữ chân người xem', d.range === 'all' ? 'toàn thời gian' : `${d.range} ngày qua`, head + body);
  }

  function geoCard(d) {
    if (!okRows(d.country)) return vcard('Các khu vực địa lý hàng đầu', 'Số lượt xem', errBox(d.country && d.country.error));
    if (!d.country.length) return vcard('Các khu vực địa lý hàng đầu', 'Số lượt xem', noData);
    const total = d.totals && !d.totals.error && d.totals.views ? d.totals.views : 0;
    const rows = state.geoMore ? d.country : d.country.slice(0, 5);
    return vcard('Các khu vực địa lý hàng đầu', 'Số lượt xem', sList(rows.map((r) => ({ label: regionName(r.country), value: +r.views || 0 })), '#9b30c9', total) + (d.country.length > 5 ? `<button class="btn sm pill" data-act="geoMore">${state.geoMore ? 'Thu gọn' : 'Xem thêm'}</button>` : ''));
  }

  function deviceCard(d) {
    if (!okRows(d.device)) return vcard('Loại thiết bị', 'Thời gian xem (giờ)', errBox(d.device && d.device.error));
    if (!d.device.length) return vcard('Loại thiết bị', 'Thời gian xem (giờ)', noData);
    const rows = d.device.map((r) => ({ label: DEV_NAME[r.deviceType] || r.deviceType, v: +r.estimatedMinutesWatched || 0 })).sort((a, b) => b.v - a.v);
    const tot = rows.reduce((t, r) => t + r.v, 0) || 1;
    return vcard('Loại thiết bị', 'Thời gian xem (giờ)', `<div class="stack">${rows.map((r, i) => `<i style="width:${((r.v / tot) * 100).toFixed(2)}%;background:${DEV_COLOR[i % DEV_COLOR.length]}" title="${esc(r.label)}"></i>`).join('')}</div>
      <div class="sl">${rows.map((r, i) => `<div class="slr dev"><span class="sll"><b class="dot2" style="background:${DEV_COLOR[i % DEV_COLOR.length]}"></b>${esc(r.label)}</span><span class="slv">${pc1((r.v / tot) * 100)}</span></div>`).join('')}</div>`);
  }

  function ageGenderCard(d) {
    if (!okRows(d.age)) return vcard('Độ tuổi và giới tính', 'Số lượt xem', errBox(d.age && d.age.error));
    if (!d.age.length) return vcard('Độ tuổi và giới tính', 'Số lượt xem', '<div class="vnote">Chưa đủ dữ liệu nhân khẩu học (Google ẩn khi số người xem quá ít).</div>');
    const g = { female: 0, male: 0, user_specified: 0 }, a = {};
    d.age.forEach((r) => { const v = +r.viewerPercentage || 0; g[r.gender] = (g[r.gender] || 0) + v; a[r.ageGroup] = (a[r.ageGroup] || 0) + v; });
    const genders = Object.entries(GENDER_NAME).map(([k, l]) => ({ label: l, value: g[k] || 0 }));
    const ages = Object.keys(a).sort((x, y) => (parseInt(x.replace('age', '')) || 0) - (parseInt(y.replace('age', '')) || 0)).map((k) => ({ label: AGE_NAME(k), value: a[k] }));
    return vcard('Độ tuổi và giới tính', 'Số lượt xem', sList(genders, '#9b30c9', 100) + '<hr class="vhr">' + sList(ages, '#9b30c9', 100));
  }

  function pageVideo(cid, vid) {
    const c = findChan(cid);
    const v = c && c.videoList.find((x) => x.id === vid);
    const back = `<a class="back" href="#/channel/${esc(cid)}">← ${c ? esc(c.name) : 'Kênh'}</a>`;
    if (!c || !v || !realOwn) return `${back}<div class="placeholder"><h2>Không tìm thấy video</h2>Chỉ mở được với video của kênh đã kết nối.</div>`;
    const rangeBtns = [['7', '7 ngày'], ['28', '28 ngày'], ['90', '90 ngày'], ['all', 'Từ khi xuất bản']].map(([k, l]) => `<button class="chip ${state.vidRange === k ? 'on' : ''}" data-act="vidRange" data-v="${k}">${l}</button>`).join('');
    const titleRow = `${back}<div class="vtitle"><h1>Số liệu phân tích về video</h1><div class="chips">${rangeBtns}</div></div>
      <div class="card profile" style="margin-bottom:10px"><div><h2 style="margin:0;font-size:16px">${esc(v.title)}</h2><div class="sub note">${esc(c.name)} · đăng ${new Date(v.date).toLocaleDateString('vi-VN')} · <a href="${esc(v.url || '#')}" target="_blank" rel="noopener" style="text-decoration:underline">Mở trên YouTube ↗</a></div></div></div>`;
    const d = vrep.data;
    if (vrep.error) return titleRow + `<div class="placeholder">${esc(vrep.error)}</div>`;
    if (!d || vrep.loading) return titleRow + '<div class="placeholder">Đang tải số liệu từ YouTube Analytics…</div>';
    const tabs = [['over', 'Tổng quan'], ['reach', 'Phạm vi tiếp cận'], ['engage', 'Mức độ tương tác'], ['aud', 'Đối tượng người xem'], ['rev', 'Doanh thu']];
    const tabBar = `<div class="stabs">${tabs.map(([k, l]) => `<button class="stab ${state.vidTab === k ? 'on' : ''}" data-act="vidTab" data-v="${k}">${l}</button>`).join('')}</div>`;
    const t = d.totals && !d.totals.error ? d.totals : null;
    const fromT = ymd(d.from), toT = ymd(d.to);
    const period = `<p class="note" style="margin:6px 2px 10px">${fromT} – ${toT} · số liệu YouTube Analytics, trễ 1–2 ngày.</p>`;
    const daily = okRows(d.daily) ? d.daily : null;
    const series = (key, conv) => (daily ? daily.map((r) => (conv ? conv(+r[key] || 0) : +r[key] || 0)) : []);
    const xl = [fromT, '', toT];
    const kpi = (k, label, val, sub) => `<button class="kpi ${state.vidMetric === k ? 'on' : ''}" data-act="vidMetric" data-v="${k}"><span class="k">${label}</span><span class="v">${val}</span>${sub ? `<span class="s">${sub}</span>` : ''}</button>`;
    const stat = (label, val, sub) => `<div class="card stat"><div class="k">${label}</div><div class="v">${val}${sub ? `<span class="d">${sub}</span>` : ''}</div></div>`;
    const totErr = t ? '' : errBox((d.totals && d.totals.error) || 'chưa có số tổng cho video này');
    const hasRev = d.hasRevenue && t && t.estimatedRevenue != null;
    let html = '';

    if (state.vidTab === 'over') {
      const M = { views: ['Lượt xem', '#7c5cff', fmt, series('views')], watch: ['Thời gian xem (giờ)', '#22c1a5', (x) => (x >= 100 ? fmt(Math.round(x)) : (Math.round(x * 10) / 10).toString().replace('.', ',')), series('estimatedMinutesWatched', (m) => m / 60)], subs: ['Người đăng ký', '#3aa0ff', fmt, series('subscribersGained')], rev: ['Doanh thu ước tính', '#f5a524', (x) => money(x), series('estimatedRevenue')] };
      const cur = M[state.vidMetric] && (state.vidMetric !== 'rev' || d.hasRevenue) ? state.vidMetric : 'views';
      const cards = t ? `<div class="kpis">${kpi('views', 'Lượt xem', fmt(t.views || 0))}${kpi('watch', 'Thời gian xem (giờ)', M.watch[2]((t.estimatedMinutesWatched || 0) / 60))}${kpi('subs', 'Người đăng ký', signed((t.subscribersGained || 0) - (t.subscribersLost || 0)))}${d.hasRevenue ? kpi('rev', 'Doanh thu ước tính', hasRev ? money(t.estimatedRevenue) : '—') : ''}</div>` : totErr;
      const chart = daily ? axisChart(M[cur][3], { color: M[cur][1], yFmt: M[cur][2], xLabels: xl }) : errBox(d.daily && d.daily.error);
      html = `${period}<div class="card vcard"><div class="vh"><b>${M[cur][0]}</b><span class="note">theo ngày</span></div>${cards}${chart}</div>${trafficCard(d)}${retentionCard(d)}`;
    } else if (state.vidTab === 'reach') {
      html = `${period}<div class="card vcard"><div class="vh"><b>Lượt xem</b><span class="note">theo ngày</span></div>${daily ? axisChart(series('views'), { color: '#7c5cff', xLabels: xl }) : errBox(d.daily && d.daily.error)}</div>${trafficCard(d)}`;
    } else if (state.vidTab === 'engage') {
      const cards = t ? `<div class="stats">${stat('Thời gian xem', fmtHours(t.estimatedMinutesWatched || 0))}${stat('Thời lượng xem trung bình', durTxt(t.averageViewDuration))}${stat('% video được xem TB', pc1(t.averageViewPercentage))}${stat('Like', fmt(t.likes || 0))}${stat('Bình luận', fmt(t.comments || 0))}${stat('Chia sẻ', fmt(t.shares || 0))}${stat('Sub từ video', signed((t.subscribersGained || 0) - (t.subscribersLost || 0)), `+${fmt(t.subscribersGained || 0)} / −${fmt(t.subscribersLost || 0)}`)}</div>` : totErr;
      html = `${period}${cards}${retentionCard(d)}<div class="card vcard"><div class="vh"><b>Thời gian xem (giờ)</b><span class="note">theo ngày</span></div>${daily ? axisChart(series('estimatedMinutesWatched', (m) => m / 60), { color: '#22c1a5', yFmt: (x) => (x >= 100 ? Math.round(x) : Math.round(x * 10) / 10).toString(), xLabels: xl }) : errBox(d.daily && d.daily.error)}</div>`;
    } else if (state.vidTab === 'aud') {
      html = `${period}<div class="two2">${ageGenderCard(d)}${geoCard(d)}</div><div class="two2">${deviceCard(d)}<div></div></div>`;
    } else {
      const r = d.revTotals && !d.revTotals.error ? d.revTotals : null;
      const rpm = hasRev && t.views ? money((t.estimatedRevenue / t.views) * 1000) : '—';
      const cards = d.hasRevenue ? (r ? `<div class="stats">${stat('Doanh thu ước tính', money(r.estimatedRevenue || 0))}${stat('RPM (trên 1.000 lượt xem)', rpm)}${stat('Doanh thu từ quảng cáo', money(r.estimatedAdRevenue || 0))}${stat('Lượt xem có quảng cáo', fmt(r.monetizedPlaybacks || 0))}${stat('Lượt hiển thị quảng cáo', fmt(r.adImpressions || 0))}${stat('CPM', money(r.cpm || 0))}${stat('CPM theo lượt phát', money(r.playbackBasedCpm || 0))}</div>` : errBox((d.revTotals && d.revTotals.error) || 'chưa có số doanh thu')) : '<div class="vnote">Kênh chưa cấp quyền doanh thu — hãy kết nối lại kênh để cấp quyền.</div>';
      html = `${period}${cards}${d.hasRevenue ? `<div class="card vcard"><div class="vh"><b>Doanh thu ước tính</b><span class="note">theo ngày (USD)</span></div>${daily ? axisChart(series('estimatedRevenue'), { color: '#f5a524', yFmt: (x) => money(x), xLabels: xl }) : errBox(d.daily && d.daily.error)}</div>` : ''}`;
    }
    return `${titleRow}${tabBar}${html}`;
  }

  // ---------- Trang: Tracker ----------
  const TABS = [
    ['rivals', 'Kênh đối thủ'], ['mine', 'Kênh của mình'],
    ['trends', '🔥 Title Trends'], ['niche', '🧭 Tìm Niche'], ['topic', '🔎 Quét chủ đề'], ['scan', '📡 Quét kênh'],
  ];

  // ---------- Bắt trend (theo cách YouTube tìm xu hướng) ----------
  // Ba tín hiệu: (1) từ khoá/công thức tiêu đề đang LÊN so kỳ trước, (2) video "nổ bất thường" = view / sub kênh (kênh nhỏ mà view lớn),
  // (3) ngách có tăng trưởng mà chưa bị kênh lớn chiếm. Hiện chạy trên kho video mẫu; bản thật lấy từ YouTube API.
  const T = window.QLK_TRENDS;
  const ageTxt = (d) => (d < 1 ? 'hôm nay' : d < 30 ? `${Math.round(d)} ngày trước` : `${Math.round(d / 30)} tháng trước`);
  const xBadge = (x) => `<span class="hb ${x >= 8 ? 'ok' : x >= 3 ? 'warn' : 'plain'}"><i></i>×${x >= 10 ? x.toFixed(0) : x.toFixed(1)}</span>`;
  const trendNote = () => `<p class="note">Đang chạy trên kho video mẫu. Khi gắn API, dữ liệu lấy từ video công khai trên YouTube (mục thịnh hành, tìm kiếm và kênh đối thủ anh đang theo dõi). Tự cập nhật lúc 08:30 hằng ngày (giờ Việt Nam); lần gần nhất: ${api && api.update && api.update.last ? fmtVN(api.update.last.at) : 'chưa có'}.</p>`;
  const growthTag = (k) => (k.growth == null ? '<span class="hb ok"><i></i>Mới xuất hiện</span>' : k.growth >= 50 ? `<span class="hb ok"><i></i>▲ ${k.growth > 500 ? '>500' : Math.round(k.growth)}%</span>` : k.growth <= -30 ? `<span class="hb bad"><i></i>▼ ${Math.abs(Math.round(k.growth))}%</span>` : `<span class="hb plain"><i></i>${k.growth >= 0 ? '+' : '−'}${Math.abs(Math.round(k.growth))}%</span>`);
  function lineWide(values, color) {
    const W = 320, H = 70, min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 4 - ((v - min) / span) * (H - 10)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return `<svg class="wide" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d} L${W} ${H} L0 ${H} Z" fill="${color}" opacity=".15"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
  }
  const searchBox = (id, val, ph, act, label) => `<div class="qbox"><input id="${id}" type="text" value="${esc(val)}" placeholder="${esc(ph)}"><button class="btn primary" data-act="${act}">${label}</button></div>`;

  function pageTrends() {
    const r = state.range;
    const res = T.titleTrends(state.trendNiche, r);
    const niches = T.NICHES;
    const top = res.kws.find((k) => k.rising) || res.kws[0];
    const bestPat = res.pats.find((p) => p.n >= 2);
    const insight = top ? `Từ khoá đang lên rõ nhất: <b>“${esc(top.kw)}”</b> (${top.n} video, ${top.ch} kênh)${bestPat ? ` · Công thức tiêu đề hiệu quả nhất: <b>${esc(bestPat.label)}</b> (×${bestPat.mult.toFixed(1)} so mức trung bình)` : ''}.` : 'Chưa đủ dữ liệu trong khoảng này.';
    window.__trendTitles = res.hits.map((v) => v.title);
    const kwRows = res.kws.map((k) => `<tr><td class="l"><button class="kw" data-act="toTopic" data-v="${esc(k.kw)}">${esc(k.kw)}</button></td><td>${k.n}</td><td>${k.ch}</td><td>${fmt(k.avg)}</td><td>${growthTag(k)}</td></tr>`).join('');
    const patRows = res.pats.map((p) => `<tr><td class="l">${esc(p.label)}</td><td>${p.n}</td><td class="bar"><i style="width:${Math.min(100, p.mult * 45)}%"></i><b>×${p.mult.toFixed(1)}</b></td></tr>`).join('');
    const hitRows = res.hits.map((v) => `<tr><td class="l vt" title="${esc(v.title)}">${esc(v.title)}</td><td class="l note">${esc(v.channel)} · ${fmt(v.subs)} sub</td><td class="big">${fmt(v.views)}</td><td>${xBadge(T.outlier(v))}</td><td class="note">${ageTxt(v.age)}</td></tr>`).join('');
    return `<div class="card insight">💡 ${insight}</div>
      <div class="filters"><label>Ngách</label><select data-act="trendNiche"><option value="all">Tất cả ngách</option>${niches.map((n) => `<option value="${esc(n)}" ${state.trendNiche === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        <span class="note">So ${r} ngày gần nhất với ${r} ngày trước đó · ${res.total} video trong kỳ</span></div>
      <div class="two2">
        <div class="card"><div class="section-title"><span>🔥 Từ khoá &amp; cụm từ đang lên</span><span class="r">bấm từ khoá để quét chủ đề</span></div>
          <div class="tablewrap"><table><thead><tr><th class="l">Từ khoá</th><th>Video</th><th>Kênh</th><th>View TB</th><th>So kỳ trước</th></tr></thead><tbody>${kwRows || '<tr><td colspan="5" class="note">Chưa đủ dữ liệu.</td></tr>'}</tbody></table></div></div>
        <div class="card"><div class="section-title"><span>🧪 Công thức tiêu đề</span><span class="r">view TB so với mức chung</span></div>
          <div class="tablewrap"><table><thead><tr><th class="l">Công thức</th><th>Video</th><th class="l">Hiệu quả</th></tr></thead><tbody>${patRows}</tbody></table></div></div>
      </div>
      <div class="card" style="margin-top:14px"><div class="section-title"><span>🚀 Video nổ bất thường trong kỳ (×view so sub kênh)</span><span class="r"><button class="btn sm" data-act="copyTrend">Copy tiêu đề</button></span></div>
        ${res.hits.length ? `<div class="tablewrap"><table><thead><tr><th class="l">Tiêu đề</th><th class="l">Kênh</th><th>Lượt xem</th><th>Nổ</th><th>Đăng</th></tr></thead><tbody>${hitRows}</tbody></table></div>` : '<div class="placeholder">Chưa có video nổ bất thường trong kỳ này.</div>'}</div>${trendNote()}`;
  }

  function pageNiche() {
    const r = state.range;
    const own = new Set(D.OWN.map((c) => c.niche));
    const riv = {};
    allRivals().forEach((c) => { riv[c.niche] = (riv[c.niche] || 0) + 1; });
    const V = { good: ['ok', 'Nên vào'], mid: ['warn', 'Cân nhắc'], low: ['bad', 'Đông / kém hấp dẫn'] };
    const rows = T.nicheScores(r).map((n, i) => `<tr>
      <td class="note">${i + 1}</td>
      <td class="l"><b>${esc(n.niche)}</b> ${own.has(n.niche) ? '<span class="tag mine">Anh đang làm</span>' : ''} ${riv[n.niche] ? `<span class="tag">${riv[n.niche]} đối thủ theo dõi</span>` : ''}</td>
      <td class="bar"><i style="width:${n.score}%"></i><b>${n.score}</b></td>
      <td>${Math.abs(n.growth) > 500 ? (n.growth > 0 ? '>+500%' : '<−500%') : `${n.growth >= 0 ? '+' : '−'}${Math.abs(Math.round(n.growth))}%`}</td>
      <td>${n.small}</td><td>${n.videos} / ${n.channels}</td><td>${fmt(n.median)}</td><td>${Math.round(n.competition * 100)}%</td>
      <td class="l"><span class="hb ${V[n.verdict][0]}"><i></i>${V[n.verdict][1]}</span></td>
      <td><button class="btn sm" data-act="toTopic" data-v="${esc(n.niche)}">Quét chủ đề →</button></td></tr>`).join('');
    return `<div class="card insight">💡 Điểm cơ hội (0–100) = <b>40%</b> tăng trưởng lượt xem của ngách + <b>40%</b> tỉ lệ video “kênh nhỏ mà view lớn” (dưới 20K sub nhưng view ≥ 10× sub) + <b>20%</b> mức ít bị kênh lớn (trên 200K sub) chiếm chỗ.</div>
      <div class="card"><div class="section-title"><span>🧭 Xếp hạng ngách (${r} ngày gần nhất)</span><span class="r">cao = dễ vào và đang lên</span></div>
        <div class="tablewrap"><table><thead><tr><th></th><th class="l">Ngách</th><th class="l">Điểm cơ hội</th><th>Tăng view</th><th>Kênh nhỏ nổ</th><th>Video / kênh</th><th>View trung vị</th><th>Kênh lớn chiếm</th><th class="l">Nhận xét</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>${trendNote()}`;
  }

  function pageTopic() {
    const q = state.topicQ;
    const head0 = `<div class="card qcard">${searchBox('tp-q', q, 'Nhập chủ đề, ví dụ: stoic anger, black holes, compound interest', 'runTopic', '🔎 Quét')}
      <div class="chips" style="margin-top:10px">${['Stoic anger', 'Black holes', 'Compound interest', 'Sleep', 'Odin', 'Overthinking'].map((s) => `<button class="chip" data-act="toTopic" data-v="${s}">${s}</button>`).join('')}</div></div>`;
    if (!q) return head0 + '<div class="card placeholder"><div class="ph-ico">🔎</div><h2>Quét một chủ đề</h2><div>Nhập từ khoá hoặc chọn gợi ý. App liệt kê video nổ, kênh nhỏ đang thành công và từ khoá liên quan để anh tìm hướng làm.</div></div>';
    const res = T.scanTopic(q);
    let list = res.list;
    if (state.topicSmall) list = list.filter((v) => v.subs < 10000);
    if (state.topicRecent) list = list.filter((v) => v.age <= 30);
    const rows = list.slice(0, 25).map((v) => `<tr><td class="l vt" title="${esc(v.title)}">${esc(v.title)}</td><td class="l note">${esc(v.channel)} · ${fmt(v.subs)} sub</td><td class="big">${fmt(v.views)}</td><td>${xBadge(T.outlier(v))}</td><td class="note">${ageTxt(v.age)}</td></tr>`).join('');
    const dirTag = res.dir > 12 ? '<span class="hb ok"><i></i>Đang tăng</span>' : res.dir < -12 ? '<span class="hb bad"><i></i>Đang giảm</span>' : '<span class="hb plain"><i></i>Ổn định</span>';
    window.__topicTitles = list.slice(0, 25).map((v) => v.title);
    return head0 + `<div class="stats">
        <div class="card stat"><div class="k">Video tìm thấy</div><div class="v">${res.list.length}</div></div>
        <div class="card stat"><div class="k">Kênh nhỏ (&lt;10K sub) đang nổ</div><div class="v">${res.small}</div></div>
        <div class="card stat"><div class="k">View trung vị</div><div class="v">${fmt(res.med)}</div></div>
        <div class="card stat"><div class="k">Mức quan tâm 12 tuần ${dirTag}</div>${lineWide(res.interest, '#7c5cff')}</div></div>
      <div class="chips" style="margin-bottom:12px"><span class="note" style="align-self:center">Liên quan:</span>${res.related.map((t) => `<button class="chip" data-act="toTopic" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="card"><div class="section-title"><span>Kết quả cho “${esc(q)}” (${list.length})</span><span class="r">
        <button class="chip ${state.topicSmall ? 'on' : ''}" data-act="topicSmall">Chỉ kênh nhỏ &lt;10K</button><button class="chip ${state.topicRecent ? 'on' : ''}" data-act="topicRecent">30 ngày qua</button><button class="btn sm" data-act="copyTopic">Copy tiêu đề</button></span></div>
        ${list.length ? `<div class="tablewrap"><table><thead><tr><th class="l">Tiêu đề</th><th class="l">Kênh</th><th>Lượt xem</th><th>Nổ (view/sub)</th><th>Đăng</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="placeholder">Không có kết quả với bộ lọc này.</div>'}</div>${trendNote()}`;
  }

  function pageScan() {
    const box = `<div class="card qcard">${searchBox('sc-url', state.scanUrl, 'Dán link kênh, ví dụ https://www.youtube.com/@ten-kenh', 'runScan', '📡 Quét kênh')}
      <div class="note" style="margin-top:8px">Phân tích nhanh một kênh mà không cần thêm vào danh sách đối thủ.</div></div>`;
    if (!state.scanName) return box + '<div class="card placeholder"><div class="ph-ico">📡</div><h2>Quét một kênh</h2><div>Dán link kênh để xem nhịp đăng, video nổ nhất, công thức tiêu đề họ hay dùng và giờ đăng hiệu quả.</div></div>';
    const s = T.scanChannel(state.scanName), c = s.c;
    const med = c.videoList.map((v) => v.views).sort((a, b) => a - b)[Math.floor(c.videoList.length / 2)] || 1;
    const top5 = c.videoList.slice().sort((a, b) => b.views - a.views).slice(0, 5);
    const rows = top5.map((v) => `<tr><td class="l vt" title="${esc(v.title)}">${esc(v.title)}</td><td class="big">${fmt(v.views)}</td><td>${xBadge(v.views / med)}</td><td class="note">${new Date(v.date).toLocaleDateString('vi-VN')}</td></tr>`).join('');
    const pats = T.PATTERNS.map((p) => ({ label: p.label, n: s.patCount[p.id] || 0 })).sort((a, b) => b.n - a.n);
    const st = (k, v, sub) => `<div class="card stat"><div class="k">${k}</div><div class="v">${v}</div>${sub ? `<div class="note">${sub}</div>` : ''}</div>`;
    return box + `<div class="card profile">${avatar(c)}<div><h2>${esc(c.name)} <span class="tag amber">Chưa theo dõi</span></h2><div class="sub note">Dữ liệu mẫu · quét ${new Date().toLocaleDateString('vi-VN')}</div></div>
        <div style="margin-left:auto"><button class="btn primary" data-act="addScanned">+ Nạp làm đối thủ</button></div></div>
      <div class="stats">${st('Subscriber', fmt(last(c.subs)), `${signed(gain(c.subs, 28))} trong 28 ngày`)}${st('Tổng lượt xem', fmt(last(c.views)), `${signed(gain(c.views, 28))} trong 28 ngày`)}${st('Số video', fmt(c.videos))}${st('View trung bình / video', fmt(s.avgViews))}${st('Nhịp đăng', `${s.perWeek} video/tuần`)}${st('Giờ đăng hiệu quả', s.bestHour, s.bestDay)}</div>
      <div class="two2"><div class="card"><div class="section-title"><span>🏆 5 video mạnh nhất</span><span class="r">nổ = view so mức thường của kênh</span></div>
        <div class="tablewrap"><table><thead><tr><th class="l">Tiêu đề</th><th>Lượt xem</th><th>Nổ</th><th>Đăng</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        <div class="card"><div class="section-title"><span>🧪 Công thức tiêu đề kênh hay dùng</span></div>
        <div class="tablewrap"><table><tbody>${pats.map((p) => `<tr><td class="l">${esc(p.label)}</td><td>${p.n}/${c.videoList.length} video</td></tr>`).join('')}</tbody></table></div></div></div>${trendNote()}`;
  }
  // ---------- Khám phá THẬT: Tìm Niche / Quét chủ đề / Quét kênh (dùng khoá API, có tốn hạn mức) ----------
  const ex = {
    niche: { text: store.get('qlk_nx_text', ''), market: '', days: 28, busy: false, res: null, err: '', sugg: [] },
    topic: { q: '', market: '', type: 'long', days: 28, busy: false, res: null, err: '', related: [] },
    chan: { link: '', busy: false, data: null, err: '', niche: '', market: '' },
  };
  const exMarket = (cur) => cur || (D.OWN.find((c) => c.market) || {}).market || 'en';
  const mktSel = (id, cur) => `<select id="${id}">${Object.entries(MARKETS).map(([k, l]) => `<option value="${k}" ${exMarket(cur) === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const daysSel = (id, cur, opts) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${+cur === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const quotaLine = (units) => { const q = api && api.quota; return `<span class="note">Tốn khoảng ${fmt(units)} đơn vị hạn mức${q ? ` · hôm nay đã dùng ${fmt(q.used)}/${fmt(q.limit)}` : ''}</span>`; };
  const exNote = (t) => `<p class="note">${t}</p>`;
  const parseKw = (t) => [...new Set(String(t || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean))].slice(0, 6);

  // ----- Tìm Niche -----
  function pageNicheReal() {
    const n = ex.niche, kws = parseKw(n.text);
    const seeds = [...new Set([...D.OWN.map((c) => c.niche), ...allRivals().map((c) => c.niche)].filter((x) => x && x !== NO_NICHE))].slice(0, 8);
    const V = { good: ['ok', 'Nên vào'], mid: ['warn', 'Cân nhắc'], low: ['bad', 'Đông / kém hấp dẫn'] };
    const form = `<div class="card qcard"><b>🧭 Chấm điểm cơ hội của ngách / từ khoá</b>
      <div class="note" style="margin:4px 0 8px">Mỗi dòng một từ khoá (tối đa 6), viết đúng ngôn ngữ của thị trường. App tìm các video nhiều view nhất trong khoảng thời gian rồi xem “kênh nhỏ mà view lớn” có nhiều không.</div>
      <textarea id="nx-text" rows="4" style="width:100%" placeholder="Ví dụ:&#10;tribu hadzabe&#10;supervivencia primitiva">${esc(n.text)}</textarea>
      <div class="filters" style="margin-top:10px">${mktSel('nx-market', n.market)}${daysSel('nx-days', n.days, [[7, '7 ngày'], [28, '28 ngày'], [90, '90 ngày']])}
        <button class="btn primary" data-act="nxRun" ${n.busy ? 'disabled' : ''}>${n.busy ? 'Đang chấm điểm…' : '🧭 Chấm điểm'}</button>${quotaLine(Math.max(1, kws.length) * 204)}</div>
      ${seeds.length ? `<div class="chips" style="margin-top:10px"><span class="note" style="align-self:center">Ngách của anh:</span>${seeds.map((s) => `<button class="chip" data-act="nxAdd" data-v="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div>` : ''}
      <div class="chips" style="margin-top:8px"><button class="btn sm" data-act="nxSugg" ${kws.length ? '' : 'disabled'}>💡 Gợi ý từ dòng đầu</button><button class="btn sm" data-act="nxExpand" ${kws.length ? '' : 'disabled'} title="Ghép từ khoá với a–z và các từ hỏi (cách, tại sao...) rồi gom gợi ý của YouTube — miễn phí">🌱 Gợi ý thêm nhiều ý tưởng (miễn phí)</button>${n.sugg.map((s) => `<button class="chip" data-act="nxAdd" data-v="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div></div>`;
    if (n.err) return form + `<div class="card placeholder"><h2>Không chấm điểm được</h2><div>${esc(n.err)}</div></div>`;
    if (!n.res) return form + '<div class="card placeholder"><div class="ph-ico">🧭</div><h2>Chưa có kết quả</h2><div>Nhập từ khoá rồi bấm “Chấm điểm”. Mỗi từ khoá tốn ~204 đơn vị hạn mức; kết quả được nhớ 24 giờ.</div></div>';
    const rows = n.res.items.map((it, i) => it.n ? `<tr><td class="note">${i + 1}</td><td class="l"><b>${esc(it.keyword)}</b>${it.cached ? ' <span class="tag">đã nhớ</span>' : ''}</td>
      <td class="bar"><i style="width:${it.score}%"></i><b>${it.score}</b></td><td class="l"><span class="hb ${V[it.verdict][0]}"><i></i>${V[it.verdict][1]}</span></td>
      <td>${it.smallChannels} kênh / ${it.smallVideos} video</td><td>${it.n} / ${it.channels}</td><td>${fmt(it.median)}</td><td>${it.bigShare}%</td><td>${it.avgAgeDays} ngày</td>
      <td class="l">${it.examples.map((e) => `<a href="${esc(e.url)}" target="_blank" rel="noopener" class="note" style="display:flex;align-items:center;gap:6px;text-decoration:underline;margin-bottom:4px" title="${esc(e.title)} — ${esc(e.channel)} (${fmt(e.subs)} sub)">${e.thumb ? `<img src="${esc(e.thumb)}" alt="" loading="lazy" style="width:48px;height:27px;object-fit:cover;border-radius:4px;flex-shrink:0">` : ''}<span>${fmt(e.views)} view / ${fmt(e.subs)} sub</span></a>`).join('') || '<span class="note">—</span>'}</td>
      <td><button class="btn sm" data-act="nxTopic" data-v="${esc(it.keyword)}">Quét chủ đề →</button> <button class="btn sm" data-act="kwPulse" data-v="${esc(it.keyword)}|${esc(n.res.market)}|long" title="Đo video/ngày và view/ngày của 7, 14, 28 ngày qua so với kỳ liền trước · ~201 đơn vị hạn mức">📈</button></td></tr>`
      : `<tr><td class="note">${i + 1}</td><td class="l"><b>${esc(it.keyword)}</b></td><td colspan="9" class="l note">${esc(it.note || 'Không có dữ liệu.')}</td></tr>`).join('');
    return form + `${(n.res.corrections || []).length ? `<div class="card insight">✏️ Đã tự sửa chính tả: ${n.res.corrections.map((c) => `“${esc(c.from)}” → “${esc(c.to)}”`).join(', ')}</div>` : ''}${n.res.warning ? `<div class="card insight">⚠ ${esc(n.res.warning)} Chưa chấm: ${esc((n.res.skipped || []).join(', '))}.</div>` : ''}<div class="card insight">💡 Điểm cơ hội (0–100) =<b>50%</b> tỉ lệ video “kênh nhỏ mà view lớn” (kênh dưới 20K sub, view ≥ 10× sub) + <b>30%</b> mức ít bị kênh lớn (trên 200K sub) chiếm chỗ + <b>20%</b> mức view trung vị. Chỉ tính video 4 phút trở lên đúng ngôn ngữ ${esc(MARKETS[n.res.market])}, ${n.res.days} ngày qua. Đây là ước lượng từ tối đa ~100 video hàng đầu, không phải sự thật tuyệt đối.</div>
      <div class="card"><div class="section-title"><span>🧭 Xếp hạng (${n.res.items.length} từ khoá)</span><span class="r">cao = dễ vào hơn · vừa dùng ${fmt(n.res.units)} đơn vị</span></div>
      <div class="tablewrap"><table><thead><tr><th></th><th class="l">Từ khoá</th><th class="l">Điểm cơ hội</th><th class="l">Nhận xét</th><th>Kênh nhỏ nổ</th><th>Video / kênh</th><th>View trung vị</th><th>Kênh lớn chiếm</th><th>Tuổi TB</th><th class="l">Ví dụ kênh nhỏ nổ</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  async function runNiche() {
    const n = ex.niche;
    if (n.busy) return;
    n.text = ($('#nx-text') || {}).value || n.text; store.set('qlk_nx_text', n.text);
    n.market = ($('#nx-market') || {}).value || exMarket(n.market); n.days = +(($('#nx-days') || {}).value) || 28;
    const kws = parseKw(n.text);
    if (!kws.length) { toast('Hãy nhập ít nhất một từ khoá.'); return; }
    n.busy = true; n.err = ''; render();
    try { n.res = await apiCall('/api/niche/scan', { keywords: kws, market: n.market, days: n.days }); loadStatus(false); }
    catch (e) { n.err = e.message; }
    n.busy = false; render();
  }

  // ----- Quét chủ đề -----
  function pageTopicReal() {
    const t = ex.topic, r = t.res;
    const form = `<div class="card qcard"><b>🔎 Quét một chủ đề trên YouTube</b>
      <div class="note" style="margin:4px 0 8px">Nhập từ khoá (đúng ngôn ngữ thị trường). App liệt kê video nhiều view nhất, video “nổ” so với mức thường của kênh, từ khoá đang lên.</div>
      <div class="qbox"><input id="tx-q" type="text" value="${esc(t.q)}" placeholder="Ví dụ: tribu hadzabe"><button class="btn primary" data-act="txRun" ${t.busy ? 'disabled' : ''}>${t.busy ? 'Đang quét…' : '🔎 Quét'}</button></div>
      <div class="filters" style="margin-top:10px">${mktSel('tx-market', t.market)}${daysSel('tx-type', t.type === 'short' ? 1 : 0, [[0, 'Video dài (từ 3 phút)'], [1, 'Short']])}${daysSel('tx-days', t.days, [[7, '7 ngày'], [28, '28 ngày'], [90, '90 ngày']])}${quotaLine(t.type === 'short' ? 270 : 470)}</div>
      ${t.related.length ? `<div class="chips" style="margin-top:10px"><span class="note" style="align-self:center">Từ khoá liên quan (gợi ý của YouTube):</span>${t.related.map((s) => `<button class="chip" data-act="txKw" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}</div>`;
    if (t.err) return form + `<div class="card placeholder"><h2>Không quét được</h2><div>${esc(t.err)}</div></div>`;
    if (!r) return form + '<div class="card placeholder"><div class="ph-ico">🔎</div><h2>Quét một chủ đề</h2><div>Nhập từ khoá rồi bấm “Quét”. Mỗi lần tốn ~470 đơn vị hạn mức (Short ~270); kết quả được nhớ 6 giờ.</div></div>';
    const top = r.top || [], outl = r.outliers || [];
    const st = (k, v, sub) => `<div class="card stat"><div class="k">${k}</div><div class="v">${v}</div>${sub ? `<div class="note">${sub}</div>` : ''}</div>`;
    const rows = top.map((v) => `<tr><td class="l vt" title="${esc(v.title)}"><a href="${esc(v.url)}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(v.title)}</a>${v.vi ? `<div class="note" style="white-space:normal">${esc(v.vi)}</div>` : ''}</td>
      <td>${v.thumb ? `<a href="${esc(v.url)}" target="_blank" rel="noopener"><img class="trthumb" src="${esc(v.thumb)}" alt="" loading="lazy"></a>` : ''}</td>
      <td class="l note">${esc(v.channelTitle)}${v.subs != null ? ' · ' + fmt(v.subs) + ' sub' : ''}</td><td class="big">${fmt(v.views)}</td>
      <td>${v.outlier ? xBadge(v.outlier.score) : '<span class="note">—</span>'}</td><td>${fmt(Math.round(v.vph))}/giờ</td><td class="note">${ageTxt((Date.now() - new Date(v.publishedAt)) / 86400000)}</td></tr>`).join('');
    const kwRows = (r.keywords || []).map((k) => `<tr><td class="l"><button class="kw" data-act="txKw" data-v="${esc(k.kw)}">${esc(k.kw)}</button></td><td>${k.n}</td><td>${k.ch}</td><td>${fmt(k.avg)}</td><td>${k.growth == null ? '<span class="hb ok"><i></i>Mới xuất hiện</span>' : `▲ ${Math.round(k.growth)}%`}</td><td><button class="btn sm" data-act="kwPulse" data-v="${esc(k.kw)}|${esc(t.market)}|${t.type}" title="Đo video/ngày và view/ngày của 7, 14, 28 ngày qua so với kỳ liền trước · ~${t.type === 'short' ? 101 : 201} đơn vị hạn mức">📈 Đo tiềm năng</button></td></tr>`).join('');
    window.__topicTitles = top.map((v) => v.title);
    return form + `<div class="stats">${st('Video tìm thấy', fmt(r.poolSize), `so ${fmt(r.priorSize)} video kỳ trước`)}${st('Video nổ (≥×5)', fmt(outl.length), 'so mức thường của kênh')}${st('View cao nhất', top[0] ? fmt(top[0].views) : '—')}${st('Đã loại khác ngôn ngữ', fmt(r.langDropped || 0))}</div>
      ${(r.corrections || []).length ? `<div class="card insight">✏️ Đã tự sửa chính tả: ${r.corrections.map((c) => `“${esc(c.from)}” → “${esc(c.to)}”`).join(', ')}</div>` : ''}${(r.notes || []).map((x) => `<div class="card insight">ℹ️ ${esc(x)}</div>`).join('')}${r.aiError ? `<div class="card insight">⚠ AI (dịch/phân loại) lỗi: ${esc(r.aiError)}</div>` : ''}
      <div class="card"><div class="section-title"><span>Kết quả cho “${esc(r.params.keyword)}” (${top.length})</span><span class="r"><button class="btn sm" data-act="copyTopic">Copy tiêu đề</button></span></div>
        ${top.length ? `<div class="tablewrap"><table><thead><tr><th class="l">Tiêu đề</th><th></th><th class="l">Kênh</th><th>Lượt xem</th><th>So mức thường</th><th>Tốc độ</th><th>Đăng</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="placeholder">Không có video phù hợp.</div>'}</div>
      ${kwRows ? `<div class="card" style="margin-top:14px"><div class="section-title"><span>🔥 Cụm từ khoá đang lên</span><span class="r">bấm từ khoá để quét tiếp · bấm “Đo tiềm năng” để xem 7/14/28 ngày</span></div><div class="tablewrap"><table><thead><tr><th class="l">Từ khoá</th><th>Video</th><th>Kênh</th><th>View TB</th><th>So kỳ trước</th><th></th></tr></thead><tbody>${kwRows}</tbody></table></div></div>` : ''}
      ${exNote(`Quét lúc ${fmtVN(r.at)}${r.fromCache ? ' (kết quả đã nhớ, chưa tốn hạn mức)' : ` · tốn ${fmt(r.quotaUsedByScan || 0)} đơn vị`}. “So mức thường” = view video ÷ trung vị view của chính kênh đó.`)}`;
  }
  async function runTopic(qOverride) {
    const t = ex.topic;
    if (t.busy) return;
    t.q = (qOverride != null ? qOverride : ($('#tx-q') || {}).value || t.q).trim();
    t.market = ($('#tx-market') || {}).value || exMarket(t.market);
    t.type = +(($('#tx-type') || {}).value) === 1 ? 'short' : 'long'; t.days = +(($('#tx-days') || {}).value) || 28;
    if (!t.q) { toast('Hãy nhập từ khoá.'); return; }
    t.busy = true; t.err = ''; render();
    apiCall(`/api/suggest?q=${encodeURIComponent(t.q)}&market=${encodeURIComponent(t.market)}`).then((j) => { t.related = (j.suggestions || []).filter((s) => s.toLowerCase() !== t.q.toLowerCase()).slice(0, 8); if (!t.busy) render(); }).catch(() => {});
    try { t.res = await apiCall('/api/scan', { keyword: t.q, market: t.market, type: t.type, days: t.days }); loadStatus(false); }
    catch (e) { t.err = e.message; }
    t.busy = false; render();
  }

  // ----- Quét kênh -----
  function analyzeChan(d) {
    const vids = d.videos, now = Date.now(), DAYMS = 86400000;
    const sorted = vids.map((v) => v.views).sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] || 1, avg = sorted.length ? sorted.reduce((t, x) => t + x, 0) / sorted.length : 0;
    const w8 = vids.filter((v) => now - new Date(v.publishedAt) <= 56 * DAYMS).length;
    const old = vids.filter((v) => now - new Date(v.publishedAt) > 10 * DAYMS);
    const group = (keyFn) => { const g = {}; old.forEach((v) => { const k = keyFn(new Date(new Date(v.publishedAt).getTime() + 7 * 3600e3)); (g[k] = g[k] || []).push(v.views / med); }); return Object.entries(g).filter(([, a]) => a.length >= 2).map(([k, a]) => ({ k: +k, n: a.length, x: a.reduce((t, y) => t + y, 0) / a.length })).sort((a, b) => b.x - a.x); };
    const hours = group((dt) => dt.getUTCHours()), days = group((dt) => dt.getUTCDay());
    const pat = {};
    vids.forEach((v) => T.patternsOf(v.title).forEach((p) => { pat[p] = (pat[p] || 0) + 1; }));
    const byViews = vids.slice().sort((a, b) => b.views - a.views);
    return { med, avg, perWeek: w8 / 8, shorts: vids.filter((v) => v.seconds < 180).length, hours, days, pat, top: byViews.slice(0, 5), top20: byViews.slice(0, 20) };
  }
  function pageScanReal() {
    const c = ex.chan, d = c.data;
    const form = `<div class="card qcard"><b>📡 Quét một kênh bất kỳ</b>
      <div class="qbox" style="margin-top:8px"><input id="cs-link" type="text" value="${esc(c.link)}" placeholder="Dán link kênh, ví dụ https://www.youtube.com/@ten-kenh"><button class="btn primary" data-act="csRun" ${c.busy ? 'disabled' : ''}>${c.busy ? 'Đang quét…' : '📡 Quét kênh'}</button></div>
      <div class="note" style="margin-top:8px">Phân tích 100 video mới nhất của kênh, không cần thêm vào danh sách đối thủ. Tốn khoảng 6 đơn vị hạn mức.</div></div>`;
    if (c.err) return form + `<div class="card placeholder"><h2>Không quét được</h2><div>${esc(c.err)}</div></div>`;
    if (!d) return form + '<div class="card placeholder"><div class="ph-ico">📡</div><h2>Quét một kênh</h2><div>Dán link kênh để xem nhịp đăng, video mạnh nhất, công thức tiêu đề họ hay dùng và giờ đăng hiệu quả.</div></div>';
    const a = analyzeChan(d), ch = d.channel;
    const top = a.top.map((v) => `<tr><td class="l vt" title="${esc(v.title)}"><a href="${esc(v.url)}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(v.title)}</a></td><td>${v.thumb ? `<a href="${esc(v.url)}" target="_blank" rel="noopener"><img class="trthumb" src="${esc(v.thumb)}" alt="" loading="lazy"></a>` : ''}</td><td class="big">${fmt(v.views)}</td><td>${xBadge(v.views / a.med)}</td><td class="note">${new Date(v.publishedAt).toLocaleDateString('vi-VN')}</td></tr>`).join('');
    // Khuôn tiêu đề + bóc tách từng tiêu đề bằng AI (học từ tool YT DNA; không dùng công thức regex tiếng Anh nữa)
    const dna = d.dna;
    const dnaList = (x) => (Array.isArray(x) ? x.map((s) => `<span class="tag">${esc(s)}</span>`).join(' ') : esc(x || '—'));
    const dnaCard = dna ? `<div class="card"><div class="section-title"><span>🧬 Khuôn tiêu đề của kênh (Title DNA)</span><span class="r">AI rút từ 20 tiêu đề nhiều view nhất</span></div><div class="vbody dna">
        <div class="dr"><b>Từ huyệt chủ đạo</b><span>${dnaList(dna.tu_huyet_chu_dao)}</span></div>
        <div class="dr"><b>Độ dài trung bình</b><span>${fmt(dna.do_dai_trung_binh || 0)} ký tự</span></div>
        <div class="dr"><b>Vị trí từ khoá</b><span>${esc(dna.vi_tri_tu_khoa || '—')}</span></div>
        <div class="dr"><b>Ký tự đặc biệt hay dùng</b><span>${dnaList(dna.ky_tu_dac_biet_hay_dung)}</span></div>
        <div class="dr"><b>Kiểu viết hoa</b><span>${esc(dna.kieu_in_hoa || '—')}</span></div>
        <div class="dr"><b>Giọng điệu</b><span>${esc(dna.giong_dieu || '—')}</span></div>
        <div class="dr"><b>Khung xương tiêu đề</b><span>${(dna.khung_xuong_tieu_de || []).map((k) => `<div class="khung">${esc(k)}</div>`).join('') || '—'}</span></div>
        <div class="dr"><b>Vì sao hút view</b><span>${esc(dna.ghi_chu || '—')}</span></div></div></div>`
      : `<div class="card"><div class="section-title"><span>🧬 Khuôn tiêu đề của kênh (Title DNA)</span></div><div class="vnote">${d.dnaError || d.aiError ? 'Chưa rút được khuôn: ' + esc(d.dnaError || d.aiError) : 'AI chưa sẵn sàng (Cài đặt → API 9Router).'}</div></div>`;
    const aiRows = a.top20.map((v) => { const x = (d.ai || {})[v.id] || {}; return `<tr><td class="l vt" title="${esc(v.title)}"><a href="${esc(v.url)}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(v.title)}</a>${x.vi ? `<div class="note" style="white-space:normal">${esc(x.vi)}</div>` : ''}</td><td class="l">${(x.phrases || []).map((p) => `<span class="tag">${esc(p)}</span>`).join(' ') || '<span class="note">—</span>'}</td><td class="l">${x.t ? `<span class="tag amber">${esc(x.t)}</span>` : '<span class="note">—</span>'}</td><td class="l">${x.c ? esc(x.c) : '<span class="note">—</span>'}</td><td class="big">${fmt(v.views)}</td></tr>`; }).join('');
    const phrCount = {};
    Object.values(d.ai || {}).forEach((x) => (x.phrases || []).forEach((p) => { phrCount[p] = (phrCount[p] || 0) + 1; }));
    const topPhr = Object.entries(phrCount).filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1]).slice(0, 12);
    const chanType = a.shorts > d.videos.length / 2 ? 'short' : 'long';
    const pulseBtn = (kw) => `<button class="btn sm" data-act="kwPulse" data-v="${esc(kw)}|${esc(d.market || 'en')}|${chanType}" title="Đo video/ngày và view/ngày của 7, 14, 28 ngày qua so với kỳ liền trước · ~${chanType === 'short' ? 101 : 201} đơn vị hạn mức">📈</button>`;
    const st = (k, v, sub) => `<div class="card stat"><div class="k">${k}</div><div class="v">${v}</div>${sub ? `<div class="note">${sub}</div>` : ''}</div>`;
    const bestH = a.hours[0], bestD = a.days[0];
    const already = allRivals().some((r) => r.id === ch.id);
    return form + `<div class="card profile"><div><h2>${esc(ch.title)} ${already ? '<span class="tag green">Đang theo dõi</span>' : '<span class="tag amber">Chưa theo dõi</span>'}</h2><div class="sub note">${esc(ch.handle || ch.id)}${ch.country ? ' · ' + esc(ch.country) : ''} · quét ${fmtVN(d.at)} · <a href="https://www.youtube.com/channel/${esc(ch.id)}" target="_blank" rel="noopener" style="text-decoration:underline">Mở kênh ↗</a></div></div>
        ${already ? '' : `<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="cs-niche" list="cniches" type="text" placeholder="Ngách" value="${esc(c.niche)}" style="width:150px">${mktSel('cs-market', c.market)}<button class="btn primary" data-act="csAdd">+ Nạp làm đối thủ</button></div>`}</div>
      <div class="stats">${st('Subscriber', ch.subs == null ? 'Ẩn' : fmt(ch.subs))}${st('Tổng lượt xem', fmt(ch.views))}${st('Số video', fmt(ch.videos), `${d.videos.length} video mới nhất được phân tích`)}${st('View trung vị / video', fmt(Math.round(a.med)), `trung bình ${fmt(Math.round(a.avg))}`)}${st('Nhịp đăng', `${a.perWeek.toFixed(1)} video/tuần`, `8 tuần gần nhất · ${a.shorts} Short trong mẫu`)}${st('Giờ đăng hiệu quả (giờ VN)', bestH ? `${String(bestH.k).padStart(2, '0')}:00` : '—', bestD ? `${DOW[bestD.k]} tốt nhất` : 'chưa đủ dữ liệu')}</div>
      <div class="two2"><div class="card"><div class="section-title"><span>🏆 5 video mạnh nhất</span><span class="r">so mức thường của kênh</span></div><div class="tablewrap"><table><thead><tr><th class="l">Tiêu đề</th><th></th><th>Lượt xem</th><th>Nổ</th><th>Đăng</th></tr></thead><tbody>${top}</tbody></table></div></div>
        ${dnaCard}</div>
      ${aiRows ? `<div class="card" style="margin-top:14px"><div class="section-title"><span>🔬 Bóc tách 20 tiêu đề nhiều view nhất</span><span class="r">từ khoá · yếu tố tâm lý · bối cảnh (AI, dịch tiếng Việt)</span></div>${topPhr.length ? `<div class="chips" style="padding:10px 16px;border-bottom:1px solid var(--line);align-items:center"><span class="note" style="align-self:center">Cụm từ khoá lặp lại — bấm 📈 để đo tiềm năng:</span>${topPhr.map(([p, n]) => `<span class="tag" style="display:inline-flex;align-items:center;gap:5px">${esc(p)} ×${n} ${pulseBtn(p)}</span>`).join(' ')}</div>` : ''}<div class="tablewrap"><table><thead><tr><th class="l">Tiêu đề</th><th class="l">Từ khoá</th><th class="l">Tâm lý</th><th class="l">Bối cảnh</th><th>Lượt xem</th></tr></thead><tbody>${aiRows}</tbody></table></div></div>` : ''}
      ${exNote('Giờ và ngày đăng hiệu quả chỉ tính từ các video đăng trên 10 ngày, mỗi khung cần ít nhất 2 video; đây là gợi ý, không phải quy luật.')}`;
  }
  async function runChanScan() {
    const c = ex.chan;
    if (c.busy) return;
    c.link = (($('#cs-link') || {}).value || c.link).trim();
    if (!c.link) { toast('Hãy dán link kênh.'); return; }
    c.busy = true; c.err = ''; render();
    try { c.data = await apiCall('/api/channel-scan', { link: c.link }); loadStatus(false); }
    catch (e) { c.err = e.message; c.data = null; }
    c.busy = false; render();
  }

  const TREND_PAGES = { trends: pageTrendsSwitch, niche: () => (apiOk() ? pageNicheReal() : pageNiche()), topic: () => (apiOk() ? pageTopicReal() : pageTopic()), scan: () => (apiOk() ? pageScanReal() : pageScan()) };

  function channelTable(list, r, withDel) {
    const sorters = {
      gainSubs: (a, b) => gain(b.subs, r) - gain(a.subs, r),
      gainViews: (a, b) => gain(b.views, r) - gain(a.views, r),
      subs: (a, b) => last(b.subs) - last(a.subs),
    };
    const rows = list.slice().sort(sorters[state.sort]).map((c) => `
      <tr class="click" data-go="#/channel/${c.id}">
        <td class="l"><div class="chan">${avatar(c)}<div><div class="n">${esc(c.name)}${realRivals ? ` <a href="https://www.youtube.com/channel/${encodeURIComponent(c.id)}" target="_blank" rel="noopener" title="Mở kênh trên YouTube" class="note">↗</a>` : ''}</div>${c.kind === 'own' ? '<span class="tag mine">Của mình</span>' : ''}</div></div></td>
        <td class="l">${nicheTag(c.niche)}${isNichePaused(c.niche) ? ' <span class="tag" style="opacity:.7" title="Ngách này đang tạm dừng theo dõi">⏸</span>' : ''}</td>
        <td>${newCell(gain(c.subs, r), last(c.subs))}</td>
        <td>${newCell(gain(c.views, r), last(c.views))}</td>
        <td>${fmt(c.videos)}</td>
        <td>${spark(c.views.slice(-(r + 1)), '#22c1a5')}</td>
        ${withDel ? `<td><button class="x" data-act="delRival" data-v="${c.id}" title="Xoá khỏi danh sách">✕</button></td>` : ''}
      </tr>`).join('');
    return `<div class="tablewrap"><table class="stk"><thead><tr><th class="l">Kênh</th><th class="l">Chủ đề</th><th>Subscriber</th><th>Lượt xem</th><th>Video</th><th>Xu hướng ${r}d</th>${withDel ? '<th></th>' : ''}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // Tab "Kênh của mình" (ảnh 7): lọc theo ngách, chọn nhiều kênh, cột xu hướng và giờ cập nhật.
  function mineCard(list, r, sortSel) {
    const f = list.some((c) => c.niche === state.mineFilter) ? state.mineFilter : 'all';
    const niches = [...new Set(list.map((c) => c.niche))];
    const chipsHtml = `<button class="chip ${f === 'all' ? 'on' : ''}" data-act="mineFilter" data-v="all">Tất cả ${list.length}</button>` +
      niches.map((n) => `<button class="chip ${f === n ? 'on' : ''}" data-act="mineFilter" data-v="${esc(n)}">${esc(n)} ${list.filter((c) => c.niche === n).length}</button>`).join('');
    const sorted = list.filter((c) => f === 'all' || c.niche === f).sort((a, b) => gain(b.subs, r) - gain(a.subs, r));
    const stamp = `08:30 ${new Date().toLocaleDateString('vi-VN')}`;
    const rows = sorted.map((c) => `
      <tr class="click" data-go="#/channel/${c.id}">
        <td class="l"><input type="checkbox" title="Chọn"></td>
        <td class="l"><div class="chan">${avatar(c)}<div><div class="n">${esc(c.name)}${realOwn ? ` <a href="https://www.youtube.com/channel/${encodeURIComponent(c.id)}" target="_blank" rel="noopener" title="Mở kênh trên YouTube" class="note">↗</a>` : ''}</div><span class="tag mine">Của mình</span></div></div></td>
        <td class="l">${nicheTag(c.niche)}</td>
        <td>${newCell(gain(c.subs, r), last(c.subs))}</td>
        <td>${newCell(gain(c.views, r), last(c.views))}</td>
        <td>${fmt(c.videos)}</td>
        <td>${spark(c.views.slice(-(r + 1)), '#22c1a5')}</td>
        <td><span class="tag green">${stamp}</span></td></tr>`).join('');
    return `<div class="card"><div class="chips" style="padding:12px 16px;border-bottom:1px solid var(--line)">${chipsHtml}</div>
      <div class="tablewrap"><table><thead><tr><th class="l"></th><th class="l">Kênh</th><th class="l">Chủ đề</th><th>Subscribers</th><th>Lượt xem</th><th>Video</th><th>Xu hướng ${r}d</th><th>Cập nhật</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function topList(title, list, r, key) {
    const items = list.slice().sort((a, b) => gain(b[key], r) - gain(a[key], r)).slice(0, 5).map((c, i) => `
      <li data-go="#/channel/${c.id}" style="cursor:pointer"><span class="rank">${i + 1}</span><span class="nm">${esc(c.name)}</span><span class="pc ${pct(c[key], r) < 0 ? 'neg' : ''}">${fmtPct(pct(c[key], r))}</span><span class="ab">${signed(gain(c[key], r))}</span></li>`).join('');
    return `<div class="card top"><h3>${title}</h3><ul>${items}</ul></div>`;
  }

  function pageTracker() {
    const r = state.range;
    const rivals = allRivals();
    const tabsHtml = TABS.map(([k, label]) => `<button class="tab ${state.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${label}${k === 'rivals' ? ` (${rivals.length})` : k === 'mine' ? ` (${D.OWN.length})` : ''}</button>`).join('');
    const top = head(ICON.chart, 'YouTube Channel Tracker', 'Theo dõi subscriber, lượt xem, video theo thời gian',
      `<button class="btn" data-act="refresh">Cập nhật ngay</button><button class="btn primary" data-act="addRival">+ Nạp đối thủ</button>`) + apiBanner() +
      `<div class="tabs">${tabsHtml}<span class="gap"></span>${TREND_PAGES[state.tab] && apiOk() ? '' : chips('r', r, 'range')}</div>`;

    if (TREND_PAGES[state.tab]) return top + TREND_PAGES[state.tab]();

    let list = state.tab === 'mine' ? D.OWN : rivals;
    if (!list.length) return top + `<div class="card placeholder"><h2>Chưa có đối thủ nào</h2><div>Bấm “+ Nạp đối thủ” để dán link kênh.</div></div>`;

    // Lọc riêng theo ngách cho tab Kênh đối thủ (tab Kênh của mình đã có bộ lọc tương tự bên trong mineCard).
    let rivalNicheChips = '';
    if (state.tab === 'rivals') {
      const rNiches = [...new Set(rivals.map((c) => c.niche))];
      if (!rivals.some((c) => c.niche === state.rivalNiche)) state.rivalNiche = 'all';
      const rf = state.rivalNiche;
      rivalNicheChips = `<div class="chips" style="margin-bottom:12px"><button class="chip ${rf === 'all' ? 'on' : ''}" data-act="rivalNiche" data-v="all">Tất cả ${rivals.length}</button>${rNiches.map((n) => `<button class="chip ${rf === n ? 'on' : ''}" data-act="rivalNiche" data-v="${esc(n)}">${esc(n)}${isNichePaused(n) ? ' ⏸' : ''} · ${rivals.filter((c) => c.niche === n).length}</button>`).join('')}</div>`;
      if (rf !== 'all') list = list.filter((c) => c.niche === rf);
    }

    const sum = (k) => list.reduce((t, c) => t + last(c[k]), 0);
    const sumG = (k) => list.reduce((t, c) => t + gain(c[k], r), 0);
    const totalVideos = list.reduce((t, c) => t + c.videos, 0);
    const stats = `<div class="stats">
      <div class="card stat"><div class="k">${state.tab === 'mine' ? 'Kênh của mình' : 'Kênh đối thủ'}</div><div class="v">${list.length}</div></div>
      <div class="card stat"><div class="k">Tổng subscriber</div><div class="v">${fmt(sum('subs'))}<span class="d">${signed(sumG('subs'))}</span></div></div>
      <div class="card stat"><div class="k">Tổng lượt xem</div><div class="v">${fmt(sum('views'))}<span class="d">${signed(sumG('views'))}</span></div></div>
      <div class="card stat"><div class="k">Tổng video</div><div class="v">${fmt(totalVideos)}</div></div></div>`;
    const tops = `<div class="two">${topList('🚀 Tăng subscriber nhiều nhất', list, r, 'subs')}${topList('🔥 Tăng lượt xem nhiều nhất', list, r, 'views')}</div>` +
      (state.tab === 'rivals' ? rivalHitsCard() + benchmarkCard(r) : '');

    const groups = {};
    list.forEach((c) => { (groups[c.niche] = groups[c.niche] || []).push(c); });
    const isRivalsTab = state.tab === 'rivals';
    const grows = Object.entries(groups).sort((a, b) => b[1].reduce((t, c) => t + last(c.views), 0) - a[1].reduce((t, c) => t + last(c.views), 0)).map(([n, cs]) => `
      <tr><td class="l">${esc(n)}</td><td>${cs.length}</td><td>${fmt(cs.reduce((t, c) => t + last(c.subs), 0))}</td><td class="big">${fmt(cs.reduce((t, c) => t + last(c.views), 0))}</td><td>${fmt(cs.reduce((t, c) => t + c.videos, 0))}</td>${isRivalsTab ? `<td>${isNichePaused(n) ? `<button class="btn sm" data-act="toggleNichePause" data-v="${esc(n)}">▶ Bật lại</button>` : `<button class="btn sm" data-act="toggleNichePause" data-v="${esc(n)}">⏸ Tạm dừng</button>`}</td>` : ''}</tr>`).join('');
    const groupCard = `<div class="card" style="margin-bottom:14px"><div class="section-title"><span>Theo ngách</span><span class="r">${Object.keys(groups).length} ngách</span></div>
      <div class="tablewrap"><table><thead><tr><th class="l">Ngách</th><th>Kênh</th><th>Subscriber</th><th>Lượt xem</th><th>Video</th>${isRivalsTab ? '<th class="l">Theo dõi</th>' : ''}</tr></thead><tbody>${grows}</tbody></table></div></div>`;

    const sortSel = `<select data-act="sort">${[['gainSubs', 'Tăng SUB'], ['gainViews', 'Tăng lượt xem'], ['subs', 'SUB cao nhất']].map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>Sắp xếp: ${l}</option>`).join('')}</select>`;
    const table = state.tab === 'mine'
      ? mineCard(list, r, sortSel)
      : `<div class="card"><div class="section-title"><span>Tất cả kênh (${list.length})</span><span class="r">${sortSel}<button class="btn sm" data-act="csvList">Xuất CSV</button></span></div><div style="padding:14px 16px 0">${rivalNicheChips}</div>${channelTable(list, r, true)}</div>`;
    return top + stats + tops + groupCard + table + '<p class="note">Số liệu mẫu. Đối thủ chỉ lấy được số liệu công khai (sub, lượt xem, video).</p>';
  }

  // ---------- Trang: Giờ đăng, Cài đặt ----------
  // ---------- Trang: Quản lý Giờ đăng ----------
  const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const TIME_POOL = ['01:30', '01:10', '21:30', '19:25', '05:00', '07:00', '19:50', '02:25', '18:15'];
  const pad2 = (n) => String(n).padStart(2, '0');
  const dayNum = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  function defaultSched() {
    const o = {};
    D.OWN.forEach((c, i) => { o[c.id] = { times: [TIME_POOL[i % TIME_POOL.length]], every: 3, offset: D.hash(c.name) % 3, comm: 1, commTime: '' }; });
    return o;
  }
  let sched = store.get('qlk_sched', null) || defaultSched();
  const calState = { y: new Date().getFullYear(), m: new Date().getMonth() };
  state.schedTab = 'station';
  let done = store.get('qlk_done', {});
  const notifyOk = () => typeof Notification !== 'undefined';

  // Giờ vàng của đối thủ trong cùng ngách (mẫu, chưa có dữ liệu thật).
  function rivalTimes(c) {
    const h = D.hash(c.name + 'r');
    return [`${pad2(h % 24)}:${pad2(((h >>> 3) % 4) * 15)}`, `${pad2((h >>> 6) % 24)}:${pad2(((h >>> 9) % 4) * 15)}`].sort();
  }
  // Giờ vàng THẬT (giờ VN): giờ đăng mà video của chính kênh và của đối thủ cùng ngách có view cao hơn mức thường của từng kênh.
  // Chỉ tính video đăng trên 7 ngày; mỗi khung giờ cần ít nhất 2 video; chưa đủ thì trả rỗng.
  function goldenHours(c) {
    const rivals = realRivals ? allRivals().filter((r) => r.niche && r.niche === c.niche) : [];
    const hours = {};
    [c.videoList || [], ...rivals.map((r) => r.videoList || [])].forEach((list) => {
      const usable = list.filter((v) => ageDays(v) > 7 && (!v.privacy || v.privacy === 'public') && (v.seconds == null || v.seconds >= 180));
      if (usable.length < 4) return;
      const vs = usable.map((v) => v.views).sort((a, b) => a - b);
      const med = vs[Math.floor(vs.length / 2)] || 1;
      usable.forEach((v) => {
        const h = (new Date(v.date).getUTCHours() + 7) % 24;
        (hours[h] = hours[h] || []).push(v.views / med);
      });
    });
    return Object.entries(hours).filter(([, a]) => a.length >= 2).map(([h, a]) => ({ h: +h, n: a.length, x: a.reduce((t, y) => t + y, 0) / a.length })).sort((a, b) => b.x - a.x).slice(0, 2).sort((a, b) => a.h - b.h);
  }
  // Video công khai kênh đã đăng trong MỘT ngày cụ thể (giờ máy anh): dùng để tự đánh dấu "đã đăng" theo lịch video, và tô màu lịch tháng theo dữ liệu thật
  function videosOnDay(c, d) {
    const iso = isoDate(d);
    return (c.videoList || []).filter((v) => isoDate(new Date(v.date)) === iso && (!v.privacy || v.privacy === 'public') && (v.seconds == null || v.seconds >= 180)).length;
  }
  const postedToday = (c) => videosOnDay(c, new Date());
  function postsOn(d) {
    const n = dayNum(d), out = [];
    D.OWN.forEach((c) => {
      const s = sched[c.id];
      if (!s || c.noPost) return;
      const hit = s.mode === 'weekday' ? (s.weekdays || []).includes(d.getDay()) : (((n - s.offset) % s.every) + s.every) % s.every === 0;
      if (hit) s.times.forEach((t) => out.push({ c, t }));
    });
    return out.sort((a, b) => a.t.localeCompare(b.t));
  }

  // ---------- Việc phải đăng trong ngày (video theo khung giờ + bài cộng đồng) ----------
  const dayKey = () => isoDate(new Date());
  // Giá trị lưu cho mỗi việc: 1 = đã đăng, 2 = anh xoá cảnh báo thủ công (hôm đó bận, không đăng).
  const doneVal = (k) => (done[dayKey()] && done[dayKey()][k]) || 0;
  const isDone = (k) => doneVal(k) === 1;
  const isSkipped = (k) => doneVal(k) === 2;
  function setTaskVal(k, val) {
    const d = dayKey();
    done[d] = done[d] || {};
    if (done[d][k] === val) delete done[d][k]; else done[d][k] = val;
    if (!Object.keys(done[d]).length) delete done[d];
    Object.keys(done).sort().slice(0, -60).forEach((x) => delete done[x]);
    store.set('qlk_done', done);
  }
  const toggleTask = (k) => setTaskVal(k, 1);
  const skipTask = (k) => setTaskVal(k, 2);
  function todayTasks() {
    const tasks = [];
    const vids = postsOn(new Date());
    D.OWN.forEach((c) => {
      const s = sched[c.id];
      if (!s || c.noPost) return; // kênh đã ngừng đăng bài: không tạo việc, không nhắc, không tính vào "cần xử lý"
      vids.filter((p) => p.c === c).forEach((p, vi) => tasks.push({ c, kind: 'video', t: p.t, key: `${c.id}|video|${p.t}`, vidIdx: vi + 1 }));
      const n = Math.max(1, s.comm == null ? 1 : s.comm); // bắt buộc tối thiểu 1 bài cộng đồng mỗi ngày
      for (let i = 1; i <= n; i++) tasks.push({ c, kind: 'comm', t: s.commTime || '', key: `${c.id}|comm|${i}`, idx: i, of: n });
    });
    return tasks;
  }
  // Bài cộng đồng là việc BẮT BUỘC mỗi ngày: nếu anh không đặt giờ nhắc thì hạn chót là 20:00.
  const COMM_DEADLINE = '20:00';
  function taskState(t, now) {
    if (isDone(t.key)) return { k: 'done', label: 'Đã đăng' };
    if (isSkipped(t.key)) return { k: 'skip', label: 'Đã xoá cảnh báo (bận)' };
    // Kênh thật: video mới đã xuất hiện trên YouTube thì tự tính là đã đăng (số video đăng hôm nay ≥ thứ tự của việc này)
    if (t.kind === 'video' && realOwn && t.vidIdx && postedToday(t.c) >= t.vidIdx) return { k: 'done', label: 'Đã đăng (tự phát hiện)', auto: true };
    const tm = t.t || (t.kind === 'comm' ? COMM_DEADLINE : '');
    if (!tm) return { k: 'todo', label: 'Chưa đăng' };
    const [h, m] = tm.split(':').map(Number);
    const diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
    const hm = (x) => (x >= 60 ? `${Math.floor(x / 60)}g${x % 60 ? pad2(x % 60) : ''}` : `${x} phút`);
    const dl = t.t ? '' : 'Hạn 20:00 · ';
    if (diff > 0) return { k: 'soon', label: `${dl}còn ${hm(diff)}` };
    if (diff > -60) return { k: 'due', label: t.t ? 'Đến giờ!' : 'Đến hạn đăng!' };
    return { k: 'late', label: `Quá ${t.t ? 'giờ' : 'hạn'} ${hm(-diff)}` };
  }
  const pendingCount = () => { const now = new Date(); return todayTasks().filter((t) => ['due', 'late'].includes(taskState(t, now).k)).length; };

  // ---------- Hồ sơ kênh: lưu file trên máy (server), dùng cho AI viết bài ----------
  let profiles = {};
  const PROF_FIELDS = ['audience', 'tone', 'focus', 'avoid', 'samples', 'cta'];
  const TONES = ['', 'Ấm áp, gần gũi', 'Trang nghiêm, sâu sắc', 'Khoa học, rõ ràng', 'Hài hước nhẹ', 'Truyền cảm hứng'];
  const profOf = (c) => Object.assign({ lang: '', audience: '', tone: '', focus: '', avoid: '', samples: '', cta: '' }, profiles[c.id] || {});
  async function loadProfiles() {
    try { profiles = await apiCall('/api/profiles'); } catch (e) { /* bỏ qua */ }
    const ae = document.activeElement;
    if (!(ae && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName))) render();
  }
  function profileCard(c) {
    const p = profOf(c);
    const filled = PROF_FIELDS.filter((f) => (p[f] || '').trim()).length;
    const defLang = window.QLK_SUGG.pool(c.niche).lang;
    const inp = (f, label, ph) => `<label>${label}</label><input type="text" data-prof="${f}" data-pid="${c.id}" value="${esc(p[f] || '')}" placeholder="${esc(ph)}">`;
    const area = (f, label, ph) => `<label>${label}</label><textarea data-prof="${f}" data-pid="${c.id}" placeholder="${esc(ph)}">${esc(p[f] || '')}</textarea>`;
    return `<details class="profcard" ${state.profOpen ? 'open' : ''}><summary>🧬 Hồ sơ kênh — để AI viết đúng giọng kênh <span class="tag ${filled >= 4 ? 'green' : 'amber'}">${filled}/6 mục</span></summary>
      <div class="pf-grid">
        ${inp('lang', 'Ngôn ngữ đăng bài', `Mặc định: ${defLang}`)}
        ${inp('audience', 'Khán giả là ai', 'Ví dụ: người Mỹ 25–45 tuổi thích lịch sử và học tiếng Anh')}
        <label>Giọng điệu</label><select data-prof="tone" data-pid="${c.id}">${TONES.map((t) => `<option value="${esc(t)}" ${p.tone === t ? 'selected' : ''}>${t || '— chọn giọng điệu —'}</option>`).join('')}</select>
        ${inp('focus', 'Series / chủ đề trọng tâm', 'Ví dụ: giải nghĩa từ Hy Lạp/Do Thái trong Kinh Thánh')}
        ${inp('avoid', 'Điều cấm kỵ (không nói)', 'Ví dụ: chính trị, so sánh tôn giáo, hứa chữa bệnh')}
        ${inp('cta', 'Lời kêu gọi ưa thích', 'Ví dụ: “Bình luận từ bạn muốn xem tiếp”')}
        ${area('samples', 'Bài mẫu kênh tâm đắc (1–3 bài, để AI học giọng)', 'Dán vài bài cộng đồng anh thấy hay…')}
      </div>
      <div class="note" style="padding:0 16px 12px">Tự lưu khi bấm ra ngoài · lưu trong file trên máy (app/data/profiles.json), không mất khi đổi trình duyệt.</div></details>`;
  }
  async function saveProfileField(pid, field, value) {
    const c = D.OWN.find((x) => x.id === pid);
    if (!c) return;
    const p = profOf(c);
    p[field] = value;
    try { profiles = await apiCall('/api/profiles', { id: pid, profile: p }); toast('Đã lưu hồ sơ kênh'); }
    catch (e) { toast(e.message); }
  }
  // AI viết bài cộng đồng cho một việc (key = kênh|comm|số thứ tự)
  async function aiWrite(key) {
    const [cid, , idx] = key.split('|');
    const c = D.OWN.find((x) => x.id === cid);
    if (!c) return;
    if (!api || !api.ai || !api.ai.set) { toast('Chưa cài khoá AI — vào Cài đặt → “AI viết bài”.'); return; }
    const p = profOf(c);
    const recent = Object.entries(drafts).filter(([k, d]) => k.includes(`|${cid}|comm|`) && d && d.text).map(([, d]) => d.text.split('\n')[0]).slice(-7);
    state.aiBusy = key; render();
    try {
      const res = await apiCall('/api/ai/community', { name: c.name, niche: c.niche, lang: window.QLK_SUGG.pool(c.niche).lang, imgStyle: window.QLK_SUGG.style(c.niche), profile: p, recent, date: dayKey(), slot: Number(idx) });
      const wantsImg = res.type === 'Câu hỏi' || res.type === 'Hình ảnh';
      res.img = wantsImg ? window.QLK_SUGG.imagePrompt(c.niche, res.scene || `an illustration themed around ${c.niche}`) : '';
      saveDraft(key, { ai: Object.assign(res, { lang: p.lang || window.QLK_SUGG.pool(c.niche).lang }) });
      toast('AI đã viết xong — xem gợi ý bên dưới');
    } catch (e) { toast(e.message); }
    state.aiBusy = null; render();
  }

  // Nháp bài cộng đồng (lưu theo ngày) và lịch sử 7 ngày.
  const COMM_TYPES = ['Văn bản', 'Bình chọn', 'Hình ảnh', 'Video / teaser', 'Câu hỏi'];
  let drafts = store.get('qlk_drafts', {});
  let since = store.get('qlk_since', null);
  if (!since) { since = isoDate(new Date()); store.set('qlk_since', since); }
  const draftOf = (key) => drafts[dayKey() + '|' + key] || { text: '', type: COMM_TYPES[0] };
  function saveDraft(key, patch) {
    const k = dayKey() + '|' + key;
    drafts[k] = Object.assign(draftOf(key), patch);
    Object.keys(drafts).filter((x) => x.slice(0, 10) < isoDate(new Date(Date.now() - 14 * 86400000))).forEach((x) => delete drafts[x]);
    store.set('qlk_drafts', drafts);
  }
  function dayStat(c, d) {
    const dn = done[isoDate(d)] || {};
    const s = sched[c.id] || {};
    const keys = postsOn(d).filter((p) => p.c === c).map((p) => `${c.id}|video|${p.t}`);
    for (let i = 1; i <= Math.max(1, s.comm == null ? 1 : s.comm); i++) keys.push(`${c.id}|comm|${i}`);
    return { need: keys.length, got: keys.filter((k) => dn[k] === 1).length };
  }
  // Lịch sử bài cộng đồng 14 ngày: mỗi ô là một ngày; bấm ô để ghi bù / bỏ ghi.
  const commNeed = (c) => Math.max(1, sched[c.id] && sched[c.id].comm != null ? sched[c.id].comm : 1);
  const commKeys = (c) => Array.from({ length: commNeed(c) }, (_, i) => `${c.id}|comm|${i + 1}`);
  function historyOf(c) {
    const days = [];
    const need = commNeed(c);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(12); d.setDate(d.getDate() - i);
      const iso = isoDate(d);
      const dn = done[iso] || {};
      const got = commKeys(c).filter((k) => dn[k] === 1).length;
      const skipped = commKeys(c).filter((k) => dn[k] === 2).length;
      let k = 'na';
      if (!need) k = 'none';
      else if (got >= need) k = 'ok';
      else if (got > 0) k = 'part';
      else if (skipped > 0) k = 'skip';
      else if (i === 0) k = 'now';
      else if (iso >= since) k = 'miss';
      days.push({ k, iso, got, need, dow: DOW[d.getDay()], dd: d.getDate(), mm: d.getMonth() + 1 });
    }
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].k === 'ok') streak++;
      else if (i === days.length - 1 && (days[i].k === 'now' || days[i].k === 'part')) continue;
      else break;
    }
    return { days, streak, okDays: days.filter((x) => x.k === 'ok').length };
  }
  // Lịch sử ĐĂNG VIDEO 14 ngày: chỉ để xem ngày nào kênh THẬT SỰ có video mới (không so với lịch, không đỏ/vàng) —
  // KHÔNG cho bấm sửa tay, để anh quản lý kênh giao nhân sự biết đúng ngày nào có bài thật.
  function videoHistoryOf(c) {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(12); d.setDate(d.getDate() - i);
      const got = videosOnDay(c, d);
      days.push({ k: got > 0 ? 'ok' : 'none', iso: isoDate(d), got, dow: DOW[d.getDay()], dd: d.getDate(), mm: d.getMonth() + 1 });
    }
    return { days, okDays: days.filter((x) => x.k === 'ok').length };
  }
  function toggleCommDay(cid, iso) {
    const c = D.OWN.find((x) => x.id === cid);
    if (!c) return;
    const dn = done[iso] || (done[iso] = {});
    const keys = commKeys(c);
    // Bấm ô lịch sử để xoay vòng: chưa ghi/bỏ lỡ → đã đăng → xoá cảnh báo (bận) → về trống.
    const allDone = keys.every((k) => dn[k] === 1), allSkip = keys.every((k) => dn[k] === 2);
    keys.forEach((k) => { if (allSkip) delete dn[k]; else dn[k] = allDone ? 2 : 1; });
    if (!Object.keys(dn).length) delete done[iso];
    store.set('qlk_done', done);
  }

  function schedStation() {
    const now = new Date();
    const tasks = todayTasks().map((t) => ({ t, s: taskState(t, now) }));
    const total = tasks.length;
    const cnt = (k) => tasks.filter((x) => x.s.k === k).length;
    const doneN = cnt('done');
    const perm = notifyOk() ? Notification.permission : 'unsupported';
    const notifBtn = perm === 'granted' ? '<span class="tag green">🔔 Đã bật nhắc giờ trên trình duyệt</span>'
      : perm === 'denied' ? '<span class="tag amber">Trình duyệt đang chặn thông báo</span>'
      : perm === 'default' ? '<button class="btn sm" data-act="notifOn">🔔 Bật nhắc giờ trên trình duyệt</button>' : '';
    const btn = (x, label) => {
      const main = `<button class="tbtn ${x.s.k}" data-act="task" data-v="${esc(x.t.key)}" title="Bấm để đánh dấu / bỏ đánh dấu đã đăng">${x.s.k === 'done' ? '✓ ' : x.s.k === 'skip' ? '' : ''}${x.s.k === 'skip' ? 'Đánh dấu đã đăng' : label}</button>`;
      // Nút xoá cảnh báo bằng tay: dùng khi hôm đó bận không đăng được. Bấm lần nữa để khôi phục.
      const clr = x.s.k === 'done' ? '' : x.s.k === 'skip'
        ? `<button class="tbtn clr" data-act="skipTask" data-v="${esc(x.t.key)}" title="Khôi phục cảnh báo">↩ Khôi phục</button>`
        : `<button class="tbtn clr" data-act="skipTask" data-v="${esc(x.t.key)}" title="Hôm nay bận không đăng được: xoá cảnh báo đỏ">✕ Xoá cảnh báo</button>`;
      return main + clr;
    };
    const chans = D.OWN.filter((c) => sched[c.id] && !c.noPost);
    if (!chans.some((c) => c.id === state.stationSel)) state.stationSel = null;
    const detailOf = (c) => {
      const mine = tasks.filter((x) => x.t.c === c);
      const dn = mine.filter((x) => x.s.k === 'done').length;
      const vids = mine.filter((x) => x.t.kind === 'video');
      const comms = mine.filter((x) => x.t.kind === 'comm');
      const vrows = vids.length ? vids.map((x) => `<div class="trow"><span class="tk">🎬 Video</span><span class="tchip">${x.t.t}</span><span class="st ${x.s.k}">${x.s.label}</span>${btn(x, x.s.k === 'done' ? 'Đã đăng' : 'Đánh dấu đã đăng')}</div>`).join('')
        : '<div class="trow"><span class="tk">🎬 Video</span><span class="note">Hôm nay chưa đến lịch đăng video</span></div>';
      const held = realOwn ? (c.videoList || []).filter((v) => v.privacy === 'private' && v.publishAt && new Date(v.publishAt) > now).map((v) => `<div class="trow"><span class="tk">⏰ Đã hẹn giờ</span><span class="tchip">${fmtVN(v.publishAt)}</span><span class="note" title="${esc(v.title)}">${esc(v.title)}</span></div>`).join('') : '';
      const commCards = comms.length ? comms.map((x) => {
        const dr = draftOf(x.t.key);
        const sg = dr.ai || window.QLK_SUGG.pick(c.niche, c.id, dayNum(new Date()), x.t.idx - 1, dr.sv || 0);
        const busy = state.aiBusy === x.t.key;
        const aiBtn = `<button class="btn sm ai" data-act="aiWrite" data-v="${esc(x.t.key)}" ${busy ? 'disabled' : ''} title="${api && api.ai && api.ai.set ? 'AI viết theo hồ sơ kênh' : 'Cần cài khoá AI trong Cài đặt'}">${busy ? '⏳ Đang viết…' : dr.ai ? '✨ AI viết lại' : '✨ AI viết bài'}</button>`;
        const sgHtml = `<div class="sugg ${dr.ai ? 'isai' : ''}"><div class="sg-h"><b>${dr.ai ? '✨ Gợi ý từ AI' : '💡 Gợi ý hôm nay'}</b><span class="tag">${esc(sg.type)}</span><span class="note">${esc(sg.lang)}</span></div>
          <div class="sg-t">${esc(sg.text)}</div>${sg.options ? `<div class="sg-o">${sg.options.map((o) => `<span class="tchip mute">${esc(o)}</span>`).join('')}</div>` : ''}
          <div class="note">Ý chính: ${esc(sg.vi)}</div>
          ${sg.img ? `<div class="sg-img"><div class="sg-ih"><b>🖼️ Prompt tạo ảnh · tỉ lệ 1:1</b><button class="btn sm" data-act="copyImg" data-v="${esc(x.t.key)}">Copy prompt ảnh</button></div><div class="sg-p">${esc(sg.img)}</div></div>` : ''}
          <div class="sg-f"><button class="btn sm primary" data-act="useSugg" data-v="${esc(x.t.key)}">Dùng bài này</button>${dr.ai ? `<button class="btn sm" data-act="aiClear" data-v="${esc(x.t.key)}">Về gợi ý mẫu</button>` : `<button class="btn sm" data-act="nextSugg" data-v="${esc(x.t.key)}">Đổi bài khác</button>`}${aiBtn}</div></div>`;
        return `<div class="ccard ${x.s.k}"><div class="cc-h"><b>Bài ${x.t.idx}/${x.t.of}</b>${x.t.t ? `<span class="tchip amb">nhắc ${x.t.t}</span>` : '<span class="tchip mute">trong ngày</span>'}<span class="st ${x.s.k}">${x.s.label}</span></div>
          ${sgHtml}
          <div class="cc-b"><select data-draft-type="${esc(x.t.key)}">${COMM_TYPES.map((t) => `<option ${dr.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <textarea data-draft="${esc(x.t.key)}" placeholder="Nháp nội dung bài đăng cộng đồng…">${esc(dr.text)}</textarea></div>
          <div class="cc-f"><button class="btn sm" data-act="copyDraft" data-v="${esc(x.t.key)}">Copy nội dung</button>${btn(x, x.s.k === 'done' ? 'Đã đăng' : 'Đánh dấu đã đăng')}</div></div>`;
      }).join('') : '<div class="trow"><span class="note">Kênh này không cần đăng bài cộng đồng (đổi ở “Thêm / sửa lịch đăng”).</span></div>';
      const up7 = [1, 2, 3, 4, 5, 6, 7].map((i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const ts = postsOn(d).filter((p) => p.c === c).map((p) => p.t);
        return `<div class="up7 ${ts.length ? 'has' : ''}"><small>${DOW[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}</small><b>${ts.join(' · ') || '—'}</b></div>`;
      }).join('');
      const h = historyOf(c);
      const histHtml = h.days.map((x) => `<button class="hd ${x.k}" data-act="histToggle" data-v="${c.id}|${x.iso}" title="${x.dd}/${x.mm}: ${x.k === 'skip' ? 'đã xoá cảnh báo (hôm đó bận, không đăng) — bấm để về trống' : `đã đăng ${x.got}/${x.need} bài cộng đồng — bấm để đổi: đã đăng → xoá cảnh báo (bận) → trống`}"><i>${x.k === 'ok' ? '✓' : x.k === 'part' ? '½' : x.k === 'skip' ? '–' : ''}</i><small>${x.dow}</small><small class="dd">${x.dd}/${x.mm}</small></button>`).join('');
      const vh = realOwn ? videoHistoryOf(c) : null;
      const vHistHtml = vh ? vh.days.map((x) => `<div class="hd ${x.k}" title="${x.dd}/${x.mm}: ${x.k === 'ok' ? `có ${x.got} video mới (dữ liệu thật từ YouTube)` : 'chưa có video mới ngày này'}"><i>${x.k === 'ok' ? '✓' : ''}</i><small>${x.dow}</small><small class="dd">${x.dd}/${x.mm}</small></div>`).join('') : '';
      const s = sched[c.id];
      return `<div class="card tcard"><div class="tc-h"><span class="chan">${avatar(c)}<span><b>${esc(c.name)}</b><br><small class="note">${esc(c.niche)}${c.country ? ' · ' + esc(c.country) : ''} · ${esc(schedFreqLabel(s))} · ${commNeed(c)} bài cộng đồng/ngày (bắt buộc)</small></span></span><span class="tag ${dn === mine.length && mine.length ? 'green' : ''}">${dn}/${mine.length} xong</span></div>
        <div class="sec-t">🎬 Video hôm nay</div>${vrows}${held}
        <div class="sec-t">Lịch video 7 ngày tới</div><div class="up7s">${up7}</div>
        ${vh ? `<div class="sec-t">📅 Video đăng lên YouTube 14 ngày gần đây <span class="note">· có video <b>${vh.okDays}/14</b> ngày</span></div><div class="hist">${vHistHtml}</div>
        <div class="hlegend"><span><i class="ok">✓</i> có video mới</span><span class="note">Ô mờ = chưa có video ngày đó. Lấy tự động từ YouTube, không sửa tay được.</span></div>` : ''}
        <div class="sec-t">📣 Bài đăng cộng đồng hôm nay</div>${profileCard(c)}<div class="ccards">${commCards}</div>
        <div class="sec-t">📅 Bài cộng đồng 14 ngày gần đây <span class="note">· đã đăng <b>${h.okDays}/14</b> ngày · chuỗi liên tiếp <b>${h.streak}</b> ngày</span></div><div class="hist">${histHtml}</div>
        <div class="hlegend"><span><i class="ok">✓</i> đăng đủ</span><span><i class="part">½</i> đăng một phần</span><span><i class="miss"></i> bỏ lỡ</span><span><i class="skip">–</i> xoá cảnh báo (bận)</span><span><i class="now"></i> hôm nay</span><span><i class="na"></i> chưa ghi nhận (bấm để ghi bù)</span></div></div>`;
    };
    const flt = state.stationFilter || 'all';
    const rank = { late: 0, due: 1, soon: 2, todo: 3, skip: 4, done: 5 };
    const listRows = chans.map((c) => {
      const mine = tasks.filter((x) => x.t.c === c);
      const dn = mine.filter((x) => x.s.k === 'done').length;
      const worst = mine.filter((x) => x.s.k !== 'done' && x.s.k !== 'skip').sort((a, b) => rank[a.s.k] - rank[b.s.k])[0];
      return { c, mine, dn, worst, level: worst ? worst.s.k : 'done' };
    }).filter((r) => flt === 'all' || (flt === 'todo' ? r.level !== 'done' : r.level === 'done'))
      .sort((a, b) => rank[a.level] - rank[b.level]);
    const listHtml = listRows.map((r) => `<button class="sitem ${state.stationSel === r.c.id ? 'on' : ''}" data-act="stationSel" data-v="${r.c.id}">
        <span class="cdot" style="background:${r.c.color}"></span><span class="sn"><b>${esc(r.c.name)}</b><small>${esc(r.c.niche)}${r.worst && r.worst.t.t ? ` · ${r.worst.t.t}` : ''}</small></span>
        <span class="sr"><span class="sd ${r.level}">${r.worst ? r.worst.s.label : r.mine.some((x) => x.s.k === 'skip') ? 'Đã xoá cảnh báo' : 'Xong hết'}</span><small>${r.dn}/${r.mine.length}</small></span></button>`).join('')
      || '<div class="note" style="padding:18px">Không có kênh nào phù hợp bộ lọc.</div>';
    const sel = chans.find((c) => c.id === state.stationSel);
    const right = sel ? detailOf(sel) : '<div class="card placeholder" style="height:100%">Chọn một kênh ở danh sách bên trái để xem giờ đăng video và bài đăng cộng đồng của kênh đó.</div>';
    return `<div class="card station-head"><div><b>Hôm nay ${now.toLocaleDateString('vi-VN')}</b> <span class="note">· ${doneN}/${total} việc đã xong</span>
        <div class="pbar"><i style="width:${total ? Math.round((doneN / total) * 100) : 0}%"></i></div></div>
        <div class="schips"><span class="hb bad"><i></i>${cnt('late')} quá giờ</span><span class="hb warn"><i></i>${cnt('due')} đến giờ</span><span class="hb ok"><i></i>${cnt('soon') + cnt('todo')} chưa tới / chờ</span>${cnt('skip') ? `<span class="hb plain"><i></i>${cnt('skip')} đã xoá cảnh báo</span>` : ''}</div>
        <div>${notifBtn}</div></div>
      ${chans.length ? `<div class="smaster"><div class="card slist"><div class="section-title"><span>Kênh cần đăng (${chans.length})</span><span class="r"><select data-act="stationFilter"><option value="all" ${flt === 'all' ? 'selected' : ''}>Tất cả</option><option value="todo" ${flt === 'todo' ? 'selected' : ''}>Còn việc</option><option value="done" ${flt === 'done' ? 'selected' : ''}>Đã xong</option></select></span></div>${listHtml}</div><div class="sdetail">${right}</div></div>` : '<div class="card placeholder">Chưa có kênh nào có lịch đăng. Bấm “+ Thêm / sửa lịch đăng”.</div>'}
      <p class="note">Trạm nhắc việc: app không tự đăng bài hộ anh. Bấm “Đánh dấu đã đăng” sau khi anh đăng xong trên YouTube. Số bài cộng đồng mỗi ngày và giờ nhắc chỉnh ở “+ Thêm / sửa lịch đăng”.</p>`;
  }

  function schedPlan() {
    const ids = D.OWN.filter((c) => sched[c.id] && !c.noPost);
    const retired = D.OWN.filter((c) => c.noPost);
    const rows = ids.map((c, i) => {
      const s = sched[c.id];
      return `<tr><td class="l note">${i + 1}</td>
        <td class="l"><span class="chan"><span class="cdot" style="background:${c.color}"></span><b>${esc(c.name)}</b></span></td>
        <td class="l note">${esc(c.niche)}</td><td class="l note">${esc(c.country || '—')}</td>
        <td class="l"><span class="tchip">${s.times.join(' · ')}</span><span class="tchip mute">${esc(schedFreqLabel(s))}</span></td>
        <td class="l">${realOwn ? (() => { const g = goldenHours(c); return g.length ? g.map((x) => `<span class="tchip amb" title="${x.n} video, view TB ×${x.x.toFixed(1)} so mức thường">${pad2(x.h)}:00</span>`).join('') : '<span class="note" title="Cần ít nhất 2 video đăng cùng khung giờ (của kênh này hoặc đối thủ cùng ngách)">chưa đủ dữ liệu</span>'; })() : `<span class="tchip amb">${rivalTimes(c).join(', ')}</span>`}</td>
        <td class="l"><span class="tchip">${commNeed(c)} bài/ngày</span><span class="tchip mute">nhắc ${s.commTime || '20:00 (hạn)'}</span></td>
        <td><button class="x" data-act="schedEdit" data-v="${c.id}" title="Sửa">✎</button><button class="x" data-act="schedDel" data-v="${c.id}" title="Xoá lịch">🗑</button></td></tr>`;
    }).join('');
    return `<div class="card"><div class="section-title"><span>Lịch từng kênh (${ids.length})</span></div>
      ${ids.length ? `<div class="tablewrap"><table><thead><tr><th class="l">STT</th><th class="l">Tên kênh</th><th class="l">Chủ đề</th><th class="l">Quốc gia</th><th class="l">Giờ đăng</th><th class="l" title="Giờ đăng mà video của kênh và của đối thủ cùng ngách thường có view cao hơn mức thường (giờ VN)">Giờ vàng${realOwn ? ' (giờ VN)' : ''}</th><th class="l">Bài cộng đồng</th><th>Thao tác</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="placeholder">Chưa có kênh nào có lịch đăng. Bấm “+ Thêm / sửa lịch đăng”.</div>'}</div>
      ${retired.length ? `<div class="card" style="margin-top:14px"><div class="section-title"><span>⏸ Kênh đã ngừng đăng (${retired.length})</span><span class="r">vẫn theo dõi số liệu, không nhắc đăng bài hay bài cộng đồng</span></div>
        <div class="tablewrap"><table><tbody>${retired.map((c) => `<tr><td class="l"><span class="chan"><span class="cdot" style="background:${c.color}"></span><b>${esc(c.name)}</b></span></td><td class="l note">${esc(c.niche)}</td><td><button class="btn sm" data-act="toggleNoPost" data-v="${esc(c.id)}">▶ Bật lại nhắc đăng bài</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}
      ${todayStrip()}${calendar()}
      ${realOwn ? '' : '<p class="note">Giờ đăng và giờ đối thủ hiện là dữ liệu mẫu; giờ đối thủ tính từ video của đối thủ khi nối API thật.</p>'}`;
  }
  function todayStrip() {
    const list = postsOn(new Date());
    return `<div class="card today-strip"><b class="pur">Hôm nay đăng · ${list.length}</b>${list.map((p) => `<span class="tchip"><span class="cdot" style="background:${p.c.color}"></span>${p.t} ${esc(p.c.name)}</span>`).join('') || '<span class="note">Không có kênh nào đến lịch.</span>'}</div>`;
  }
  // Lịch tháng: chỉ hiện KẾ HOẠCH (mọi kênh đang có lịch + ngày đăng theo quy tắc), không so với thực tế —
  // muốn xem có đăng đúng hạn thật hay không thì mở "Trạm đăng bài" (lịch sử 14 ngày lấy từ dữ liệu YouTube thật, không sửa tay được).
  function calendar() {
    const { y, m } = calState;
    const first = new Date(y, m, 1);
    const start = new Date(y, m, 1 - first.getDay());
    const todayKey = isoDate(new Date());
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (i >= 35 && d.getMonth() !== m) break;
      const posts = d.getMonth() === m ? postsOn(d) : [];
      const shown = posts.slice(0, 3).map((p) => `<div class="ev"><span class="cdot" style="background:${p.c.color}"></span>${p.t} ${esc(p.c.name)}</div>`).join('');
      cells += `<div class="day ${d.getMonth() !== m ? 'out' : ''} ${isoDate(d) === todayKey ? 'now' : ''}"><div class="dn">${d.getDate()}</div>${shown}${posts.length > 3 ? `<div class="more">+${posts.length - 3} nữa</div>` : ''}</div>`;
    }
    return `<div class="card cal"><div class="section-title"><span class="calnav"><button class="btn sm" data-act="calNav" data-v="today">Hôm nay</button><button class="x" data-act="calNav" data-v="-1">‹</button><b>Tháng ${m + 1} ${y}</b><button class="x" data-act="calNav" data-v="1">›</button></span></div>
      <div class="dows">${DOW.map((d) => `<div>${d}</div>`).join('')}</div><div class="days">${cells}</div></div>`;
  }
  function schedToday() {
    const now = new Date();
    const cur = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const list = postsOn(now);
    const rows = list.map((p) => `<tr><td class="l"><span class="chan"><span class="cdot" style="background:${p.c.color}"></span><b>${esc(p.c.name)}</b></span></td><td class="l note">${esc(p.c.niche)}</td><td class="l"><span class="tchip">${p.t}</span></td><td class="l">${p.t < cur ? '<span class="tag green">Đã qua giờ</span>' : '<span class="tag amber">Sắp tới</span>'}</td></tr>`).join('');
    return `<div class="card"><div class="section-title"><span>Đăng hôm nay (${list.length})</span><span class="r">${now.toLocaleDateString('vi-VN')}</span></div>
      ${list.length ? `<div class="tablewrap"><table><thead><tr><th class="l">Kênh</th><th class="l">Chủ đề</th><th class="l">Giờ đăng</th><th class="l">Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="placeholder">Hôm nay không có kênh nào đến lịch đăng.</div>'}</div>`;
  }
  function pageSchedule() {
    const pn = pendingCount();
    const tabs = [['plan', 'Lịch đăng (khung giờ)'], ['station', `Trạm đăng bài${pn ? ` <b class="nb">${pn}</b>` : ''}`], ['today', '🎉 Đăng hôm nay']];
    const body = state.schedTab === 'today' ? schedToday() : state.schedTab === 'station' ? schedStation() : schedPlan();
    return head(ICON.cal, 'Quản lý Giờ đăng', 'Mỗi kênh có khung giờ + tần suất riêng — chỉnh từng kênh', '<button class="btn primary" data-act="schedEdit" data-v="">+ Thêm / sửa lịch đăng</button>') +
      `<div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${state.schedTab === k ? 'on' : ''}" data-act="schedTab" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
  }
  const WD_PICKER = [[1, 'T2'], [2, 'T3'], [3, 'T4'], [4, 'T5'], [5, 'T6'], [6, 'T7'], [0, 'CN']]; // Thứ 2 → Chủ nhật, giá trị khớp Date.getDay()
  // Nhãn tần suất ngắn gọn cho bảng: "mỗi N ngày" hoặc danh sách thứ đã chọn (theo đúng thứ tự T2→CN)
  const schedFreqLabel = (s) => (s.mode === 'weekday' ? WD_PICKER.filter(([v]) => (s.weekdays || []).includes(v)).map(([, l]) => l).join(', ') || 'chưa chọn thứ' : `mỗi ${s.every} ngày`);
  function openSchedEdit(id, draft) {
    const cur = id || (draft && draft.id) || (D.OWN.find((c) => !sched[c.id]) || D.OWN[0]).id;
    const base = sched[cur] || { mode: 'interval', times: ['08:00'], every: 1, offset: 0, weekdays: [1, 3, 5], comm: 1, commTime: '' };
    const s = draft ? { ...base, ...draft } : base;
    const mode = s.mode === 'weekday' ? 'weekday' : 'interval';
    const startDate = new Date(Date.UTC(1970, 0, 1) + (dayNum(new Date()) - ((dayNum(new Date()) - (s.offset || 0)) % s.every + s.every) % s.every) * 86400000);
    const wds = new Set(s.weekdays && s.weekdays.length ? s.weekdays : [1, 3, 5]);
    const modeTabs = `<div class="tabs" style="margin:4px 0 2px">
        <button class="tab ${mode === 'interval' ? 'on' : ''}" data-act="schedMode" data-v="interval">Mỗi N ngày</button>
        <button class="tab ${mode === 'weekday' ? 'on' : ''}" data-act="schedMode" data-v="weekday">Theo thứ trong tuần</button></div>`;
    const intervalFields = `<label>Mỗi bao nhiêu ngày đăng một lần</label><input id="sc-every" type="text" value="${s.every}">
      <label>Ngày đăng gần nhất / bắt đầu</label><input id="sc-start" type="text" value="${startDate.toISOString().slice(0, 10)}" placeholder="YYYY-MM-DD">`;
    const weekdayFields = `<label>Chọn các thứ trong tuần muốn đăng</label>
      <div class="chips" id="sc-wd">${WD_PICKER.map(([v, l]) => `<button type="button" class="chip ${wds.has(v) ? 'on' : ''}" data-act="schedWd" data-v="${v}">${l}</button>`).join('')}</div>`;
    modal(`<h3>${id ? 'Sửa' : 'Thêm / sửa'} lịch đăng</h3><div class="note">Chọn kênh, giờ đăng và tần suất.</div>
      <label>Kênh</label><select id="sc-chan" style="width:100%">${D.OWN.map((c) => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <label>Giờ đăng (nhiều giờ ngăn cách bằng dấu phẩy, dạng HH:MM)</label><input id="sc-times" type="text" value="${s.times.join(', ')}">
      <label>Kiểu lặp lại</label>${modeTabs}
      <div id="sc-modebox">${mode === 'weekday' ? weekdayFields : intervalFields}</div>
      <label>Số bài đăng cộng đồng mỗi ngày (bắt buộc tối thiểu 1, tối đa 10)</label><input id="sc-comm" type="text" value="${Math.max(1, s.comm == null ? 1 : s.comm)}">
      <label>Giờ nhắc bài cộng đồng (tuỳ chọn, HH:MM — để trống nếu chỉ cần trong ngày)</label><input id="sc-ctime" type="text" value="${s.commTime || ''}" placeholder="Ví dụ 10:00">
      <div class="err" id="m-err"></div><div class="foot"><button class="btn" data-act="closeModal">Huỷ</button><button class="btn primary" data-act="schedSave" data-v="${mode}">Lưu lịch</button></div>`);
  }
  // Đọc các ô đang có trong form (không phụ thuộc kiểu lặp lại đang hiện) để giữ lại khi đổi tab hoặc chọn/bỏ một thứ.
  function schedDraftFromForm(mode) {
    return {
      id: $('#sc-chan').value, mode,
      times: ($('#sc-times').value || '').split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean),
      every: parseInt(($('#sc-every') || {}).value, 10) || 1,
      weekdays: [...document.querySelectorAll('#sc-wd .chip.on')].map((b) => +b.dataset.v),
      comm: parseInt(($('#sc-comm') || {}).value, 10) || 1,
      commTime: (($('#sc-ctime') || {}).value || '').trim(),
    };
  }
  function saveSched() {
    const err = $('#m-err');
    const id = $('#sc-chan').value;
    const mode = ($('button[data-act="schedSave"]') || {}).dataset.v === 'weekday' ? 'weekday' : 'interval';
    const times = $('#sc-times').value.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);
    if (!times.length || times.some((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) { err.textContent = 'Giờ đăng phải dạng HH:MM, ví dụ 08:30.'; return; }
    let every = 1, offset = 0, weekdays;
    if (mode === 'weekday') {
      weekdays = [...document.querySelectorAll('#sc-wd .chip.on')].map((b) => +b.dataset.v);
      if (!weekdays.length) { err.textContent = 'Chọn ít nhất một thứ trong tuần.'; return; }
    } else {
      every = parseInt($('#sc-every').value, 10);
      const sd = $('#sc-start').value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!(every >= 1 && every <= 60)) { err.textContent = 'Tần suất từ 1 đến 60 ngày.'; return; }
      if (!sd) { err.textContent = 'Ngày bắt đầu dạng YYYY-MM-DD.'; return; }
      const n = dayNum(new Date(+sd[1], +sd[2] - 1, +sd[3]));
      offset = ((n % every) + every) % every;
    }
    const comm = parseInt($('#sc-comm').value, 10);
    const ctime = $('#sc-ctime').value.trim();
    if (!(comm >= 1 && comm <= 10)) { err.textContent = 'Mỗi ngày phải có ít nhất 1 bài cộng đồng (tối đa 10).'; return; }
    if (ctime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(ctime)) { err.textContent = 'Giờ nhắc bài cộng đồng phải dạng HH:MM hoặc để trống.'; return; }
    sched[id] = mode === 'weekday' ? { mode, times: [...new Set(times)].sort(), weekdays, comm, commTime: ctime } : { mode, times: [...new Set(times)].sort(), every, offset, comm, commTime: ctime };
    store.set('qlk_sched', sched);
    closeModal(); render();
    // Nói rõ đã lưu cho KÊNH NÀO và 3 ngày đăng gần nhất sẽ là ngày nào, để không bị hiểu nhầm "bấm Lưu không có tác dụng"
    // khi ngày bắt đầu mới trùng vị trí chu kỳ với ngày cũ (ví dụ đổi từ ngày lẻ sang ngày lẻ khác, mỗi 2 ngày) nên lịch trông y hệt.
    const chanName = (D.OWN.find((c) => c.id === id) || {}).name || '';
    const upcoming = [];
    const wdSet = mode === 'weekday' ? new Set(weekdays) : null;
    for (let i = 0, d = new Date(); upcoming.length < 3 && i < 60; i++, d.setDate(d.getDate() + 1)) {
      const hit = wdSet ? wdSet.has(d.getDay()) : (((dayNum(d) - offset) % every) + every) % every === 0;
      if (hit) upcoming.push(`${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`);
    }
    toast(`Đã lưu lịch đăng cho “${chanName}” — đăng vào: ${upcoming.join(', ')}${upcoming.length ? '…' : ''}`);
  }

  // Nhắc giờ: kiểm tra mỗi 30 giây, báo một lần cho mỗi việc khi đến giờ.
  function tick() {
    const now = new Date();
    const key = 'qlk_notified';
    let seen = store.get(key, {});
    if (seen.day !== dayKey()) seen = { day: dayKey(), keys: [] };
    const fresh = todayTasks().filter((t) => taskState(t, now).k === 'due' && !seen.keys.includes(t.key));
    if (fresh.length) {
      fresh.forEach((t) => seen.keys.push(t.key));
      store.set(key, seen);
      const msg = fresh.map((t) => `${t.t || COMM_DEADLINE} · ${t.c.name} — ${t.kind === 'video' ? 'đăng video' : 'đăng bài cộng đồng (bắt buộc mỗi ngày)'}`).join('\n');
      toast('⏰ Đến giờ đăng: ' + msg.replace(/\n/g, ' | '));
      if (notifyOk() && Notification.permission === 'granted') { try { new Notification('Đến giờ đăng', { body: msg }); } catch (e) { /* bỏ qua */ } }
    }
    if ((location.hash || '').startsWith('#/schedule') && $('#modal').hidden && !(document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName))) render();
    else updateNavBadge();
  }
  function updateNavBadge() {
    const a = document.querySelector('#nav a[href="#/schedule"]');
    if (a) {
      const n = pendingCount();
      a.innerHTML = 'Quản lý Giờ đăng' + (n ? ` <b class="nb">${n}</b>` : '');
    }
    const d = document.querySelector('#nav a[href="#/dashboard"]');
    if (d) {
      const u = typeof unreadCount === 'function' ? unreadCount() : 0;
      d.innerHTML = 'Dashboard' + (u ? ` <b class="nb">${u}</b>` : '');
    }
  }
  // ---------- Trạng thái kết nối API (đèn góc trên bên phải + trang Cài đặt) ----------
  let api = null;
  let apiBusy = false;
  const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN') : '');

  // Mỗi đèn luôn hiện TÊN dịch vụ; màu và chữ nhỏ phía sau thể hiện trạng thái.
  const LIGHT_WORD = { ok: '', unset: '', unchecked: ' · chưa kiểm tra', error: ' · lỗi', checking: ' · đang kiểm tra…' };
  const LIGHT_TIP = { ok: 'kết nối tốt', unset: 'chưa cài', unchecked: 'đã lưu, chưa kiểm tra', error: 'lỗi', checking: 'đang kiểm tra…' };
  function setLight(id, name, cls, detail, word) {
    const p = $(id);
    p.className = 'api-pill ' + cls;
    p.querySelector('.lbl').textContent = name + (word != null ? word : LIGHT_WORD[cls]);
    p.title = `${name}: ${detail || LIGHT_TIP[cls]}\n(bấm để mở Cài đặt)`;
  }
  const lightCls = (st) => (st === 'ok' || st === 'error' || st === 'unchecked' ? st : 'unset');
  function updatePill() {
    const yt = api && api.apiKey, ai = api && api.ai, o = api && api.oauth;
    setLight('#api-pill', 'YouTube Data API v3', apiBusy ? 'checking' : lightCls(yt ? yt.state : 'unset'), yt && yt.state === 'error' ? yt.message : '');
    const oc = !o ? 'unset' : o.connected ? 'ok' : o.clientIdSet && o.secretSet ? 'unchecked' : 'unset';
    setLight('#oauth-pill', o && o.connected ? `Google OAuth · ${o.channels} kênh` : 'Google OAuth', oc, oc === 'unchecked' ? 'đã lưu khoá, chưa kết nối kênh nào' : o && o.connected ? `đã kết nối ${o.channels} kênh` : '', oc === 'unchecked' ? ' · chưa kết nối kênh' : undefined);
    setLight('#ai-pill', 'API 9Router', lightCls(ai ? ai.state : 'unset'), ai && ai.state === 'error' ? ai.message : '');
    const v = api && api.version, vEl = $('#version-tag');
    if (vEl) vEl.textContent = v && v.commit ? new Date(v.date).toLocaleDateString('vi-VN') : '';
  }
  async function apiCall(path, body) {
    const r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Có lỗi xảy ra');
    return j;
  }
  async function loadStatus(check) {
    apiBusy = !!check; updatePill();
    try {
      api = await apiCall('/api/status' + (check ? '?check=1' : ''));
      if (check && api.ai && api.ai.set) api = await apiCall('/api/ai/test', {});
    } catch (e) { api = null; }
    apiBusy = false; updatePill();
    const ae = document.activeElement;
    const typing = ae && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName);
    if (!typing && $('#modal').hidden && !document.querySelector('#app input:not(:placeholder-shown)')) render();
  }

  function pageSettings() {
    const k = (api && api.apiKey) || { set: false, masked: '' };
    const o = (api && api.oauth) || { clientIdSet: false, secretSet: false, connected: false, redirectUri: 'http://localhost:4400/oauth/callback', clientIdMasked: '' };
    const ai = (api && api.ai) || { set: false, masked: '', baseUrl: 'http://127.0.0.1:20128/v1', model: 'ag/gemini-3.8-flash', state: 'unset', message: '' };
    const aiInfo = ai.state === 'ok' ? { tag: '<span class="tag green">Sẵn sàng</span>', msg: `<span class="result ok">✓ ${esc(ai.message)} · ${fmtTime(ai.checkedAt)}</span>` }
      : ai.state === 'error' ? { tag: '<span class="tag" style="background:rgba(240,84,108,.14);color:var(--red)">Lỗi</span>', msg: `<span class="result bad">✕ ${esc(ai.message)}</span>` }
      : ai.state === 'unchecked' ? { tag: '<span class="tag amber">Chưa kiểm tra</span>', msg: '<span class="result warn">Đã lưu, bấm “Kiểm tra kết nối”.</span>' }
      : { tag: '<span class="tag">Chưa cài</span>', msg: '' };
    const up = api && api.update;
    const step = (ok, text, hint) => `<li class="${ok ? 'ok' : ''}"><span class="ck">${ok ? '✓' : '○'}</span><span>${text}${hint ? ` <small>${hint}</small>` : ''}</span></li>`;
    const doneCount = [k.set, k.set && api && api.apiKey.state === 'ok', o.clientIdSet && o.secretSet, o.connected].filter(Boolean).length;
    return head(ICON.cog, 'Cài đặt', 'Kết nối API và lịch cập nhật') + `
      <div class="card set-card">
        <h3>Các bước gắn API <span class="tag ${doneCount === 4 ? 'green' : 'amber'}">${doneCount}/4 xong</span></h3>
        <ol class="steps">
          ${step(k.set, 'Thêm khoá API vào mục “YouTube Data API — các khoá” bên dưới', 'lấy ở Google Cloud → Credentials')}
          ${step(k.set && api && api.apiKey.state === 'ok', 'Bấm “Kiểm tra” cạnh khoá — đèn góc trên bên phải sáng xanh là xong', 'lỗi sẽ báo rõ nguyên nhân')}
          ${step(o.clientIdSet && o.secretSet, 'Dán Client ID và Client Secret để đọc số liệu chi tiết kênh của anh', 'cần khi nối 5 kênh')}
          ${step(o.connected, 'Kết nối từng kênh bằng tài khoản Google', 'làm ở bước sau khi nối dữ liệu thật')}
        </ol>
      </div>
      ${quotaCard()}
      ${apiKeysCard()}
      <div class="card set-card">
        <h3>AI viết bài — 9router (Gemini) ${aiInfo.tag}</h3>
        <div class="desc">Dùng để viết bài đăng cộng đồng đúng giọng từng kênh. Cùng 9router anh đang dùng ở các app khác (địa chỉ mặc định là máy anh, 9router phải đang chạy).</div>
        <div class="row"><label for="in-ai-url">Địa chỉ 9router</label><input id="in-ai-url" type="text" value="${esc(ai.baseUrl)}"></div>
        <div class="row"><label for="in-ai-model">Model</label><input id="in-ai-model" type="text" value="${esc(ai.model)}"></div>
        <div class="row"><label for="in-ai-key">Khoá API 9router</label><input id="in-ai-key" type="password" autocomplete="off" placeholder="${ai.set ? esc(ai.masked) + ' (đã lưu — nhập mới để thay)' : 'Dán khoá 9router…'}"></div>
        <div class="actions"><button class="btn primary" data-act="saveAi">Lưu &amp; kiểm tra</button><button class="btn" data-act="testAi" ${ai.set ? '' : 'disabled'}>Kiểm tra kết nối</button><button class="btn" data-act="clearAi" ${ai.set ? '' : 'disabled'}>Xoá khoá</button>${aiInfo.msg}</div>
      </div>
      <div class="card set-card">
        <h3>Google OAuth — các bộ Client ID / Secret <span class="tag ${o.connected ? 'green' : 'amber'}">${o.connected ? `Đã kết nối ${o.channels} kênh` : o.clientIdSet ? 'Đã lưu khoá — chưa kết nối kênh nào' : 'Chưa cài'}</span></h3>
        <div class="desc">Mỗi bộ ứng với <b>một project Google Cloud</b>. Google giới hạn <b>100 tài khoản</b> cho mỗi bộ chưa xác minh (tính cả kênh đã xoá). Thêm bộ mới để dự phòng khi bộ hiện tại gần đầy; kênh mới sẽ kết nối bằng bộ anh chọn ở mục “Kênh đã kết nối”. Các kênh cũ vẫn chạy bằng bộ đã kết nối.</div>
        ${(o.clients || []).map((c) => `<div class="ocrow"><div class="cinfo"><b>${esc(c.label)}</b><small>${esc(c.clientIdMasked)} · ${c.channels} kênh đang dùng</small></div>
          <div class="ouse"><div class="pbar" style="min-width:0"><i style="width:${Math.min(100, c.lifetime)}%;background:${c.lifetime >= 100 ? 'var(--red)' : c.lifetime >= 80 ? 'var(--amber)' : 'var(--green)'}"></i></div><small>đã dùng ${c.lifetime}/100 suất${c.lifetime >= 100 ? ' — ĐẦY' : c.lifetime >= 80 ? ' — sắp đầy' : ''}</small></div>
          <button class="btn sm ${c.published ? 'primary' : ''}" data-act="oauthPub" data-v="${esc(c.key)}|${c.published ? 0 : 1}" title="Khi anh đã bấm Publish app trên Google Cloud, quyền kênh không còn hết hạn sau 7 ngày. Bật để Dashboard thôi đếm ngược.">${c.published ? '✓ Đã Publish' : 'Đánh dấu đã Publish'}</button>
          <button class="btn sm" data-act="rmOauthClient" data-v="${esc(c.key)}" ${c.channels ? 'disabled title="Còn kênh đang dùng bộ này"' : ''}>🗑 Xoá bộ</button></div>`).join('') || '<div class="note" style="margin-bottom:8px">Chưa có bộ OAuth nào.</div>'}
        <div class="row" style="margin-top:12px"><label for="in-olabel">Tên gọi (tuỳ chọn)</label><input id="in-olabel" type="text" autocomplete="off" placeholder="Ví dụ: Project dự phòng 1"></div>
        <div class="row"><label for="in-cid">Client ID</label><input id="in-cid" type="text" autocomplete="off" placeholder="xxxx.apps.googleusercontent.com"></div>
        <div class="row"><label for="in-cs">Client Secret</label><input id="in-cs" type="password" autocomplete="off" placeholder="GOCSPX-…"></div>
        <div class="row"><label>Redirect URI</label><div><code>${esc(o.redirectUri)}</code> <span class="note">— mỗi bộ đều phải đăng ký đúng địa chỉ này trong Google Cloud</span></div></div>
        <div class="actions">
          <button class="btn primary" data-act="addOauthClient">+ Thêm bộ OAuth</button>
        </div>
        <details><summary>Cách lấy khóa trên Google Cloud</summary><ol>
          <li>Vào console.cloud.google.com, tạo project mới bằng đúng mail quản lý 5 kênh.</li>
          <li>Mục “APIs &amp; Services → Library”: bật <b>YouTube Data API v3</b> và <b>YouTube Analytics API</b>.</li>
          <li>“Credentials → Create credentials → API key”: copy dán vào ô Khóa API ở trên.</li>
          <li>“OAuth consent screen”: chọn External, điền tên app, rồi chuyển sang <b>In production</b> (nếu để Testing, kết nối tự hết hạn sau 7 ngày).</li>
          <li>“Credentials → Create credentials → OAuth client ID”, loại Web application, thêm Redirect URI ở trên. Copy Client ID và Client Secret dán vào đây.</li>
        </ol></details>
      </div>
      ${managersCard()}
      ${channelsCard(o)}
      <div class="card set-card">
        <h3>Ngưỡng cảnh báo kênh</h3>
        <div class="desc">Quyết định khi nào cột Tình trạng chuyển vàng hoặc đỏ.</div>
        <div class="row"><label for="h-red">Đỏ: lượt xem 7 ngày giảm hơn (%)</label><input id="h-red" type="text" value="${Math.round((1 - HEALTH.dropRed) * 100)}"></div>
        <div class="row"><label for="h-amb">Vàng: lượt xem 7 ngày giảm hơn (%)</label><input id="h-amb" type="text" value="${Math.round((1 - HEALTH.dropAmber) * 100)}"></div>
        <div class="row"><label for="h-sr">Đỏ: số ngày chưa có video</label><input id="h-sr" type="text" value="${HEALTH.staleRed}"></div>
        <div class="row"><label for="h-sa">Vàng: số ngày chưa có video</label><input id="h-sa" type="text" value="${HEALTH.staleAmber}"></div>
        <div class="actions"><button class="btn primary" data-act="saveHealth">Lưu ngưỡng</button><button class="btn" data-act="resetHealth">Về mặc định</button></div>
      </div>
      <div class="card set-card">
        <h3>Lịch cập nhật tự động <span class="tag green">Đang bật</span></h3>
        <div class="desc">Mỗi ngày lúc <b>08:30 giờ Việt Nam</b>. Nếu lúc đó máy hoặc app đang tắt, app tự <b>chạy bù</b> ngay khi anh mở. Kế tiếp: <b>${fmtVN(up && up.nextRunAt)}</b>. App phải đang chạy (mở bằng shortcut Desktop) thì mới cập nhật.</div>
        ${up && up.last ? `<div class="note" style="margin-bottom:6px">Lần chạy gần nhất: <b>${fmtVN(up.last.at)}</b> (${TRIGGER[up.last.trigger] || up.last.trigger})</div>
        <ul class="steps ustep">${up.last.steps.map((s) => `<li class="${s.state}"><span class="ck">${s.state === 'ok' ? '✓' : s.state === 'skip' ? '–' : '✕'}</span><span>${esc(s.name)} <small>${esc(s.msg)}</small></span></li>`).join('')}</ul>` : '<div class="note">Chưa có lần chạy nào.</div>'}
        <div class="actions"><button class="btn primary" data-act="runUpdate" ${up && up.running ? 'disabled' : ''}>Chạy cập nhật ngay</button><span class="note">Các bước “–” đang chờ nối dữ liệu YouTube thật.</span></div>
      </div>
      <div class="card set-card">
        <h3>Dữ liệu</h3>
        <div class="desc">Hiện app đang dùng dữ liệu mẫu. Đối thủ anh thêm được lưu trong trình duyệt này.</div>
        <button class="btn" data-act="resetRivals">Đặt lại danh sách đối thủ về mặc định</button>
      </div>`;
  }

  // ================= Thị trường, thư viện ngách, đối thủ thật =================
  const MARKETS = { en: 'Tiếng Anh', es: 'Tiếng Tây Ban Nha', pt: 'Tiếng Bồ Đào Nha', ja: 'Tiếng Nhật', ko: 'Tiếng Hàn', vi: 'Tiếng Việt' };
  const marketOpts = (cur, withEmpty) => (withEmpty ? `<option value="">— thị trường —</option>` : '') + Object.entries(MARKETS).map(([k, l]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${l}</option>`).join('');
  let lib = { niches: {} };
  let serverRivals = [];
  let realRivals = false;
  const apiOk = () => !!(api && api.apiKey && api.apiKey.state === 'ok');
  async function loadLibrary() { try { lib = (await apiCall('/api/library')).library; } catch (e) { /* bỏ qua */ } }
  async function loadRivals() {
    if (!apiOk()) { realRivals = false; return; }
    try {
      const arr = await apiCall('/api/rivals');
      serverRivals = arr.map((r, i) => {
        const max = r.videoList.reduce((m, v) => Math.max(m, v.views), 0);
        return {
          id: r.id, kind: 'rival', name: r.name, niche: r.niche, market: r.market, country: '', handle: r.handle, color: REAL_COLORS[(i + 3) % REAL_COLORS.length],
          videos: r.videos, subs: r.subs, views: r.views, comments: null, trackedDays: r.trackedDays, lastCheck: r.lastCheck,
          videoList: r.videoList.map((v) => ({ ...v, isNew: (Date.now() - new Date(v.date)) / 86400000 <= 2, isTop: max > 0 && v.views === max })),
        };
      });
      realRivals = true;
    } catch (e) { /* giữ nguyên */ }
  }
  const hoursAgo = (iso) => { const h = (Date.now() - new Date(iso)) / 3600e3; return h < 1 ? 'vừa đăng' : h < 24 ? `${Math.round(h)} giờ trước` : `${Math.round(h / 24)} ngày trước`; };

  // ================= Title Trends THẬT (quét cả YouTube theo từ khoá của ngách) =================
  const trend = { niche: store.get('qlk_tr_niche', ''), market: store.get('qlk_tr_market', 'en'), type: 'long', days: 1, kw: null, loading: false, error: '', result: null, minOutlier: 5, tried: false };
  const nicheChoices = () => [...new Set([...(realOwn ? D.OWN.map((c) => c.niche) : []), ...allRivals().map((c) => c.niche), ...Object.keys(lib.niches)].filter((n) => n && n !== NO_NICHE))];
  const ownMarketFor = (niche) => { const c = conns.find((x) => x.niche === niche && x.market); return c ? c.market : ''; };
  const libKeyword = () => ((lib.niches[trend.niche] || { markets: {} }).markets[trend.market] || {}).keyword || '';
  const trendKeyword = () => (trend.kw !== null ? trend.kw : libKeyword());
  const outTier = (x) => (x >= 100 ? 't4' : x >= 10 ? 't3' : x >= 5 ? 't2' : x >= 2 ? 't1' : 't0');
  const outFmt = (x) => (x >= 100 ? '>100x' : (x >= 10 ? x.toFixed(0) : x.toFixed(1)) + 'x');
  const outBadge = (o) => (o ? `<span class="ob ${outTier(o.score)}" title="Điểm nổ = lượt xem ÷ trung vị lượt xem của ${o.n} video gần nhất của kênh (${fmt(o.base)} view)">${outFmt(o.score)}</span>` : '<span class="ob t0" title="Kênh chưa đủ video để tính điểm nổ">—</span>');
  const vphBadge = (v) => `<span class="vb" title="${v.vphRecent != null ? 'VPH GẦN ĐÂY (tính từ lần quét trước)' : 'VPH trung bình từ lúc đăng (chưa có lần quét trước để tính VPH gần đây)'}">${fmt(v.vphRecent != null ? v.vphRecent : v.vph)} VPH${v.vphRecent != null ? '' : '*'}</span>`;
  const PARTS = ['① Từ khoá', '② Tâm lý', '③ Bối cảnh'];

  function trendNeedApi() {
    return `<div class="card placeholder"><div class="ph-ico">🔑</div><h2>Cần gắn YouTube Data API</h2><div>Title Trends quét video thật trên YouTube nên cần khoá API (đèn “YouTube Data API v3” phải xanh). <a href="#/settings" style="color:#b8a6ff">Mở Cài đặt →</a></div></div>`;
  }
  function trendRow(v, i, p) {
    const added = serverRivals.some((r) => r.id === v.channelId);
    const fl = v.flags || {};
    const flags = `<span class="fl ${fl.k ? 'on' : ''}" title="Từ khoá ở nửa đầu tiêu đề">①</span><span class="fl ${fl.t ? 'on' : ''}" title="Yếu tố tâm lý${fl.t ? ': ' + fl.t : ''}">②</span><span class="fl ${fl.c ? 'on' : ''}" title="Bối cảnh/đóng gói${fl.c ? ': ' + fl.c : ''}">③</span>`;
    return `<div class="trr"><span class="rk">${i + 1}</span>
      <div class="tt"><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.title)}</a>${v.vi ? `<div class="tv">${esc(v.vi)}</div>` : ''}
        <div class="tm"><a href="${esc(v.channelUrl)}" target="_blank" rel="noopener">${esc(v.channelTitle)}</a> · ${v.subs != null ? fmt(v.subs) + ' sub' : 'ẩn sub'} · ${hoursAgo(v.publishedAt)} · ${Math.round(v.seconds / 60)} phút ${outBadge(v.outlier)} ${vphBadge(v)} ${flags}</div></div>
      <a class="trthumb-a" href="${esc(v.url)}" target="_blank" rel="noopener">${v.thumb ? `<img class="trthumb" src="${esc(v.thumb)}" alt="" loading="lazy">` : '<div class="trthumb"></div>'}</a>
      <div class="tvw"><b>${fmt(v.views)}</b><small>lượt xem</small></div>
      <div>${added ? '<span class="tag green">Đã là đối thủ</span>' : `<button class="btn sm" data-act="addRivalFromScan" data-v="${esc(v.channelId)}|${esc(p.niche || '')}|${p.market}">+ Thêm đối thủ</button>`}</div></div>`;
  }
  function trendResults(r) {
    const p = r.params;
    const fRows = r.formulas.map((f) => {
      const label = PARTS.filter((_, i) => f.parts[i]).join(' + ') || 'Không có thành phần nào';
      const n = f.parts.filter(Boolean).length;
      return `<tr><td class="l">${label} <span class="tag ${n === 3 ? 'green' : ''}">${n}/3</span></td><td>${f.n}</td><td>${fmt(f.avg)}</td><td class="bar"><i style="width:${Math.min(100, f.mult * 45)}%"></i><b>×${f.mult.toFixed(1)}</b></td></tr>`;
    }).join('');
    const kRows = r.keywords.map((k) => `<tr><td class="l"><b>${esc(k.kw)}</b></td><td>${k.n}</td><td>${k.ch}</td><td>${fmt(k.avg)}</td><td>${k.growth == null ? '<span class="hb ok"><i></i>Mới xuất hiện</span>' : `<span class="hb ok"><i></i>▲ ${k.growth > 500 ? '>500' : Math.round(k.growth)}%</span>`}</td></tr>`).join('');
    const oRows = r.outliers.filter((x) => x.outlier.score >= trend.minOutlier).map((v) => `<tr><td class="l vt" title="${esc(v.title)}"><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.title)}</a>${v.vi ? `<div class="tv">${esc(v.vi)}</div>` : ''}</td><td>${v.thumb ? `<a href="${esc(v.url)}" target="_blank" rel="noopener"><img class="trthumb" src="${esc(v.thumb)}" alt="" loading="lazy"></a>` : ''}</td><td class="l note">${esc(v.channelTitle)}</td><td class="big">${fmt(v.views)}</td><td>${outBadge(v.outlier)}</td><td>${vphBadge(v)}</td></tr>`).join('');
    const trig = Object.entries(r.triggers).map(([k, n]) => `<span class="tchip mute">${esc(k)} ${n}</span>`).join('');
    return `<div class="card insight">🔎 “${esc(p.keyword)}” · ${MARKETS[p.market]} · ${p.type === 'short' ? 'Video Short (<3 phút)' : 'Video dài (≥3 phút)'} · ${p.days === 1 ? '24 giờ' : p.days + ' ngày'} qua · quét ${hoursAgo(r.at)} · ${r.poolSize} video đúng ngôn ngữ${r.langDropped ? ` (đã loại ${r.langDropped} video khác ngôn ngữ)` : ''}${r.fromCache ? ' · <b>từ bộ nhớ đệm 6 giờ</b> (không tốn hạn mức)' : ` · tốn <b>${r.quotaUsedByScan}</b> đơn vị`}
        <button class="btn sm" style="margin-left:8px" data-act="runTrendForce">Quét lại</button></div>
      ${r.aiError ? `<div class="apibanner"><span>⚠ AI (9router) chưa dịch/phân loại được một phần: ${esc(r.aiError)}</span></div>` : ''}
      ${r.notes && r.notes.length ? `<div class="card placeholder">${esc(r.notes[0])}</div>` : `
      <div class="card" style="margin-bottom:14px"><div class="section-title"><span>🏆 15 tiêu đề nhiều lượt xem nhất trong khoảng đã chọn</span><span class="r">bấm tiêu đề để mở video · * = VPH trung bình từ lúc đăng</span></div>${r.top.map((v, i) => trendRow(v, i, p)).join('')}</div>
      <div class="two2">
        <div class="card"><div class="section-title"><span>🔥 Từ khoá &amp; cụm từ đang lên</span><span class="r">≥3 video · ≥2 kênh · tăng so kỳ trước · view cao hơn mức chung</span></div>
          <div class="tablewrap"><table><thead><tr><th class="l">Cụm từ</th><th>Video</th><th>Kênh</th><th>View TB</th><th>So kỳ trước</th></tr></thead><tbody>${kRows || `<tr><td colspan="5" class="note">Chưa có cụm từ nào đủ điều kiện trong khoảng này.${p.days === 1 ? ' Khoảng 1 ngày có ít video — thử 7 ngày.' : ''}</td></tr>`}</tbody></table></div></div>
        <div class="card"><div class="section-title"><span>🧪 Công thức tiêu đề (3 thành phần)</span><span class="r">view TB so với mức chung</span></div>
          <div class="tablewrap"><table><thead><tr><th class="l">Tổ hợp</th><th>Video</th><th>View TB</th><th class="l">Hiệu quả</th></tr></thead><tbody>${fRows || '<tr><td colspan="4" class="note">Chưa phân loại được (cần AI 9router).</td></tr>'}</tbody></table></div>
          ${trig ? `<div style="padding:8px 14px 12px"><span class="note">Yếu tố tâm lý: </span>${trig}</div>` : ''}</div>
      </div>
      <div class="card" style="margin-top:14px"><div class="section-title"><span>🚀 Video nổ bất thường (điểm nổ ≥ ${trend.minOutlier}x)</span><span class="r"><button class="chip ${trend.minOutlier === 5 ? 'on' : ''}" data-act="trOutlier" data-v="5">từ 5x</button><button class="chip ${trend.minOutlier === 10 ? 'on' : ''}" data-act="trOutlier" data-v="10">từ 10x</button></span></div>
        ${oRows ? `<div class="tablewrap"><table><thead><tr><th class="l">Tiêu đề</th><th></th><th class="l">Kênh</th><th>Lượt xem</th><th>Điểm nổ</th><th>VPH</th></tr></thead><tbody>${oRows}</tbody></table></div>` : '<div class="placeholder">Chưa có video nào đạt ngưỡng này.</div>'}</div>
      <p class="note">Điểm nổ = lượt xem ÷ trung vị lượt xem của ~20 video cùng loại gần nhất của chính kênh đó (cách của VidIQ). Màu: &lt;2x xám · 2–5x xanh · 5–10x tím · &gt;10x đỏ.</p>`}`;
  }
  function pageTrendsReal() {
    if (!trend.niche && nicheChoices().length) { trend.niche = nicheChoices()[0]; const mk = ownMarketFor(trend.niche); if (mk) trend.market = mk; }
    if (!trend.result && !trend.loading && !trend.tried) { trend.tried = true; const last = store.get('qlk_tr_last', ''); if (last) loadTrendScan(last, true); }
    const q = (api && api.quota) || { used: 0, limit: 10000 };
    const est = trend.type === 'short' ? 270 : 470;
    const kw = trendKeyword();
    const bar = `<div class="card tbar"><div class="tb-row">
        <label>Ngách</label><input id="tr-niche" list="tr-niches" value="${esc(trend.niche)}" placeholder="Gõ hoặc chọn ngách…"><datalist id="tr-niches">${nicheChoices().map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
        <label>Thị trường</label><select id="tr-market">${marketOpts(trend.market)}</select>
        <label>Loại video</label><select id="tr-type"><option value="long" ${trend.type === 'long' ? 'selected' : ''}>Video dài (≥3 phút)</option><option value="short" ${trend.type === 'short' ? 'selected' : ''}>Video Short (&lt;3 phút)</option></select></div>
      <div class="tb-row">
        <label>Từ khoá</label><input id="tr-kw" list="tr-sug" value="${esc(kw)}" placeholder="Để trống = dùng tên ngách${trend.niche ? ': ' + trend.niche : ''}" style="min-width:260px"><datalist id="tr-sug"></datalist>
        <div class="chips">${[1, 7, 28, 90].map((n) => `<button class="chip ${trend.days === n ? 'on' : ''}" data-act="trDays" data-v="${n}">${n === 1 ? '1 ngày' : n + ' ngày'}</button>`).join('')}</div>
        <button class="btn primary" data-act="runTrend" ${trend.loading ? 'disabled' : ''}>${trend.loading ? '⏳ Đang quét…' : '🔍 Quét'}</button>
        <span class="note">~${est} đơn vị · hôm nay đã dùng ${fmt(q.used)}/${fmt(q.limit)}</span></div></div>`;
    let body;
    if (trend.loading) body = '<div class="card placeholder"><div class="ph-ico">⏳</div><h2>Đang quét YouTube…</h2><div>Tìm video, tính điểm nổ và nhờ AI dịch + phân loại tiêu đề. Thường mất 20–60 giây.</div></div>';
    else if (trend.error) body = `<div class="card placeholder"><div class="ph-ico">⚠️</div><h2>Chưa quét được</h2><div>${esc(trend.error)}</div></div>`;
    else if (trend.result) body = trendResults(trend.result);
    else body = '<div class="card placeholder"><div class="ph-ico">🔥</div><h2>Chọn ngách, thị trường và bấm Quét</h2><div>Từ khoá mặc định là tên ngách; anh gõ từ khoá khác thì app ưu tiên từ khoá anh gõ. Gõ tới đâu hiện gợi ý của YouTube tới đó.</div></div>';
    return bar + body;
  }
  function pageTrendsSwitch() { return apiOk() ? pageTrendsReal() : trendNeedApi(); }
  async function loadTrendScan(id, quiet) {
    try {
      const r = await apiCall('/api/scan/get?id=' + encodeURIComponent(id));
      trend.result = r; trend.error = '';
      trend.niche = r.params.niche || trend.niche; trend.market = r.params.market; trend.type = r.params.type; trend.days = r.params.days;
      trend.kw = r.params.keyword === r.params.niche ? null : r.params.keyword;
      if (r.quota && api) api.quota = r.quota;
    } catch (e) { if (!quiet) trend.error = e.message; }
    render();
  }
  async function runTrend(force) {
    const niche = ($('#tr-niche').value || '').trim(), kw = ($('#tr-kw').value || '').trim();
    trend.niche = niche; trend.kw = kw; trend.market = $('#tr-market').value; trend.type = $('#tr-type').value;
    if (!niche && !kw) { toast('Hãy chọn hoặc gõ ngách (hoặc từ khoá) để quét.'); return; }
    store.set('qlk_tr_niche', niche); store.set('qlk_tr_market', trend.market);
    trend.loading = true; trend.error = ''; render();
    try {
      const res = await apiCall('/api/scan', { niche, market: trend.market, keyword: kw, type: trend.type, days: trend.days, force: !!force });
      trend.result = res;
      if (res.quota && api) api.quota = res.quota;
      store.set('qlk_tr_last', res.id);
      await loadLibrary();
      trend.kw = null;
      toast(res.fromCache ? 'Kết quả đã quét trong 6 giờ qua (không tốn thêm hạn mức)' : `Quét xong · tốn ${res.quotaUsedByScan} đơn vị hạn mức`);
    } catch (e) { trend.error = e.message; }
    trend.loading = false; render();
  }
  let sugTimer = null;
  function trendSuggest(val) {
    clearTimeout(sugTimer);
    sugTimer = setTimeout(async () => {
      if (val.trim().length < 2) return;
      try { const j = await apiCall('/api/suggest?q=' + encodeURIComponent(val.trim()) + '&market=' + trend.market); const dl = $('#tr-sug'); if (dl) dl.innerHTML = j.suggestions.map((s) => `<option value="${esc(s)}">`).join(''); } catch (e) { /* bỏ qua */ }
    }, 250);
  }
  async function addRivalFromScan(v) {
    const [cid, niche, market] = v.split('|');
    try {
      const r = await apiCall('/api/rivals/add', { channelId: cid, niche, market });
      toast(r.existed ? 'Kênh này đã có trong danh sách đối thủ' : `Đã thêm “${r.title}” vào đối thủ (ngách ${niche || '—'} · ${MARKETS[market]})`);
      await loadRivals(); render();
    } catch (e) { toast(e.message); }
  }

  // ================= Dashboard + thông báo (nhấp vào = đã đọc; đã đọc nằm trong lịch sử) =================
  let notifs = [];
  const vnDate = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const SECTIONS = [['mine', '🧑‍💼 Kênh của mình'], ['rival', '🎯 Kênh đối thủ'], ['trend', '🔥 Trend thị trường'], ['system', '⚙️ Hệ thống']];
  const SEV = { bad: '🔴', warn: '🟠', info: '🔵' };
  const sinceTxt = (iso) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000)); return m < 60 ? `${m} phút trước` : m < 1440 ? `${Math.round(m / 60)} giờ trước` : `${Math.round(m / 1440)} ngày trước`; };
  const unreadCount = () => notifs.filter((n) => !n.readAt).length;
  // Thông báo dựa trên TRẠNG THÁI hiện tại (mỗi ngày một thông báo cho mỗi vấn đề)
  function stateItems() {
    const d = vnDate(), now = new Date(), items = [];
    if (realOwn) {
      D.OWN.forEach((c) => {
        const h = health(c);
        if (h.level >= 1) items.push({ key: `health:${c.id}:${d}:${h.level}`, section: 'mine', kind: 'health', severity: h.level === 2 ? 'bad' : 'warn', title: `${c.name}: ${h.level === 2 ? 'cần xử lý' : 'cần theo dõi'}`, body: h.reasons.map((r) => r.t).join('\n'), link: { type: 'hash', href: `#/channel/${c.id}` } });
        const g1 = gain(c.views, 1), avg = (c.views[N - 2] - c.views[N - 16]) / 14;
        if (avg > 20 && g1 > avg * 3) items.push({ key: `swing:${c.id}:${d}:views-up`, section: 'mine', kind: 'swing', severity: 'info', title: `${c.name}: lượt xem tăng đột biến`, body: `+${fmt(g1)} trong ngày (thường ~${fmt(avg)}/ngày)`, link: { type: 'hash', href: `#/channel/${c.id}` } });
        if (gain(c.subs, 1) < 0) items.push({ key: `swing:${c.id}:${d}:subs-down`, section: 'mine', kind: 'swing', severity: 'warn', title: `${c.name}: mất subscriber`, body: `${signed(gain(c.subs, 1))} trong ngày`, link: { type: 'hash', href: `#/channel/${c.id}` } });
        // Doanh thu / RPM tụt mạnh (7 ngày gần nhất so với 7 ngày trước đó)
        const rv = c.revenue;
        if (rv && rv.state === 'ok' && rv.prev7 >= 1 && rv.d7 < rv.prev7 * 0.6) {
          const drop = Math.round((1 - rv.d7 / rv.prev7) * 100);
          items.push({ key: `rev:${c.id}:${d}:${drop >= 60 ? 'bad' : 'warn'}`, section: 'mine', kind: 'revenue', severity: drop >= 60 ? 'bad' : 'warn', title: `${c.name}: doanh thu 7 ngày giảm ${drop}%`, body: `${money(rv.d7)} so với ${money(rv.prev7)} tuần trước${rv.rpm7 != null && rv.rpm28 != null ? ` · RPM 7 ngày ${money(rv.rpm7)} (28 ngày: ${money(rv.rpm28)})` : ''}`, link: { type: 'hash', href: `#/channel/${c.id}` } });
        }
        // Video bị lỗi tải lên / bị từ chối
        c.videoList.filter((v) => ['failed', 'rejected', 'deleted'].includes(v.upload)).slice(0, 3).forEach((v) => items.push({ key: `vidfail:${c.id}:${v.id}:${v.upload}`, section: 'mine', kind: 'video', severity: 'bad', title: `${c.name}: video ${v.upload === 'rejected' ? 'bị từ chối' : v.upload === 'failed' ? 'tải lên lỗi' : 'đã bị xoá'}`, body: `${v.title}${v.rejection ? ' — lý do: ' + v.rejection : ''}`, link: v.url ? { type: 'url', href: v.url } : { type: 'hash', href: `#/channel/${c.id}` } }));
      });
      todayTasks().forEach((t) => {
        const s = taskState(t, now);
        if (s.k !== 'late' && s.k !== 'due') return;
        items.push({ key: `task:${t.key}:${d}:${s.k}`, section: 'mine', kind: 'task', severity: s.k === 'late' ? 'bad' : 'warn', title: `${t.c.name}: ${t.kind === 'video' ? `đăng video ${t.t}` : 'bài cộng đồng'} — ${s.label.toLowerCase()}`, body: 'Bấm để mở Trạm đăng bài', link: { type: 'hash', href: '#/schedule' } });
      });
    }
    if (api) {
      if (api.apiKey && api.apiKey.state === 'error') items.push({ key: `sys:yt:${d}`, section: 'system', kind: 'api', severity: 'bad', title: 'YouTube Data API v3 báo lỗi', body: api.apiKey.message, link: { type: 'hash', href: '#/settings' } });
      if (api.ai && api.ai.state === 'error') items.push({ key: `sys:ai:${d}`, section: 'system', kind: 'api', severity: 'warn', title: 'API 9Router báo lỗi', body: api.ai.message, link: { type: 'hash', href: '#/settings' } });
      if (api.quota && api.quota.used >= 8000) items.push({ key: `sys:quota:${d}:${api.quota.used >= 10000 ? 'full' : 'high'}`, section: 'system', kind: 'quota', severity: api.quota.used >= 10000 ? 'bad' : 'warn', title: api.quota.used >= 10000 ? 'Đã hết hạn mức YouTube hôm nay' : 'Hạn mức YouTube sắp hết', body: `Đã dùng ${fmt(api.quota.used)}/${fmt(api.quota.limit)} đơn vị. Làm mới lúc ${fmtVN(api.quota.resetAt)} (giờ VN).`, link: { type: 'hash', href: '#/settings' } });
      const bad = api.update && api.update.last ? api.update.last.steps.filter((s) => s.state === 'error') : [];
      if (bad.length) items.push({ key: `sys:update:${d}`, section: 'system', kind: 'update', severity: 'warn', title: `Cập nhật tự động có ${bad.length} bước lỗi`, body: bad.map((s) => `• ${s.name}: ${s.msg}`).join('\n'), link: { type: 'hash', href: '#/settings' } });
    }
    // Quyền kênh sắp hết hạn (dự án còn ở chế độ Testing): báo trước để kết nối lại, khỏi mất số liệu
    conns.filter((c) => !c.needsReauth && c.expiresAt).forEach((c) => {
      const left = (new Date(c.expiresAt) - Date.now()) / 86400000;
      if (left <= 3) items.push({ key: `sys:expiry:${c.id}:${d}`, section: 'system', kind: 'oauth', severity: left <= 1 ? 'bad' : 'warn', title: `Kênh “${c.title}”: quyền kết nối ${left <= 0 ? 'đã quá hạn 7 ngày' : `còn ${Math.ceil(left)} ngày`}`, body: 'Dự án Google còn ở chế độ Testing nên quyền hết hạn sau 7 ngày. Kết nối lại kênh (hoặc Publish app rồi đánh dấu trong Cài đặt).', link: { type: 'hash', href: '#/settings' } });
    });
    conns.filter((c) => c.needsReauth).forEach((c) => items.push({ key: `sys:reauth:${c.id}:${d}`, section: 'system', kind: 'oauth', severity: 'bad', title: `Kênh “${c.title}” cần kết nối lại`, body: 'Quyền truy cập đã hết hạn hoặc bị thu hồi.', link: { type: 'hash', href: '#/settings' } }));
    return items;
  }
  async function refreshNotifs() {
    try { notifs = (await apiCall('/api/notifications/sync', { items: stateItems() })).items; } catch (e) { return; }
    updateNavBadge();
    if ((location.hash || '#/dashboard').startsWith('#/dashboard') && idle()) render();
  }
  async function openNotif(key) {
    const n = notifs.find((x) => x.key === key);
    if (!n) return;
    if (!n.readAt) { n.readAt = new Date().toISOString(); apiCall('/api/notifications/read', { key }).catch(() => {}); }
    updateNavBadge();
    if (n.link && n.link.type === 'url') { window.open(n.link.href, '_blank', 'noopener'); render(); return; }
    if (n.link && n.link.href && location.hash !== n.link.href) { location.hash = n.link.href; return; }
    render();
  }
  const notifBtn = (n, read) => `<button class="n-row ${read ? 'read' : ''}" data-act="notif" data-v="${esc(n.key)}"><span class="n-dot"></span><span class="n-main"><b>${esc(n.title)}</b>${n.body ? `<small>${esc(n.body).replace(/\n/g, '<br>')}</small>` : ''}</span><span class="n-time">${read ? 'đã đọc ' + sinceTxt(n.readAt) : sinceTxt(n.createdAt)}</span></button>`;
  // ---------- Bản tin buổi sáng ----------
  const STOP = new Set(('that with this from your what when they their have will into about video videos official full episode nuevo nueva nuevos nuevas para como entre sobre desde hasta todo todos todas este esta estos estas cuando donde porque pero mas muy unos unas los las del con por que ante tras segun mais quando essa esse isso uma dos das nao pelo pela seu sua ainda depois antes despues real vida world best most only ever just like more than then them these those been being were was are and the for you not but his her its our out who how why can').split(/\s+/));
  const kwTokens = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w));
  const dChip = (p) => (p == null || !isFinite(p) ? '' : `<span class="d ${p < 0 ? 'neg' : ''}">${p >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(p))}%</span>`);
  const pctChange = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);
  const dashOwn = () => D.OWN.filter((c) => state.dashNiche === 'all' || c.niche === state.dashNiche);

  // days: 7 | 28 | 90 — mảng views/subs chỉ lưu N=90 ngày gần nhất nên mốc 90 tự giới hạn còn N-1 ngày, và không đủ dữ liệu để so "kỳ trước" (cần 180 ngày).
  function chMetrics(c, days) {
    const ok = revOk(c), rv = c.revenue;
    const revKey = days === 7 ? 'd7' : days === 28 ? 'd28' : 'd90';
    const rpmKey = days === 7 ? 'rpm7' : days === 28 ? 'rpm28' : 'rpm90';
    const revPrevKey = days === 7 ? 'prev7' : days === 28 ? 'prev28' : null;
    const gd = Math.min(days, N - 1);
    const prevOk = N - 1 - gd * 2 >= 0;
    const vp = prevOk ? c.views[N - 1 - gd] - c.views[N - 1 - gd * 2] : null;
    return { c, days, rev: ok ? rv[revKey] : null, revPrev: ok && revPrevKey ? rv[revPrevKey] : null, rpm: ok ? rv[rpmKey] : null, v: gain(c.views, gd), vp, s: gain(c.subs, gd), h: health(c) };
  }

  // Video của mình đang bứt phá: lượt xem/ngày trong 7 ngày gần nhất so với mức thường của chính kênh (trung vị)
  function ownBreakouts(own) {
    const out = [];
    own.forEach((c) => {
      const rate = (v) => v.v7 / Math.min(7, Math.max(1, ageDays(v)));
      const base = c.videoList.filter((v) => v.v7 != null && v.v7 > 0 && ageDays(v) >= 3).map(rate).sort((a, b) => a - b);
      if (base.length < 4) return;
      const med = base[Math.floor(base.length / 2)] || 1;
      c.videoList.forEach((v) => {
        if (v.v7 == null || v.v7 < 50) return;
        const x = rate(v) / med, growth = v.p7 > 0 ? (v.v7 / v.p7 - 1) * 100 : null;
        // "Bứt phá" = đang TĂNG so với tuần trước (không phải video chỉ cao đều), hoặc video mới đăng (≤14 ngày) vượt mức thường của kênh
        const rising = growth != null ? growth >= 50 && v.v7 >= 100 : v.v7 >= 200;
        const fresh = ageDays(v) <= 14 && x >= VIRAL_X;
        if (rising || fresh) out.push({ c, v, x, growth });
      });
    });
    return out.sort((a, b) => (b.growth == null ? b.x * 100 : b.growth) - (a.growth == null ? a.x * 100 : a.growth)).slice(0, 6);
  }
  function ownBreakoutCard(own) {
    const title = '<span>🚀 Video của mình đang bứt phá</span><span class="r"><i class="chev">▾</i></span>';
    if (!own.some((c) => c.videoList.some((v) => v.v7 != null))) return dashSection('ownBreakout', 'dcard', title, '<div class="dempty">Chưa có số liệu 7 ngày của video. Bấm “Đồng bộ” ở Cài đặt để lấy.</div>');
    const list = ownBreakouts(own);
    const rows = list.map((o) => `<tr class="click" data-go="#/video/${esc(o.c.id)}/${esc(o.v.id)}"><td class="l vt" title="${esc(o.v.title)}">${esc(o.v.title)}</td><td class="l note">${esc(o.c.name)}</td><td class="big">${fmt(o.v.v7)}</td><td><span class="hb ok"><i></i>${o.x > 100 ? '>×100' : '×' + xTag(o.x)}</span></td><td>${o.growth != null ? dChip(o.growth) : '<span class="note">mới</span>'}</td><td>${o.v.rev28 != null ? money(o.v.rev28) : '—'}</td></tr>`).join('');
    const titleWithSub = '<span>🚀 Video của mình đang bứt phá</span><span class="r">7 ngày qua, so mức thường của kênh <i class="chev">▾</i></span>';
    return dashSection('ownBreakout', 'dcard', titleWithSub,
      list.length ? `<div class="tablewrap"><table><thead><tr><th class="l">Video</th><th class="l">Kênh</th><th>Lượt xem 7 ngày</th><th>So mức thường</th><th>So tuần trước</th><th>Doanh thu 28 ngày</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="dempty">Chưa có video nào đang tăng mạnh (từ +50% so với tuần trước) hoặc video mới vượt mức thường. Khi có, nó sẽ hiện ở đây.</div>');
  }

  // Đối thủ đang nổ có CÙNG TỪ KHOÁ với các video mạnh của mình
  function rivalKeywordHits(own) {
    if (!realRivals) return null;
    const kw = new Map();
    own.forEach((c) => c.videoList.slice().sort((a, b) => b.views - a.views).slice(0, 12).forEach((v) => new Set(kwTokens(v.title)).forEach((w) => kw.set(w, (kw.get(w) || 0) + 1))));
    const rivals = activeRivals().filter((r) => state.dashNiche === 'all' || r.niche === state.dashNiche || !own.length);
    return hits(rivals, 14).map((o) => ({ ...o, shared: [...new Set(kwTokens(o.v.title))].filter((w) => kw.has(w)).sort((a, b) => kw.get(b) - kw.get(a)).slice(0, 4) })).filter((o) => o.shared.length >= 2).slice(0, 6);
  }
  function rivalKeywordCard(own) {
    const list = rivalKeywordHits(own);
    const title = '<span>🎯 Đối thủ đang nổ cùng từ khoá với mình</span><span class="r">14 ngày qua · từ 2 từ khoá chung trở lên <i class="chev">▾</i></span>';
    if (list == null) return dashSection('rivalKeyword', 'dcard', title, '<div class="dempty">Chưa theo dõi đối thủ thật nào. Thêm đối thủ ở YouTube Channel Tracker.</div>');
    const rows = list.map((o) => `<tr>
      <td>${o.v.thumb ? `<a href="${esc(o.v.url)}" target="_blank" rel="noopener"><img class="trthumb" src="${esc(o.v.thumb)}" alt="" loading="lazy"></a>` : ''}</td>
      <td class="l vt"><a href="${esc(o.v.url)}" target="_blank" rel="noopener" title="${esc(o.v.title)}">${esc(o.v.title)}</a></td>
      <td class="l note"><a href="https://www.youtube.com/channel/${esc(o.c.id)}" target="_blank" rel="noopener">${esc(o.c.name)}</a></td>
      <td class="l">${o.shared.map((w) => `<span class="tag">${esc(w)}</span>`).join(' ')}</td>
      <td class="l"><span class="tag">${esc(o.c.niche)}</span></td>
      <td class="big">${fmt(o.v.views)}</td>
      <td><span class="hb ok"><i></i>×${xTag(o.x)}</span></td></tr>`).join('');
    window.__dashHitTitles = list.map((o) => o.v.title);
    return dashSection('rivalKeyword', 'dcard', title, list.length ? `<div class="tablewrap"><table><thead><tr><th></th><th class="l">Video đối thủ</th><th class="l">Kênh</th><th class="l">Từ khoá chung</th><th class="l">Ngách</th><th>Lượt xem</th><th>So mức thường</th></tr></thead><tbody>${rows}</tbody></table></div><div style="padding:8px 14px"><button class="btn sm" data-act="copyDashHits">Copy tiêu đề</button></div>` : '<div class="dempty">Chưa có video đối thủ nào đang nổ trùng từ 2 khoá chung trở lên với video mạnh của mình.</div>');
  }

  function kpiStrip(own) {
    const ms = own.map((c) => chMetrics(c, 7));
    const sum = (f) => ms.reduce((t, m) => t + (f(m) || 0), 0);
    const okRev = ms.filter((m) => m.rev != null);
    const rev7 = okRev.reduce((t, m) => t + m.rev, 0), revPrev = okRev.reduce((t, m) => t + (m.revPrev || 0), 0);
    const rv28 = own.filter(revOk).reduce((t, c) => t + c.revenue.d28, 0), vw28 = own.filter(revOk).reduce((t, c) => t + (c.revenue.vw28 || 0), 0);
    const v7 = sum((m) => m.v), vp = sum((m) => m.vp);
    const bad = ms.filter((m) => m.h.level === 2).length, warn = ms.filter((m) => m.h.level === 1).length;
    const card = (k, v, d, sub) => `<div class="card stat"><div class="k">${k}</div><div class="v">${v}${d || ''}</div>${sub ? `<div class="note" style="font-size:11.5px;margin-top:2px">${sub}</div>` : ''}</div>`;
    return `<div class="stats">
      ${card('Doanh thu 7 ngày (ước tính)', okRev.length ? money(rev7) : '—', okRev.length ? dChip(pctChange(rev7, revPrev)) : '', okRev.length ? `tuần trước ${money(revPrev)} · ${okRev.length}/${ms.length} kênh có số` : 'Chưa kênh nào cấp quyền doanh thu')}
      ${card('RPM 28 ngày', vw28 > 0 ? money((rv28 / vw28) * 1000) : '—', '', 'doanh thu trên 1.000 lượt xem')}
      ${card('Lượt xem 7 ngày', fmt(v7), dChip(pctChange(v7, vp)), `tuần trước ${fmt(vp)}`)}
      ${card('Subscriber 7 ngày', signed(sum((m) => m.s7)), '', `${ms.length} kênh`)}
      ${card('Kênh cần chú ý', `${bad + warn}`, '', `${bad} cần xử lý · ${warn} cần theo dõi`)}</div>`;
  }

  function rankingCard(own) {
    const days = state.dashRange || 7;
    const ms = own.map((c) => chMetrics(c, days));
    const key = { rev: (m) => (m.rev == null ? -1 : m.rev), rpm: (m) => (m.rpm == null ? -1 : m.rpm), views: (m) => m.v, subs: (m) => m.s, growth: (m) => (m.vp > 0 ? m.v / m.vp : 0) }[state.dashSort] || ((m) => m.v);
    const sorted = ms.slice().sort((a, b) => key(b) - key(a));
    const cut = sorted.length > 10 && !state.dashRankAll;
    const row = (m) => `<tr class="click" data-go="#/channel/${esc(m.c.id)}"><td class="l"><div class="chan">${avatar(m.c)}<div class="n">${esc(m.c.name)}</div></div></td>
      <td class="l">${nicheTag(m.c.niche)}</td><td class="l">${managerBadge(m.c)}</td>
      <td>${m.rev != null ? `<span class="big">${money(m.rev)}</span>${dChip(pctChange(m.rev, m.revPrev))}` : '<span class="note">—</span>'}</td><td>${m.rpm != null ? money(m.rpm) : '—'}</td>
      <td><span class="big">${fmt(m.v)}</span>${dChip(pctChange(m.v, m.vp))}</td><td>${signed(m.s)}</td><td>${spark(m.c.views.slice(-(days + 1)), '#22c1a5')}</td><td class="l">${hBadge(m.h)}</td></tr>`;
    const body = cut ? sorted.slice(0, 5).map(row).join('') + `<tr><td colspan="9" class="l note" style="text-align:center">… ${sorted.length - 10} kênh ở giữa …</td></tr>` + sorted.slice(-5).map(row).join('') : sorted.map(row).join('');
    const opts = [['rev', 'Doanh thu'], ['rpm', 'RPM'], ['views', 'Lượt xem'], ['subs', 'Sub'], ['growth', 'Tăng trưởng lượt xem']];
    const rangeChips = [7, 28, 90].map((n) => `<button class="chip ${days === n ? 'on' : ''}" data-act="dashRange" data-v="${n}">${n} ngày</button>`).join('');
    const title = `<span>🏆 Xếp hạng kênh${cut ? ' <span class="note">(5 tốt nhất và 5 kém nhất)</span>' : ''}</span><span class="r"><span onclick="event.preventDefault()"><div class="chips">${rangeChips}</div><select data-act="dashSort">${opts.map(([k, l]) => `<option value="${k}" ${state.dashSort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>${sorted.length > 10 ? `<button class="btn sm" data-act="dashRankAll">${state.dashRankAll ? 'Thu gọn' : 'Xem tất cả'}</button>` : ''}</span> <i class="chev">▾</i></span>`;
    return dashSection('ranking', 'dcard', title,
      `<div class="tablewrap"><table><thead><tr><th class="l">Kênh</th><th class="l">Chủ đề</th><th class="l">Người quản lý</th><th>Doanh thu ${days} ngày</th><th>RPM ${days} ngày</th><th>Lượt xem ${days} ngày</th><th>Sub ${days} ngày</th><th>Xu hướng ${days} ngày</th><th class="l">Tình trạng</th></tr></thead><tbody>${body || '<tr><td colspan="9" class="l note">Chưa có kênh nào.</td></tr>'}</tbody></table></div>
      ${days === 90 ? '<p class="note" style="padding:8px 16px 12px">% so kỳ trước chỉ có ở mốc 7 và 28 ngày — mốc 90 ngày cần 180 ngày dữ liệu để so nên chưa tính được, chỉ hiện số tuyệt đối.</p>' : ''}`);
  }

  function todayCard(own) {
    const ids = new Set(own.map((c) => c.id)), now = new Date();
    const tasks = todayTasks().filter((t) => ids.has(t.c.id)).map((t) => ({ t, s: taskState(t, now) }));
    const left = tasks.filter((x) => !['done', 'skip'].includes(x.s.k));
    const order = { late: 0, due: 1, soon: 2, todo: 3 };
    const rows = left.sort((a, b) => order[a.s.k] - order[b.s.k]).slice(0, 6).map((x) => `<div class="n-row" style="cursor:default"><span class="n-dot" style="background:${x.s.k === 'late' ? 'var(--red)' : x.s.k === 'due' ? 'var(--amber)' : 'var(--muted)'}"></span><span class="n-main"><b>${esc(x.t.c.name)}: ${x.t.kind === 'video' ? `đăng video ${esc(x.t.t)}` : `bài cộng đồng${x.t.of > 1 ? ` (${x.t.idx}/${x.t.of})` : ''}`}</b></span><span class="n-time">${esc(x.s.label)}</span></div>`).join('');
    // video đã hẹn giờ đăng trong 48 giờ tới
    const sched2 = own.flatMap((c) => c.videoList.filter((v) => v.privacy === 'private' && v.publishAt && new Date(v.publishAt) > now && new Date(v.publishAt) - now < 48 * 3600e3).map((v) => ({ c, v })));
    const srows = sched2.slice(0, 4).map((o) => `<div class="n-row" style="cursor:default"><span class="n-dot" style="background:var(--accent)"></span><span class="n-main"><b>${esc(o.c.name)}: video đã hẹn giờ</b><small>${esc(o.v.title)}</small></span><span class="n-time">${fmtVN(o.v.publishAt)}</span></div>`).join('');
    return dashSection('today', 'dcard', `<span>📅 Lịch hôm nay</span><span class="r">${tasks.length - left.length}/${tasks.length} việc đã xong · <a href="#/schedule" style="text-decoration:underline" onclick="event.preventDefault();location.hash='#/schedule'">Mở Trạm đăng bài</a> <i class="chev">▾</i></span>`,
      `<div class="ntf">${rows || (tasks.length ? '<div class="dempty">Xong hết việc hôm nay 🎉</div>' : '<div class="dempty">Chưa đặt lịch đăng cho kênh nào.</div>')}${srows}</div>`);
  }

  // Bảng "hôm nay" cho các kênh của mình — subs/views hôm nay, video mới, cờ cần chú ý
  function ownTodayCard(own) {
    if (!own.length) return '';
    const rows = own.map((c) => {
      const h = health(c);
      return `<tr class="click" data-go="#/channel/${esc(c.id)}">
        <td class="l"><div class="chan">${avatar(c)}<div class="n">${esc(c.name)}</div></div></td>
        <td class="l">${nicheTag(c.niche)}</td>
        <td class="l">${managerBadge(c)}</td>
        <td>${deltaCell(gain(c.subs, 1))}</td>
        <td class="big">${fmt(gain(c.views, 1))}</td>
        <td class="l">${c.noPost ? '<span class="hb plain"><i></i>⏸ Đã ngừng đăng</span>' : hBadge(h)}</td>
      </tr>`;
    }).join('');
    return dashSection('ownToday', 'dcard', '<span>📺 Kênh của anh — hôm nay</span><span class="r"><i class="chev">▾</i></span>',
      `<div class="tablewrap"><table><thead><tr><th class="l">Kênh</th><th class="l">Chủ đề</th><th class="l">Người quản lý</th><th>Subs hôm nay</th><th>Views hôm nay</th><th class="l">Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  // Báo cáo theo từng ngách: mỗi ngách 1 vùng riêng, không gộp chung nên không còn bỏ sót đối thủ ở ngách khác
  function nicheZoneGroups() {
    const rivals = allRivals();
    const niches = [...new Set([...D.OWN.map((c) => c.niche), ...rivals.map((c) => c.niche)])].filter((n) => n && n !== NO_NICHE && !isNichePaused(n));
    const filtered = state.dashNiche === 'all' ? niches : niches.filter((n) => n === state.dashNiche);
    return filtered.map((n) => ({ niche: n, own: D.OWN.filter((c) => c.niche === n), rivals: rivals.filter((c) => c.niche === n) }));
  }
  function nicheZoneCard(g) {
    const tagHtml = (g.own.length ? '<span class="tag mine">Ngách của anh</span>' : '<span class="tag">Đang dò</span>');
    const ownNote = g.own.length ? g.own.map((c) => esc(c.name) + (c.noPost ? ' (⏸)' : '')).join(', ') : 'chưa có kênh sở hữu';
    const id = 'niche:' + g.niche;
    if (g.own.length && !g.rivals.length) {
      return dashSection(id, 'dcard nichezone', `<span>${esc(g.niche)} ${tagHtml}</span><span class="r">${ownNote} · 0 đối thủ <i class="chev">▾</i></span>`,
        `<div class="dempty">Ngách này chưa theo dõi đối thủ nào — thêm đối thủ để so sánh tăng trưởng.<br><a class="btn sm primary" href="#/tracker" style="margin-top:8px;display:inline-block">+ Thêm đối thủ</a></div>`);
    }
    const v7Sum = g.rivals.reduce((t, c) => t + gain(c.views, 7), 0);
    const vpSum = g.rivals.reduce((t, c) => t + (c.views[N - 8] - c.views[N - 15]), 0);
    return dashSection(id, 'dcard nichezone', `<span>${esc(g.niche)} ${tagHtml}</span><span class="r">${ownNote} · ${g.rivals.length} đối thủ <i class="chev">▾</i></span>`,
      `<div class="section-title"><span class="note">Tổng lượt xem 7 ngày (${g.rivals.length} kênh)</span><span class="r"><b>${fmt(v7Sum)}</b> ${dChip(pctChange(v7Sum, vpSum))}</span></div>`);
  }
  function nicheZonesCard() {
    const groups = nicheZoneGroups();
    if (!groups.length) return '';
    return `<div class="dsec">🗂 Báo cáo theo ngách</div><div class="nichegrid">${groups.map(nicheZoneCard).join('')}</div>`;
  }

  function pageDashboard() {
    const un = notifs.filter((n) => !n.readAt);
    const sevRank = { bad: 0, warn: 1, info: 2 };
    const by = (s) => un.filter((n) => n.section === s).sort((a, b) => (sevRank[a.severity] - sevRank[b.severity]) || (a.createdAt < b.createdAt ? 1 : -1));
    const up = api && api.update, q = api && api.quota;
    // Một danh sách duy nhất, chia nhóm bằng dòng nhãn nhỏ; chỉ hiện nhóm có thông báo mới.
    const secHtml = SECTIONS.map(([k, l]) => {
      const list = by(k);
      if (!list.length) return '';
      const all = state.dashAll && state.dashAll[k], shown = all ? list : list.slice(0, 8);
      return `<div class="n-sec">${l} · ${list.length}</div>${shown.map((n) => notifBtn(n, false)).join('')}${list.length > shown.length ? `<button class="n-more" data-act="dashMore" data-v="${k}">Xem thêm ${list.length - shown.length} thông báo</button>` : ''}`;
    }).join('');
    const hf = state.histFilter || 'all';
    const hist = notifs.filter((n) => hf === 'all' || n.section === hf).sort((a, b) => ((b.readAt || b.createdAt) > (a.readAt || a.createdAt) ? 1 : -1)).slice(0, 80);
    const niches = [...new Set(D.OWN.map((c) => c.niche))].filter((n) => n && n !== NO_NICHE);
    const filter = realOwn && niches.length > 1 ? `<select data-act="dashNiche"><option value="all">Mọi ngách</option>${niches.map((n) => `<option value="${esc(n)}" ${state.dashNiche === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>` : '';
    const own = realOwn ? dashOwn() : [];
    const briefTitle = realOwn && own.length ? '🔔 Cần xử lý ngay' : '🔔 Thông báo';
    const brief = dashSection('notif', 'ntf', `<span>${briefTitle}</span><span class="r"><i class="chev">▾</i></span>`, secHtml || '<div class="dempty">Không có thông báo mới 🎉</div>');
    const top = realOwn && own.length ? ownTodayCard(own) : '';
    const after = realOwn && own.length
      ? ownBreakoutCard(own) + nicheZonesCard() + rivalKeywordCard(own) + rankingCard(own) + todayCard(own)
      : '<div class="card dcard"><div class="dempty">Kết nối kênh thật để thấy bản tin: doanh thu, video bứt phá, báo cáo theo ngách, xếp hạng kênh.</div></div>';
    return head('📊', 'Bản tin buổi sáng', `${new Date().toLocaleDateString('vi-VN')} · ${un.length ? `${un.length} thông báo mới` : 'không có thông báo mới'}`, `${filter}<span class="note">Cập nhật gần nhất ${up && up.last ? fmtVN(up.last.at) : 'chưa có'} · kế tiếp ${up ? fmtVN(up.nextRunAt) : '08:30'}${q ? ` · hạn mức ${fmt(q.used)}/${fmt(q.limit)}` : ''}</span>`) + apiBanner() + top + brief +
      `${after}
      <details class="card dhist" ${state.histOpen ? 'open' : ''}><summary>Lịch sử thông báo (${notifs.length})<select data-act="histFilter" onclick="event.stopPropagation()"><option value="all" ${hf === 'all' ? 'selected' : ''}>Tất cả</option>${SECTIONS.map(([k, l]) => `<option value="${k}" ${hf === k ? 'selected' : ''}>${l}</option>`).join('')}</select></summary>
        <div class="ntf">${hist.length ? hist.map((n) => notifBtn(n, !!n.readAt)).join('') : '<div class="dempty">Chưa có thông báo nào.</div>'}</div></details>`;
  }

  // ---------- Router ----------
  const NAV = [['#/dashboard', 'Dashboard', 'dashboard'], ['#/channels', 'Quản lý Kênh', 'channels'], ['#/schedule', 'Quản lý Giờ đăng', 'schedule'], ['#/tracker', 'YouTube Channel Tracker', 'tracker'], ['#/settings', 'Cài đặt', 'settings']];
  function render() {
    const hash = location.hash || '#/dashboard';
    const [, route, arg, arg2] = hash.split('/');
    let html, active = route;
    if (route === 'channel') {
      html = pageDetail(arg);
      const c = findChan(arg);
      active = c && c.kind === 'rival' ? 'tracker' : 'channels';
    } else if (route === 'video') {
      active = 'channels';
      if (realOwn && findChan(arg)) ensureVideoReport(arg, arg2);
      html = pageVideo(arg, arg2);
    } else if (route === 'tracker') {
      if (arg === 'trend') {
        state.tab = 'trends';
        if (arg2 && !trend.loading && trend.linkLoaded !== arg2 && !(trend.result && trend.result.id === arg2)) { trend.linkLoaded = arg2; trend.tried = true; loadTrendScan(arg2); }
      }
      html = pageTracker();
    } else if (route === 'channels') { html = pageChannels(); }
    else if (route === 'schedule') html = pageSchedule();
    else if (route === 'settings') html = pageSettings();
    else { html = pageDashboard(); active = 'dashboard'; }
    $('#nav').innerHTML = NAV.map(([h, l, k]) => `<a href="${h}" class="${active === k ? 'on' : ''}">${l}</a>`).join('');
    updateNavBadge();
    $('#app').innerHTML = html;
    document.title = 'Quản lý Kênh';
  }

  // ---------- Popup / toast ----------
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.hidden = true), 3200);
  }
  function modal(html) { const m = $('#modal'); m.innerHTML = `<div class="card modal">${html}</div>`; m.hidden = false; }
  function closeModal() { $('#modal').hidden = true; if (typeof cmt !== 'undefined') cmt.open = false; }

  function openAddRival(prefill) {
    const niches = [...new Set(D.OWN.concat(allRivals()).map((c) => c.niche))];
    const real = apiOk();
    modal(`<h3>Nạp đối thủ</h3><div class="note">Dán link kênh YouTube (mỗi dòng một link) và điền ngách${real ? ' + thị trường' : ''}.</div>
      <label>Link kênh đối thủ</label><textarea id="m-links" placeholder="https://www.youtube.com/@ten-kenh"></textarea>
      <label>Niche (ngách)</label><input id="m-niche" type="text" list="m-niches" placeholder="Ví dụ: Stoic" value="${esc(trend.niche || '')}"><datalist id="m-niches">${niches.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
      ${real ? `<label>Thị trường</label><select id="m-market">${marketOpts(trend.market)}</select>` : ''}
      <div class="err" id="m-err"></div><div class="foot"><button class="btn" data-act="closeModal">Huỷ</button><button class="btn primary" data-act="saveRival">Nạp đối thủ</button></div>`);
    if (typeof prefill === 'string') $('#m-links').value = prefill;
    $('#m-links').focus();
  }
  function parseChannel(url) {
    const m = url.trim().match(/youtube\.com\/(?:@([^\/?#\s]+)|channel\/([^\/?#\s]+)|c\/([^\/?#\s]+)|user\/([^\/?#\s]+))/i);
    if (!m) return null;
    const raw = m[1] || m[2] || m[3] || m[4];
    let name; try { name = decodeURIComponent(raw); } catch (e) { name = raw; }
    return { name, url: url.trim() };
  }
  function saveRival() {
    const links = $('#m-links').value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const niche = $('#m-niche').value.trim();
    const err = $('#m-err');
    if (!links.length) { err.textContent = 'Hãy dán ít nhất một link kênh.'; return; }
    if (!niche) { err.textContent = 'Hãy điền niche (ngách) của đối thủ.'; return; }
    if (apiOk()) {
      err.textContent = 'Đang thêm…';
      apiCall('/api/rivals/add-links', { links, niche, market: $('#m-market').value }).then(async (j) => {
        const ok = j.results.filter((r) => r.ok), bad = j.results.filter((r) => !r.ok);
        await loadRivals(); closeModal(); state.tab = 'rivals'; render();
        toast(`Đã thêm ${ok.filter((r) => !r.existed).length} đối thủ` + (ok.some((r) => r.existed) ? ` (${ok.filter((r) => r.existed).length} đã có sẵn)` : '') + (bad.length ? ` · ${bad.length} link lỗi: ${bad[0].error}` : ''));
      }).catch((er) => { err.textContent = er.message; });
      return;
    }
    const parsed = links.map(parseChannel);
    const bad = links.filter((_, i) => !parsed[i]);
    if (bad.length) { err.textContent = 'Link không hợp lệ: ' + bad[0]; return; }
    const known = allRivals().map((c) => c.name.toLowerCase());
    let added = 0;
    parsed.forEach((p) => {
      if (known.includes(p.name.toLowerCase())) return;
      const h = D.hash(p.name);
      addedRivals.push({
        id: 'rival-' + h.toString(36), name: p.name, niche, url: p.url,
        subs: 3000 + (h % 400000), views: 200000 + (h % 30000000), videos: 40 + (h % 400), growth: 0.03 + (h % 9) / 100,
      });
      known.push(p.name.toLowerCase()); added++;
    });
    store.set('qlk_added', addedRivals);
    closeModal(); state.tab = 'rivals'; render();
    toast(added ? `Đã nạp ${added} đối thủ (số liệu mẫu)` : 'Các kênh này đã có trong danh sách');
  }

  function runScan() {
    const url = $('#sc-url').value.trim();
    const p = parseChannel(url);
    if (!p) { toast('Link kênh chưa đúng. Ví dụ: https://www.youtube.com/@ten-kenh'); return; }
    state.scanUrl = url; state.scanName = p.name; render();
  }
  async function addApiKeyUI() {
    const label = ($('#in-klabel') || {}).value || '';
    const value = (($('#in-key') || {}).value || '').trim();
    if (!value) { toast('Hãy nhập khoá API trước.'); return; }
    apiBusy = true; updatePill();
    try {
      api = await apiCall('/api/keys', { label, value });
      const addedKey = api.addedKey; render();
      if (addedKey) { await testOneKeyUI(addedKey); return; } // tự kiểm tra luôn khoá vừa thêm
      toast('Đã thêm khoá API');
    } catch (e) { toast(e.message); }
    apiBusy = false; updatePill(); render();
  }
  async function testOneKeyUI(id) {
    apiBusy = true; updatePill();
    try {
      api = await apiCall('/api/status?check=' + encodeURIComponent(id));
      const k = (((api && api.quota) || {}).keys || []).find((x) => x.key === id);
      toast(k && k.state === 'ok' ? `${k.label}: kết nối tốt` : `${k ? k.label : 'Khoá'}: ${k ? k.message : 'lỗi'}`);
    } catch (e) { toast(e.message); }
    apiBusy = false; updatePill(); render();
  }
  async function rmApiKeyUI(id) {
    try { api = await apiCall('/api/keys/remove', { key: id }); toast('Đã xoá khoá API'); render(); }
    catch (e) { toast(e.message); }
  }
  async function doAi(body, okMsg) {
    try { api = await apiCall(body.__path || '/api/settings/ai', body.__path ? {} : body); toast(okMsg(api.ai)); }
    catch (e) { toast(e.message); }
    updatePill(); render();
  }
  // ---------- Kênh của anh: số liệu THẬT qua OAuth (thay dữ liệu mẫu khi đã kết nối) ----------
  const REAL_COLORS = ['#7c5cff', '#22c1a5', '#f5a524', '#ef5b7b', '#4aa3ff', '#9bd23c', '#c26bff', '#ff8a4c'];
  let conns = [];
  let realOwn = false;
  const idle = () => { const ae = document.activeElement; return $('#modal').hidden && !(ae && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName)); };
  function updateDemoPill() {
    const p = document.querySelector('.demo-pill');
    p.textContent = realOwn ? 'Kênh của anh: thật · đối thủ: mẫu' : 'Dữ liệu mẫu';
    p.title = realOwn ? 'Số liệu kênh của anh lấy từ YouTube qua OAuth; đối thủ và trend vẫn là dữ liệu mẫu' : 'Chưa nối Google OAuth, số liệu là dữ liệu mẫu';
  }
  async function loadChannels() { try { conns = (await apiCall('/api/channels')).list; } catch (e) { /* bỏ qua */ } }
  async function loadOwn() {
    let arr = [];
    try { arr = await apiCall('/api/own'); } catch (e) { return; }
    if (!arr.length) {
      // Không còn kênh thật nào (ví dụ vừa xoá kênh cuối): quay về dữ liệu mẫu
      if (realOwn) { D.OWN.length = 0; MOCK_OWN.forEach((c) => D.OWN.push(c)); realOwn = false; updateDemoPill(); }
      return;
    }
    const cs = arr.map((o, i) => {
      const max = o.videoList.reduce((m, v) => Math.max(m, v.views), 0);
      return {
        id: o.id, kind: 'own', name: o.name, niche: o.niche, country: o.country, market: o.market || '', gmail: o.gmail || '', where: o.where || '', manager: o.manager || '', color: REAL_COLORS[i % REAL_COLORS.length], videos: o.videos,
        subs: o.subs, views: o.views, comments: o.comments, avgViewDuration: o.avgViewDuration, revenueDaily: o.revenueDaily, rpmDaily: o.rpmDaily, watchMinutesDaily: o.watchMinutesDaily, watchMinutes28: o.watchMinutes28, syncedAt: o.syncedAt, revenue: o.revenue, unanswered: o.unansweredComments, noPost: !!o.noPost,
        videoList: o.videoList.map((v) => ({ ...v, isNew: (Date.now() - new Date(v.date)) / 86400000 <= 2, isTop: max > 0 && v.views === max })),
      };
    });
    D.OWN.length = 0;
    cs.forEach((c) => D.OWN.push(c));
    realOwn = true;
    cs.forEach((c, i) => { if (!sched[c.id]) sched[c.id] = { times: [TIME_POOL[i % TIME_POOL.length]], every: 3, offset: 0, comm: 1, commTime: '' }; });
    store.set('qlk_sched', sched);
    updateDemoPill();
  }
  async function refreshOwn() { await loadChannels(); await loadOwn(); if (idle()) render(); }
  // Bộ OAuth được chọn để kết nối kênh mới (mặc định: bộ còn nhiều suất nhất)
  function chosenClient(cl) {
    const list = cl || (api && api.oauth && api.oauth.clients) || [];
    const el = document.querySelector('#oauth-client');
    const want = (el && el.value) || store.get('qlk_oauth_client', '');
    if (list.some((c) => c.key === want)) return want;
    return list.length ? list.slice().sort((a, b) => a.lifetime - b.lifetime)[0].key : '';
  }
  const connectHint = () => (($('#oauth-hint') || {}).value || '').trim();
  const connQs = () => { const h = connectHint(); return `client=${encodeURIComponent(chosenClient())}${h ? '&hint=' + encodeURIComponent(h) : ''}`; };
  // AN TOÀN: app KHÔNG tự mở trình duyệt của máy này (nó sẽ hiện các Gmail đang đăng nhập ở máy này).
  // Anh copy link rồi dán vào ĐÚNG hồ sơ GPM / trình duyệt VPS đang đăng nhập Gmail của kênh.
  function startConnect() {
    const o = api && api.oauth;
    if (!o || !o.clientIdSet) { toast('Anh cần thêm một bộ OAuth (Client ID + Secret) trước.'); location.hash = '#/settings'; return; }
    modal(`<h3>Kết nối kênh — mở đúng nơi Gmail đang đăng nhập</h3>
      <div class="warnbox">⚠ App <b>không tự mở trình duyệt</b> của máy này. Đừng đăng nhập Gmail của kênh vào trình duyệt của máy này nếu Gmail đó phải giữ nguyên nơi đăng nhập.</div>
      <ol class="connol">
        <li>Bấm <b>một</b> trong hai nút copy bên dưới.</li>
        <li><b>Hồ sơ GPM trên máy này:</b> dán link (nút 1) vào thanh địa chỉ của <b>đúng hồ sơ</b> đang đăng nhập Gmail của kênh — app tự hoàn tất.</li>
        <li><b>VPS / máy khác:</b> dán link Google (nút 2) vào trình duyệt trên đó, cho phép, rồi copy <b>toàn bộ địa chỉ</b> trang lỗi <code>localhost</code>, dán vào ô <b>“Dán địa chỉ callback”</b> bên dưới và bấm <b>Hoàn tất kết nối</b>.</li>
        <li>Trên màn chọn tài khoản của Google, chọn <b>đúng Gmail của kênh</b> (nếu thấy Gmail khác → dừng, đóng tab, kiểm tra lại đã mở đúng hồ sơ chưa).</li>
      </ol>
      <div class="foot" style="justify-content:flex-start;flex-wrap:wrap">
        <button class="btn primary" data-act="copyConnect">1. Copy link cho hồ sơ GPM (máy này)</button>
        <button class="btn primary" data-act="copyGoogleLink">2. Copy link Google (VPS / máy khác)</button>
        <button class="btn" data-act="closeModal">Đóng</button></div>
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line)"><b style="font-size:13px">Đã cho phép trên VPS / máy khác? Dán địa chỉ callback để hoàn tất</b>
        <div class="vps-row" style="padding:8px 0 0"><input id="oauth-paste-m" type="text" autocomplete="off" placeholder="Dán địa chỉ http://localhost:4400/oauth/callback?code=…"><button class="btn primary" data-act="completeOauth">Hoàn tất kết nối</button></div>
        <div class="note" style="margin-top:6px">Làm trong vài phút sau khi cho phép; mỗi link chỉ dùng cho một lần kết nối.</div></div>
      <details class="vps" style="margin-top:12px"><summary>Chỉ dùng cho Gmail của chính anh đang đăng nhập sẵn ở máy này</summary>
        <div class="vps-row" style="padding-top:10px"><button class="btn" data-act="openHere">Mở trên trình duyệt của máy này</button></div></details>`);
  }
  async function syncChannels(id) {
    toast('Đang lấy số liệu…');
    try { await apiCall('/api/channels/sync', id ? { id } : {}); toast('Đã đồng bộ'); } catch (e) { toast(e.message); }
    await refreshOwn(); loadStatus(false);
  }
  // Xoá sạch dữ liệu người dùng gắn với một kênh (lịch đăng, ghim, ghi chú, nháp, đánh dấu đã đăng). Lịch sử thông báo cũ được giữ.
  function purgeChannelData(id) {
    delete sched[id]; store.set('qlk_sched', sched);
    pins = pins.filter((x) => x !== id); store.set('qlk_pins', pins);
    delete notes[id]; store.set('qlk_notes', notes);
    Object.keys(drafts).filter((k) => k.includes(`|${id}|`)).forEach((k) => delete drafts[k]); store.set('qlk_drafts', drafts);
    Object.keys(done).forEach((d) => { Object.keys(done[d]).filter((k) => k.startsWith(id + '|')).forEach((k) => delete done[d][k]); if (!Object.keys(done[d]).length) delete done[d]; });
    store.set('qlk_done', done);
    delete profiles[id];
    if (state.stationSel === id) state.stationSel = null;
  }
  // Xoá theo dõi MỘT kênh: kênh của mình (thu hồi OAuth + xoá số liệu) hoặc kênh đối thủ (dừng theo dõi + xoá số liệu)
  async function deleteTracked(id) {
    const own = realOwn && D.OWN.find((c) => c.id === id);
    const riv = !own && realRivals && serverRivals.find((c) => c.id === id);
    const name = own ? own.name : riv ? riv.name : id;
    const msg = own
      ? `Xoá theo dõi kênh “${name}”?\n\nApp sẽ THU HỒI quyền truy cập Google của kênh, xoá số liệu đã lưu, lịch đăng, ghi chú, hồ sơ kênh và nháp bài của kênh này. Lịch sử thông báo cũ vẫn được giữ.\n\nKhông thể hoàn tác (muốn theo dõi lại phải kết nối lại kênh).`
      : `Xoá theo dõi kênh đối thủ “${name}”?\n\nApp sẽ dừng theo dõi và xoá số liệu đã lưu của kênh này. Lịch sử thông báo cũ vẫn được giữ.`;
    if (!window.confirm(msg)) return;
    try {
      if (own) await apiCall('/api/channels/disconnect', { id });
      else if (riv) await apiCall('/api/rivals/remove', { id });
      else return;
      purgeChannelData(id);
      toast(`Đã xoá theo dõi “${name}”`);
    } catch (e) { toast(e.message); return; }
    if ((location.hash || '').startsWith('#/channel/' + id)) location.hash = own ? '#/channels' : '#/tracker';
    await Promise.all([loadChannels(), loadRivals()]);
    await loadOwn();
    loadStatus(false); refreshNotifs(); render();
  }
  const disconnectChannel = (id) => deleteTracked(id);
  function quotaCard() {
    const q = api && api.quota;
    if (!q) return '';
    const pctUsed = Math.min(100, Math.round((q.used / q.limit) * 100));
    const kinds = Object.entries(q.byKind || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}: ${fmt(n)}`).join(' · ');
    const keys = q.keys || [];
    const perKey = keys.length > 1 ? `<div class="note" style="margin-top:8px">${keys.map((k) => `${esc(k.label)} ${fmt(k.used)}/${fmt(k.limit)}`).join(' · ')}</div>` : '';
    return `<div class="card set-card"><h3>Hạn mức YouTube hôm nay <span class="tag ${pctUsed >= 80 ? 'amber' : 'green'}">${fmt(q.used)}/${fmt(q.limit)} đơn vị</span></h3>
      <div class="pbar" style="min-width:0"><i style="width:${pctUsed}%;background:${pctUsed >= 80 ? 'var(--amber)' : 'var(--green)'}"></i></div>
      <div class="desc" style="margin-top:8px">Làm mới lúc <b>${fmtVN(q.resetAt)}</b> (giờ Việt Nam). ${kinds ? 'Đã dùng: ' + esc(kinds) + '.' : 'Hôm nay chưa dùng gì.'} ${keys.length > 1 ? `Gồm ${keys.length} khoá API cộng lại — app tự xoay sang khoá còn nhiều nhất.` : 'Khi hết, app dừng quét và báo rõ giờ có lại.'}</div>${perKey}</div>`;
  }
  function apiKeysCard() {
    const list = ((api && api.quota) || {}).keys || [];
    const rows = list.map((k) => {
      const pct = Math.min(100, Math.round((k.used / k.limit) * 100));
      const tag = k.state === 'ok' ? '<span class="tag green">Kết nối tốt</span>' : k.state === 'error' ? '<span class="tag" style="background:rgba(240,84,108,.14);color:var(--red)">Lỗi</span>' : '<span class="tag amber">Chưa kiểm tra</span>';
      return `<div class="ocrow"><div class="cinfo"><b>${esc(k.label)}</b><small>${esc(k.masked)} ${tag}${k.message ? ' · ' + esc(k.message) : ''}</small></div>
        <div class="ouse"><div class="pbar" style="min-width:0"><i style="width:${pct}%;background:${pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--green)'}"></i></div><small>đã dùng ${fmt(k.used)}/${fmt(k.limit)}${pct >= 100 ? ' — HẾT' : pct >= 80 ? ' — sắp hết' : ''}</small></div>
        <button class="btn sm" data-act="testOneKey" data-v="${esc(k.key)}">Kiểm tra</button>
        <button class="btn sm" data-act="rmApiKey" data-v="${esc(k.key)}">🗑 Xoá</button></div>`;
    }).join('') || '<div class="note" style="margin-bottom:8px">Chưa có khoá YouTube Data API nào.</div>';
    return `<div class="card set-card">
      <h3>YouTube Data API — các khoá <span class="tag ${list.length ? 'green' : 'amber'}">${list.length} khoá</span></h3>
      <div class="desc">Dùng để lấy số liệu công khai của kênh đối thủ, quét Title Trends/Tìm Niche/Quét chủ đề, đọc bình luận. Mỗi khoá là một project Google Cloud riêng, có hạn mức 10.000 đơn vị/ngày RIÊNG với nhau. Thêm khoá dự phòng để app <b>tự xoay vòng</b> sang khoá còn nhiều hạn mức nhất khi khoá đang dùng gần hết — không cần chọn tay.</div>
      ${rows}
      <div class="row" style="margin-top:12px"><label for="in-klabel">Tên gọi (tuỳ chọn)</label><input id="in-klabel" type="text" autocomplete="off" placeholder="Ví dụ: Khoá dự phòng 1"></div>
      <div class="row"><label for="in-key">Khoá API</label><input id="in-key" type="password" autocomplete="off" placeholder="AIza…"></div>
      <div class="actions"><button class="btn primary" data-act="addApiKey">+ Thêm khoá API</button></div>
    </div>`;
  }
  function channelsCard(o) {
    const niches = [...new Set([...(window.QLK_TRENDS ? window.QLK_TRENDS.NICHES : []), ...D.OWN.map((c) => c.niche)])];
    const rows = conns.map((c) => `<div class="crow"><div class="cinfo"><b>${esc(c.title)}</b><small>${esc(c.handle || c.id)} · ${c.lastSync ? 'đồng bộ ' + fmtVN(c.lastSync) : 'chưa đồng bộ'}${c.needsReauth ? ' · <span class="bad">cần kết nối lại</span>' : ''}${c.lastError ? ' · <span class="bad">' + esc(c.lastError) + '</span>' : ''}</small></div>
        <input type="text" list="cniches" data-cmeta="niche" data-cid="${esc(c.id)}" placeholder="Ngách (vd: Stoic)" value="${esc(c.niche || '')}">
        <input type="text" data-cmeta="country" data-cid="${esc(c.id)}" placeholder="Quốc gia" value="${esc(c.country || '')}">
        <select data-cmeta="market" data-cid="${esc(c.id)}" title="Thị trường (ngôn ngữ) của kênh">${marketOpts(c.market, true)}</select>
        <span class="cbtn"><button class="btn sm" data-act="syncCh" data-v="${esc(c.id)}">Đồng bộ</button><button class="btn sm" data-act="discCh" data-v="${esc(c.id)}">🗑 Xoá theo dõi</button></span>
        <div class="crow-x"><input type="text" data-cmeta="gmail" data-cid="${esc(c.id)}" placeholder="Gmail của kênh" value="${esc(c.gmail || '')}"><input type="text" data-cmeta="where" data-cid="${esc(c.id)}" placeholder="Nơi vận hành (VPS / proxy / hồ sơ GPM)" value="${esc(c.where || '')}"><span class="note">Bộ OAuth: ${esc(((o.clients || []).find((x) => x.key === c.clientKey) || {}).label || '—')}</span></div></div>`).join('');
    const cl = o.clients || [];
    const can = cl.length > 0;
    const chosen = chosenClient(cl);
    const clientSel = can ? `<div class="row" style="margin-bottom:10px"><label for="oauth-client">Kết nối kênh mới bằng bộ</label><select id="oauth-client">${cl.map((c) => `<option value="${esc(c.key)}" ${c.key === chosen ? 'selected' : ''}>${esc(c.label)} — đã dùng ${c.lifetime}/100 suất</option>`).join('')}</select></div>` : '';
    return `<div class="card set-card"><h3>Kênh đã kết nối <span class="tag ${conns.length ? 'green' : 'amber'}">${conns.length} kênh</span></h3>
      <div class="desc"><b>Mỗi kênh cấp quyền riêng.</b> App <b>không tự mở trình duyệt</b> của máy này: anh copy link rồi dán vào <b>đúng hồ sơ GPM / trình duyệt VPS đã đăng nhập Gmail của kênh đó</b>. Không đăng nhập Gmail của kênh vào trình duyệt của máy này.</div>
      <datalist id="cniches">${niches.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
      ${rows || '<div class="note" style="margin-bottom:8px">Chưa kết nối kênh nào.</div>'}
      ${clientSel}
      ${can ? `<div class="row" style="margin-bottom:10px"><label for="oauth-hint">Gmail dự kiến (tuỳ chọn)</label><input id="oauth-hint" type="text" autocomplete="off" placeholder="Gmail của kênh sắp kết nối — Google sẽ chọn sẵn đúng tài khoản này"></div>` : ''}
      <div class="actions"><button class="btn primary" data-act="connectChannel" ${can ? '' : 'disabled'} title="${can ? '' : 'Cần thêm một bộ OAuth trước'}">+ Kết nối kênh</button><button class="btn" data-act="copyConnect" ${can ? '' : 'disabled'}>Sao chép link cho hồ sơ GPM</button><button class="btn" data-act="syncCh" data-v="" ${conns.length ? '' : 'disabled'}>Đồng bộ tất cả</button></div>
      <details class="vps"><summary>Kênh nằm trên máy khác / VPS? Xem cách kết nối</summary>
        <ol>
          <li>Bấm <b>“Sao chép link Google”</b> bên dưới.</li>
          <li>Mở link đó trong <b>trình duyệt trên VPS</b> (đang đăng nhập đúng kênh), chọn kênh và bấm cho phép.</li>
          <li>Trình duyệt VPS sẽ báo <b>không mở được trang localhost:4400</b> — bình thường. <b>Copy toàn bộ địa chỉ</b> trên thanh địa chỉ (bắt đầu bằng <code>http://localhost:4400/oauth/callback?code=…</code>).</li>
          <li>Dán vào ô dưới rồi bấm <b>“Hoàn tất kết nối”</b> (làm trong vòng vài phút, mã chỉ dùng một lần).</li>
        </ol>
        <div class="vps-row"><button class="btn" data-act="copyGoogleLink" ${can ? '' : 'disabled'}>Sao chép link Google</button></div>
        <div class="vps-row"><input id="oauth-paste" type="text" placeholder="Dán địa chỉ http://localhost:4400/oauth/callback?code=…" ${can ? '' : 'disabled'}><button class="btn primary" data-act="completeOauth" ${can ? '' : 'disabled'}>Hoàn tất kết nối</button></div>
      </details>
      <div class="note" style="margin-top:8px">Tự đồng bộ mỗi giờ. Khoá làm mới (refresh token) lưu trong <code>app/data/channels.json</code> trên máy, không hiện ra giao diện.</div></div>`;
  }
  async function runUpdateNow() {
    toast('Đang chạy cập nhật…');
    try {
      api = await apiCall('/api/update/run', {});
      const steps = api.update.last.steps;
      const bad = steps.filter((s) => s.state === 'error').length, skip = steps.filter((s) => s.state === 'skip').length;
      toast(bad ? `Cập nhật xong nhưng ${bad} bước lỗi — xem ở Cài đặt` : skip ? `Đã chạy. ${skip} bước đang chờ nối dữ liệu thật` : 'Cập nhật xong');
    } catch (e) { toast(e.message); }
    updatePill(); render();
  }
  async function addOauthClient() {
    const body = { label: $('#in-olabel').value, clientId: $('#in-cid').value, clientSecret: $('#in-cs').value };
    if (!body.clientId.trim() || !body.clientSecret.trim()) { toast('Hãy nhập cả Client ID và Client Secret.'); return; }
    try { api = await apiCall('/api/oauth/clients', body); toast('Đã thêm bộ OAuth'); }
    catch (e) { toast(e.message); return; }
    updatePill(); render();
  }

  // ---------- Danh sách cố định "Người quản lý" ----------
  function managersCard() {
    const list = (api && api.managers) || [];
    const counts = new Map();
    D.OWN.forEach((c) => { if (c.manager) counts.set(c.manager, (counts.get(c.manager) || 0) + 1); });
    const rows = list.map((m) => {
      const n = counts.get(m.name) || 0;
      return `<div class="ocrow"><div class="cinfo"><b><span class="mgrdot" style="background:${m.color};margin-right:7px;"></span>${esc(m.name)}</b><small>${n} kênh đang gán</small></div>
        <button class="btn sm" data-act="rmManager" data-v="${esc(m.name)}" ${n ? 'disabled title="Còn kênh đang gán người này — đổi người quản lý cho các kênh đó trước"' : ''}>🗑 Xoá</button></div>`;
    }).join('') || '<div class="note" style="margin-bottom:8px">Chưa có người quản lý nào.</div>';
    return `<div class="card set-card">
      <h3>Người quản lý <span class="tag ${list.length ? 'green' : 'amber'}">${list.length} người</span></h3>
      <div class="desc">Danh sách cố định để gán cho từng kênh ở cột "Người quản lý" trong Quản lý Kênh (chọn dropdown, không gõ tự do) — giúp lọc và so sánh chất lượng đúng người. Mỗi người tự động nhận 1 màu để dễ nhận ra.</div>
      ${rows}
      <div class="row" style="margin-top:12px"><label for="in-manager">Tên người quản lý</label><input id="in-manager" type="text" autocomplete="off" placeholder="Ví dụ: Minh Anh"></div>
      <div class="actions"><button class="btn primary" data-act="addManager">+ Thêm người quản lý</button></div>
    </div>`;
  }
  async function addManagerUI() {
    const name = (($('#in-manager') || {}).value || '').trim();
    if (!name) { toast('Hãy nhập tên người quản lý.'); return; }
    try { const j = await apiCall('/api/managers', { name }); api.managers = j.managers; toast('Đã thêm người quản lý'); render(); }
    catch (e) { toast(e.message); }
  }

  // ---------- Sự kiện ----------
  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act, v = act.dataset.v;
      if (a === 'range') { state.range = +v; store.set('qlk_range', state.range); render(); }
      else if (a === 'detailRange') { state.detailRange = +v; render(); }
      else if (a === 'vidRange') { state.vidRange = String(v); render(); }
      else if (a === 'vidTab') { state.vidTab = String(v); render(); }
      else if (a === 'vidMetric') { state.vidMetric = String(v); render(); }
      else if (a === 'vidTraffic') { state.vidTraffic = String(v); render(); }
      else if (a === 'geoMore') { state.geoMore = !state.geoMore; render(); }
      else if (a === 'tab') { state.tab = v; render(); }
      else if (a === 'vsort') { state.vsort = v; render(); }
      else if (a === 'addRival') openAddRival();
      else if (a === 'saveRival') saveRival();
      else if (a === 'closeModal') closeModal();
      else if (a === 'schedTab') { state.schedTab = v; render(); }
      else if (a === 'schedEdit') openSchedEdit(v);
      else if (a === 'schedMode') { const d = schedDraftFromForm(v); openSchedEdit(d.id, d); }
      else if (a === 'schedWd') {
        e.target.classList.toggle('on'); // đổi ngay trên nút đang bấm rồi mới đọc lại toàn bộ form để giữ các ô khác
        const d = schedDraftFromForm('weekday');
        openSchedEdit(d.id, d);
      }
      else if (a === 'task') { toggleTask(v); render(); }
      else if (a === 'skipTask') { skipTask(v); render(); toast(isSkipped(v) ? 'Đã xoá cảnh báo cho việc này hôm nay' : 'Đã khôi phục cảnh báo'); }
      else if (a === 'stationSel') { state.stationSel = v; render(); }
      else if (a === 'copyImg') {
        const [cid, , idx] = v.split('|');
        const c = D.OWN.find((x) => x.id === cid);
        const sg = draftOf(v).ai || window.QLK_SUGG.pick(c.niche, c.id, dayNum(new Date()), Number(idx) - 1, draftOf(v).sv || 0);
        if (sg.img && navigator.clipboard) navigator.clipboard.writeText(sg.img).then(() => toast('Đã copy prompt tạo ảnh 1:1'), () => toast('Không copy được'));
        else toast('Bài này không cần ảnh');
      }
      else if (a === 'histToggle') { const [cid, iso] = v.split('|'); toggleCommDay(cid, iso); render(); }
      else if (a === 'nextSugg') { saveDraft(v, { sv: (draftOf(v).sv || 0) + 1 }); render(); }
      else if (a === 'useSugg') {
        const [cid, , idx] = v.split('|');
        const c = D.OWN.find((x) => x.id === cid);
        const sg = draftOf(v).ai || window.QLK_SUGG.pick(c.niche, c.id, dayNum(new Date()), Number(idx) - 1, draftOf(v).sv || 0);
        saveDraft(v, { text: sg.text + (sg.options ? '\n' + sg.options.map((o) => '• ' + o).join('\n') : ''), type: sg.type });
        render(); toast('Đã đưa gợi ý vào ô nháp — chỉnh lại nếu muốn');
      }
      else if (a === 'toTopic') { state.topicQ = v; state.tab = 'topic'; state.topicSmall = false; state.topicRecent = false; render(); scrollTo(0, 0); }
      else if (a === 'runTopic') { state.topicQ = $('#tp-q').value.trim(); render(); }
      else if (a === 'topicSmall') { state.topicSmall = !state.topicSmall; render(); }
      else if (a === 'topicRecent') { state.topicRecent = !state.topicRecent; render(); }
      else if (a === 'runScan') runScan();
      else if (a === 'addScanned') openAddRival(state.scanUrl);
      else if (a === 'copyTopic' || a === 'copyTrend') {
        const t = (a === 'copyTopic' ? window.__topicTitles : window.__trendTitles) || [];
        if (navigator.clipboard && t.length) navigator.clipboard.writeText(t.join('\n')).then(() => toast(`Đã copy ${t.length} tiêu đề`), () => toast('Không copy được'));
        else toast('Không có tiêu đề để copy');
      }
      else if (a === 'copyDraft') {
        const ta = document.querySelector(`[data-draft="${v}"]`);
        const t = ta ? ta.value : '';
        if (!t.trim()) toast('Chưa có nội dung để copy.');
        else if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Đã copy nội dung bài cộng đồng'), () => toast('Không copy được'));
      }
      else if (a === 'notifOn') { if (notifyOk()) Notification.requestPermission().then(() => render()); }
      else if (a === 'schedSave') saveSched();
      else if (a === 'schedDel') { delete sched[v]; store.set('qlk_sched', sched); render(); toast('Đã xoá lịch đăng của kênh'); }
      else if (a === 'calNav') {
        if (v === 'today') { calState.y = new Date().getFullYear(); calState.m = new Date().getMonth(); }
        else { const d = new Date(calState.y, calState.m + +v, 1); calState.y = d.getFullYear(); calState.m = d.getMonth(); }
        render();
      }
      else if (a === 'mineFilter') { state.mineFilter = v; render(); }
      else if (a === 'rivalNiche') { state.rivalNiche = v; render(); }
      else if (a === 'toggleNichePause') {
        const paused = isNichePaused(v);
        apiCall(paused ? '/api/niches/unpause' : '/api/niches/pause', { niche: v })
          .then((j) => { api.pausedNiches = j.pausedNiches; toast(paused ? `Đã bật lại theo dõi ngách "${v}"` : `Đã tạm dừng theo dõi ngách "${v}" — đỡ tốn hạn mức, đỡ nhiễu thông báo`); render(); })
          .catch((er) => toast(er.message));
      }
      else if (a === 'pin') { e.stopPropagation(); pins = pins.includes(v) ? pins.filter((x) => x !== v) : pins.concat(v); store.set('qlk_pins', pins); render(); }
      else if (a === 'csvOwn') {
        const hs = new Map(D.OWN.map((c) => [c.id, health(c)]));
        downloadCsv(`kenh-cua-minh-${todayStamp()}.csv`, [['Kênh', 'Người quản lý', 'Chủ đề', 'Tổng video', 'SUB', 'SUB +hôm qua', 'Lượt xem', 'Lượt xem +hôm qua', 'Bình luận', 'Tình trạng', 'Lý do']]
          .concat(D.OWN.map((c) => [c.name, c.manager || '', c.niche, c.videos, last(c.subs), gain(c.subs, 1), last(c.views), gain(c.views, 1), last(c.comments), HB[hs.get(c.id).level][1], hs.get(c.id).reasons.map((x) => x.t).join('; ')])));
        toast('Đã xuất CSV kênh của mình');
      }
      else if (a === 'csvList') {
        const r = state.range;
        downloadCsv(`doi-thu-${r}ngay-${todayStamp()}.csv`, [['Kênh', 'Ngách', 'SUB', `SUB +${r}ngày`, 'Lượt xem', `Lượt xem +${r}ngày`, 'Video']]
          .concat(allRivals().map((c) => [c.name, c.niche, last(c.subs), gain(c.subs, r), last(c.views), gain(c.views, r), c.videos])));
        toast('Đã xuất CSV đối thủ');
      }
      else if (a === 'copyHits') {
        const t = (window.__hitTitles || []).join('\n');
        if (navigator.clipboard && t) navigator.clipboard.writeText(t).then(() => toast(`Đã copy ${window.__hitTitles.length} tiêu đề`), () => toast('Không copy được'));
        else toast('Không có tiêu đề để copy');
      }
      else if (a === 'saveHealth') {
        const n = (id) => Number($('#' + id).value);
        const red = n('h-red'), amb = n('h-amb'), sr = n('h-sr'), sa = n('h-sa');
        if (![red, amb, sr, sa].every((x) => Number.isFinite(x) && x > 0) || red > 100 || amb > 100) { toast('Hãy nhập số dương hợp lệ (phần trăm tối đa 100).'); return; }
        if (amb >= red || sa >= sr) { toast('Ngưỡng vàng phải nhẹ hơn ngưỡng đỏ (phần trăm vàng < đỏ, ngày vàng < đỏ).'); return; }
        Object.assign(HEALTH, { dropRed: 1 - red / 100, dropAmber: 1 - amb / 100, staleRed: sr, staleAmber: sa });
        store.set('qlk_health', HEALTH); toast('Đã lưu ngưỡng cảnh báo');
      }
      else if (a === 'resetHealth') { Object.assign(HEALTH, { dropRed: 0.5, dropAmber: 0.8, staleRed: 7, staleAmber: 4 }); store.set('qlk_health', HEALTH); render(); toast('Đã về ngưỡng mặc định'); }
      else if (a === 'saveAi') {
        apiBusy = false;
        doAi({ baseUrl: $('#in-ai-url').value, model: $('#in-ai-model').value, apiKey: $('#in-ai-key').value, test: true }, (ai) => (ai.state === 'ok' ? 'Đã lưu — AI kết nối tốt' : 'Đã lưu, nhưng: ' + ai.message));
      }
      else if (a === 'testAi') doAi({ __path: '/api/ai/test' }, (ai) => (ai.state === 'ok' ? 'AI kết nối tốt' : ai.message));
      else if (a === 'clearAi') doAi({ clear: true }, () => 'Đã xoá khoá AI');
      else if (a === 'aiWrite') aiWrite(v);
      else if (a === 'aiClear') { saveDraft(v, { ai: null }); render(); }
      else if (a === 'addApiKey') addApiKeyUI();
      else if (a === 'testOneKey') testOneKeyUI(v);
      else if (a === 'rmApiKey') {
        if (window.confirm('Xoá khoá API này khỏi app?')) rmApiKeyUI(v);
      }
      else if (a === 'addOauthClient') addOauthClient();
      else if (a === 'oauthPub') {
        const [key, on] = String(v).split('|');
        apiCall('/api/oauth/clients/published', { key, published: on === '1' }).then((j) => { api = j; loadChannels().then(() => { refreshNotifs(); render(); }); toast(on === '1' ? 'Đã đánh dấu Publish — không đếm ngược 7 ngày nữa' : 'Đã bỏ đánh dấu Publish'); }).catch((er) => toast(er.message));
      }
      else if (a === 'rmOauthClient') {
        if (window.confirm('Xoá bộ OAuth này khỏi app? (Suất đã dùng của project trên Google vẫn không được trả lại.)')) {
          apiCall('/api/oauth/clients/remove', { key: v }).then((j) => { api = j; toast('Đã xoá bộ OAuth'); updatePill(); render(); }).catch((er) => toast(er.message));
        }
      }
      else if (a === 'addManager') addManagerUI();
      else if (a === 'rmManager') {
        if (window.confirm(`Xoá "${v}" khỏi danh sách người quản lý?`)) {
          apiCall('/api/managers/remove', { name: v }).then((j) => { api.managers = j.managers; toast('Đã xoá người quản lý'); render(); }).catch((er) => toast(er.message));
        }
      }
      else if (a === 'addOwn' || a === 'connectChannel') startConnect();
      else if (a === 'copyConnect') {
        const link = location.origin + '/oauth/start?' + connQs();
        if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => toast('Đã copy link kết nối — dán vào ĐÚNG hồ sơ GPM đang đăng nhập Gmail của kênh (không mở ở trình duyệt này)'), () => toast('Không copy được: ' + link));
      }
      else if (a === 'openHere') {
        if (window.confirm('Mở trang Google ở trình duyệt CỦA MÁY NÀY?\n\nChỉ dùng khi Gmail của kênh vốn đã đăng nhập sẵn ở đây. Nếu Gmail đó phải giữ nguyên nơi đăng nhập thì bấm Huỷ.')) window.open('/oauth/start?' + connQs(), '_blank');
      }
      else if (a === 'copyGoogleLink') {
        apiCall('/api/oauth/link?' + connQs()).then((j) => (navigator.clipboard ? navigator.clipboard.writeText(j.url).then(() => toast('Đã copy link Google — mở nó trên trình duyệt của VPS (link dùng trong 60 phút, mỗi link chỉ cho MỘT lần kết nối)'), () => toast('Không copy được, trình duyệt chặn clipboard')) : toast('Trình duyệt không cho copy tự động'))).catch((er) => toast(er.message));
      }
      else if (a === 'completeOauth') {
        const inModal = !$('#modal').hidden && $('#oauth-paste-m');
        const u = ((inModal ? $('#oauth-paste-m') : $('#oauth-paste')).value || '').trim();
        if (!u) { toast('Hãy dán địa chỉ callback vào ô trước.'); return; }
        toast('Đang hoàn tất kết nối…');
        apiCall('/api/oauth/complete', { url: u }).then((r) => { if (inModal) closeModal(); toast(`Đã kết nối kênh “${r.title}” — nhớ đặt ngách và thị trường`); return refreshOwn().then(() => loadStatus(false)); }).catch((er) => toast(er.message));
      }
      else if (a === 'syncCh') syncChannels(v);
      else if (a === 'discCh') disconnectChannel(v);
      else if (a === 'refresh' || a === 'runUpdate') runUpdateNow();
      else if (a === 'trDays') { trend.days = +v; render(); }
      else if (a === 'runTrend') runTrend(false);
      else if (a === 'runTrendForce') runTrend(true);
      else if (a === 'trOutlier') { trend.minOutlier = +v; render(); }
      else if (a === 'addRivalFromScan') addRivalFromScan(v);
      else if (a === 'notif') openNotif(v);
      else if (a === 'chanComments') { e.stopPropagation(); openChannelComments(String(v), false); }
      else if (a === 'cmtMore') { cmt.shown += 8; renderCmt(); cmtAssist(); }
      else if (a === 'cmtRescan') { openChannelComments(cmt.cid, true); }
      else if (a === 'cmtCopy') {
        const t = (cmt.ai[String(v)] || {}).reply || '';
        if (navigator.clipboard && t) navigator.clipboard.writeText(t).then(() => toast('Đã copy câu trả lời'), () => toast('Không copy được'));
      }
      else if (a === 'vcmtMore') { vcmt.shown += 8; renderVcmt(); vcmtAssist(); }
      else if (a === 'vcmtRescan') { openComments(vcmt.cid, vcmt.vid, true); }
      else if (a === 'vcmtCopy') {
        const t = (vcmt.ai[String(v)] || {}).reply || '';
        if (navigator.clipboard && t) navigator.clipboard.writeText(t).then(() => toast('Đã copy câu trả lời'), () => toast('Không copy được'));
      }
      else if (a === 'kwPulse') { e.stopPropagation(); const [kw, mk, tp] = String(v).split('|'); openPulse(kw, mk, tp); }
      else if (a === 'vidComments') { const [cid, vid] = String(v).split('|'); openComments(cid, vid); }
      else if (a === 'nxRun') runNiche();
      else if (a === 'nxAdd') {
        const n = ex.niche; n.text = (($('#nx-text') || {}).value || n.text).trim();
        if (parseKw(n.text).length >= 6) { toast('Tối đa 6 từ khoá mỗi lần — xoá bớt một dòng trước khi thêm.'); return; }
        n.market = ($('#nx-market') || {}).value || n.market; n.days = +(($('#nx-days') || {}).value) || n.days;
        n.text = (n.text ? n.text + '\n' : '') + v; store.set('qlk_nx_text', n.text); render();
      }
      else if (a === 'nxSugg') {
        const n = ex.niche; n.text = ($('#nx-text') || {}).value || n.text; n.market = ($('#nx-market') || {}).value || exMarket(n.market);
        const kw = parseKw(n.text)[0];
        if (kw) apiCall(`/api/suggest?q=${encodeURIComponent(kw)}&market=${encodeURIComponent(n.market)}`).then((j) => { n.sugg = (j.suggestions || []).slice(0, 10); render(); }).catch((er) => toast(er.message));
      }
      else if (a === 'nxExpand') {
        const n = ex.niche; n.text = ($('#nx-text') || {}).value || n.text; n.market = ($('#nx-market') || {}).value || exMarket(n.market);
        const kw = parseKw(n.text)[0];
        if (kw) { toast('Đang gom gợi ý từ khoá…'); apiCall(`/api/suggest/expand?q=${encodeURIComponent(kw)}&market=${encodeURIComponent(n.market)}`).then((j) => { n.sugg = (j.suggestions || []).slice(0, 40); render(); toast(`Có ${n.sugg.length} gợi ý — bấm để thêm vào danh sách`); }).catch((er) => toast(er.message)); }
      }
      else if (a === 'nxTopic') { ex.topic.q = String(v); ex.topic.market = ex.niche.res ? ex.niche.res.market : ex.topic.market; ex.topic.res = null; ex.topic.err = ''; state.tab = 'topic'; render(); scrollTo(0, 0); }
      else if (a === 'txRun') runTopic();
      else if (a === 'txKw') runTopic(String(v));
      else if (a === 'csRun') runChanScan();
      else if (a === 'csAdd') {
        const c = ex.chan; c.niche = (($('#cs-niche') || {}).value || '').trim(); c.market = ($('#cs-market') || {}).value || 'en';
        apiCall('/api/rivals/add', { channelId: c.data.channel.id, niche: c.niche, market: c.market })
          .then((r) => { toast(r.existed ? 'Kênh này đã có trong danh sách đối thủ' : `Đã nạp “${r.title}” làm đối thủ`); return loadRivals(); }).then(() => render()).catch((er) => toast(er.message));
      }
      else if (a === 'detailMetric') { state.detailMetric = v; render(); }
      else if (a === 'dashRankAll') { state.dashRankAll = !state.dashRankAll; render(); }
      else if (a === 'dashRange') { state.dashRange = +v; render(); }
      else if (a === 'copyDashHits') {
        const t = (window.__dashHitTitles || []).join('\n');
        if (navigator.clipboard && t) navigator.clipboard.writeText(t).then(() => toast(`Đã copy ${window.__dashHitTitles.length} tiêu đề`), () => toast('Không copy được'));
        else toast('Không có tiêu đề để copy');
      }
      else if (a === 'dashMore') { state.dashAll = { ...(state.dashAll || {}), [v]: true }; render(); }
      else if (a === 'delChan' || (a === 'delRival' && realRivals)) { e.stopPropagation(); deleteTracked(v); }
      else if (a === 'toggleNoPost') {
        e.stopPropagation();
        const c = findChan(v);
        if (!c) return;
        const next = !c.noPost;
        apiCall('/api/channels/nopost', { id: v, noPost: next })
          .then(() => { c.noPost = next; toast(next ? `Đã ngừng nhắc đăng bài cho “${c.name}” — vẫn theo dõi số liệu` : `Đã bật lại nhắc đăng bài cho “${c.name}”`); render(); })
          .catch((er) => toast(er.message));
      }
      else if (a === 'delRival') {
        e.stopPropagation();
        addedRivals = addedRivals.filter((d) => d.id !== v);
        if (D.RIVALS.some((c) => c.id === v)) removedIds.push(v);
        store.set('qlk_added', addedRivals); store.set('qlk_removed', removedIds); render(); toast('Đã xoá đối thủ khỏi danh sách');
      } else if (a === 'resetRivals') { addedRivals = []; removedIds = []; sched = defaultSched(); store.set('qlk_added', []); store.set('qlk_removed', []); store.set('qlk_sched', null); toast('Đã đặt lại danh sách đối thủ và lịch đăng'); }
      else if (a === 'copyTitles') {
        const picked = [...document.querySelectorAll('[data-vt]:checked')].map((x) => window.__vids[+x.dataset.vt].title);
        const titles = picked.length ? picked : window.__vids.map((v) => v.title);
        const text = titles.join('\n');
        const done = () => toast(`Đã copy ${titles.length} tiêu đề`);
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => toast('Không copy được, trình duyệt chặn clipboard'));
        else toast('Không copy được, trình duyệt chặn clipboard');
      }
      return;
    }
    if (e.target.id === 'modal') { closeModal(); return; }
    const go = e.target.closest('[data-go]');
    if (go && !e.target.closest('button,input,select,a')) location.hash = go.dataset.go;
  });
  document.addEventListener('change', (e) => {
    if (e.target.dataset && e.target.dataset.act === 'sort') { state.sort = e.target.value; render(); }
    if (e.target.dataset && e.target.dataset.act === 'chSort') { state.chSort = e.target.value; render(); }
    if (e.target.dataset && e.target.dataset.cmeta) {
      const row = e.target.closest('.crow') || e.target.closest('tr');
      const cid = e.target.dataset.cid;
      const conn = conns.find((x) => x.id === cid) || {};
      const nEl = row.querySelector('[data-cmeta=niche]'), cEl = row.querySelector('[data-cmeta=country]'), mEl = row.querySelector('[data-cmeta=market]'), gEl = row.querySelector('[data-cmeta=gmail]'), wEl = row.querySelector('[data-cmeta=where]'), maEl = row.querySelector('[data-cmeta=manager]');
      apiCall('/api/channels/meta', { id: cid, niche: nEl ? nEl.value : conn.niche, country: cEl ? cEl.value : conn.country, market: mEl ? mEl.value : conn.market || '', gmail: gEl ? gEl.value : conn.gmail || '', where: wEl ? wEl.value : conn.where || '', manager: maEl ? maEl.value : conn.manager || '' })
        .then((j) => { conns = j.list; return loadOwn(); }).then(() => loadLibrary()).then(() => { toast(maEl ? 'Đã lưu người quản lý' : 'Đã lưu ngách / thị trường'); render(); }).catch((er) => toast(er.message));
    }
    if (e.target.dataset && e.target.dataset.prof) saveProfileField(e.target.dataset.pid, e.target.dataset.prof, e.target.value.trim());
    if (e.target.dataset && e.target.dataset.draft) saveDraft(e.target.dataset.draft, { text: e.target.value });
    if (e.target.dataset && e.target.dataset.draftType) saveDraft(e.target.dataset.draftType, { type: e.target.value });
    if (e.target.dataset && e.target.dataset.act === 'trendNiche') { state.trendNiche = e.target.value; render(); }
    if (e.target.dataset && e.target.dataset.act === 'histFilter') { state.histFilter = e.target.value; state.histOpen = true; render(); }
    if (e.target.id === 'oauth-client') store.set('qlk_oauth_client', e.target.value);
    // Thanh điều khiển Title Trends: chỉ cập nhật ô liên quan, KHÔNG vẽ lại trang (để bấm nút Quét ngay sau khi gõ không bị mất)
    if (e.target.id === 'tr-niche') {
      trend.niche = e.target.value.trim(); trend.kw = null;
      const mk = ownMarketFor(trend.niche);
      if (mk) { trend.market = mk; $('#tr-market').value = mk; }
      $('#tr-kw').value = libKeyword();
      $('#tr-kw').placeholder = 'Để trống = dùng tên ngách' + (trend.niche ? ': ' + trend.niche : '');
    }
    if (e.target.id === 'tr-market') { trend.market = e.target.value; trend.kw = null; $('#tr-kw').value = libKeyword(); }
    if (e.target.id === 'tr-type') { trend.type = e.target.value; }
    if (e.target.dataset && e.target.dataset.act === 'stationFilter') { state.stationFilter = e.target.value; render(); }
    if (e.target.dataset && e.target.dataset.act === 'chNiche') { state.chNiche = e.target.value; render(); }
    if (e.target.dataset && e.target.dataset.act === 'chManager') { state.chManager = e.target.value; render(); }
    if (e.target.dataset && e.target.dataset.act === 'dashNiche') { state.dashNiche = e.target.value; render(); }
    if (e.target.dataset && e.target.dataset.act === 'dashSort') { state.dashSort = e.target.value; render(); }
    if (e.target.dataset && e.target.dataset.note) {
      const v = e.target.value.trim();
      if (v) notes[e.target.dataset.note] = v; else delete notes[e.target.dataset.note];
      store.set('qlk_notes', notes); toast('Đã lưu ghi chú');
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'tr-kw') { trend.kw = e.target.value; trendSuggest(e.target.value); return; }
    if (e.target.id !== 'ch-q') return;
    state.q = e.target.value; render();
    const el = $('#ch-q'); el.focus(); el.setSelectionRange(el.value.length, el.value.length);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && e.target.id === 'in-key') addApiKeyUI();
    if (e.key === 'Enter' && e.target.id === 'tr-kw') { e.preventDefault(); runTrend(false); return; }
    if (e.key === 'Enter' && e.target.id === 'tp-q') { state.topicQ = e.target.value.trim(); render(); }
    if (e.key === 'Enter' && e.target.id === 'sc-url') runScan();
    if (e.key === 'Enter' && e.target.id === 'tx-q') { e.preventDefault(); runTopic(); }
    if (e.key === 'Enter' && e.target.id === 'cs-link') { e.preventDefault(); runChanScan(); }
  });
  // Giữ chữ anh đang gõ ở các ô khám phá (phòng khi trang vẽ lại)
  document.addEventListener('input', (e) => {
    const id = e.target && e.target.id;
    if (id === 'nx-text') { ex.niche.text = e.target.value; store.set('qlk_nx_text', ex.niche.text); }
    else if (id === 'tx-q') ex.topic.q = e.target.value;
    else if (id === 'cs-link') ex.chan.link = e.target.value;
  });
  // Nhớ lựa chọn ở các ô chọn (thị trường, số ngày, loại video) để không bị đặt lại khi trang vẽ lại
  document.addEventListener('change', (e) => {
    const id = e.target && e.target.id, v = e.target && e.target.value;
    if (id === 'nx-market') ex.niche.market = v;
    else if (id === 'nx-days') ex.niche.days = +v || 28;
    else if (id === 'tx-market') ex.topic.market = v;
    else if (id === 'tx-days') ex.topic.days = +v || 28;
    else if (id === 'tx-type') { ex.topic.type = +v === 1 ? 'short' : 'long'; render(); } // cập nhật dòng ước tính hạn mức
    else if (id === 'cs-niche') ex.chan.niche = v;
    else if (id === 'cs-market') ex.chan.market = v;
  });
  document.addEventListener('toggle', (e) => {
    if (!e.target.classList) return;
    if (e.target.classList.contains('digest')) store.set('qlk_digest', e.target.open);
    if (e.target.classList.contains('profcard')) state.profOpen = e.target.open;
    if (e.target.classList.contains('dhist')) state.histOpen = e.target.open;
    if (e.target.classList.contains('dashsec')) {
      const id = e.target.dataset.dashid;
      if (e.target.open) delete dashClosed[id]; else dashClosed[id] = true;
      store.set('qlk_dashClosed', dashClosed);
    }
  }, true);
  document.addEventListener('mousemove', (e) => {
    const svg = e.target.closest && e.target.closest('svg[data-chart]');
    const tip = $('#tip'), dot = $('#chartdot');
    if (!svg || !CHARTS[svg.dataset.chart]) { tip.hidden = true; dot.hidden = true; return; }
    const ch = CHARTS[svg.dataset.chart];
    const rect = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(ch.values.length - 1, Math.round(((e.clientX - rect.left) / rect.width) * (ch.values.length - 1))));
    const offset = N - ch.values.length;
    const fmtFn = ch.fmt || fmt;
    tip.innerHTML = `<span class="tip-day">${dayLabel(offset + i)}</span><span class="tip-val">${fmtFn(ch.values[i])}</span>`;
    tip.hidden = false;
    tip.style.left = Math.min(e.clientX + 14, innerWidth - 170) + 'px';
    tip.style.top = e.clientY + 14 + 'px';
    const pt = ch.pts[i];
    if (pt) {
      dot.style.background = ch.color || 'var(--accent)';
      dot.style.left = (rect.left + (pt[0] / ch.W) * rect.width) + 'px';
      dot.style.top = (rect.top + (pt[1] / ch.H) * rect.height) + 'px';
      dot.hidden = false;
    } else dot.hidden = true;
  });
  window.addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
  render();
  // Nạp lần lượt: trạng thái API → thư viện ngách + đối thủ thật + kênh của anh → thông báo (Dashboard)
  loadStatus(true).then(() => Promise.all([loadLibrary(), loadRivals(), refreshOwn()])).then(() => { render(); return refreshNotifs(); });
  loadProfiles();
  setInterval(() => { refreshOwn().then(() => loadRivals()).then(() => refreshNotifs()); }, 300000); // 5 phút: lấy số liệu mới server đã đồng bộ + thông báo mới
  window.addEventListener('focus', () => { refreshOwn().then(() => loadRivals()).then(() => refreshNotifs()); loadStatus(false); }); // quay lại từ tab kết nối Google
  tick();
  setInterval(tick, 30000);
  setInterval(() => loadStatus(true), 3600000); // tự kiểm tra lại mỗi 1 giờ
})();
