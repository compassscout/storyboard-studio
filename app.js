'use strict';

/* =========================================================
   演示数据
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function option(scene, title, desc, type, duration, transition, reason, keywords, source = 'Wikimedia Commons', license = 'Public Domain') {
  return { scene, title, desc, type, duration, transition, reason, keywords, source, license };
}

const project = {
  title: '罗马帝国为什么会分裂？',
  category: '历史 · 知识',
};

const shots = [
  {
    id: 's1',
    line: '公元 3 世纪，罗马帝国已经统治地中海世界近三百年。',
    lineType: '背景',
    optionIndex: 0,
    adopted: true,
    adoptedOption: null,
    options: [
      option('map', '帝国全盛版图', '从地中海全图缓慢推近到意大利半岛。', '地图', 10, '缓推 / 叠化', '开篇先建立空间感，让观众知道“罗马”不是一个抽象名词，而是一个横跨三大洲的帝国。', ['Roman Empire map', '3rd century', 'Mediterranean']),
      option('document', '泛黄的行省地图', '古代地图手稿上标出罗马行省与主要道路。', '史料', 9, '叠化', '用史料质感替代现代地图，先定下“历史纪录片”的视觉基调。', ['ancient Roman map', 'manuscript', 'Roman provinces'], 'Internet Archive', 'Public Domain'),
      option('timeline', '三世纪时间轴', '从公元 200 年缓慢滑到 300 年。', '图表', 8, '横移', '先给时间坐标，后面讲“五十年换二十多个皇帝”时观众不会失去方向。', ['Roman Empire timeline', '3rd century crisis']),
    ],
  },
  {
    id: 's2',
    line: '但从公元 235 年开始，帝国在五十年里换了二十多位皇帝。',
    lineType: '数据',
    optionIndex: 0,
    adopted: true,
    adoptedOption: null,
    options: [
      option('coins', '皇帝金币蒙太奇', '三枚金币特写快速切换，叠出皇帝名单。', '史料', 14, '快切 / 叠化', '用金币而不是文字列表，把“皇帝更替频繁”变成可感知的视觉节奏。', ['Roman emperor coins', 'denarius', 'Crisis of the Third Century']),
      option('timeline', '半个世纪的皇帝名单', '时间轴上的头像快速刷新，数字不断累加。', '图表', 12, '连续快切', '适合强调数字本身，让“五十年的二十多位皇帝”形成冲击。', ['Roman emperors timeline', '235 284', 'barracks emperors']),
      option('soldiers', '边军团与皇位更替', '士兵拥立将领的剪影，旗帜在风中翻动。', '情景', 11, '硬切', '把皇位更替和军队联系起来，为下一句“军队拥立皇帝”做铺垫。', ['Roman legion', 'barracks emperor', 'Roman army']),
    ],
  },
  {
    id: 's3',
    line: '军队拥立皇帝，元老院无力约束，边境压力同时加剧。',
    lineType: '冲突',
    optionIndex: 0,
    adopted: false,
    adoptedOption: null,
    options: [
      option('senate', '元老院辩论', '昏暗大厅里，元老们争论，声音逐渐被军靴声盖过。', '情景', 13, '声音先入', '这一句有三个主体，先用元老院表现“无力约束”，再用声音把军队带进来。', ['Roman Senate', 'senate debate', 'Roman politics']),
      option('soldiers', '边境上的军团', '军团旗帜、矛尖和城墙剪影交替出现。', '情景', 11, '硬切', '把“边境压力”视觉化，避免整段都是室内政治戏。', ['Roman legion', 'Roman frontier', 'limes']),
      option('document', '三世纪危机文献', '泛黄纸页上出现“危机”“内战”“蛮族入侵”等批注。', '史料', 9, '叠化', '用文献关键词快速交代三重压力，适合信息密度高的段落。', ['Crisis of the Third Century', 'Roman documents'], 'Internet Archive', 'Public Domain'),
    ],
  },
  {
    id: 's4',
    line: '戴克里先尝试把帝国一分为二，由两位奥古斯都共同治理。',
    lineType: '转折',
    optionIndex: 0,
    adopted: false,
    adoptedOption: null,
    options: [
      option('tetrarchy', '四帝共治', '地图切成四块，两位奥古斯都与两位凯撒的徽章出现。', '地图', 12, '分屏', '这是全片的制度转折点，用“四块地图 + 四枚徽章”把抽象改革变成结构。', ['Tetrarchy map', 'Diocletian', 'Augustus Caesar']),
      option('map', '帝国一分为二', '从单一版图拉出一条分割线，东西两侧变色。', '地图', 10, '缓推', '不急着讲四帝，先用最简单的“二分”让观众抓住改革核心。', ['Division of Roman Empire', 'Diocletian map']),
      option('capitals', '两座新都城', '罗马与尼科米底亚之间的道路被点亮。', '地图', 9, '横移', '把制度变化落到地理上，为后文“东西分裂”埋伏笔。', ['Nicomedia', 'Rome', 'Diocletian capital']),
    ],
  },
  {
    id: 's5',
    line: '这次改革暂时稳住了局势，却也埋下了东西分裂的种子。',
    lineType: '观点',
    optionIndex: 0,
    adopted: false,
    adoptedOption: null,
    options: [
      option('capitals', '两座都城', '罗马与君士坦丁堡的柱廊、穹顶左右并置。', '地图', 11, '叠化', '用双城并置表达“暂时稳定”，同时让观众感觉两套权力中心正在形成。', ['Rome', 'Constantinople', 'late Roman empire']),
      option('divided', '裂缝出现', '地图上出现一条细线，慢慢变粗、变红。', '地图', 9, '缓推', '把“种子”做成视觉隐喻：不是立刻分裂，而是一条逐渐扩大的裂缝。', ['Roman Empire split', 'division map']),
      option('document', '改革后的诏令', '羊皮纸上的拉丁文与红色印章。', '史料', 8, '叠化', '用诏令的权威感表现“改革暂时稳住局势”，再在结尾转暗。', ['Edict of Diocletian', 'Roman law'], 'Internet Archive', 'Public Domain'),
    ],
  },
  {
    id: 's6',
    line: '到 395 年，帝国正式分裂，之后再没有真正统一。',
    lineType: '结论',
    optionIndex: 0,
    adopted: false,
    adoptedOption: null,
    options: [
      option('divided', '395 年正式分裂', '地图从中间裂开，西罗马与东罗马分别亮起。', '地图', 12, '缓推 / 定格', '结尾需要一张明确的分裂图，把前面所有铺垫收束成一个不可逆的结果。', ['Division of Roman Empire 395', 'Western Roman Empire', 'Eastern Roman Empire']),
      option('map', '帝国最后的统一版图', '全图慢慢变暗，边界线逐渐消失。', '地图', 10, '缓慢拉远', '用“统一版图的消失”做情绪收尾，比直接切地图更有余味。', ['Roman Empire 395', 'map']),
      option('timeline', '从 235 到 395', '时间轴从危机起点滑到分裂终点。', '图表', 9, '横移', '适合做总结镜头，把 160 年的因果压缩成一条线。', ['Roman Empire timeline', '395 AD']),
    ],
  },
];

shots.forEach((shot) => {
  shot.adoptedOption = shot.adopted ? shot.options[0] : null;
});

const materials = [
  { name: '罗马帝国版图_03', scene: 'map', tags: '地图 · 地中海 · 3世纪' },
  { name: '三世纪金币特写', scene: 'coins', tags: '金币 · 皇帝 · 史料' },
  { name: '元老院辩论_油画', scene: 'senate', tags: '元老院 · 人物 · 室内' },
  { name: '罗马军团_边境', scene: 'soldiers', tags: '军队 · 边境 · 旗帜' },
  { name: '四帝共治_示意图', scene: 'tetrarchy', tags: '制度 · 地图 · 分屏' },
  { name: '罗马与君士坦丁堡', scene: 'capitals', tags: '双城 · 建筑 · 对比' },
  { name: '395年帝国分裂图', scene: 'divided', tags: '地图 · 分裂 · 结尾' },
  { name: '古代地图手稿', scene: 'document', tags: '手稿 · 文献 · 质感' },
];

let activeId = 's1';
let activeTab = 'ai';
let audioElapsed = 0;
let audioTimer = null;
let isPlaying = false;
let toastTimer = null;

/* =========================================================
   SVG 场景
   ========================================================= */

