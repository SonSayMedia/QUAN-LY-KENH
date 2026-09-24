// Kho gợi ý bài đăng cộng đồng theo ngách. Mỗi ngày MỘT bài, chọn NGẪU NHIÊN nhưng không lặp trong cả vòng:
// mỗi kênh có "túi" bài; túi được xáo ngẫu nhiên theo từng vòng, mỗi ngày lấy một bài trong túi (hết túi thì xáo lại).
// Mỗi mục: [loại bài, nội dung (đúng ngôn ngữ kênh), lựa chọn bình chọn, ý chính tiếng Việt, cảnh minh hoạ (tiếng Anh, chỉ cho loại Câu hỏi/Hình ảnh)]
// Khi gắn AI (9router/Gemini), bài do AI viết thay thế gợi ý mẫu.
(function () {
  const S = {
    Bible: { lang: 'Tiếng Anh', style: 'cinematic painterly realism, warm golden light, deep shadows, ancient Middle Eastern atmosphere', items: [
      ['Bình chọn', 'Which book of the Bible should we unpack next?', ['Daniel', 'Revelation', 'Psalms', 'Genesis'], 'Hỏi khán giả muốn giải nghĩa sách nào tiếp theo'],
      ['Câu hỏi', 'Which single word in the Bible changed how you read a verse? Tell us below 👇', null, 'Hỏi từ nào trong Kinh Thánh đổi cách hiểu của họ', 'an open ancient scroll with glowing Hebrew and Greek letters rising from the page'],
      ['Văn bản', 'Did you know? In Hebrew, “shalom” means far more than peace — it means wholeness. Which meaning surprised you most?', null, 'Chia sẻ nghĩa của “shalom” và hỏi cảm nhận'],
      ['Câu hỏi', 'What verse has been on your heart this week?', null, 'Hỏi câu Kinh Thánh đang nghĩ đến tuần này', 'an old open Bible on a wooden table beside a candle at dawn, soft window light'],
      ['Bình chọn', 'Should our next video cover a Greek word or a Hebrew word?', ['Greek word', 'Hebrew word'], 'Chọn giữa từ Hy Lạp và từ Do Thái cho video sau'],
      ['Văn bản', 'Small habit, big change: read one Psalm before you check your phone today. Who is in?', null, 'Thử thách đọc một bài Thi thiên trước khi xem điện thoại'],
      ['Video / teaser', 'New video tomorrow: a word you have read a hundred times — and probably misunderstood. Guess which one 👇', null, 'Nhá hàng video mai, cho khán giả đoán từ'],
      ['Câu hỏi', 'Which Bible character do you relate to most, and why?', null, 'Hỏi nhân vật Kinh Thánh họ thấy gần gũi nhất', 'silhouettes of ancient biblical figures walking along a desert road at sunset'],
      ['Hình ảnh', 'Morning light on an old scroll. Which verse does this image bring to mind? 📜', null, 'Đăng ảnh cuộn giấy cổ và hỏi câu Kinh Thánh gợi nhớ', 'sunrise light falling across an ancient parchment scroll and a clay oil lamp'],
      ['Hình ảnh', 'A quiet moment with the Psalms tonight. What word would you underline? ✍️', null, 'Đăng ảnh đọc Thi thiên và hỏi từ muốn gạch chân', 'a hand holding a quill above an open Psalms manuscript in warm candlelight'],
    ] },
    English: { lang: 'Tiếng Anh', style: 'vintage historical illustration, warm sepia parchment tones, detailed engraving style', items: [
      ['Bình chọn', 'Which era should we use to teach English next?', ['Ancient Rome', 'Vikings', 'Victorian London', 'The Titanic'], 'Chọn thời kỳ lịch sử cho bài học tiếng Anh sau'],
      ['Câu hỏi', 'Word of the day: “plague”. Can you use it in a sentence about history? Write yours below!', null, 'Đặt câu với từ “plague”', 'a medieval city street under a dark dramatic sky with a single glowing lantern'],
      ['Văn bản', 'Quick tip: “ancient” and “old” are not the same. Ancient means thousands of years ago. Can you give an example?', null, 'Mẹo phân biệt “ancient” và “old”'],
      ['Câu hỏi', 'What is the hardest English word for you to pronounce? We will cover the top answers in a video.', null, 'Hỏi từ khó phát âm nhất', 'colorful speech bubbles floating above an antique world map, playful vintage style'],
      ['Bình chọn', 'How do you practice English the most?', ['Watching videos', 'Reading', 'Speaking', 'Writing'], 'Hỏi cách luyện tiếng Anh chính'],
      ['Văn bản', 'Today’s history fact: the Great Fire of London burned for four days. Which word in this sentence is new to you?', null, 'Sự thật lịch sử kèm hỏi từ mới'],
      ['Video / teaser', 'Tomorrow: learn 10 English words from the story of Cleopatra. Ready?', null, 'Nhá hàng bài học 10 từ từ câu chuyện Cleopatra'],
      ['Câu hỏi', 'Tell us one new English word you learned this week 👇', null, 'Hỏi từ mới học được tuần này', 'an open notebook with handwritten words and a quill beside an antique globe'],
      ['Hình ảnh', 'Can you describe this scene in English? Write one sentence below 👇', null, 'Đăng ảnh cảnh lịch sử và yêu cầu mô tả bằng tiếng Anh', 'a bustling Victorian London street at dusk with gas lamps and horse carriages'],
      ['Hình ảnh', 'What do you see? Name three objects in English! 🏺', null, 'Đăng ảnh và hỏi gọi tên 3 đồ vật bằng tiếng Anh', 'an ancient Roman forum with marble columns, amphorae and statues in warm sunlight'],
    ] },
    'Hidden Science': { lang: 'Tiếng Anh', style: 'sleek technical illustration, dark blueprint background, cool blue neon accents, high detail', items: [
      ['Bình chọn', 'Which everyday machine should we take apart next?', ['Microwave', 'Zipper', 'Refrigerator', 'Mechanical watch'], 'Chọn thiết bị hằng ngày để “mổ xẻ” tiếp'],
      ['Câu hỏi', 'What everyday object do you use daily but have no idea how it works? Ask us.', null, 'Hỏi đồ vật dùng hằng ngày mà chưa hiểu', 'a household appliance shown as a glowing exploded-view diagram on a dark blueprint background'],
      ['Văn bản', 'Fun fact: a refrigerator does not create cold — it moves heat out. Did you know that?', null, 'Sự thật: tủ lạnh chuyển nhiệt ra ngoài'],
      ['Câu hỏi', 'Guess: why are airplane wings curved on top? The best answer gets pinned.', null, 'Đố vì sao cánh máy bay cong phía trên', 'an airplane wing cross-section with visible airflow lines in blueprint style'],
      ['Bình chọn', 'Which do you find more fascinating?', ['Tiny mechanisms', 'Giant machines'], 'Thích cơ chế nhỏ hay máy khổng lồ'],
      ['Văn bản', 'A mechanical watch has over a hundred tiny parts working together. Would you try to build one?', null, 'Đồng hồ cơ có hơn trăm chi tiết nhỏ'],
      ['Video / teaser', 'Tomorrow: the hidden mechanism inside something you touch every day. Can you guess what it is?', null, 'Nhá hàng video mai, đoán vật dụng'],
      ['Câu hỏi', 'Which invention do you think is the most underrated?', null, 'Hỏi phát minh bị đánh giá thấp nhất', 'simple everyday inventions (paperclip, zipper, light bulb) lit like museum artifacts'],
      ['Hình ảnh', 'Can you guess what machine this is from the inside? ⚙️', null, 'Đăng ảnh bên trong máy và hỏi đoán tên', 'macro view of interlocking brass gears and springs inside a mechanical watch, shallow depth of field'],
      ['Hình ảnh', 'Mystery part of the day: what does it do? 🔍', null, 'Đăng ảnh một chi tiết máy và hỏi công dụng', 'a single unlabeled mechanical component on a dark studio backdrop with blue rim light'],
    ] },
    'Phật Pháp': { lang: 'Tiếng Tây Ban Nha', style: 'soft serene minimalist zen aesthetic, pastel dawn light, gentle mist, calm composition', items: [
      ['Bình chọn', '¿Qué tema quieres que tratemos en el próximo video?', ['Soltar', 'La respiración', 'La ira', 'El vacío'], 'Chọn chủ đề video sau: buông bỏ, hơi thở, giận dữ, tính không'],
      ['Câu hỏi', '¿Qué te ayuda más a calmar la mente cuando estás estresado? Cuéntanos 👇', null, 'Hỏi điều giúp bình tĩnh khi căng thẳng', 'a calm monk meditating beside a still lake at dawn with soft mist'],
      ['Văn bản', 'Hoy, antes de responder, respira tres veces. Una pequeña pausa puede cambiar todo tu día. 🙏', null, 'Nhắc thở ba lần trước khi phản ứng'],
      ['Câu hỏi', '¿Qué es lo que más te cuesta soltar en este momento?', null, 'Hỏi điều khó buông bỏ nhất lúc này', 'an open hand releasing a glowing lotus petal that floats away on a quiet river'],
      ['Bình chọn', '¿Cuándo prefieres meditar?', ['Mañana', 'Tarde', 'Noche', 'Cuando lo necesito'], 'Hỏi thời điểm thích thiền'],
      ['Văn bản', 'Una idea budista muy conocida: el dolor es inevitable, pero el sufrimiento es opcional. ¿Qué opinas?', null, 'Chia sẻ ý “đau là tất yếu, khổ là lựa chọn”'],
      ['Video / teaser', 'Mañana: la historia de un monje y un río que cambiará cómo ves el enojo. ¿Lo esperas?', null, 'Nhá hàng câu chuyện nhà sư và dòng sông'],
      ['Câu hỏi', '¿Cuántos minutos al día dedicas al silencio?', null, 'Hỏi mỗi ngày dành bao nhiêu phút cho im lặng', 'a quiet stone path through a bamboo forest in soft morning light'],
      ['Hình ảnh', 'Respira con esta imagen un momento. ¿Qué sientes? 🌿', null, 'Đăng ảnh yên bình và hỏi cảm nhận', 'a serene misty mountain temple at sunrise under a soft pastel sky'],
      ['Hình ảnh', '¿Qué palabra te da esta imagen? 🪷', null, 'Đăng ảnh hoa sen và hỏi từ gợi lên', 'a single lotus flower on still water with gentle ripples, minimalist composition'],
    ] },
    Stoic: { lang: 'Tiếng Pháp', style: 'cinematic chiaroscuro, muted stone and slate palette, dramatic sky, timeless classical mood', items: [
      ['Bình chọn', 'Quel philosophe stoïcien voulez-vous découvrir en priorité ?', ['Marc Aurèle', 'Sénèque', 'Épictète'], 'Chọn triết gia Khắc kỷ muốn xem trước'],
      ['Câu hỏi', 'Quelle situation vous a fait perdre votre calme cette semaine ? Comment l’auriez-vous gérée en stoïcien ?', null, 'Hỏi tình huống mất bình tĩnh tuần này', 'a lone figure standing calm on a rocky shore facing a stormy sea'],
      ['Văn bản', 'Rappel stoïcien : ne vous inquiétez que de ce qui dépend de vous. Le reste ne vous appartient pas.', null, 'Nhắc chỉ lo điều mình kiểm soát được'],
      ['Câu hỏi', 'Quelle habitude stoïcienne aimeriez-vous adopter dès demain ?', null, 'Hỏi thói quen Khắc kỷ muốn bắt đầu từ mai', 'a marble bust of a Roman philosopher in dramatic side light'],
      ['Bình chọn', 'Le matin ou le soir : quand faites-vous votre réflexion ?', ['Le matin', 'Le soir', 'Pas encore'], 'Hỏi thời điểm suy ngẫm'],
      ['Văn bản', 'Un exercice simple ce soir : notez trois choses que vous avez bien faites aujourd’hui.', null, 'Bài tập tối nay: ghi 3 việc làm tốt'],
      ['Video / teaser', 'Demain : pourquoi les stoïciens préparaient l’adversité à l’avance. Vous êtes prêts ?', null, 'Nhá hàng video: vì sao người Khắc kỷ chuẩn bị trước nghịch cảnh'],
      ['Câu hỏi', 'Quelle citation de Marc Aurèle vous accompagne le plus ?', null, 'Hỏi câu nói của Marcus Aurelius yêu thích', 'an ancient Roman study desk with a scroll and an oil lamp in moody cinematic light'],
      ['Hình ảnh', 'Cette image vous inspire quelle citation stoïque ? 🏛️', null, 'Đăng ảnh tượng đá và hỏi câu Khắc kỷ gợi nhớ', 'a weathered marble statue against a stormy dusk sky in muted tones'],
      ['Hình ảnh', 'Un moment de calme avant la tempête. Que ferait un stoïcien ? ⛈️', null, 'Đăng ảnh pháo đài trước bão và hỏi người Khắc kỷ sẽ làm gì', 'a fortress on a cliff above stormy waves, cinematic and muted'],
    ] },
  };

  const GENERIC = (niche) => ({ lang: 'Tiếng Việt', style: 'clean modern illustration matching the channel topic, cohesive color palette', items: [
    ['Câu hỏi', `Chủ đề ${niche} nào anh chị muốn xem trong video tới? Để lại bình luận nhé 👇`, null, 'Hỏi khán giả muốn xem chủ đề nào', `an inviting illustration themed around ${niche}`],
    ['Bình chọn', `Anh chị thích dạng video ${niche} nào hơn?`, ['Ngắn gọn', 'Chi tiết', 'Câu chuyện'], 'Bình chọn dạng video'],
    ['Văn bản', `Mẹo nhỏ về ${niche} cho hôm nay — anh chị thấy hữu ích không?`, null, 'Chia sẻ mẹo và hỏi phản hồi'],
    ['Video / teaser', `Sắp có video mới về ${niche}. Anh chị đoán nội dung là gì?`, null, 'Nhá hàng video mới'],
    ['Hình ảnh', `Hình ảnh hôm nay về ${niche}. Anh chị nghĩ tới điều gì? 👇`, null, 'Đăng ảnh và hỏi cảm nhận', `a striking illustration themed around ${niche}`],
  ] });

  const hashStr = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function rngOf(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function shuffled(n, seed) {
    const a = Array.from({ length: n }, (_, i) => i), r = rngOf(seed);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  const api = {
    pool: (niche) => S[niche] || GENERIC(niche),
    style: (niche) => (S[niche] || GENERIC(niche)).style,
    // Prompt ảnh tỉ lệ 1:1 phù hợp phong cách kênh.
    imagePrompt(niche, scene) {
      if (!scene) return '';
      return `${scene}. Style: ${this.style(niche)}. Square 1:1 aspect ratio, centered composition with clear space for a text overlay, no text, no watermark, no logos, high detail.`;
    },
    // Mỗi ngày một bài ngẫu nhiên; không lặp trong cả vòng (túi bài được xáo lại mỗi vòng).
    pick(niche, chanKey, dayNumber, slot, variant) {
      const p = this.pool(niche), n = p.items.length;
      const cycle = Math.floor(dayNumber / n), pos = dayNumber - cycle * n;
      const seed = (c) => hashStr(`${chanKey}|${niche}|${c}`);
      const order = shuffled(n, seed(cycle));
      const prevLast = shuffled(n, seed(cycle - 1))[n - 1];
      if (order[0] === prevLast) [order[0], order[1]] = [order[1], order[0]]; // không trùng bài cuối vòng trước
      const idx = order[(pos + slot * Math.max(1, Math.floor(n / 3)) + variant) % n];
      const it = p.items[idx];
      const wantsImg = it[0] === 'Câu hỏi' || it[0] === 'Hình ảnh';
      return { type: it[0], text: it[1], options: it[2], vi: it[3], lang: p.lang, img: wantsImg ? this.imagePrompt(niche, it[4] || `an illustration themed around ${niche}`) : '' };
    },
  };
  api.niches = Object.keys(S); // các ngách đã có kho gợi ý riêng
  window.QLK_SUGG = api;
})();
