// Khám phá thật (dùng khoá API, có đếm hạn mức): quét một kênh bất kỳ, và chấm điểm cơ hội của các ngách/từ khoá.
const DAY = 86400000;

module.exports = function makeExplore(core, scan, rivals, ctx) {
  const aiChat = ctx.aiChat;
  const { yt, videoDetails, channelDetails, MARKETS, readJson, writeJson, quotaState, quotaCheck } = core;
  const median = scan.median;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  // ---------- Khuôn tiêu đề (Title DNA): học từ tool YT DNA — AI bóc tách MỖI tiêu đề theo 3 thành phần, không dùng regex tiếng Anh ----------
  const FRAMEWORK = `CÔNG THỨC BÓC TÁCH 1 TIÊU ĐỀ = 3 THÀNH PHẦN:
1. Từ khoá cảm xúc / VẤN ĐỀ (Keyword – cho SEO): cụm từ chính khán giả gõ tìm, nên nằm nửa đầu tiêu đề.
2. Yếu tố tâm lý – KHOẢNG TRỐNG TÒ MÒ / NỖI ĐAU (Click-trigger – cho con người): "lưỡi câu" cảm xúc đánh vào 1 trong 4 từ huyệt: Sợ hãi, Tò mò, Tham lam (kết quả dễ dàng), Cảnh giác.
3. Cụm BỐI CẢNH / ĐÓNG GÓI (Format/Context): giúp định hình thể loại/độ tin cậy, thường dùng số, ngoặc vuông [ ], ngoặc tròn ( ), năm.
CÔNG THỨC GHÉP THAM KHẢO: [Bối cảnh/Con số] + [Từ khoá cảm xúc] + [Yếu tố tâm lý].`;
  const LANG_OF = { en: 'tiếng Anh', es: 'tiếng Tây Ban Nha', pt: 'tiếng Bồ Đào Nha', ja: 'tiếng Nhật', ko: 'tiếng Hàn', vi: 'tiếng Việt' };
  async function titleDna(titles, langLabel) {
    const raw = await aiChat([
      { role: 'system', content: `Bạn là chuyên gia phân tích tiêu đề YouTube. Dựa trên công thức dưới đây, hãy bóc tách các tiêu đề mẫu của MỘT kênh (${langLabel}) và rút ra "khuôn đặt tiêu đề" đặc trưng của kênh đó (Title DNA). Chỉ trả về JSON hợp lệ. Mọi trường mô tả viết bằng TIẾNG VIỆT CÓ DẤU đầy đủ.\n${FRAMEWORK}` },
      { role: 'user', content: `Đây là các tiêu đề nhiều view nhất của kênh. Trả về đúng cấu trúc JSON:\n{"tu_huyet_chu_dao":["Tò mò",...],"vi_tri_tu_khoa":"mô tả thói quen đặt từ khoá (đầu/giữa)","ky_tu_dac_biet_hay_dung":["[]","()","|","số",...],"kieu_in_hoa":"mô tả thói quen viết hoa","giong_dieu":"chất giọng tổng thể","khung_xuong_tieu_de":["[Số] + [Chủ đề] + [Yếu tố tâm lý mạnh]","..."],"ghi_chu":"đặc điểm riêng khiến tiêu đề kênh này hút view"}\n\nCác tiêu đề:\n${titles.map((t) => '- ' + t).join('\n')}` },
    ], 6000);
    const m = /\{[\s\S]*\}/.exec(raw);
    if (!m) throw new Error('AI trả về sai định dạng');
    return JSON.parse(m[0]);
  }
  // Bổ sung phần AI cho kết quả quét kênh: dịch + bóc tách từng tiêu đề (20 video nhiều view nhất) và rút khuôn. Lỗi AI không làm hỏng lượt quét.
  async function enrichChannel(data) {
    const top = data.videos.slice().sort((a, b) => b.views - a.views).slice(0, 20).map((v) => ({ id: v.id, title: v.title }));
    if (!top.length) return;
    const langs = {};
    data.videos.slice(0, 40).forEach((v) => { const l = scan.detectLang(v); if (MARKETS[l]) langs[l] = (langs[l] || 0) + 1; });
    const market = Object.entries(langs).sort((a, b) => b[1] - a[1]).map((x) => x[0])[0] || 'en';
    data.market = market;
    const acache = readJson('ai-cache.json', {});
    const err = await scan.aiAnalyze(top, market, 'full', acache);
    writeJson('ai-cache.json', acache);
    data.ai = {};
    top.forEach((v) => { const a = acache[v.id]; if (a) data.ai[v.id] = { vi: a.vi || '', phrases: a.phrases || [], k: !!a.k, t: a.t || null, c: a.c || null }; });
    data.aiError = err || '';
    try { data.dna = await titleDna(top.map((v) => v.title), LANG_OF[market] || 'tiếng Anh'); data.dna.do_dai_trung_binh = Math.round(top.reduce((t, v) => t + v.title.length, 0) / top.length); }
    catch (e) { data.dnaError = String(e.message || e).slice(0, 160); }
  }

  // ---------- Quét một kênh: 100 video mới nhất (tốn ~6 đơn vị) ----------
  const chCache = new Map();
  async function scanChannel(link) {
    const c = await rivals.resolveLink(link);
    const hit = chCache.get(c.id);
    if (hit && Date.now() - hit.t < 30 * 60000) return hit.data;
    if (!c.uploads) throw new Error('Kênh này không có danh sách video công khai.');
    const ids = [];
    let page = '';
    for (let i = 0; i < 2; i++) {
      const pl = await yt('playlistItems', { part: 'contentDetails', playlistId: c.uploads, maxResults: 50, pageToken: page }, 'playlistItems');
      (pl.items || []).forEach((x) => ids.push(x.contentDetails.videoId));
      page = pl.nextPageToken || '';
      if (!page) break;
    }
    const vids = (await videoDetails(ids)).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    const data = {
      at: new Date().toISOString(),
      channel: { id: c.id, title: c.title, handle: c.handle, country: c.country, subs: c.subs, views: c.views, videos: c.videos },
      videos: vids.map((v) => ({ id: v.id, title: v.title, views: v.views, likes: v.likes, comments: v.comments, publishedAt: v.publishedAt, seconds: v.seconds, thumb: v.thumb, url: `https://www.youtube.com/watch?v=${v.id}` })),
      quota: quotaState(),
    };
    await enrichChannel(data).catch((e) => { data.aiError = String(e.message || e).slice(0, 160); });
    chCache.set(c.id, { t: Date.now(), data });
    return data;
  }

  // ---------- Tìm ngách: chấm điểm cơ hội theo từ khoá (~204 đơn vị mỗi từ khoá) ----------
  const NICHE_UNITS = 204;
  async function keywordSample(q, market, days) {
    const m = MARKETS[market];
    const now = Date.now();
    const ids = [];
    for (const d of ['medium', 'long']) { // YouTube cắt ở 4 phút và 20 phút
      const j = await yt('search', { part: 'snippet', type: 'video', q, order: 'viewCount', publishedAfter: new Date(now - days * DAY).toISOString(), publishedBefore: new Date(now).toISOString(), maxResults: 50, regionCode: m.gl, relevanceLanguage: m.hl, videoDuration: d, safeSearch: 'none' }, 'search');
      (j.items || []).forEach((it) => { if (it.id && it.id.videoId) ids.push(it.id.videoId); });
    }
    const all = await videoDetails([...new Set(ids)]);
    const typed = all.filter((v) => scan.isLong(v));
    const vids = typed.filter((v) => scan.inMarket(v, market));
    const chans = await channelDetails([...new Set(vids.map((v) => v.channelId))]);
    return { vids, chans, dropped: typed.length - vids.length, now };
  }
  function scoreKeyword(q, s) {
    const { vids, chans, now } = s;
    const n = vids.length;
    if (!n) return { keyword: q, n: 0, note: s.dropped ? `Không có video đúng ngôn ngữ (đã loại ${s.dropped} video khác ngôn ngữ).` : 'Không tìm thấy video nào.', score: 0, verdict: 'low' };
    const views = vids.map((v) => v.views);
    const med = median(views);
    const subsOf = (v) => (chans[v.channelId] ? chans[v.channelId].subs : null);
    const isSmallHit = (v) => { const sb = subsOf(v); return sb != null && sb < 20000 && v.views >= Math.max(3000, 10 * Math.max(1, sb)); };
    const smallHits = vids.filter(isSmallHit);
    const smallChannels = new Set(smallHits.map((v) => v.channelId));
    const big = vids.filter((v) => { const sb = subsOf(v); return sb != null && sb > 200000; });
    const outlierShare = smallHits.length / n, bigShare = big.length / n;
    const score = Math.round(100 * (0.5 * clamp01(outlierShare / 0.25) + 0.3 * (1 - bigShare) + 0.2 * clamp01(Math.log10(Math.max(1, med)) / 6)));
    return {
      keyword: q, n, channels: new Set(vids.map((v) => v.channelId)).size, median: Math.round(med), totalViews: views.reduce((t, x) => t + x, 0),
      smallVideos: smallHits.length, smallChannels: smallChannels.size, bigShare: Math.round(bigShare * 100), avgAgeDays: Math.round(vids.reduce((t, v) => t + (now - new Date(v.publishedAt)) / DAY, 0) / n),
      score, verdict: score >= 60 ? 'good' : score >= 40 ? 'mid' : 'low',
      examples: smallHits.sort((a, b) => b.views - a.views).slice(0, 3).map((v) => ({ id: v.id, title: v.title, channel: v.channelTitle, subs: subsOf(v), views: v.views, url: `https://www.youtube.com/watch?v=${v.id}`, thumb: v.thumb || '' })),
    };
  }
  async function nicheScan(p) {
    const market = MARKETS[p.market] ? p.market : 'en';
    const days = [7, 28, 90].includes(+p.days) ? +p.days : 28;
    const seenKw = new Set();
    const kws = (Array.isArray(p.keywords) ? p.keywords : []).map((k) => String(k || '').trim().slice(0, 100)).filter((k) => { const l = k.toLowerCase(); if (!k || seenKw.has(l)) return false; seenKw.add(l); return true; }).slice(0, 6);
    if (!kws.length) throw new Error('Hãy nhập ít nhất một từ khoá ngách.');
    const cache = readJson('niche-cache.json', { items: {} });
    const key = (k) => `v1|${market}|${days}|${k.toLowerCase()}`;
    const fresh = (k) => { const h = cache.items[key(k)]; return h && Date.now() - new Date(h.at) < 24 * 3600e3 ? h : null; };
    const todo = kws.filter((k) => !fresh(k) || p.force);
    quotaCheck(todo.length * NICHE_UNITS);
    const used0 = quotaState().used;
    let quotaErr = '';
    for (const k of todo) {
      try {
        const res = scoreKeyword(k, await keywordSample(k, market, days));
        cache.items[key(k)] = { ...res, at: new Date().toISOString() };
        writeJson('niche-cache.json', cache); // ghi từng từ khoá để lỡ hết hạn mức giữa chừng vẫn giữ kết quả đã có
      } catch (e) {
        if (e.code !== 'QUOTA') throw e;
        quotaErr = e.message; break; // hết hạn mức giữa chừng: trả phần đã chấm được
      }
    }
    const keys = Object.keys(cache.items);
    if (keys.length > 300) { keys.sort((a, b) => (cache.items[a].at < cache.items[b].at ? -1 : 1)).slice(0, keys.length - 250).forEach((k) => delete cache.items[k]); writeJson('niche-cache.json', cache); }
    const done = kws.filter((k) => cache.items[key(k)]);
    if (!done.length && quotaErr) throw Object.assign(new Error(quotaErr), { code: 'QUOTA' });
    return { market, days, items: done.map((k) => ({ ...cache.items[key(k)], cached: !todo.includes(k) })).sort((a, b) => b.score - a.score), skipped: kws.filter((k) => !cache.items[key(k)]), warning: quotaErr, units: quotaState().used - used0, quota: quotaState() };
  }

  // ---------- Đo tiềm năng một từ khoá: video/ngày và view/ngày của 7/14/28 ngày qua so với cùng độ dài kỳ liền trước ----------
  // 1 lượt gọi (order=date, 56 ngày gần nhất) đủ tính cả 3 mốc, đỡ tốn hạn mức hơn quét 3 lần riêng.
  async function pulseFetch(q, market, type) {
    const m = MARKETS[market];
    const durations = type === 'short' ? ['short'] : ['medium', 'long'];
    const from = new Date(Date.now() - 56 * DAY).toISOString();
    const ids = [];
    for (const d of durations) {
      const j = await yt('search', { part: 'snippet', type: 'video', q, order: 'date', publishedAfter: from, maxResults: 50, regionCode: m.gl, relevanceLanguage: m.hl, videoDuration: d, safeSearch: 'none' }, 'search');
      (j.items || []).forEach((it) => { if (it.id && it.id.videoId) ids.push(it.id.videoId); });
    }
    const all = await videoDetails([...new Set(ids)]);
    const typed = all.filter((v) => (type === 'short' ? !scan.isLong(v) : scan.isLong(v)));
    return typed.filter((v) => scan.inMarket(v, market));
  }
  function pulseWindow(videos, days, now) {
    const age = (v) => (now - new Date(v.publishedAt)) / DAY;
    const cur = videos.filter((v) => age(v) <= days), prev = videos.filter((v) => { const a = age(v); return a > days && a <= 2 * days; });
    const velocity = (arr) => (arr.length ? Math.round(arr.reduce((t, v) => t + v.views / Math.max(1, age(v)), 0) / arr.length) : 0);
    const pct = (c, p) => (p > 0 ? Math.round(((c - p) / p) * 100) : c > 0 ? null : 0);
    const vc = velocity(cur), vp = velocity(prev);
    return { days, n: cur.length, prevN: prev.length, growthN: pct(cur.length, prev.length), velocity: vc, prevVelocity: vp, growthVelocity: pct(vc, vp) };
  }
  async function keywordPulse(p) {
    const market = MARKETS[p.market] ? p.market : 'en';
    const type = p.type === 'short' ? 'short' : 'long';
    const q = String(p.keyword || '').trim().slice(0, 100);
    if (!q) throw new Error('Thiếu từ khoá cần đo.');
    const cache = readJson('pulse-cache.json', { items: {} });
    const key = `v1|${market}|${type}|${q.toLowerCase()}`;
    const hit = cache.items[key];
    if (hit && !p.force && Date.now() - new Date(hit.at) < 24 * 3600e3) return { ...hit, cached: true };
    quotaCheck(type === 'short' ? 101 : 201);
    const used0 = quotaState().used;
    const videos = await pulseFetch(q, market, type);
    const now = Date.now();
    const windows = [7, 14, 28].map((d) => pulseWindow(videos, d, now));
    // Chỉ chấm "lên/xuống" trên các mốc THỰC SỰ so sánh được (kỳ trước có video). Từ khoá quá phổ biến có thể lấp đầy
    // cả 100 video mẫu chỉ trong vài ngày gần nhất -> các mốc xa hơn không có gì để so, không được tính là "ổn định".
    const validW = windows.filter((w) => w.prevN > 0);
    const risingV = validW.filter((w) => (w.growthN || 0) >= 20 || (w.growthVelocity || 0) >= 20);
    const fallingV = validW.filter((w) => (w.growthN || 0) <= -20 && (w.growthVelocity || 0) <= -20);
    const verdict = videos.length < 4 ? 'low' : !validW.length ? 'saturated'
      : risingV.length / validW.length >= 0.5 ? 'rising' : fallingV.length / validW.length >= 0.5 ? 'falling' : 'stable';
    const uncovered = windows.filter((w) => w.prevN === 0).map((w) => w.days);
    const data = { keyword: q, market, type, at: new Date().toISOString(), sample: videos.length, windows, verdict, uncovered, units: quotaState().used - used0 };
    cache.items[key] = data;
    const keys = Object.keys(cache.items);
    if (keys.length > 300) keys.sort((a, b) => (cache.items[a].at < cache.items[b].at ? -1 : 1)).slice(0, keys.length - 250).forEach((k) => delete cache.items[k]);
    writeJson('pulse-cache.json', cache);
    return { ...data, cached: false, quota: quotaState() };
  }

  return { scanChannel, nicheScan, keywordPulse, NICHE_UNITS };
};