function sceneSvg(scene) {
  const wrap = (background, inner) => `
    <svg class="scene-svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(scene)}">
      <rect width="800" height="450" fill="${background}"/>
      ${inner}
    </svg>`;

  const scenes = {
    map: wrap('#dfd1b8', `
      <g opacity=".19" stroke="#7e6b53" stroke-width="1">
        ${[80, 160, 240, 320, 400, 480, 560, 640, 720].map((x) => `<path d="M${x} 0v450"/>`).join('')}
        ${[70, 140, 210, 280, 350, 420].map((y) => `<path d="M0 ${y}h800"/>`).join('')}
      </g>
      <path d="M0 295 C100 282 170 300 250 332 C340 370 500 378 800 330 L800 450 L0 450Z" fill="#9db6ad"/>
      <path d="M90 74 C180 38 300 38 382 68 C448 92 520 88 596 68 L682 126 C640 166 566 175 505 204 C430 240 355 254 296 238 C224 218 174 174 136 142Z" fill="#c57a57"/>
      <path d="M615 104 C680 126 736 176 758 236 C706 260 652 254 610 232 C578 214 566 174 580 142Z" fill="#b76a4b"/>
      <path d="M340 240 C370 258 390 282 384 302 C356 314 330 300 318 278 C312 260 322 248 340 240Z" fill="#d9c49f"/>
      <path d="M380 304 C430 300 462 326 448 352 C414 372 374 360 360 336Z" fill="#c9b38c"/>
      <g fill="#7b6048" opacity=".75">
        <circle cx="330" cy="222" r="4"/><circle cx="362" cy="214" r="3"/><circle cx="302" cy="188" r="3"/>
        <circle cx="250" cy="150" r="3"/><circle cx="488" cy="146" r="3"/><circle cx="552" cy="190" r="3"/>
      </g>
      <g font-family="Georgia, serif" fill="#6e5b45">
        <text x="54" y="62" font-size="13" letter-spacing="5" opacity=".72">MARE NOSTRUM</text>
        <text x="333" y="213" font-size="11" letter-spacing="3">ROMA</text>
        <text x="548" y="310" font-size="9" letter-spacing="2" opacity=".55">AFRICA</text>
        <text x="146" y="120" font-size="9" letter-spacing="2" opacity=".55">GALLIA</text>
      </g>
      <g transform="translate(698 78)" fill="none" stroke="#7b654d" opacity=".6">
        <circle r="23" stroke-width="1"/><circle r="16" stroke-width=".7"/>
        <path d="M0-31v62M-31 0h62" stroke-width=".8"/>
        <path d="m0-31-4 9h8Z" fill="#7b654d" stroke="none"/>
      </g>
      <text x="54" y="414" font-family="Georgia, serif" font-size="9" fill="#6f5d47" opacity=".65" letter-spacing="3">IMPERIUM ROMANUM · III SAECULUM</text>
    `),
    coins: wrap('#251f18', `
      <g opacity=".28" stroke="#d9b36b" stroke-width="1">
        ${Array.from({ length: 16 }, (_, i) => `<path d="M400 225 L${400 + Math.cos(i / 16 * Math.PI * 2) * 620} ${225 + Math.sin(i / 16 * Math.PI * 2) * 620}"/>`).join('')}
      </g>
      ${[
        [216, 230, 100, 'IMP · CAESAR'],
        [400, 212, 114, 'SOL · INVICTVS'],
        [590, 236, 96, 'VICTORIA · AVG'],
      ].map(([cx, cy, r, label]) => `
        <g>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="#a47b3f" stroke="#d8b570" stroke-width="2"/>
          <circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="#6d4d22" stroke-width="1" opacity=".7"/>
          <circle cx="${cx}" cy="${cy}" r="${r - 20}" fill="none" stroke="#e2c98e" stroke-width=".6" opacity=".5"/>
          <path d="M${cx - 30} ${cy + 44} C${cx - 42} ${cy + 18} ${cx - 22} ${cy - 2} ${cx - 10} ${cy - 8} C${cx - 2} ${cy - 42} ${cx + 32} ${cy - 46} ${cx + 38} ${cy - 16} C${cx + 56} ${cy + 2} ${cx + 42} ${cy + 30} ${cx + 26} ${cy + 44}Z" fill="#3b2a18" opacity=".82"/>
          <path d="M${cx - 18} ${cy - 12} C${cx - 34} ${cy - 2} ${cx - 28} ${cy + 18} ${cx - 12} ${cy + 26}" fill="none" stroke="#d8b570" stroke-width="2" opacity=".55"/>
          <text x="${cx}" y="${cy + r + 23}" text-anchor="middle" font-family="Georgia, serif" font-size="9" letter-spacing="2" fill="#c9a86b" opacity=".8">${label}</text>
        </g>
      `).join('')}
      <text x="52" y="70" font-family="Georgia, serif" font-size="12" letter-spacing="4" fill="#d8b570" opacity=".65">AES · ARGENTUM · AURUM</text>
    `),
    senate: wrap('#2e2119', `
      <ellipse cx="400" cy="288" rx="320" ry="110" fill="#463326" opacity=".72"/>
      <path d="M0 360 C140 330 260 350 400 338 C560 324 680 340 800 368 L800 450 L0 450Z" fill="#211814"/>
      <g fill="#5a4433" opacity=".9">
        ${[110, 230, 350, 470, 590, 710].map((x) => `
          <rect x="${x}" y="96" width="26" height="210" rx="2"/>
          <rect x="${x - 9}" y="88" width="44" height="12" rx="2" fill="#6f5540"/>
          <rect x="${x - 7}" y="306" width="40" height="10" rx="2" fill="#6f5540"/>
        `).join('')}
      </g>
      <path d="M400 0 L400 155" stroke="#c49a5a" stroke-width="1" opacity=".4"/>
      <ellipse cx="400" cy="170" rx="115" ry="55" fill="#d7ad6a" opacity=".11"/>
      <g fill="#17110e">
        ${[280, 345, 400, 455, 520].map((x, index) => `
          <circle cx="${x}" cy="${278 + (index % 2) * 8}" r="14"/>
          <path d="M${x - 26} 356 C${x - 30} 318 ${x - 12} 300 ${x} 300 C${x + 16} 300 ${x + 32} 318 ${x + 26} 356Z"/>
        `).join('')}
      </g>
      <path d="M600 92 L680 92 L680 270 L600 270Z" fill="#6f3328" opacity=".55"/>
      <path d="M638 92 L638 270" stroke="#bd8d58" stroke-width="1" opacity=".35"/>
      <text x="52" y="418" font-family="Georgia, serif" font-size="10" fill="#c9a774" opacity=".55" letter-spacing="3">SENATVS · ROMANVS</text>
    `),
    tetrarchy: wrap('#d8c9ae', `
      <g opacity=".2" stroke="#725d45" stroke-width="1">
        ${[100, 200, 300, 400, 500, 600, 700].map((x) => `<path d="M${x} 0v450"/>`).join('')}
        ${[90, 180, 270, 360].map((y) => `<path d="M0 ${y}h800"/>`).join('')}
      </g>
      <path d="M84 96 H380 V224 H84Z" fill="#a85e43" opacity=".78"/>
      <path d="M420 96 H716 V224 H420Z" fill="#4e7770" opacity=".78"/>
      <path d="M84 250 H380 V378 H84Z" fill="#c59b55" opacity=".72"/>
      <path d="M420 250 H716 V378 H420Z" fill="#6f5f86" opacity=".72"/>
      <path d="M84 96 H716 V378 H84Z" fill="none" stroke="#5d4935" stroke-width="2"/>
      <path d="M400 96 V378" stroke="#5d4935" stroke-width="2"/>
      <path d="M84 237 H716" stroke="#5d4935" stroke-width="2"/>
      <g>
        <circle cx="224" cy="163" r="43" fill="#e0cda9" stroke="#755c40" stroke-width="2"/>
        <circle cx="576" cy="163" r="43" fill="#e0cda9" stroke="#755c40" stroke-width="2"/>
        <path d="M204 184 C196 163 209 144 228 145 C248 140 260 160 248 183Z" fill="#58432e" opacity=".8"/>
        <path d="M556 184 C548 163 561 144 580 145 C600 140 612 160 600 183Z" fill="#58432e" opacity=".8"/>
        <text x="224" y="231" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#5f4933" letter-spacing="2">AUGUSTUS</text>
        <text x="576" y="231" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#5f4933" letter-spacing="2">AUGUSTUS</text>
        <text x="224" y="324" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#5f4933" letter-spacing="2">CAESAR</text>
        <text x="576" y="324" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#5f4933" letter-spacing="2">CAESAR</text>
      </g>
      <text x="54" y="428" font-family="Georgia, serif" font-size="10" fill="#5c4834" opacity=".65" letter-spacing="3">TETRARCHIA · DOMINATVS</text>
    `),
    capitals: wrap('#282019', `
      <path d="M0 382 C160 360 280 366 400 374 C560 384 680 366 800 388 L800 450 L0 450Z" fill="#191411"/>
      <g transform="translate(170 0)" fill="#5a4432">
        <rect x="0" y="118" width="24" height="220"/><rect x="62" y="118" width="24" height="220"/><rect x="124" y="118" width="24" height="220"/>
        <rect x="-10" y="104" width="168" height="15" rx="2" fill="#725842"/>
        <path d="M-18 104 L74 54 L166 104Z" fill="#7c5f47"/>
        <rect x="-8" y="338" width="164" height="12" fill="#725842"/>
      </g>
      <g transform="translate(540 0)" fill="#4c5e57">
        <path d="M0 210 C0 148 44 108 100 108 C156 108 200 148 200 210Z"/>
        <rect x="82" y="188" width="36" height="154"/>
        <rect x="48" y="214" width="104" height="14" rx="2" fill="#73877d"/>
        <rect x="18" y="338" width="164" height="12" fill="#73877d"/>
        <path d="M100 108 V72" stroke="#b6935e" stroke-width="2"/>
        <circle cx="100" cy="67" r="4" fill="#c7a56e"/>
      </g>
      <path d="M300 230 C360 206 430 206 500 230" fill="none" stroke="#c3a16b" stroke-width="1.3" stroke-dasharray="5 7" opacity=".6"/>
      <g font-family="Georgia, serif" fill="#d1b07b" opacity=".75">
        <text x="170" y="290" text-anchor="middle" font-size="11" letter-spacing="3">ROMA</text>
        <text x="640" y="290" text-anchor="middle" font-size="11" letter-spacing="3">CONSTANTINOPOLIS</text>
      </g>
      <text x="54" y="68" font-family="Georgia, serif" font-size="12" fill="#bd9b68" opacity=".6" letter-spacing="4">DUAE CAPITALES</text>
    `),
    divided: wrap('#d8cab1', `
      <g opacity=".18" stroke="#715c44" stroke-width="1">
        ${[80, 160, 240, 320, 400, 480, 560, 640, 720].map((x) => `<path d="M${x} 0v450"/>`).join('')}
        ${[90, 180, 270, 360].map((y) => `<path d="M0 ${y}h800"/>`).join('')}
      </g>
      <path d="M30 110 C150 62 290 58 388 108 L388 342 C290 390 150 386 30 338Z" fill="#b35f45" opacity=".78"/>
      <path d="M412 108 C520 58 670 62 770 110 L770 338 C670 386 520 390 412 342Z" fill="#4f7771" opacity=".8"/>
      <path d="M388 108 L412 108 L412 342 L388 342Z" fill="#e7d9c0"/>
      <path d="M400 72 V382" stroke="#7f684d" stroke-width="2" stroke-dasharray="8 7"/>
      <g font-family="Georgia, serif" fill="#f0e6d5">
        <text x="190" y="214" text-anchor="middle" font-size="24" letter-spacing="6" opacity=".88">WEST</text>
        <text x="610" y="214" text-anchor="middle" font-size="24" letter-spacing="6" opacity=".88">EAST</text>
        <text x="190" y="242" text-anchor="middle" font-size="10" letter-spacing="3" opacity=".65">ROMA</text>
        <text x="610" y="242" text-anchor="middle" font-size="10" letter-spacing="3" opacity=".65">CONSTANTINOPOLIS</text>
      </g>
      <g font-family="Georgia, serif" fill="#6f5942">
        <text x="54" y="410" font-size="10" letter-spacing="3">DIVISIO IMPERII · 395</text>
        <text x="716" y="410" text-anchor="end" font-size="10" letter-spacing="2" opacity=".6">POST HOC · NUNQUAM</text>
      </g>
    `),
    timeline: wrap('#211d18', `
      <path d="M70 226 H730" stroke="#c8a66d" stroke-width="1.4" opacity=".7"/>
      <path d="M70 226 H430" stroke="#ce6e4b" stroke-width="2.2"/>
      ${[
        [120, '235', '军人皇帝开始'],
        [255, '270', '边境危机'],
        [390, '284', '戴克里先'],
        [535, '305', '四帝共治'],
        [700, '395', '正式分裂'],
      ].map(([x, year, label]) => `
        <g>
          <circle cx="${x}" cy="226" r="${year === '395' ? 6 : 4}" fill="${year === '395' ? '#ce6e4b' : '#c8a66d'}"/>
          <path d="M${x} 226 V${year === '395' ? 160 : 188}" stroke="#8e7655" stroke-width="1" opacity=".6"/>
          <text x="${x}" y="${year === '395' ? 144 : 172}" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#d8ba85">${year}</text>
          <text x="${x}" y="${year === '395' ? 304 : 318}" text-anchor="middle" font-family="sans-serif" font-size="8.5" fill="#b3a28a" letter-spacing="1">${label}</text>
        </g>
      `).join('')}
      <text x="54" y="70" font-family="Georgia, serif" font-size="12" fill="#c8a66d" opacity=".65" letter-spacing="4">CRISIS · REFORM · DIVISION</text>
    `),
    document: wrap('#2c251d', `
      <g transform="translate(150 70) rotate(-4)">
        <rect width="500" height="330" rx="3" fill="#ddcba9"/>
        <rect x="22" y="22" width="456" height="286" fill="none" stroke="#a98758" stroke-width="1" opacity=".55"/>
        <text x="44" y="64" font-family="Georgia, serif" font-size="12" fill="#765c3b" letter-spacing="4">IMPERIVM ROMANVM</text>
        <g stroke="#9e8159" stroke-width="2" opacity=".6">
          ${Array.from({ length: 9 }, (_, i) => `<path d="M44 ${106 + i * 22} H${i === 8 ? 340 : 440}"/>`).join('')}
        </g>
        <circle cx="405" cy="252" r="31" fill="#a94f3a" opacity=".8"/>
        <circle cx="405" cy="252" r="23" fill="none" stroke="#d8b483" stroke-width="1" opacity=".6"/>
        <text x="405" y="257" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="#e7cfac">S · P · Q · R</text>
      </g>
      <text x="52" y="420" font-family="Georgia, serif" font-size="10" fill="#bda276" opacity=".55" letter-spacing="3">ARCHIVUM · MANUSCRIPTUM</text>
    `),
    soldiers: wrap('#241e18', `
      <path d="M0 360 C120 340 230 352 340 340 C500 322 650 344 800 370 L800 450 L0 450Z" fill="#15110e"/>
      <g fill="#0f0c0a">
        ${[170, 280, 390, 500, 610].map((x, i) => `
          <g transform="translate(${x} ${i % 2 ? 10 : 0})">
            <circle cx="0" cy="250" r="15"/>
            <path d="M-28 360 C-32 306 -17 274 0 274 C20 274 34 306 28 360Z"/>
            <path d="M${-22} 360 L${-27} 420 M${22} 360 L${28} 420" stroke="#0f0c0a" stroke-width="7"/>
            <path d="M${i % 2 ? 28 : -28} 280 L${i % 2 ? 70 : -70} 92" stroke="#6e553a" stroke-width="2.5"/>
            <path d="M${i % 2 ? 70 : -70} 92 L${i % 2 ? 80 : -80} 78" stroke="#b9a17f" stroke-width="2"/>
          </g>
        `).join('')}
      </g>
      <path d="M660 56 L660 290" stroke="#8a6a45" stroke-width="3"/>
      <path d="M660 70 C720 84 748 118 736 160 C708 144 682 140 660 148Z" fill="#8e3f31" opacity=".9"/>
      <text x="54" y="70" font-family="Georgia, serif" font-size="12" fill="#c3a270" opacity=".6" letter-spacing="4">LIMES · EXERCITVS</text>
    `),
    crowd: wrap('#33251d', `
      <ellipse cx="400" cy="180" rx="300" ry="120" fill="#e0b574" opacity=".08"/>
      <g fill="#17110d">
        ${[100, 180, 260, 340, 420, 500, 580, 660, 740].map((x, i) => `
          <g transform="translate(${x} ${i % 3 * 12})">
            <circle cx="0" cy="${250 + i % 4 * 6}" r="${18 + i % 3 * 3}"/>
            <path d="M-34 390 C-38 326 -20 288 0 288 C24 288 40 326 34 390Z"/>
          </g>
        `).join('')}
      </g>
      <text x="54" y="70" font-family="Georgia, serif" font-size="12" fill="#c3a270" opacity=".55" letter-spacing="4">POPVLVS · ROMANVS</text>
    `),
  };

  return scenes[scene] || scenes.map;
}

