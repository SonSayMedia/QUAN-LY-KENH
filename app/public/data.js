// Dữ liệu MẪU (chưa nối Google OAuth). Sinh ổn định theo id để mỗi lần mở app số liệu không đổi.
(function () {
  const DAYS = 90;
  const COLORS = ['#7c5cff', '#22c1a5', '#f5a524', '#ef5b7b', '#4aa3ff', '#9bd23c', '#c26bff', '#ff8a4c'];

  function hash(str) {
    let h = 2166136261;
    for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }

  // Chuỗi tích luỹ DAYS ngày, phần tử cuối = total.
  // slump (tuỳ chọn): hệ số làm 7 ngày cuối tăng chậm lại, dùng để mô phỏng kênh đang tụt.
  function series(seed, total, growthRate, minGain, slump) {
    const r = rng(seed);
    const base = Math.max(minGain, (total * growthRate) / DAYS);
    const inc = [];
    for (let i = 0; i < DAYS; i++) {
      const bump = i > DAYS - 8 ? (slump ? slump * (0.6 + r() * 0.8) : 1 + (r() * 0.9)) : 1;
      inc.push(Math.round(base * (0.35 + r() * 1.3) * bump));
    }
    const out = new Array(DAYS);
    out[DAYS - 1] = total;
    for (let i = DAYS - 2; i >= 0; i--) out[i] = Math.max(0, out[i + 1] - inc[i + 1]);
    return out;
  }

  const TITLES = {
    Bible: ['"Blessed" Doesn\'t Mean Happy — The Greek Word Behind the Sermon', '"Weeks" Doesn\'t Mean Seven Days — The Hebrew Word in Daniel', 'What Binding and Loosing Truly Meant in Rabbinic Law', '"Love" Doesn\'t Mean Feeling — The Hebrew Word in Marriage', '"Meek" Doesn\'t Mean Weak — The Greek Word Jesus Chose', 'The Forgotten Meaning of "Amen" in Ancient Worship', 'Why "Sin" Was an Archery Term Before It Was Religion', 'The Real Story Behind the Tower of Babel Text'],
    English: ['Learn English Through History: The Fall of Rome', 'Learn English Through History: The Black Death', 'Learn English Through History: Queen Victoria', 'Learn English Through History: The Titanic', 'Learn English Through History: Julius Caesar', 'Learn English Through History: The Great Fire of London', 'Learn English Through History: Vikings', 'Learn English Through History: Cleopatra'],
    'Hidden Science': ['The Hidden Mechanism Inside a Mechanical Watch', 'How a Refrigerator Really Moves Heat', 'The Secret Physics of a Spinning Top', 'Why Airplanes Really Stay in the Air', 'The Hidden Mechanism of a Zipper', 'How Noise Cancelling Headphones Work', 'The Strange Engineering of a Bicycle Gear', 'Inside a Microwave: What Is Actually Heating?'],
    'Phật Pháp': ['El silencio que cura: 3 enseñanzas del monje', 'Por qué soltar es más difícil que aferrarse', 'La historia del monje y el río', 'Cómo el Buda enfrentó el enojo', 'El vacío no es lo que crees', 'La práctica de 10 minutos que cambia todo', 'Una lección de humildad del maestro zen', 'Respirar antes de responder'],
    Stoic: ['Sénèque : Pourquoi le temps ne vous manque pas', 'Marc Aurèle et l\'art de ne pas se plaindre', 'Épictète : ce qui dépend de vous', 'Les 5 habitudes des stoïciens', 'Comment rester calme sous pression', 'La mort comme professeur de vie', 'Pourquoi les stoïciens fuyaient le luxe', 'Le journal du soir de Marc Aurèle'],
    default: ['Tổng hợp những điều cần biết về chủ đề này', 'Sự thật ít người biết — phần 1', 'Sự thật ít người biết — phần 2', 'Câu chuyện đằng sau sự kiện nổi tiếng', 'Giải thích đơn giản trong 10 phút', 'Top 5 điều bạn chưa từng nghe', 'Vì sao mọi người hiểu sai chuyện này', 'Lịch sử ngắn gọn của chủ đề'],
  };

  function makeVideos(id, niche, views, count, lastAge) {
    const r = rng(hash(id + 'v'));
    const pool = TITLES[niche] || TITLES.default;
    const list = [];
    for (let i = 0; i < count; i++) {
      const age = i === 0 ? (lastAge != null ? lastAge : r() * 1.5) : (lastAge || 0) + i * (1.5 + r() * 2.5);
      const v = Math.round((views / (count * 2.2)) * (0.15 + r() * (i === 0 ? 0.6 : 2.4)));
      const d = new Date(Date.now() - age * 86400000);
      list.push({
        title: pool[i % pool.length] + (i >= pool.length ? ` #${Math.floor(i / pool.length) + 1}` : ''),
        views: v,
        likes: Math.round(v * (0.02 + r() * 0.04)),
        comments: Math.round(v * (0.002 + r() * 0.006)),
        date: d.toISOString(),
        isNew: age <= 2,
      });
    }
    const max = list.reduce((m, x) => (x.views > m ? x.views : m), 0);
    return list.map((v) => ({ ...v, isTop: v.views === max }));
  }

  function build(def, kind, i) {
    const seed = hash(def.name);
    const subs = series(seed, def.subs, def.growth, 1);
    const views = series(seed + 1, def.views, def.growth * 1.2, 5, def.slump);
    const comments = def.comments != null ? series(seed + 2, def.comments, def.growth * 1.1, 0) : null;
    return {
      id: def.id || (kind === 'own' ? 'own-' : 'rival-') + seed.toString(36),
      kind,
      name: def.name,
      niche: def.niche,
      country: def.country || '',
      color: COLORS[i % COLORS.length],
      videos: def.videos,
      subs, views, comments,
      videoList: makeVideos(def.name, def.niche, def.views, Math.min(14, Math.max(8, Math.round(def.videos / 4))), def.lastVideoDaysAgo),
    };
  }

  const OWN = [
    { name: 'The Bible Unpacked', niche: 'Bible', country: 'US', subs: 329, views: 17400, videos: 24, comments: 412, growth: 0.16 },
    { name: 'Learn English Through History', niche: 'English', country: 'US', subs: 590, views: 11900, videos: 46, comments: 268, growth: 0.06 },
    { name: 'The Hidden Mechanism', niche: 'Hidden Science', country: 'US', subs: 53, views: 15000, videos: 43, comments: 91, growth: 0.12 },
    { name: 'El Monje Sereno', niche: 'Phật Pháp', country: 'Tây Ban Nha', subs: 4, views: 333, videos: 27, comments: 12, growth: 0.5, lastVideoDaysAgo: 5 },
    { name: 'Forteresse Stoïque', niche: 'Stoic', country: 'Pháp', subs: 4, views: 228, videos: 28, comments: 6, growth: 0.5, slump: 0.12, lastVideoDaysAgo: 9 },
  ].map((d, i) => build(d, 'own', i));

  const RIVAL_SEED = [
    ['Ink Explainer', 'Bible', 1450000, 122000000, 640, 0.09],
    ['Neon Rush', 'Hidden Science', 980000, 88000000, 410, 0.11],
    ['Le Précepteur', 'Stoic', 640000, 39000000, 300, 0.07],
    ['Deep Made Simple', 'Hidden Science', 520000, 41000000, 260, 0.08],
    ['The Feynman Way', 'Hidden Science', 410000, 30000000, 190, 0.06],
    ['Stoic Daily Notes', 'Stoic', 720000, 54000000, 520, 0.05],
    ['Verses Decoded', 'Bible', 310000, 21000000, 280, 0.07],
    ['History Speaks', 'English', 260000, 18000000, 350, 0.04],
    ['Zen Morning', 'Phật Pháp', 205000, 12000000, 240, 0.06],
    ['Marcus Notebook', 'Stoic', 188000, 9500000, 170, 0.05],
    ['Bible Insights TV', 'Bible', 156000, 8700000, 330, 0.03],
    ['Physics in Motion', 'Hidden Science', 143000, 7600000, 210, 0.05],
  ];
  const RIVALS = RIVAL_SEED.map(([name, niche, s, v, n, g], i) => build({ name, niche, subs: s, views: v, videos: n, growth: g }, 'rival', i));

  window.QLK_DATA = { DAYS, OWN, RIVALS, build, hash, rng };
})();
