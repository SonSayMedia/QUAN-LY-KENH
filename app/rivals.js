// Đối thủ thật: thêm từ kết quả quét hoặc dán link, theo dõi số liệu mỗi ngày, phát hiện video mới + video nổ (≥5x).
module.exports = function makeRivals(core, scan) {
  const { yt, channelDetails, videoDetails, readJson, writeJson, notifUpsert, readSettings, writeSettings } = core;
  const load = () => readJson('rivals.json', { rivals: [] });
  const save = (o) => writeJson('rivals.json', o);
  const snapsAll = () => readJson('rival-snap.json', {});
  const vnDay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const urlOf = (id) => `https://www.youtube.com/watch?v=${id}`;

  // ---- Ngách tạm dừng theo dõi: đối thủ trong các ngách này không bị đồng bộ (đỡ tốn hạn mức, đỡ nhiễu thông báo) — vẫn xem được trong danh sách, chỉ không cập nhật số liệu/không báo video nổ ----
  function pausedNiches() {
    const s = readSettings();
    return Array.isArray(s.pausedNiches) ? s.pausedNiches : [];
  }
  function setNichePaused(niche, paused) {
    const n = String(niche || '').trim();
    if (!n) throw new Error('Ngách không hợp lệ');
    const s = readSettings();
    const set = new Set(Array.isArray(s.pausedNiches) ? s.pausedNiches : []);
    if (paused) set.add(n); else set.delete(n);
    s.pausedNiches = [...set];
    writeSettings(s);
    return s.pausedNiches;
  }

  function parseLink(s) {
    s = String(s || '').trim();
    let m;
    if ((m = /youtube\.com\/channel\/(UC[\w-]{20,})/i.exec(s))) return { id: m[1] };
    if ((m = /youtube\.com\/@([^\/?#\s]+)/i.exec(s))) { try { return { handle: decodeURIComponent(m[1]) }; } catch (e) { return { handle: m[1] }; } }
    if ((m = /youtube\.com\/user\/([^\/?#\s]+)/i.exec(s))) return { user: m[1] };
    if (/^UC[\w-]{20,}$/.test(s)) return { id: s };
    if (/^@\S+$/.test(s)) return { handle: s.slice(1) };
    return null;
  }
  async function resolveLink(s) {
    const p = parseLink(s);
    if (!p) throw new Error('Link không nhận ra. Dùng dạng https://www.youtube.com/@ten-kenh hoặc /channel/UC…');
    if (p.id) { const d = await channelDetails([p.id]); if (!d[p.id]) throw new Error('Không tìm thấy kênh ' + p.id); return d[p.id]; }
    const j = await yt('channels', { part: 'snippet,statistics,contentDetails', ...(p.handle ? { forHandle: '@' + p.handle } : { forUsername: p.user }) }, 'channels');
    const ch = (j.items || [])[0];
    if (!ch) throw new Error('Không tìm thấy kênh: ' + s);
    const d = await channelDetails([ch.id]);
    return d[ch.id];
  }

  const snapshot = (all, id, c) => {
    const d = vnDay();
    const arr = all[id] || [];
    const row = { d, subs: c.subs, views: c.views, videos: c.videos };
    if (arr.length && arr[arr.length - 1].d === d) arr[arr.length - 1] = row; else arr.push(row);
    all[id] = arr.slice(-120);
  };

  // Cập nhật số liệu + tìm video mới cho các đối thủ. silent = không tạo thông báo (dùng lúc mới thêm).
  async function refresh(list, opts) {
    const silent = !!(opts && opts.silent);
    const data = load();
    const paused = new Set(pausedNiches());
    const targets = data.rivals.filter((r) => (!list || list.includes(r.id)) && !paused.has(r.niche || ''));
    if (!targets.length) return { checked: 0, newVideos: 0, hits: 0 };
    const chans = await channelDetails(targets.map((r) => r.id));
    const snaps = snapsAll();
    const bcache = readJson('baseline-cache.json', {});
    let newVideos = 0, hits = 0;
    const flush = () => { save(data); writeJson('rival-snap.json', snaps); writeJson('baseline-cache.json', bcache); };
    for (const r of targets) {
      const c = chans[r.id];
      if (!c) continue;
      Object.assign(r, { title: c.title, handle: c.handle || r.handle, uploads: c.uploads || r.uploads, stats: { subs: c.subs, views: c.views, videos: c.videos }, lastCheck: new Date().toISOString() });
      snapshot(snaps, r.id, c);
      if (!r.uploads) continue;
      try {
        const pl = await yt('playlistItems', { part: 'contentDetails', playlistId: r.uploads, maxResults: 10 }, 'playlistItems');
        const ids = (pl.items || []).map((x) => x.contentDetails.videoId);
        const first = !r.knownIds;
        const known = new Set(r.knownIds || []);
        const fresh = ids.filter((id) => !known.has(id));
        if (ids.length) {
          // Luôn lấy lại số liệu MỚI NHẤT của 10 video gần nhất hiện tại (không chỉ video mới phát hiện) —
          // trước đây chỉ fetch video MỚI nên lượt xem của video cũ bị đứng yên mãi từ lúc thấy lần đầu, sai lệch với thực tế.
          const det = await videoDetails(ids);
          const cur = new Map((r.recentVideos || []).map((v) => [v.id, v]));
          det.forEach((v) => cur.set(v.id, { id: v.id, title: v.title, views: v.views, publishedAt: v.publishedAt, seconds: v.seconds, thumb: v.thumb || '' }));
          r.recentVideos = [...cur.values()].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, 20);
          r.knownIds = [...new Set([...ids, ...(r.knownIds || [])])].slice(0, 40);
          if (!silent && !first) {
            // Đối thủ đăng video mới: không báo riêng nữa (theo yêu cầu) — chỉ báo khi video đó NỔ (dưới đây).
            const newLong = det.filter((v) => v.seconds >= scan.LONG_MIN && fresh.includes(v.id));
            newVideos += newLong.length;
            if (newLong.length) {
              const bl = await scan.baselines([{ id: r.id, uploads: r.uploads }], 'long', bcache);
              newLong.forEach((v) => {
                const b = scan.baseFor(bl, r.id, v.id);
                if (b && v.views / Math.max(1, b.base) >= 5) {
                  hits++;
                  notifUpsert([{ key: `rivalhit:${v.id}`, section: 'rival', kind: 'outlier', severity: 'warn', title: `${r.title}: video nổ ${(v.views / b.base).toFixed(1)}x — ${v.title}`, body: `${v.views.toLocaleString('vi-VN')} lượt xem`, link: { type: 'url', href: urlOf(v.id) } }]);
                }
              });
            }
          }
        }
      } catch (e) { if (e.code === 'QUOTA') { flush(); throw e; } }
    }
    flush();
    return { checked: targets.length, newVideos, hits };
  }

  async function addChannel(c, niche, market, source) {
    const data = load();
    let r = data.rivals.find((x) => x.id === c.id);
    if (r) { r.niche = niche || r.niche; r.market = market || r.market; save(data); return { existed: true, rival: r }; }
    r = { id: c.id, title: c.title, handle: c.handle || '', niche: niche || '', market: market || 'en', source: source || 'manual', addedAt: new Date().toISOString(), uploads: c.uploads, stats: { subs: c.subs, views: c.views, videos: c.videos }, knownIds: null, recentVideos: [] };
    data.rivals.push(r);
    save(data);
    await refresh([c.id], { silent: true }).catch(() => {});
    return { existed: false, rival: load().rivals.find((x) => x.id === c.id) };
  }
  async function addById(channelId, niche, market, source) {
    const d = await channelDetails([channelId]);
    if (!d[channelId]) throw new Error('Không tìm thấy kênh');
    return addChannel(d[channelId], niche, market, source);
  }
  async function addLinks(links, niche, market) {
    const out = [];
    for (const l of links) {
      try { const c = await resolveLink(l); const r = await addChannel(c, niche, market, 'link'); out.push({ link: l, ok: true, title: c.title, existed: r.existed }); }
      catch (e) { out.push({ link: l, ok: false, error: e.message }); if (e.code === 'QUOTA') break; }
    }
    return out;
  }
  function remove(id) {
    const data = load();
    data.rivals = data.rivals.filter((r) => r.id !== id);
    save(data);
    const s = snapsAll();
    delete s[id];
    writeJson('rival-snap.json', s);
  }
  function setMeta(id, niche, market) {
    const data = load();
    const r = data.rivals.find((x) => x.id === id);
    if (!r) throw new Error('Không có đối thủ này');
    if (niche != null) r.niche = String(niche).slice(0, 60);
    if (market) r.market = market;
    save(data);
  }

  // Dữ liệu cho giao diện: chuỗi 90 ngày dựng từ các ảnh chụp (trước ngày thêm thì giữ bằng số đầu tiên).
  function forClient() {
    const snaps = snapsAll();
    const today = new Date(vnDay() + 'T00:00:00Z').getTime();
    return load().rivals.map((r) => {
      const arr = snaps[r.id] || [];
      const at = (key, dayMs) => {
        const d = new Date(dayMs).toISOString().slice(0, 10);
        let v = null;
        for (const s of arr) { if (s.d <= d) v = s[key]; else break; }
        return v != null ? v : arr.length ? arr[0][key] : 0;
      };
      const series = (key) => Array.from({ length: 90 }, (_, i) => at(key, today - (89 - i) * 86400000) || 0);
      return {
        id: r.id, name: r.title, handle: r.handle, niche: r.niche || 'Chưa đặt ngách', market: r.market, addedAt: r.addedAt, source: r.source,
        videos: (r.stats || {}).videos || 0, subs: series('subs'), views: series('views'), trackedDays: arr.length, lastCheck: r.lastCheck || null,
        videoList: (r.recentVideos || []).map((v) => ({ id: v.id, title: v.title, views: v.views, likes: 0, comments: 0, date: v.publishedAt, url: urlOf(v.id), seconds: v.seconds, thumb: v.thumb || '' })),
      };
    });
  }

  return { load, refresh, addById, addLinks, remove, setMeta, forClient, resolveLink, pausedNiches, setNichePaused };
};
