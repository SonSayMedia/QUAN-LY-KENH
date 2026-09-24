// Bộ máy "bắt trend" — hiện chạy trên KHO VIDEO MẪU sinh ổn định theo từ khoá.
// Khi nối YouTube API thật, chỉ cần thay corpus() bằng dữ liệu từ videos.list (chart=mostPopular)
// và search.list; các hàm phân tích bên dưới giữ nguyên.
(function () {
  const D = window.QLK_DATA;
  const { hash, rng } = D;

  const BANK = {
    Stoic: { subj: ['Marcus Aurelius', 'Seneca', 'Epictetus', 'Anger', 'Fear of Death', 'Discipline', 'Silence', 'Luxury', 'Envy', 'Time'], ch: ['Stoic Daily Notes', 'Le Précepteur', 'Marcus Notebook', 'Calm Philosopher', 'Iron Mind', 'Quiet Strength', 'Forteresse Interieure'] },
    Bible: { subj: ['Genesis', 'the Book of Daniel', 'the Sermon on the Mount', 'Hebrew Words', 'Greek Words', 'Revelation', 'the Psalms', 'the Tower of Babel', 'Ancient Israel', 'the Apostle Paul'], ch: ['Ink Explainer', 'Verses Decoded', 'Bible Insights TV', 'Scroll & Stone', 'Lamp Unfolded', 'The Word Room'] },
    'Hidden Science': { subj: ['a Mechanical Watch', 'a Refrigerator', 'Airplane Wings', 'a Zipper', 'Noise Cancelling', 'a Microwave', 'Gears', 'Superconductors', 'Batteries', 'Lasers'], ch: ['Neon Rush', 'Deep Made Simple', 'The Feynman Way', 'Physics in Motion', 'Inside Machines', 'Tiny Mechanics'] },
    'Phật Pháp': { subj: ['Letting Go', 'the Middle Way', 'Mindful Breathing', 'Anger', 'Emptiness', 'Zen Stories', 'Suffering', 'Compassion', 'Meditation', 'the Monk and the River'], ch: ['Zen Morning', 'El Monje Sereno', 'Quiet Lotus', 'Path of Calm', 'Mountain Temple', 'Breath & Bell'] },
    History: { subj: ['Rome', 'the Black Death', 'the Vikings', 'Cleopatra', 'the Titanic', 'Julius Caesar', 'the Silk Road', 'Ancient Egypt', 'the Crusades', 'Napoleon'], ch: ['History Speaks', 'Learn English Through History', 'Old World Tales', 'Chronicle Lane', 'Timeline Talks', 'Past Unlocked'] },
    'Tâm lý học': { subj: ['Narcissists', 'Body Language', 'Attachment Styles', 'Dark Psychology', 'Introverts', 'Overthinking', 'Manipulation', 'Self-Discipline', 'Loneliness', 'Habits'], ch: ['Mind Decoded', 'Psych in Plain Words', 'Inner Compass', 'The Quiet Brain', 'Mindscape', 'Behavior Lab'] },
    'Tài chính': { subj: ['Compound Interest', 'Index Funds', 'Inflation', 'Debt', 'Side Hustles', 'the 50/30/20 Rule', 'Credit Scores', 'Retirement', 'Passive Income', 'Budgeting'], ch: ['Money Simplified', 'Wealth Notes', 'Penny Logic', 'Cash Clarity', 'Budget Bench', 'The Frugal Desk'] },
    'Thần thoại': { subj: ['Zeus', 'Odin', 'Anubis', 'Medusa', 'Ragnarok', 'Thor', 'Athena', 'Loki', 'Poseidon', 'Osiris'], ch: ['Myth Vault', 'Gods & Legends', 'Olympus Tales', 'Norse Nights', 'Legend Loop', 'Ancient Voices'] },
    'Sức khoẻ': { subj: ['Sleep', 'Cortisol', 'Gut Health', 'Intermittent Fasting', 'Vitamin D', 'Inflammation', 'Blood Sugar', 'Magnesium', 'Walking', 'Stress'], ch: ['Body Basics', 'Vital Notes', 'Healthy Answers', 'Doc Simplified', 'Wellness Lens', 'Everyday Health'] },
    'Sinh tồn': { subj: ['a Plane Crash', 'Desert Survival', 'a Bear Attack', 'Winter Camping', 'Getting Lost', 'a Shipwreck', 'Wild Water', 'a Blizzard', 'Foraging', 'Fire Making'], ch: ['Wild Ready', 'Survival Logic', 'Trail Truths', 'Outback Notes', 'Lost & Found', 'Camp Sense'] },
    'Vũ trụ': { subj: ['Black Holes', 'Mars', 'the Big Bang', 'Dark Matter', 'Voyager 1', 'Neutron Stars', 'the Moon', 'Exoplanets', 'Time Dilation', 'the Milky Way'], ch: ['Cosmos Simple', 'Star Notes', 'Beyond the Sky', 'Space Bites', 'Orbit Daily', 'Deep Field'] },
  };
  const NICHES = Object.keys(BANK);
  const TEMPLATES = [
    'The Hidden Truth About {S}', 'Why Nobody Talks About {S}', '{N} Things You Never Knew About {S}', 'How {S} Really Works',
    'What Happens When You Ignore {S}', '{S}: The Secret Most People Miss', '{N} Lessons {S} Can Teach You', 'Everything About {S} in {N} Minutes',
    'The Real Meaning of {S}', 'Stop Believing This About {S}', 'Why {S} Changes Everything', '{S} Doesn\'t Mean What You Think',
  ];

  const STOP = new Set(('the and for you your are was were what when why how not this that with from about into they them their have has had who nobody most people ' +
    'things never knew really works ignore happens when minutes lessons teach can real meaning stop believing changes everything mean think secret miss doesn any all one out more than only ' +
    'way talks book letting hidden truth real meaning everything lessons secret miss ignore una que los las por con para como del este esta').split(' '));

  // ---------- Kho video mẫu ----------
  function channelSubs(name) {
    const r = rng(hash(name) + 7);
    return Math.round(Math.exp(Math.log(400) + r() * (Math.log(1500000) - Math.log(400))));
  }
  let CORPUS = null;
  function corpus() {
    if (CORPUS) return CORPUS;
    const out = [];
    NICHES.forEach((niche, ni) => {
      const b = BANK[niche];
      const r = rng(hash(niche) + 99);
      const heat = 0.6 + r() * 1.4; // độ "nóng" chung của ngách
      for (let i = 0; i < 46; i++) {
        const si = Math.floor(r() * b.subj.length);
        const hot = si < 2; // 2 chủ đề đầu mỗi ngách đang lên
        const subject = b.subj[si];
        const tpl = TEMPLATES[Math.floor(r() * TEMPLATES.length)];
        const title = tpl.replace(/\{S\}/g, subject).replace(/\{N\}/g, String(3 + Math.floor(r() * 9)));
        const channel = b.ch[Math.floor(r() * b.ch.length)];
        const subs = channelSubs(channel);
        const age = hot && r() < 0.62 ? r() * 27 : r() * 170;
        const mult = (0.15 + Math.pow(r(), 3) * 26) * heat * (hot && age < 28 ? 1.8 : 1);
        out.push({ id: `${ni}-${i}`, niche, title, channel, subs, views: Math.round(subs * mult + 300 + r() * 2000), age, subject });
      }
    });
    CORPUS = out;
    return out;
  }
  const outlier = (v) => v.views / Math.max(v.subs, 500);

  // ---------- Công thức tiêu đề ----------
  const PATTERNS = [
    { id: 'num', label: 'Có con số / danh sách', test: /\b\d+\b/ },
    { id: 'q', label: 'Mở bằng câu hỏi (Why/How/What)', test: /^(why|how|what|when|who)\b/i },
    { id: 'contrast', label: 'Đối lập “không phải như anh nghĩ”', test: /doesn.t mean|stop believing|what you think|nobody talks/i },
    { id: 'secret', label: 'Bí mật / sự thật ẩn', test: /secret|hidden|truth|real\b/i },
    { id: 'promise', label: 'Hứa kết quả / hậu quả', test: /what happens|changes everything|lessons|teach/i },
    { id: 'time', label: 'Nêu thời lượng (in N minutes)', test: /in \d+ minutes/i },
  ];
  const patternsOf = (title) => PATTERNS.filter((p) => p.test.test(title)).map((p) => p.id);

  function tokens(title) {
    const ws = title.toLowerCase().replace(/[“”"'’]/g, ' ').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
    const set = new Set();
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i];
      const ok = (x) => x.length > 2 && !STOP.has(x) && !/^\d+$/.test(x);
      if (ok(w)) set.add(w);
      if (i + 1 < ws.length && ok(w) && ok(ws[i + 1])) set.add(w + ' ' + ws[i + 1]);
    }
    return set;
  }

  function titleTrends(niche, days) {
    const all = corpus().filter((v) => niche === 'all' || v.niche === niche);
    const recent = all.filter((v) => v.age < days);
    const prior = all.filter((v) => v.age >= days && v.age < days * 2);
    const count = (list) => {
      const m = new Map();
      list.forEach((v) => tokens(v.title).forEach((t) => {
        const o = m.get(t) || { n: 0, views: 0, ch: new Set() };
        o.n++; o.views += v.views; o.ch.add(v.channel);
        m.set(t, o);
      }));
      return m;
    };
    const mr = count(recent), mp = count(prior);
    const minN = days <= 7 ? 2 : 3;
    const kws = [...mr.entries()].filter(([, o]) => o.n >= minN).map(([k, o]) => {
      const p = mp.has(k) ? mp.get(k).n : 0;
      const growth = p ? ((o.n - p) / p) * 100 : null;
      return { kw: k, n: o.n, ch: o.ch.size, avg: o.views / o.n, prev: p, growth, rising: p === 0 ? o.n >= minN + 1 : growth >= 50 };
    }).sort((a, b) => (Number(b.rising) - Number(a.rising)) || (b.n * Math.log(2 + b.avg)) - (a.n * Math.log(2 + a.avg)));
    // Bỏ từ đơn đã nằm trong một cụm hai từ có cùng số video (tránh lặp "stoic", "marcus", "marcus aurelius").
    const kwsDedup = kws.filter((k) => k.kw.includes(' ') || !kws.some((o) => o !== k && o.kw.includes(' ') && o.kw.split(' ').includes(k.kw) && o.n >= k.n)).slice(0, 14);
    const base = recent.reduce((t, v) => t + v.views, 0) / Math.max(recent.length, 1);
    const pats = PATTERNS.map((p) => {
      const vs = recent.filter((v) => p.test.test(v.title));
      const avg = vs.reduce((t, v) => t + v.views, 0) / Math.max(vs.length, 1);
      return { id: p.id, label: p.label, n: vs.length, mult: vs.length ? avg / base : 0 };
    }).sort((a, b) => b.mult - a.mult);
    const hits = recent.filter((v) => outlier(v) >= 4).sort((a, b) => outlier(b) - outlier(a)).slice(0, 8);
    return { total: recent.length, prior: prior.length, kws: kwsDedup, pats, hits, base };
  }

  // ---------- Điểm cơ hội ngách ----------
  function nicheScores(days) {
    return NICHES.map((n) => {
      const all = corpus().filter((v) => v.niche === n);
      const rec = all.filter((v) => v.age < days), pri = all.filter((v) => v.age >= days && v.age < days * 2);
      const sum = (l) => l.reduce((t, v) => t + v.views, 0);
      const growth = (sum(rec) - sum(pri)) / Math.max(sum(pri), 1);
      const small = rec.filter((v) => v.subs < 20000 && v.views >= 10 * v.subs).length;
      const smallRatio = small / Math.max(rec.length, 1);
      const chans = new Set(rec.map((v) => v.channel));
      const big = new Set(rec.filter((v) => v.subs > 200000).map((v) => v.channel));
      const competition = big.size / Math.max(chans.size, 1);
      const clamp = (x) => Math.max(0, Math.min(1, x));
      const score = Math.round(100 * (0.4 * clamp(growth) + 0.4 * clamp(smallRatio / 0.3) + 0.2 * (1 - competition)));
      const median = rec.map((v) => v.views).sort((a, b) => a - b)[Math.floor(rec.length / 2)] || 0;
      return { niche: n, videos: rec.length, channels: chans.size, growth: growth * 100, small, median, competition, score, verdict: score >= 60 ? 'good' : score >= 40 ? 'mid' : 'low', channelsBig: big.size };
    }).sort((a, b) => b.score - a.score);
  }

  // ---------- Quét chủ đề ----------
  function scanTopic(q) {
    const toks = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    let list = corpus().filter((v) => toks.some((t) => v.title.toLowerCase().includes(t) || v.niche.toLowerCase().includes(t)));
    const cap = q.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    if (list.length < 10) {
      const r = rng(hash(q));
      const names = ['Topic Lab', 'Clear Answers', 'Deep Dive Daily', 'Simple Facts', 'The Explainer Desk', 'Curious Notes', 'Insight Room'];
      for (let i = 0; i < 14; i++) {
        const subs = Math.round(Math.exp(Math.log(500) + r() * (Math.log(900000) - Math.log(500))));
        const ch = names[Math.floor(r() * names.length)] + (i % 3 ? '' : ' ' + (i + 1));
        list.push({
          id: 'syn-' + i, niche: 'Khác', channel: ch, subs: channelSubs(ch + q), subject: cap,
          title: TEMPLATES[Math.floor(r() * TEMPLATES.length)].replace(/\{S\}/g, cap).replace(/\{N\}/g, String(3 + Math.floor(r() * 9))),
          views: Math.round(subs * (0.2 + Math.pow(r(), 3) * 22) + 500), age: r() * 120,
        });
      }
    }
    list = list.map((v) => ({ ...v })).sort((a, b) => outlier(b) - outlier(a));
    const rel = new Map();
    list.forEach((v) => tokens(v.title).forEach((t) => { if (!toks.includes(t) && !toks.some((x) => t.includes(x))) rel.set(t, (rel.get(t) || 0) + 1); }));
    const related = [...rel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => x[0]);
    const r2 = rng(hash(q) + 5);
    const slope = (r2() - 0.35) * 1.2;
    const interest = Array.from({ length: 12 }, (_, i) => Math.max(5, Math.round(50 + slope * (i - 6) * 12 + (r2() - 0.5) * 16)));
    const dir = interest.slice(-3).reduce((a, b) => a + b, 0) - interest.slice(0, 3).reduce((a, b) => a + b, 0);
    const med = list.map((v) => v.views).sort((a, b) => a - b)[Math.floor(list.length / 2)] || 0;
    return { list, related, interest, dir, small: list.filter((v) => v.subs < 10000 && outlier(v) >= 8).length, med };
  }

  // ---------- Quét kênh ----------
  function scanChannel(name) {
    const h = hash(name);
    const c = D.build({ id: 'scan-' + h.toString(36), name, niche: 'Khác', subs: 800 + (h % 700000), views: 40000 + (h % 60000000), videos: 40 + (h % 380), growth: 0.02 + (h % 9) / 100 }, 'rival', h % 8);
    const r = rng(h + 11);
    const perWeek = 1 + Math.floor(r() * 6);
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
    const avgViews = c.videoList.reduce((t, v) => t + v.views, 0) / c.videoList.length;
    const patCount = {};
    c.videoList.forEach((v) => patternsOf(v.title).forEach((p) => { patCount[p] = (patCount[p] || 0) + 1; }));
    return { c, perWeek, bestDay: days[Math.floor(r() * 7)], bestHour: `${String(12 + Math.floor(r() * 9)).padStart(2, '0')}:00`, avgViews, patCount };
  }

  window.QLK_TRENDS = { NICHES, PATTERNS, patternsOf, titleTrends, nicheScores, scanTopic, scanChannel, outlier, corpus };
})();
