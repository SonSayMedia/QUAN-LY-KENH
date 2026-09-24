// Quét Title Trends thật: tìm video theo từ khoá (cả YouTube), xếp theo lượt xem trong khoảng thời gian,
// tính điểm nổ (kiểu VidIQ: view ÷ trung vị view của chính kênh), VPH, và nhờ AI dịch + phân loại tiêu đề theo 3 thành phần.
const DAY = 86400000;
const LONG_MIN = 180; // dưới 3 phút = Short, từ 3 phút = video dài

module.exports = function makeScan(core, ctx) {
  const { yt, videoDetails, channelDetails, MARKETS, readJson, writeJson, chunk, quotaState } = core;
  const { aiChat } = ctx;

  const isLong = (v) => v.seconds >= LONG_MIN;

  // ---------- Nhận diện ngôn ngữ tiêu đề (để chỉ giữ video đúng ngôn ngữ của thị trường đã chọn) ----------
  // relevanceLanguage của YouTube chỉ là gợi ý nên kết quả vẫn lẫn ngôn ngữ khác; em lọc lại ở đây.
  const SW = {
    en: 'the and of to in for with on is you your how why what this that from are life world best top real new when who has have will can not all my our its at by an it be or as',
    es: 'el la los las de del que en un una por para con es como más y se su al lo sus pero este esta cómo qué nunca sobre entre desde',
    pt: 'o os as de do da dos das que em um uma para com não é como mais se no na pelo pela você isso ele ela nos seu sua ao aos você ninguém',
    fr: 'le les des du une est pour dans avec pas sur qui que au aux et un sont ce cette plus ses',
    de: 'der die das und ist mit für nicht ein eine auf den dem des zu von im wie',
    id: 'yang dan di dengan untuk ini itu dari pada adalah tidak akan ke juga saya',
    it: 'il lo gli le di che per con una sono nel della degli alla non più come',
    tr: 've bir bu için ile de da çok daha en gibi mi',
  };
  const SWSET = Object.fromEntries(Object.entries(SW).map(([k, v]) => [k, new Set(v.split(' '))]));
  const VI_RE = /[ăơưđĂƠƯĐạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ]/;
  function detectLang(v) {
    const t = String(v.title || '');
    if (/[가-힯ᄀ-ᇿ]/.test(t)) return 'ko';
    if (/[぀-ヿ]/.test(t)) return 'ja';
    if (/[一-鿿]/.test(t) && !/[A-Za-z]{4,}/.test(t)) return 'zh';
    if (/[Ѐ-ӿ֐-ۿऀ-෿฀-๿]/.test(t)) return 'other';
    const meta = String(v.lang || '').toLowerCase().split('-')[0];
    if (VI_RE.test(t)) return 'vi';
    const words = t.toLowerCase().match(/[a-zà-ÿñç]+/g) || [];
    let best = 'unknown', bestScore = 0;
    Object.entries(SWSET).forEach(([k, set]) => { const s = words.filter((w) => set.has(w)).length; if (s > bestScore) { best = k; bestScore = s; } });
    if (/[¿¡ñ]/i.test(t) && bestScore < 3) return 'es';
    if (/[ãõ]/i.test(t) && bestScore < 3) return 'pt';
    if (['en', 'es', 'pt', 'vi', 'ja', 'ko'].includes(meta)) {
      // metadata do người đăng đặt; nếu tiêu đề rõ ràng là ngôn ngữ Latin khác thì tin tiêu đề
      return best !== 'unknown' && best !== meta && bestScore >= 2 ? (['en', 'es', 'pt'].includes(best) ? best : 'other') : meta;
    }
    if (meta && meta !== 'und' && meta !== 'zxx' && bestScore === 0) return 'other';
    if (best === 'unknown') return 'unknown';
    return ['en', 'es', 'pt'].includes(best) ? best : 'other';
  }
  // Tiêu đề không có từ dừng để nhận diện (vd "Baikal 4K"): chỉ nhận cho thị trường tiếng Anh nếu toàn ký tự Latin cơ bản.
  const inMarket = (v, market) => { const l = detectLang(v); return l === market || (l === 'unknown' && market === 'en' && !/[^\x00-\x7F]/.test(v.title)); };
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
  const norm = (s) => String(s || '').toLowerCase().replace(/[“”"'’.,!?:;()\[\]{}|/\\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const estimateUnits = (type) => (type === 'short' ? 270 : 470);

  async function searchIds({ q, market, type, from, to }) {
    const m = MARKETS[market];
    const durations = type === 'short' ? ['short'] : ['medium', 'long']; // YouTube cắt ở 4 phút và 20 phút
    const ids = [];
    for (const d of durations) {
      const j = await yt('search', { part: 'snippet', type: 'video', q, order: 'viewCount', publishedAfter: from, publishedBefore: to, maxResults: 50, regionCode: m.gl, relevanceLanguage: m.hl, videoDuration: d, safeSearch: 'none' }, 'search');
      (j.items || []).forEach((it) => { if (it.id && it.id.videoId) ids.push(it.id.videoId); });
    }
    return [...new Set(ids)];
  }

  // Mức view "bình thường" của kênh: trung vị view ~20 video cùng loại gần nhất (lưu cache 24 giờ).
  async function baselines(channels, type, bcache) {
    const out = {};
    for (const ch of channels) {
      if (!ch.uploads) continue;
      const key = `${ch.id}|${type}`;
      const hit = bcache[key];
      if (hit && Date.now() - hit.t < DAY) { out[ch.id] = hit; continue; }
      try {
        const pl = await yt('playlistItems', { part: 'contentDetails', playlistId: ch.uploads, maxResults: 30 }, 'playlistItems');
        const ids = (pl.items || []).map((x) => x.contentDetails.videoId);
        const vids = (await videoDetails(ids)).filter((v) => (type === 'short' ? !isLong(v) : isLong(v))).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, 20);
        bcache[key] = { t: Date.now(), vids: vids.map((v) => [v.id, v.views]) };
        out[ch.id] = bcache[key];
      } catch (e) { if (e.code === 'QUOTA') throw e; }
    }
    return out;
  }
  const baseFor = (bl, chId, excludeId) => {
    const b = bl[chId];
    if (!b) return null;
    const views = b.vids.filter((x) => x[0] !== excludeId).map((x) => x[1]);
    return views.length >= 3 ? { base: median(views), n: views.length } : null;
  };

  // AI: dịch tiêu đề + trích cụm từ khoá + phân loại 3 thành phần (lưu cache theo video, 30 ngày)
  async function aiAnalyze(vids, market, mode, acache) {
    const need = vids.filter((v) => { const c = acache[v.id]; return !c || (mode === 'full' && !c.vi); });
    let error = null;
    for (const part of chunk(need, 20)) {
      const full = mode === 'full';
      const prompt = [
        { role: 'system', content: 'Bạn là chuyên gia phân tích tiêu đề YouTube. Chỉ trả về JSON hợp lệ, không giải thích.' },
        { role: 'user', content: [
          `Ngôn ngữ của các tiêu đề: ${MARKETS[market].label}.`,
          'Với mỗi tiêu đề hãy trả về các trường:',
          full ? '- "vi": bản dịch tiếng Việt tự nhiên, ngắn gọn (nếu đã là tiếng Việt thì giữ nguyên).' : '',
          '- "phrases": 1–3 CỤM TỪ KHOÁ chính (2–4 từ, viết thường, đúng ngôn ngữ gốc) mà người xem có thể gõ lên thanh tìm kiếm YouTube.',
          '- "k": true nếu NỬA ĐẦU tiêu đề chứa một cụm từ khoá tìm kiếm như trên, ngược lại false.',
          '- "t": yếu tố tâm lý, MỘT trong: "sợ hãi" (đánh vào nỗi đau, mất mát, nguy hiểm), "tò mò" (bí ẩn, điều bị giấu), "tham lam" (kết quả dễ dàng/nhanh/lợi lớn), "cảnh giác" (cảnh báo, sai lầm cần tránh); null nếu không có.',
          '- "c": bối cảnh/đóng gói, MỘT trong: "ngoặc vuông", "ngoặc tròn", "con số", "năm", "khác"; null nếu không có.',
          `Trả về đúng một mảng JSON: [{"id":"...",${full ? '"vi":"...",' : ''}"phrases":["..."],"k":true,"t":"tò mò","c":"con số"}]`,
          'Danh sách: ' + JSON.stringify(part.map((v) => ({ id: v.id, title: v.title }))),
        ].filter(Boolean).join('\n') },
      ];
      try {
        const raw = await aiChat(prompt, 8000);
        const m = /\[[\s\S]*\]/.exec(raw);
        if (!m) throw new Error('AI trả về sai định dạng');
        JSON.parse(m[0]).forEach((it) => {
          if (!it || !it.id) return;
          acache[it.id] = { ...(acache[it.id] || {}), t0: Date.now(), ...(it.vi ? { vi: String(it.vi).slice(0, 300) } : {}), phrases: (it.phrases || []).map(norm).filter(Boolean).slice(0, 3), k: !!it.k, t: it.t || null, c: it.c || null };
        });
      } catch (e) { error = String(e.message || e).slice(0, 160); }
    }
    return error;
  }

  function analyze(pool, prior, ai) {
    const avgAll = pool.length ? pool.reduce((t, v) => t + v.views, 0) / pool.length : 0;
    const phr = (v) => ((ai[v.id] || {}).phrases || []);
    const rec = new Map(), pri = new Map();
    pool.forEach((v) => phr(v).forEach((p) => { const o = rec.get(p) || { vids: new Set(), ch: new Set(), sum: 0 }; if (!o.vids.has(v.id)) { o.vids.add(v.id); o.ch.add(v.channelId); o.sum += v.views; } rec.set(p, o); }));
    prior.forEach((v) => phr(v).forEach((p) => { const o = pri.get(p) || { vids: new Set() }; o.vids.add(v.id); pri.set(p, o); }));
    // "Đang lên": ≥3 video của ≥2 kênh, số video tăng so với kỳ trước VÀ view TB cao hơn mức chung của nhóm
    const keywords = [...rec.entries()].map(([p, o]) => {
      const n = o.vids.size, prev = pri.has(p) ? pri.get(p).vids.size : 0, avg = o.sum / n;
      return { kw: p, n, ch: o.ch.size, avg, prev, growth: prev ? ((n - prev) / prev) * 100 : null };
    }).filter((k) => k.n >= 3 && k.ch >= 2 && k.n > k.prev && k.avg >= avgAll).sort((a, b) => b.n - a.n || b.avg - a.avg).slice(0, 15);
    // Công thức = tổ hợp 3 thành phần: ① từ khoá, ② tâm lý, ③ bối cảnh
    const groups = new Map();
    const trig = {};
    pool.forEach((v) => {
      const a = ai[v.id];
      if (!a) return;
      const key = `${a.k ? 1 : 0}${a.t ? 1 : 0}${a.c ? 1 : 0}`;
      const g = groups.get(key) || { key, n: 0, sum: 0 };
      g.n++; g.sum += v.views; groups.set(key, g);
      if (a.t) trig[a.t] = (trig[a.t] || 0) + 1;
    });
    const formulas = [...groups.values()].map((g) => ({ key: g.key, n: g.n, avg: g.sum / g.n, mult: avgAll ? g.sum / g.n / avgAll : 0, parts: g.key.split('').map((x) => x === '1') })).sort((a, b) => b.mult - a.mult);
    return { keywords, formulas, triggers: trig, avgAll };
  }

  async function runScan(p) {
    const market = MARKETS[p.market] ? p.market : 'en';
    const type = p.type === 'short' ? 'short' : 'long';
    const days = [1, 7, 28, 90].includes(+p.days) ? +p.days : 1;
    const q = String(p.keyword || p.niche || '').trim();
    if (!q) throw new Error('Chưa có từ khoá hoặc ngách để quét.');
    const cacheKey = `v2|${market}|${type}|${days}|${q.toLowerCase()}`; // v2: đã lọc theo ngôn ngữ thị trường
    const scans = readJson('scans.json', { items: [] });
    const hit = scans.items.find((s) => s.cacheKey === cacheKey && Date.now() - new Date(s.at) < 6 * 3600e3);
    if (hit && !p.force) return { ...hit, fromCache: true, quota: quotaState() };
    core.quotaCheck(estimateUnits(type));
    const usedBefore = quotaState().used;
    const now = Date.now();
    const iso = (t) => new Date(t).toISOString();
    const [recentIds, priorIds] = [
      await searchIds({ q, market, type, from: iso(now - days * DAY), to: iso(now) }),
      await searchIds({ q, market, type, from: iso(now - 2 * days * DAY), to: iso(now - days * DAY) }),
    ];
    const details = await videoDetails([...recentIds, ...priorIds]);
    const okType = (v) => (type === 'short' ? !isLong(v) : isLong(v));
    const recentSet = new Set(recentIds);
    const byViews = (a, b) => b.views - a.views;
    const typed = details.filter((v) => okType(v));
    const inLang = typed.filter((v) => inMarket(v, market));
    const langDropped = typed.length - inLang.length;
    const recentPool = inLang.filter((v) => recentSet.has(v.id)).sort(byViews).slice(0, 50);
    const priorPool = inLang.filter((v) => !recentSet.has(v.id)).sort(byViews).slice(0, 50);
    const result = { id: 's' + now.toString(36), cacheKey, at: iso(now), params: { niche: p.niche || '', market, type, days, keyword: q }, poolSize: recentPool.length, priorSize: priorPool.length, langDropped, top: [], keywords: [], formulas: [], triggers: {}, outliers: [], aiError: null, notes: [] };
    if (!recentPool.length) {
      result.notes.push(langDropped ? `Không có video nào bằng ${MARKETS[market].label} trong khoảng thời gian này (đã loại ${langDropped} video khác ngôn ngữ). Thử mốc dài hơn hoặc đổi từ khoá.` : 'Không tìm thấy video nào trong khoảng thời gian này với từ khoá đó.');
    } else {
      const top30 = recentPool.slice(0, 30);
      const chans = await channelDetails(top30.map((v) => v.channelId));
      const bcache = readJson('baseline-cache.json', {});
      const bl = await baselines(Object.values(chans), type, bcache);
      writeJson('baseline-cache.json', bcache);
      const seen = readJson('seen.json', {});
      const acache = readJson('ai-cache.json', {});
      result.aiError = await aiAnalyze(recentPool, market, 'full', acache);
      const err2 = await aiAnalyze(priorPool, market, 'phrases', acache);
      result.aiError = result.aiError || err2;
      writeJson('ai-cache.json', acache);
      const item = (v) => {
        const ch = chans[v.channelId];
        const b = ch ? baseFor(bl, v.channelId, v.id) : null;
        const hours = Math.max(1, (now - new Date(v.publishedAt)) / 3600e3);
        const prev = seen[v.id];
        const vphRecent = prev && now - prev.t >= 6 * 3600e3 ? Math.max(0, (v.views - prev.views) / ((now - prev.t) / 3600e3)) : null;
        const a = acache[v.id] || {};
        return {
          id: v.id, url: `https://www.youtube.com/watch?v=${v.id}`, title: v.title, vi: a.vi || '', channelId: v.channelId, channelTitle: v.channelTitle,
          channelUrl: `https://www.youtube.com/channel/${v.channelId}`, subs: ch ? ch.subs : null, views: v.views, seconds: v.seconds, publishedAt: v.publishedAt, thumb: v.thumb || '',
          vph: v.views / hours, vphRecent, outlier: b ? { score: v.views / Math.max(1, b.base), base: Math.round(b.base), n: b.n } : null,
          flags: { k: !!a.k, t: a.t || null, c: a.c || null },
        };
      };
      const items = recentPool.map((v, i) => (i < 30 ? item(v) : { ...item(v), outlier: null }));
      result.top = items.slice(0, 15);
      result.outliers = items.filter((x) => x.outlier && x.outlier.score >= 5).sort((a, b) => b.outlier.score - a.outlier.score).slice(0, 20);
      Object.assign(result, (({ keywords, formulas, triggers }) => ({ keywords, formulas, triggers }))(analyze(recentPool, priorPool, acache)));
      // ghi nhận lượt thấy để lần sau tính VPH gần đây
      recentPool.forEach((v) => { if (!seen[v.id] || now - seen[v.id].t >= 6 * 3600e3) seen[v.id] = { t: now, views: v.views }; });
      const keys = Object.keys(seen);
      if (keys.length > 6000) keys.sort((a, b) => seen[a].t - seen[b].t).slice(0, keys.length - 5000).forEach((k) => delete seen[k]);
      writeJson('seen.json', seen);
    }
    result.quotaUsedByScan = quotaState().used - usedBefore;
    scans.items = [result, ...scans.items.filter((s) => s.cacheKey !== cacheKey)].slice(0, 60);
    writeJson('scans.json', scans);
    return { ...result, quota: quotaState() };
  }
  const getScan = (id) => { const s = readJson('scans.json', { items: [] }).items.find((x) => x.id === id); return s ? { ...s, quota: quotaState() } : null; };

  return { runScan, getScan, estimateUnits, median, isLong, baselines, baseFor, LONG_MIN, detectLang, inMarket, aiAnalyze, norm };
};