/* =========================================================
   工具
   ========================================================= */

function formatClock(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function currentOption(shot) {
  if (!shot) return null;
  return shot.adopted ? shot.adoptedOption : shot.options[shot.optionIndex];
}

function activeShot() {
  return shots.find((shot) => shot.id === activeId) || shots[0];
}

function startOf(index) {
  let total = 0;
  for (let i = 0; i < index; i += 1) total += currentOption(shots[i]).duration;
  return total;
}

function totalDuration() {
  return shots.reduce((total, shot) => total + currentOption(shot).duration, 0);
}

function shotIndex() {
  return Math.max(0, shots.findIndex((shot) => shot.id === activeId));
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2200);
}

function updateProjectTitle() {
  $('#projectTitle').textContent = project.title;
  document.title = `${project.title} · 分镜台`;
}

/* =========================================================
   渲染
   ========================================================= */

function renderScript() {
  const list = $('#scriptList');
  list.innerHTML = shots.map((shot, index) => {
    const opt = currentOption(shot);
    const start = startOf(index);
    return `
      <article class="script-line ${shot.id === activeId ? 'is-active' : ''}" data-shot="${shot.id}" tabindex="0">
        <div class="line-num">${String(index + 1).padStart(2, '0')}</div>
        <div class="line-body">
          <div class="line-text">${escapeHtml(shot.line)}</div>
          <div class="line-meta">
            <span class="line-type">${escapeHtml(shot.lineType)}</span>
            <span>${formatClock(start)} · ${opt.duration}s</span>
            <span class="line-status ${shot.adopted ? 'is-adopted' : ''}">
              <i></i>${shot.adopted ? '已采用' : '待确认'}
            </span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  $$('.script-line', list).forEach((node) => {
    node.addEventListener('click', () => selectShot(node.dataset.shot));
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectShot(node.dataset.shot);
      }
    });
  });
  $('#scriptStats').textContent = `${shots.length} 句 · 约 ${shots.reduce((sum, shot) => sum + shot.line.length, 0)} 字`;
}

function renderPreview() {
  const shot = activeShot();
  const opt = currentOption(shot);
  const index = shotIndex();
  $('#preview').innerHTML = `
    ${sceneSvg(opt.scene)}
    <div class="preview-top">
      <span class="pill">SCENE ${String(index + 1).padStart(2, '0')} · ${escapeHtml(opt.type)}</span>
      <span class="pill">${shot.adopted ? '已采用' : 'AI 建议'}</span>
    </div>
    <div class="preview-bottom">
      <div>
        <div class="preview-title">${escapeHtml(opt.title)}</div>
        <div class="preview-sub">${escapeHtml(opt.desc)}</div>
      </div>
      <div class="preview-duration">${opt.duration}s</div>
    </div>
  `;

  $('#shotIndex').innerHTML = `镜头 ${String(index + 1).padStart(2, '0')} <span>${escapeHtml(shot.lineType)}</span>`;
  $('#captionTitle').textContent = opt.title;
  $('#captionDesc').textContent = opt.desc;
  $('#captionDuration').textContent = `${opt.duration}s`;
  $('#captionTransition').textContent = opt.transition;
}

function renderSuggestions() {
  const shot = activeShot();
  const selected = currentOption(shot);
  const index = shotIndex();

  $('#sentenceContext').innerHTML = `<strong>第 ${index + 1} 句</strong> · ${escapeHtml(shot.line)}`;
  $('#suggestionList').innerHTML = shot.options.map((opt, optionIndex) => `
    <button class="suggestion ${selected === opt ? 'is-selected' : ''}" data-option="${optionIndex}" type="button">
      <span class="suggestion-thumb">${sceneSvg(opt.scene)}</span>
      <span class="suggestion-copy">
        <span class="suggestion-kicker">方案 ${String(optionIndex + 1).padStart(2, '0')} · ${escapeHtml(opt.type)}</span>
        <span class="suggestion-title">${escapeHtml(opt.title)}</span>
        <span class="suggestion-desc">${escapeHtml(opt.desc)}</span>
      </span>
      <span class="suggestion-check">✓</span>
    </button>
  `).join('');

  $$('.suggestion', $('#suggestionList')).forEach((node) => {
    node.addEventListener('click', () => {
      shot.optionIndex = Number(node.dataset.option);
      shot.adopted = false;
      shot.adoptedOption = null;
      renderAll();
      toast('已切换画面方案，点击「采用这个镜头」确认');
    });
  });

  $('#whyText').textContent = selected.reason;
  $('#keywordRow').innerHTML = selected.keywords.map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join('');
  $('#sourceText').textContent = selected.source;
  $('#licenseText').textContent = selected.license;
  $('#shotNote').value = shot.note || '';

  const candidates = materials.filter((material) => material.scene === selected.scene).slice(0, 2);
  const fallback = candidates.length ? candidates : materials.slice(0, 2);
  $('#candidateList').innerHTML = fallback.map((material) => `
    <button class="candidate" type="button" data-candidate="${escapeHtml(material.name)}">
      <span class="candidate-thumb">${sceneSvg(material.scene)}</span>
      <span class="candidate-copy">
        <span class="candidate-name">${escapeHtml(material.name)}</span>
        <span class="candidate-tags">${escapeHtml(material.tags)}</span>
      </span>
    </button>
  `).join('');

  $$('.candidate', $('#candidateList')).forEach((node) => {
    node.addEventListener('click', () => {
      shot.material = node.dataset.candidate;
      toast(`已关联素材：${node.dataset.candidate}`);
    });
  });

  const adoptBtn = $('#adoptBtn');
  const already = shot.adopted && shot.adoptedOption === selected;
  adoptBtn.textContent = already ? '已采用' : '采用这个镜头';
  adoptBtn.disabled = already;
  adoptBtn.classList.toggle('is-done', already);
}

function renderStageNotes() {
  const shot = activeShot();
  const index = shotIndex();
  const next = shots[index + 1];
  const note = $('#transitionNote');
  const button = $('#nextShotButton');
  if (next) {
    note.textContent = `下一镜头「${currentOption(next).title}」· 建议用${currentOption(next).transition}承接。`;
    button.textContent = '下一镜头 →';
    button.disabled = false;
  } else {
    note.textContent = '这是最后一个镜头，建议定格 1–2 秒再收尾，给观众留一点余味。';
    button.textContent = '已是最后一镜';
    button.disabled = true;
  }
}

function renderTimeline() {
  const timeline = $('#timeline');
  timeline.innerHTML = shots.map((shot, index) => {
    const opt = currentOption(shot);
    const start = startOf(index);
    return `
      <button class="shot-block ${shot.id === activeId ? 'is-active' : ''} ${shot.adopted ? '' : 'is-pending'}" data-shot="${shot.id}" type="button" style="width:${Math.max(98, opt.duration * 11)}px">
        <span class="shot-thumb">${sceneSvg(opt.scene)}</span>
        <span class="shot-name">${String(index + 1).padStart(2, '0')} · ${escapeHtml(opt.title)}</span>
        <span class="shot-time">${formatClock(start)} / ${opt.duration}s</span>
        ${shot.adopted ? '<span class="shot-check">✓</span>' : ''}
      </button>
    `;
  }).join('');

  $$('.shot-block', timeline).forEach((node) => {
    node.addEventListener('click', () => selectShot(node.dataset.shot));
  });
}

function renderStats() {
  const total = totalDuration();
  $('#shotCount').textContent = String(shots.length);
  $('#durationText').textContent = formatClock(total);
  $('#timelineTotal') && ($('#timelineTotal').textContent = formatClock(total));
}

function renderMaterials() {
  const query = ($('#materialSearch')?.value || '').trim().toLowerCase();
  const filtered = materials
    .map((material, originalIndex) => ({ ...material, originalIndex }))
    .filter((material) => {
      if (!query) return true;
      return `${material.name} ${material.tags}`.toLowerCase().includes(query);
    });

  $('#materialCount').textContent = String(materials.length);
  $('#materialGrid').innerHTML = filtered.map((material) => `
    <button class="material-card" data-material="${material.originalIndex}" type="button">
      <span class="material-thumb">${sceneSvg(material.scene)}</span>
      <span class="material-info">
        <span class="material-name">${escapeHtml(material.name)}</span>
        <span class="material-tags">${escapeHtml(material.tags)}</span>
      </span>
    </button>
  `).join('');

  $('#materialEmpty').hidden = filtered.length > 0;
  $$('.material-card', $('#materialGrid')).forEach((node) => {
    node.addEventListener('click', () => {
      const material = materials[Number(node.dataset.material)];
      activeShot().material = material.name;
      toast(`已关联素材：${material.name}`);
    });
  });
}

function renderAll() {
  renderScript();
  renderPreview();
  renderSuggestions();
  renderTimeline();
  renderStageNotes();
  renderStats();
  renderMaterials();
}

/* =========================================================
   选择 / 播放
   ========================================================= */

function stopPlayback() {
  if (audioTimer) clearInterval(audioTimer);
  audioTimer = null;
  isPlaying = false;
  updatePlayButton();
}

function selectShot(id, { playback = false } = {}) {
  if (!shots.some((shot) => shot.id === id)) return;
  if (!playback) {
    stopPlayback();
    activeId = id;
    audioElapsed = startOf(shotIndex());
    updateAudioUI();
  } else {
    activeId = id;
  }
  renderScript();
  renderPreview();
  renderSuggestions();
  renderTimeline();
  renderStageNotes();
}

function updatePlayButton() {
  const button = $('#playBtn');
  button.innerHTML = isPlaying
    ? '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>'
    : '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="m8 5 11 7-11 7V5Z"/></svg>';
  button.setAttribute('aria-label', isPlaying ? '暂停旁白' : '播放旁白');
}

function updateAudioUI() {
  const total = totalDuration();
  const ratio = total ? Math.min(1, audioElapsed / total) : 0;
  $('#audioClock').textContent = formatClock(audioElapsed);
  $('#audioProgress').style.width = `${ratio * 100}%`;
  $$('#waveform i').forEach((bar, index) => {
    bar.classList.toggle('is-played', index / $$('#waveform i').length < ratio);
  });
}

function togglePlayback() {
  if (isPlaying) {
    stopPlayback();
    return;
  }
  if (audioElapsed >= totalDuration()) audioElapsed = 0;
  isPlaying = true;
  updatePlayButton();
  audioTimer = setInterval(() => {
    audioElapsed += 0.1;
    if (audioElapsed >= totalDuration()) {
      audioElapsed = totalDuration();
      updateAudioUI();
      stopPlayback();
      toast('演示播放结束');
      return;
    }
    updateAudioUI();
    const index = shots.findIndex((shot, i) => audioElapsed >= startOf(i) && audioElapsed < startOf(i) + currentOption(shot).duration);
    if (index >= 0 && shots[index].id !== activeId) selectShot(shots[index].id, { playback: true });
  }, 100);
}

/* =========================================================
   导入 / 导出
   ========================================================= */

function parseSentences(text) {
  const cleaned = text.replace(/\r/g, '').trim();
  if (!cleaned) return [];

  let pieces = cleaned
    .split('\n')
    .map((line) => line.replace(/^[-*•\s]+/, '').trim())
    .filter(Boolean);

  if (pieces.length <= 1) {
    pieces = cleaned.split(/(?<=[。！？!?])\s*/u).map((line) => line.trim()).filter(Boolean);
  }

  return pieces.filter((line) => line.length > 1).slice(0, 12);
}

function generatedOptions(line, index) {
  const pool = [
    { scene: 'map', type: '地图', title: '地图定位', desc: '用地图建立空间关系与年代坐标。', keywords: ['历史地图', '地理位置', '年代'] },
    { scene: 'timeline', type: '图表', title: '时间轴', desc: '把关键年份排成一条可读的时间线。', keywords: ['时间轴', '年代', '事件'] },
    { scene: 'document', type: '史料', title: '文献与手稿', desc: '用档案、信件或文献建立史料质感。', keywords: ['历史文献', '手稿', '档案'] },
    { scene: 'coins', type: '史料', title: '器物特写', desc: '用钱币、器物或艺术品做细节特写。', keywords: ['文物', '钱币', '博物馆'] },
    { scene: 'senate', type: '情景', title: '人物与场景', desc: '用人物群像或历史场景还原气氛。', keywords: ['历史场景', '人物', '绘画'] },
    { scene: 'soldiers', type: '情景', title: '动作与冲突', desc: '用军队、旗帜或行动镜头制造张力。', keywords: ['军队', '冲突', '旗帜'] },
  ];
  const chosen = [pool[index % pool.length], pool[(index + 2) % pool.length], pool[(index + 4) % pool.length]];
  return chosen.map((item, i) => option(
    item.scene,
    `${item.title}${i === 0 ? '' : i === 1 ? ' · 备选' : ' · 备选'}`,
    item.desc,
    item.type,
    Math.min(14, Math.max(6, Math.round(line.length / 18) + 4)),
    i === 0 ? '缓推 / 叠化' : '硬切',
    i === 0
      ? '先用最直观的空间/时间信息建立上下文，让观众知道这句话在讲什么。'
      : '换一种视觉语法，避免连续使用同一种镜头造成疲劳。',
    item.keywords,
  ));
}

function generateFromSentences(sentences, title) {
  project.title = title || '未命名项目';
  const types = ['背景', '数据', '冲突', '转折', '观点', '结论'];
  shots.length = 0;
  sentences.forEach((line, index) => {
    shots.push({
      id: `gen-${Date.now()}-${index}`,
      line,
      lineType: types[index % types.length],
      optionIndex: 0,
      adopted: false,
      adoptedOption: null,
      options: generatedOptions(line, index),
    });
  });
  activeId = shots[0].id;
  audioElapsed = 0;
  updateProjectTitle();
  renderAll();
  updateAudioUI();
}

function openImport() {
  $('#importTitleInput').value = project.title;
  $('#importText').value = shots.map((shot) => shot.line).join('\n');
  $('#importModal').hidden = false;
  setTimeout(() => $('#importText').focus(), 50);
}

function closeImport() {
  $('#importModal').hidden = true;
}

function exportCsv() {
  const rows = [['序号', '时间', '旁白', '作用', '画面类型', '画面建议', '搜索词', '来源', '版权', '时长', '转场']];
  shots.forEach((shot, index) => {
    const opt = currentOption(shot);
    rows.push([
      String(index + 1).padStart(2, '0'),
      formatClock(startOf(index)),
      shot.line,
      shot.lineType,
      opt.type,
      `${opt.title}：${opt.desc}`,
      opt.keywords.join(' / '),
      opt.source,
      opt.license,
      `${opt.duration}s`,
      opt.transition,
    ]);
  });
  const csv = `\ufeff${rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.title.replace(/[\\/:*?"<>|]/g, '_')}-分镜表.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('分镜表已导出，可在 Excel / 剪映工作流中继续整理');
}

/* =========================================================
   事件
   ========================================================= */

function bindEvents() {
  $('#playBtn').addEventListener('click', togglePlayback);

  $('#importBtn').addEventListener('click', openImport);
  $('#closeImport').addEventListener('click', closeImport);
  $('#cancelImport').addEventListener('click', closeImport);
  $('#importModal').addEventListener('click', (event) => {
    if (event.target === $('#importModal')) closeImport();
  });

  $('#confirmImport').addEventListener('click', () => {
    const sentences = parseSentences($('#importText').value);
    if (!sentences.length) {
      toast('先粘贴至少一句旁白');
      return;
    }
    generateFromSentences(sentences, $('#importTitleInput').value.trim());
    closeImport();
    toast(`已生成 ${sentences.length} 个镜头，点击任意一句查看建议`);
  });

  $('#generateBtn').addEventListener('click', () => {
    const button = $('#generateBtn');
    const original = button.innerHTML;
    button.classList.add('is-loading');
    button.disabled = true;
    button.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M3 12h18"/></svg> 正在理解稿子…';
    setTimeout(() => {
      button.classList.remove('is-loading');
      button.disabled = false;
      button.innerHTML = original;
      toast(`已重新分析 ${shots.length} 个镜头 · ${shots.filter((shot) => shot.adopted).length} 个已采用`);
    }, 1200);
  });

  $('#refreshIdea').addEventListener('click', () => {
    const shot = activeShot();
    shot.optionIndex = (shot.optionIndex + 1) % shot.options.length;
    shot.adopted = false;
    shot.adoptedOption = null;
    renderAll();
    toast('已换一个画面方案');
  });

  $('#adoptBtn').addEventListener('click', () => {
    const shot = activeShot();
    shot.adoptedOption = shot.options[shot.optionIndex];
    shot.adopted = true;
    renderAll();
    toast('镜头已采用，时间线已同步');
  });

  $('#shotNote').addEventListener('input', (event) => {
    activeShot().note = event.target.value;
  });

  $('#nextShotButton').addEventListener('click', () => {
    const next = shots[shotIndex() + 1];
    if (next) selectShot(next.id);
  });

  $('#exportBtn').addEventListener('click', exportCsv);

  $('#materialTabBtn').addEventListener('click', () => switchTab('materials'));
  $('#aiTabBtn').addEventListener('click', () => switchTab('ai'));
  $('#materialSearch').addEventListener('input', renderMaterials);
  $('#addMaterial').addEventListener('click', () => {
    materials.push({ name: `新素材_${String(materials.length + 1).padStart(2, '0')}`, scene: 'document', tags: '待整理 · 未标注' });
    renderMaterials();
    toast('已添加一个演示素材');
  });

  $('#collapseScript').addEventListener('click', () => {
    const pane = $('.script-pane');
    const collapsed = pane.classList.toggle('is-collapsed');
    $('.workspace').classList.toggle('script-collapsed', collapsed);
    $('#collapseScript').textContent = collapsed ? '＋' : '−';
    $('#collapseScript').title = collapsed ? '展开' : '收起';
    toast(collapsed ? '脚本已收起，点左侧「脚本」恢复' : '脚本已展开');
  });

  $('#fullscreenBtn').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('#preview').requestFullscreen();
    } catch {
      toast('当前浏览器不支持预览全屏');
    }
  });

  $$('.rail-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      $$('.rail-item').forEach((node) => node.classList.remove('is-active'));
      item.classList.add('is-active');
      if (index === 1) {
        const pane = $('.script-pane');
        pane.classList.remove('is-collapsed');
        $('.workspace').classList.remove('script-collapsed');
        $('#collapseScript').textContent = '−';
        toast('脚本面板已展开');
      } else if (index === 2) {
        switchTab('materials');
        toast('已打开素材库');
      } else if (index === 3) {
        exportCsv();
      } else {
        toast('项目视图：当前为原型演示');
      }
    });
  });

  $('.rail-help').addEventListener('click', () => toast('演示版：真实版本会接入 AI 与本地素材索引'));

  document.addEventListener('keydown', (event) => {
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (event.key === 'Escape') closeImport();
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectShot(shots[Math.min(shots.length - 1, shotIndex() + 1)].id);
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      selectShot(shots[Math.max(0, shotIndex() - 1)].id);
    }
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlayback();
    }
  });
}

function switchTab(tab) {
  activeTab = tab;
  const isMaterials = tab === 'materials';
  $('#aiTabBtn').classList.toggle('is-active', !isMaterials);
  $('#materialTabBtn').classList.toggle('is-active', isMaterials);
  $('#aiTabBtn').setAttribute('aria-selected', String(!isMaterials));
  $('#materialTabBtn').setAttribute('aria-selected', String(isMaterials));
  $('#aiPanel').hidden = isMaterials;
  $('#materialPanel').hidden = !isMaterials;
}

/* =========================================================
   初始化
   ========================================================= */

function initWaveform() {
  const waveform = $('#waveform');
  const bars = Array.from({ length: 64 }, (_, index) => {
    const height = 5 + Math.round((Math.sin(index * 0.72) * 0.45 + Math.sin(index * 1.7) * 0.25 + 0.5) * 18);
    return `<i style="height:${Math.max(4, height)}px"></i>`;
  });
  waveform.innerHTML = bars.join('');
}

function init() {
  initWaveform();
  updateProjectTitle();
  bindEvents();
  renderAll();
  updateAudioUI();
}

init();
