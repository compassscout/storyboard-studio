'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const samples = {
  rome: {
    title: '罗马帝国为什么会分裂？',
    path: 'D:\\VideoProjects\\罗马帝国\\',
    text: `公元 3 世纪，罗马帝国已经统治地中海世界近三百年。
但从公元 235 年开始，帝国在五十年里换了二十多位皇帝。
军队拥立皇帝，元老院无力约束，边境压力同时加剧。
戴克里先尝试把帝国一分为二，由两位奥古斯都共同治理。
这次改革暂时稳住了局势，却也埋下了东西分裂的种子。
到 395 年，帝国正式分裂，之后再没有真正统一。`,
  },
  city: {
    title: '中世纪城市的一天',
    path: 'D:\\VideoProjects\\中世纪城市\\',
    text: `天还没亮，面包师已经点燃了炉火。
清晨的城门打开，农民推着车进入城市。
中午，集市上挤满了商人和学徒。
傍晚，钟声响起，城门即将关闭。
夜晚，城市只剩下巡夜人的脚步声。`,
  },
};

let project = { ...samples.rome };
let currentStep = 1;
let activeIndex = 0;
let currentTime = 0;
let playing = false;
let playTimer = null;
let toastTimer = null;
let activeMediaTab = 'storyboard';
let currentMediaFilter = 'all';
let selectedExportTarget = 'pack';

const shots = [
  {
    id: 's1', start: 0, dur: 10, type: '背景', scene: 'map', material: '罗马帝国版图_03', review: 'adopted',
    visual: '罗马帝国全盛版图，地中海区域缓慢推近，标出罗马城。',
    narration: '公元 3 世纪，罗马帝国已经统治地中海世界近三百年。',
    keywords: ['Roman Empire map', '3rd century', 'Mediterranean'],
  },
  {
    id: 's2', start: 10, dur: 14, type: '数据', scene: 'coins', material: '三世纪金币特写', review: 'adopted',
    visual: '三枚皇帝金币特写快速切换，叠出半个世纪的皇帝名单。',
    narration: '但从公元 235 年开始，帝国在五十年里换了二十多位皇帝。',
    keywords: ['Roman emperor coins', 'Crisis of the Third Century'],
  },
  {
    id: 's3', start: 24, dur: 13, type: '冲突', scene: 'senate', material: '元老院辩论_油画', review: 'adopted',
    visual: '昏暗的元老院大厅，元老们争论；军靴声从远处逼近。',
    narration: '军队拥立皇帝，元老院无力约束，边境压力同时加剧。',
    keywords: ['Roman Senate', 'Roman politics', 'Roman frontier'],
  },
  {
    id: 's4', start: 37, dur: 12, type: '转折', scene: 'tetrarchy', material: '四帝共治_示意图', review: 'pending',
    visual: '地图切成四块，两位奥古斯都与两位凯撒的徽章依次出现。',
    narration: '戴克里先尝试把帝国一分为二，由两位奥古斯都共同治理。',
    keywords: ['Tetrarchy map', 'Diocletian', 'Augustus Caesar'],
  },
  {
    id: 's5', start: 49, dur: 11, type: '观点', scene: 'capitals', material: '罗马与君士坦丁堡', review: 'pending',
    visual: '罗马的柱廊与君士坦丁堡的穹顶左右并置，一条道路连接两城。',
    narration: '这次改革暂时稳住了局势，却也埋下了东西分裂的种子。',
    keywords: ['Rome', 'Constantinople', 'late Roman empire'],
  },
  {
    id: 's6', start: 60, dur: 12, type: '结论', scene: 'divided', material: '395年帝国分裂图', review: 'pending',
    visual: '地图从中间裂开，西罗马与东罗马分别亮起，最后定格在 395 年。',
    narration: '到 395 年，帝国正式分裂，之后再没有真正统一。',
    keywords: ['Division of Roman Empire 395', 'Western Roman Empire'],
  },
];

const materialLibrary = [
  { name: '罗马帝国版图_03', scene: 'map', kind: 'image', tags: '地图 · 地中海 · 3世纪' },
  { name: '三世纪金币特写', scene: 'coins', kind: 'video', tags: '金币 · 皇帝 · 史料' },
  { name: '元老院辩论_油画', scene: 'senate', kind: 'image', tags: '元老院 · 人物 · 室内' },
  { name: '罗马军团_边境', scene: 'soldier', kind: 'video', tags: '军队 · 边境 · 旗帜' },
  { name: '四帝共治_示意图', scene: 'tetrarchy', kind: 'image', tags: '制度 · 地图 · 分屏' },
  { name: '罗马与君士坦丁堡', scene: 'capitals', kind: 'image', tags: '双城 · 建筑 · 对比' },
  { name: '395年帝国分裂图', scene: 'divided', kind: 'image', tags: '地图 · 分裂 · 结尾' },
  { name: '古代地图手稿', scene: 'document', kind: 'image', tags: '手稿 · 文献 · 质感' },
  { name: '旁白_豆包.wav', scene: 'document', kind: 'audio', tags: '旁白 · 44.1kHz · 01:12' },
];

/* ---------------- SVG scenes ---------------- */
function sceneSvg(scene) {
  const wrap = (bg, body) => `<svg class="scene-svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="800" height="450" fill="${bg}"/>${body}</svg>`;
  const grid = `<g opacity=".16" stroke="#7d6a52" stroke-width="1">${[80,160,240,320,400,480,560,640,720].map(x=>`<path d="M${x} 0v450"/>`).join('')}${[70,140,210,280,350,420].map(y=>`<path d="M0 ${y}h800"/>`).join('')}</g>`;

  if (scene === 'coins') {
    return wrap('#241e17', `
      <g opacity=".22" stroke="#d9b36b">${Array.from({length:18},(_,i)=>`<path d="M400 225 L${400+Math.cos(i/18*Math.PI*2)*620} ${225+Math.sin(i/18*Math.PI*2)*620}"/>`).join('')}</g>
      ${[[210,230,92,'IMP · CAESAR'],[400,210,108,'SOL · INVICTVS'],[596,238,88,'VICTORIA · AVG']].map(([x,y,r,l])=>`
        <g><circle cx="${x}" cy="${y}" r="${r}" fill="#a57b3f" stroke="#d8b570" stroke-width="2"/>
        <circle cx="${x}" cy="${y}" r="${r-12}" fill="none" stroke="#6d4d22" opacity=".6"/>
        <path d="M${x-28} ${y+42} C${x-38} ${y+16} ${x-18} ${y-4} ${x-8} ${y-9} C${x-2} ${y-40} ${x+30} ${y-46} ${x+36} ${y-16} C${x+52} ${y+2} ${x+40} ${y+28} ${x+24} ${y+42}Z" fill="#3b2a18" opacity=".8"/>
        <text x="${x}" y="${y+r+20}" text-anchor="middle" font-family="Georgia, serif" font-size="9" letter-spacing="2" fill="#c9a86b" opacity=".8">${l}</text></g>
      `).join('')}
      <text x="50" y="65" font-family="Georgia, serif" font-size="12" fill="#d8b570" opacity=".55" letter-spacing="4">AES · ARGENTUM · AURUM</text>
    `);
  }

  if (scene === 'senate') {
    return wrap('#2d2119', `
      <ellipse cx="400" cy="290" rx="320" ry="110" fill="#463326" opacity=".7"/>
      <path d="M0 360 C160 332 280 350 400 340 C560 326 680 342 800 368 L800 450 L0 450Z" fill="#1c1511"/>
      <g fill="#5a4433">${[110,230,350,470,590,710].map(x=>`<rect x="${x}" y="96" width="26" height="210"/><rect x="${x-9}" y="88" width="44" height="12" fill="#705640"/><rect x="${x-7}" y="306" width="40" height="10" fill="#705640"/>`).join('')}</g>
      <ellipse cx="400" cy="180" rx="120" ry="58" fill="#d7ad6a" opacity=".1"/>
      <g fill="#17110d">${[280,345,400,455,520].map((x,i)=>`<circle cx="${x}" cy="${278+(i%2)*8}" r="14"/><path d="M${x-26} 356 C${x-30} 318 ${x-12} 300 ${x} 300 C${x+16} 300 ${x+32} 318 ${x+26} 356Z"/>`).join('')}</g>
      <path d="M600 92 L680 92 L680 270 L600 270Z" fill="#6f3328" opacity=".5"/>
      <text x="50" y="418" font-family="Georgia, serif" font-size="10" fill="#c9a774" opacity=".55" letter-spacing="3">SENATVS · ROMANVS</text>
    `);
  }

  if (scene === 'tetrarchy') {
    return wrap('#d8c9ae', `
      ${grid}
      <path d="M84 96H380V224H84Z" fill="#a85e43" opacity=".78"/><path d="M420 96H716V224H420Z" fill="#4e7770" opacity=".78"/>
      <path d="M84 250H380V378H84Z" fill="#c59b55" opacity=".72"/><path d="M420 250H716V378H420Z" fill="#6f5f86" opacity=".72"/>
      <path d="M84 96H716V378H84Z M400 96V378 M84 237H716" fill="none" stroke="#5d4935" stroke-width="2"/>
      <g><circle cx="224" cy="163" r="43" fill="#e0cda9" stroke="#755c40" stroke-width="2"/><circle cx="576" cy="163" r="43" fill="#e0cda9" stroke="#755c40" stroke-width="2"/>
      <path d="M204 184 C196 163 209 144 228 145 C248 140 260 160 248 183Z" fill="#58432e" opacity=".8"/><path d="M556 184 C548 163 561 144 580 145 C600 140 612 160 600 183Z" fill="#58432e" opacity=".8"/>
      <text x="224" y="231" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#5f4933" letter-spacing="2">AUGUSTUS</text><text x="576" y="231" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#5f4933" letter-spacing="2">AUGUSTUS</text>
      <text x="224" y="324" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#5f4933" letter-spacing="2">CAESAR</text><text x="576" y="324" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#5f4933" letter-spacing="2">CAESAR</text></g>
      <text x="50" y="428" font-family="Georgia, serif" font-size="10" fill="#5c4834" opacity=".65" letter-spacing="3">TETRARCHIA · DOMINATVS</text>
    `);
  }

  if (scene === 'capitals') {
    return wrap('#282019', `
      <path d="M0 382 C160 360 280 366 400 374 C560 384 680 366 800 388 L800 450 L0 450Z" fill="#191411"/>
      <g transform="translate(170 0)" fill="#5a4432"><rect x="0" y="118" width="24" height="220"/><rect x="62" y="118" width="24" height="220"/><rect x="124" y="118" width="24" height="220"/><rect x="-10" y="104" width="168" height="15" fill="#725842"/><path d="M-18 104 L74 54 L166 104Z" fill="#7c5f47"/><rect x="-8" y="338" width="164" height="12" fill="#725842"/></g>
      <g transform="translate(540 0)" fill="#4c5e57"><path d="M0 210 C0 148 44 108 100 108 C156 108 200 148 200 210Z"/><rect x="82" y="188" width="36" height="154"/><rect x="48" y="214" width="104" height="14" fill="#73877d"/><rect x="18" y="338" width="164" height="12" fill="#73877d"/><path d="M100 108V72" stroke="#b6935e" stroke-width="2"/><circle cx="100" cy="67" r="4" fill="#c7a56e"/></g>
      <path d="M300 230 C360 206 430 206 500 230" fill="none" stroke="#c3a16b" stroke-width="1.3" stroke-dasharray="5 7" opacity=".55"/>
      <text x="170" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#d1b07b" opacity=".75" letter-spacing="3">ROMA</text>
      <text x="640" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#d1b07b" opacity=".75" letter-spacing="3">CONSTANTINOPOLIS</text>
      <text x="50" y="68" font-family="Georgia, serif" font-size="12" fill="#bd9b68" opacity=".55" letter-spacing="4">DUAE CAPITALES</text>
    `);
  }

  if (scene === 'divided') {
    return wrap('#d8cab1', `
      ${grid}
      <path d="M30 110 C150 62 290 58 388 108 L388 342 C290 390 150 386 30 338Z" fill="#b35f45" opacity=".8"/>
      <path d="M412 108 C520 58 670 62 770 110 L770 338 C670 386 520 390 412 342Z" fill="#4f7771" opacity=".82"/>
      <path d="M388 108H412V342H388Z" fill="#e7d9c0"/><path d="M400 72V382" stroke="#7f684d" stroke-width="2" stroke-dasharray="8 7"/>
      <text x="190" y="214" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#f0e6d5" opacity=".88" letter-spacing="6">WEST</text>
      <text x="610" y="214" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#f0e6d5" opacity=".88" letter-spacing="6">EAST</text>
      <text x="190" y="242" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#f0e6d5" opacity=".6" letter-spacing="3">ROMA</text>
      <text x="610" y="242" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#f0e6d5" opacity=".6" letter-spacing="3">CONSTANTINOPOLIS</text>
      <text x="50" y="410" font-family="Georgia, serif" font-size="10" fill="#6f5942" letter-spacing="3">DIVISIO IMPERII · 395</text>
    `);
  }

  if (scene === 'document') {
    return wrap('#2c251d', `
      <g transform="translate(150 70) rotate(-4)"><rect width="500" height="330" fill="#ddcba9"/><rect x="22" y="22" width="456" height="286" fill="none" stroke="#a98758" opacity=".55"/>
      <text x="44" y="64" font-family="Georgia, serif" font-size="12" fill="#765c3b" letter-spacing="4">IMPERIVM ROMANVM</text>
      <g stroke="#9e8159" stroke-width="2" opacity=".6">${Array.from({length:9},(_,i)=>`<path d="M44 ${106+i*22} H${i===8?340:440}"/>`).join('')}</g>
      <circle cx="405" cy="252" r="31" fill="#a94f3a" opacity=".8"/><circle cx="405" cy="252" r="23" fill="none" stroke="#d8b483" opacity=".6"/>
      <text x="405" y="257" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="#e7cfac">S · P · Q · R</text></g>
      <text x="50" y="420" font-family="Georgia, serif" font-size="10" fill="#bda276" opacity=".55" letter-spacing="3">ARCHIVUM · MANUSCRIPTUM</text>
    `);
  }

  if (scene === 'soldier') {
    return wrap('#241e18', `
      <path d="M0 360 C120 340 230 352 340 340 C500 322 650 344 800 370 L800 450 L0 450Z" fill="#15110e"/>
      <g fill="#0f0c0a">${[170,280,390,500,610].map((x,i)=>`<g transform="translate(${x} ${i%2?10:0})"><circle cx="0" cy="250" r="15"/><path d="M-28 360 C-32 306 -17 274 0 274 C20 274 34 306 28 360Z"/><path d="M${i%2?28:-28} 280 L${i%2?70:-70} 92" stroke="#6e553a" stroke-width="2.5"/></g>`).join('')}</g>
      <path d="M660 56V290" stroke="#8a6a45" stroke-width="3"/><path d="M660 70 C720 84 748 118 736 160 C708 144 682 140 660 148Z" fill="#8e3f31" opacity=".9"/>
      <text x="50" y="70" font-family="Georgia, serif" font-size="12" fill="#c3a270" opacity=".6" letter-spacing="4">LIMES · EXERCITVS</text>
    `);
  }

  return wrap('#dfd1b8', `
    ${grid}
    <path d="M0 295 C100 282 170 300 250 332 C340 370 500 378 800 330 L800 450 L0 450Z" fill="#9db6ad"/>
    <path d="M90 74 C180 38 300 38 382 68 C448 92 520 88 596 68 L682 126 C640 166 566 175 505 204 C430 240 355 254 296 238 C224 218 174 174 136 142Z" fill="#c57a57"/>
    <path d="M615 104 C680 126 736 176 758 236 C706 260 652 254 610 232 C578 214 566 174 580 142Z" fill="#b76a4b"/>
    <path d="M340 240 C370 258 390 282 384 302 C356 314 330 300 318 278 C312 260 322 248 340 240Z" fill="#d9c49f"/>
    <path d="M380 304 C430 300 462 326 448 352 C414 372 374 360 360 336Z" fill="#c9b38c"/>
    <g fill="#7b6048" opacity=".75"><circle cx="330" cy="222" r="4"/><circle cx="362" cy="214" r="3"/><circle cx="302" cy="188" r="3"/><circle cx="250" cy="150" r="3"/><circle cx="488" cy="146" r="3"/></g>
    <text x="54" y="62" font-family="Georgia, serif" font-size="13" fill="#6e5b45" opacity=".7" letter-spacing="5">MARE NOSTRUM</text>
    <text x="333" y="213" font-family="Georgia, serif" font-size="11" fill="#6e5b45" letter-spacing="3">ROMA</text>
    <text x="54" y="414" font-family="Georgia, serif" font-size="9" fill="#6f5d47" opacity=".65" letter-spacing="3">IMPERIUM ROMANUM · III SAECULUM</text>
  `);
}

/* ---------------- utilities ---------------- */
function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function totalDuration() {
  return shots.reduce((sum, shot) => sum + shot.dur, 0);
}

function showToast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2400);
}

function goStep(step) {
  currentStep = step;
  $$('.step').forEach((node) => {
    const value = Number(node.dataset.step);
    node.classList.toggle('is-active', value === step);
    node.classList.toggle('is-done', value < step);
    node.querySelector('.step-num').textContent = value < step ? '✓' : String(value);
  });
  $('#step1').hidden = step !== 1;
  $('#step2').hidden = step !== 2;
  $('#step3').hidden = step !== 3;
  if (step === 2) {
    setInspectorPane('shot');
    renderEditor();
  }
  if (step === 1) updateCharCount();
  window.scrollTo({ top: 0 });
}

function updateCharCount() {
  const text = $('#scriptInput').value.trim();
  const lines = text.split('\n').filter((line) => line.trim()).length;
  $('#charCount').textContent = `${lines} 段 · 约 ${text.replace(/\s/g, '').length} 字`;
}

function updateProjectView() {
  $('#projectName').value = project.title;
  $('#projectPath').textContent = project.path;
  $('#outputPath').textContent = project.path;
  $('#editorPath').textContent = `${project.path}storyboard.json`;
  $('#exportPath').textContent = `${project.path}export\\`;
}

function updateAiService() {
  const provider = $('#apiProvider')?.value || 'DeepSeek';
  const model = $('#apiModel')?.value || 'deepseek-chat';
  $('#aiServiceName').textContent = provider;
  $('#aiServiceModel').textContent = `${model} · 已连接`;
}

function updateReviewStats() {
  const adopted = shots.filter((shot) => shot.review === 'adopted').length;
  const pending = shots.length - adopted;
  const meta = $('.context-meta');
  if (meta) meta.innerHTML = `${shots.length} 个镜头 · <b>${adopted} 已采用</b> · ${pending} 待确认`;
  const head = $('.shot-panel-head span:last-child');
  if (head) head.textContent = `${adopted} / ${shots.length} 已采用`;
  const shotCount = $('#shotTabCount');
  if (shotCount) shotCount.textContent = String(shots.length);
  const mediaCount = $('#mediaTabCount');
  if (mediaCount) mediaCount.textContent = String(materialLibrary.length);
  const checkSummary = $('#checkSummary');
  if (checkSummary) checkSummary.textContent = pending ? `3 项通过 · 1 项提醒` : '全部通过 · 可以导出';
  const checkAdopt = $('#checkAdopt');
  if (checkAdopt) checkAdopt.hidden = pending === 0;
  const checkAdoptText = $('#checkAdoptText');
  if (checkAdoptText && pending) {
    const pendingNo = shots.filter((shot) => shot.review !== 'adopted').map((shot) => String(shots.indexOf(shot) + 1).padStart(2, '0')).join('、');
    checkAdoptText.textContent = `镜头 ${pendingNo} 还未采用，导出前确认`;
  }
}

/* ---------------- step 2 render ---------------- */
function renderStage() {
  const shot = shots[activeIndex];
  $('#stageScene').innerHTML = sceneSvg(shot.scene);
  $('#stageShotNo').textContent = String(activeIndex + 1).padStart(2, '0');
  $('#stageType').textContent = shot.type;
  $('#stageVisual').textContent = shot.visual;
  $('#stageNarration').textContent = `“${shot.narration}”`;
  const material = $('#stageMaterial');
  if (shot.material) {
    material.textContent = `素材：${shot.material}`;
    material.classList.add('is-bound');
  } else {
    material.textContent = '未绑定素材';
    material.classList.remove('is-bound');
  }
  $('#inspectorNo').textContent = String(activeIndex + 1).padStart(2, '0');
  const adopt = $('#inspectorAdopt');
  adopt.textContent = shot.review === 'adopted' ? '已采用' : '待确认';
  adopt.classList.toggle('is-pending', shot.review !== 'adopted');
  $('#visualInput').value = shot.visual;
  $('#narrationInput').value = shot.narration;
  $('#durationSelect').value = `${shot.dur}s`;
  updateReviewStats();
}

function renderTimeline() {
  const total = totalDuration();
  const video = $('#videoTrack');
  const audio = $('#audioTrack');
  const text = $('#textTrack');
  const ruler = $('#ruler');

  video.innerHTML = shots.map((shot, index) => `
    <button class="clip ${index === activeIndex ? 'is-active' : ''} ${shot.review === 'pending' ? 'is-pending' : ''}" data-index="${index}" style="flex:${shot.dur} 1 0%" title="${shot.visual}">
      <span class="clip-thumb">${sceneSvg(shot.scene)}</span>
      <span class="clip-copy"><span class="clip-num">${String(index + 1).padStart(2, '0')}</span><span class="clip-name">${shot.visual.slice(0, 12)}</span></span>
    </button>
  `).join('');

  audio.innerHTML = shots.map((shot, index) => `
    <button class="clip ${index === activeIndex ? 'is-active' : ''}" data-index="${index}" style="flex:${shot.dur} 1 0%" title="旁白：${shot.narration}">
      <span class="audio-wave">${Array.from({ length: 22 }, (_, i) => `<i style="height:${5 + Math.round(Math.abs(Math.sin(i * .8 + index)) * 15)}px"></i>`).join('')}</span>
    </button>
  `).join('');

  text.innerHTML = shots.map((shot, index) => `
    <button class="clip ${index === activeIndex ? 'is-active' : ''}" data-index="${index}" style="flex:${shot.dur} 1 0%" title="字幕占位">
      <span class="clip-copy"><span class="clip-name">字幕占位</span></span>
    </button>
  `).join('');

  $$('.clip', $('#timelineTracks')).forEach((node) => {
    node.addEventListener('click', () => {
      stopPlayback();
      setActiveShot(Number(node.dataset.index), true);
    });
  });

  ruler.innerHTML = [0, 15, 30, 45, 60, total].map((value) => `
    <span style="left:${(value / total) * 100}%">${formatTime(value)}</span>
  `).join('');

  updatePlayhead();
}

function renderMedia() {
  const query = ($('#mediaSearch')?.value || '').toLowerCase();
  const list = materialLibrary
    .map((item, index) => ({ ...item, index }))
    .filter((item) => currentMediaFilter === 'all' || item.kind === currentMediaFilter)
    .filter((item) => !query || `${item.name} ${item.tags}`.toLowerCase().includes(query));

  $('#mediaCount').textContent = `${materialLibrary.length} 个素材 · 本地`;
  const count = $('#mediaTabCount');
  if (count) count.textContent = String(materialLibrary.length);

  $('#mediaList').innerHTML = list.length ? list.map((item) => `
    <button class="media-item ${shots[activeIndex].material === item.name ? 'is-bound' : ''}" data-media="${item.index}">
      <span class="media-thumb ${item.kind === 'audio' ? 'is-audio' : ''}">${sceneSvg(item.scene)}${item.kind === 'audio' ? '<span class="audio-mini">▮▮▮</span>' : ''}</span>
      <span class="media-copy"><span class="media-name">${item.name}</span><span class="media-tags">${item.tags}</span></span>
    </button>
  `).join('') : '<div class="media-empty">没有匹配的素材</div>';

  $$('.media-item', $('#mediaList')).forEach((node) => {
    node.addEventListener('click', () => {
      const material = materialLibrary[Number(node.dataset.media)];
      shots[activeIndex].material = material.name;
      renderMedia();
      renderStage();
      renderBindCard();
      showToast(`已绑定素材：${material.name}`);
    });
  });
}

function renderStoryboardList() {
  $('#shotList').innerHTML = shots.map((shot, index) => `
    <button class="shot-row ${index === activeIndex ? 'is-active' : ''}" data-shot-index="${index}">
      <span class="shot-row-num">${String(index + 1).padStart(2, '0')}</span>
      <span class="shot-row-main">
        <strong>${shot.type} <em>${shot.dur}s · ${shot.material ? '已绑定' : '未绑定'}</em></strong>
        <small>${shot.visual}</small>
      </span>
      <span class="shot-status ${shot.review === 'adopted' ? 'adopted' : 'pending'}">${shot.review === 'adopted' ? '已采用' : '待确认'}</span>
    </button>
  `).join('');

  $$('.shot-row', $('#shotList')).forEach((node) => {
    node.addEventListener('click', () => {
      stopPlayback();
      setActiveShot(Number(node.dataset.shotIndex), true);
    });
  });
  updateReviewStats();
}

function renderBindCard() {
  const shot = shots[activeIndex];
  $('#bindBody').innerHTML = shot.material
    ? `<span class="bind-material"><i class="dot"></i>${shot.material}<em>已绑定</em></span>`
    : '<span class="bind-empty">这个镜头还没有绑定素材</span>';
}

function renderEditor() {
  renderStage();
  renderTimeline();
  $('#shotPanel').hidden = activeMediaTab !== 'storyboard';
  $('#mediaPanel').hidden = activeMediaTab === 'storyboard';
  if (activeMediaTab === 'storyboard') renderStoryboardList();
  else renderMedia();
  renderBindCard();
  updatePlayhead();
}

function setMediaTab(tab) {
  activeMediaTab = tab;
  const isStoryboard = tab === 'storyboard';
  $('#storyboardTabBtn').classList.toggle('is-active', isStoryboard);
  $('#mediaTabBtn').classList.toggle('is-active', !isStoryboard);
  $('#shotPanel').hidden = !isStoryboard;
  $('#mediaPanel').hidden = isStoryboard;
  if (isStoryboard) renderStoryboardList();
  else renderMedia();
}

function setInspectorPane(pane) {
  $$('.inspector-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.pane === pane));
  $$('.inspector-pane').forEach((item) => { item.hidden = item.dataset.pane !== pane; });
}

function setActiveShot(index, syncTime = false) {
  activeIndex = Math.max(0, Math.min(shots.length - 1, index));
  if (syncTime) {
    currentTime = shots[activeIndex].start;
    updatePlayhead();
  }
  renderStage();
  renderTimeline();
  if (activeMediaTab === 'storyboard') renderStoryboardList();
  else renderMedia();
  renderBindCard();
}

/* ---------------- playback ---------------- */
function updatePlayhead() {
  const total = totalDuration();
  const ratio = total ? Math.min(1, currentTime / total) : 0;
  $('#playhead').style.left = `${ratio * 100}%`;
  $('#transportProgress').style.width = `${ratio * 100}%`;
  $('#transportTime').textContent = `${formatTime(currentTime)} / ${formatTime(total)}`;
}

function updatePlayButton() {
  $('#playBtn').innerHTML = playing
    ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>'
    : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m8 5 11 7-11 7V5Z"/></svg>';
}

function stopPlayback() {
  if (playTimer) clearInterval(playTimer);
  playTimer = null;
  playing = false;
  updatePlayButton();
}

function togglePlayback() {
  if (playing) {
    stopPlayback();
    return;
  }
  if (currentTime >= totalDuration()) currentTime = 0;
  playing = true;
  updatePlayButton();
  playTimer = setInterval(() => {
    currentTime += 0.1;
    if (currentTime >= totalDuration()) {
      currentTime = totalDuration();
      updatePlayhead();
      stopPlayback();
      showToast('预演播放结束');
      return;
    }
    updatePlayhead();
    const nextIndex = shots.findIndex((shot) => currentTime >= shot.start && currentTime < shot.start + shot.dur);
    if (nextIndex >= 0 && nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      renderStage();
      renderTimeline();
      renderBindCard();
    }
  }, 100);
}

/* ---------------- step 3 ---------------- */
function renderExportPath() {
  $('#exportPath').textContent = `${project.path}export\\`;
}

/* ---------------- events ---------------- */
function bindEvents() {
  $$('.step').forEach((node) => {
    node.addEventListener('click', () => goStep(Number(node.dataset.step)));
  });

  $('#scriptInput').addEventListener('input', updateCharCount);
  $('#projectName').addEventListener('input', (event) => {
    project.title = event.target.value;
  });
  $('#renameProjectBtn').addEventListener('click', () => {
    $('#projectName').focus();
    $('#projectName').select();
  });
  $('#uploadScriptBtn').addEventListener('click', () => {
    showToast('原型演示：真实版本会打开文件选择器，读取 .txt / .md 文稿');
  });

  $('#generateBtn').addEventListener('click', () => {
    const text = $('#scriptInput').value.trim();
    if (!text) {
      showToast('先粘贴或上传一篇文稿');
      return;
    }
    const button = $('#generateBtn');
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span>正在理解文稿并生成分镜…';
    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = original;
      goStep(2);
      showToast('已生成 6 个镜头，先审核镜头表，再绑定素材（演示）');
    }, 1100);
  });

  $('#chooseFolderBtn').addEventListener('click', () => {
    project.path = 'E:\\VideoProjects\\罗马帝国\\';
    updateProjectView();
    showToast('已选择输出目录（原型演示）');
  });

  $('#testApiBtn').addEventListener('click', () => {
    showToast('DeepSeek 连接正常（原型演示）');
  });

  $('#openApiSettingsBtn').addEventListener('click', () => { $('#apiModal').hidden = false; });

  $('#apiProvider').addEventListener('change', (event) => {
    const model = $('#apiModel');
    if (event.target.value === 'DeepSeek') {
      model.innerHTML = '<option>deepseek-chat</option><option>deepseek-reasoner</option>';
    } else {
      model.innerHTML = '<option>gpt-4.1</option><option>gpt-4o-mini</option>';
    }
    updateAiService();
  });
  $('#apiModel').addEventListener('change', updateAiService);

  $('#regenerateBtn').addEventListener('click', () => goStep(1));
  $('#toExportBtn').addEventListener('click', () => {
    stopPlayback();
    goStep(3);
    renderExportPath();
  });

  $('#undoBtn').addEventListener('click', () => showToast('原型演示：撤销栈还没有接入'));
  $('#redoBtn').addEventListener('click', () => showToast('原型演示：重做栈还没有接入'));
  $('#reviewAllBtn').addEventListener('click', () => {
    shots.forEach((shot) => { shot.review = 'adopted'; });
    renderStoryboardList();
    renderStage();
    showToast('已批量采用 6 个镜头（演示）');
  });
  $('#reviewHintBtn').addEventListener('click', () => setMediaTab('media'));
  $('#addTrackBtn').addEventListener('click', () => showToast('原型演示：自定义轨道还没有接入'));
  $('#addClipBtn').addEventListener('click', () => showToast('原型演示：一个镜头多片段还没有接入'));

  $('#fitBtn').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('#stageCanvas').requestFullscreen();
    } catch {
      showToast('当前浏览器不支持画布全屏');
    }
  });

  $$('.tool-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.tool-chip').forEach((item) => item.classList.remove('is-active'));
      chip.classList.add('is-active');
    });
  });

  $$('.recent-item').forEach((item) => {
    item.addEventListener('click', () => showToast('原型演示：项目切换暂未接入'));
  });

  $('#playBtn').addEventListener('click', togglePlayback);

  $('#prevShotBtn').addEventListener('click', () => {
    stopPlayback();
    setActiveShot(activeIndex - 1, true);
  });
  $('#nextShotBtn').addEventListener('click', () => {
    stopPlayback();
    setActiveShot(activeIndex + 1, true);
  });

  $$('.inspector-tab').forEach((tab) => {
    tab.addEventListener('click', () => setInspectorPane(tab.dataset.pane));
  });

  $('#adoptShotBtn').addEventListener('click', () => {
    shots[activeIndex].review = 'adopted';
    renderStage();
    renderStoryboardList();
    showToast(`镜头 ${String(activeIndex + 1).padStart(2, '0')} 已采用`);
  });
  $('#reviseShotBtn').addEventListener('click', () => {
    shots[activeIndex].review = 'pending';
    renderStage();
    renderStoryboardList();
    showToast(`镜头 ${String(activeIndex + 1).padStart(2, '0')} 已标记为需要修改`);
  });

  $('#visualInput').addEventListener('input', (event) => {
    shots[activeIndex].visual = event.target.value;
    $('#stageVisual').textContent = event.target.value;
    renderTimeline();
  });
  $('#narrationInput').addEventListener('input', (event) => {
    shots[activeIndex].narration = event.target.value;
    $('#stageNarration').textContent = `“${event.target.value}”`;
    renderTimeline();
  });
  $('#durationSelect').addEventListener('change', (event) => {
    shots[activeIndex].dur = Number.parseInt(event.target.value, 10);
    let start = 0;
    shots.forEach((shot) => {
      shot.start = start;
      start += shot.dur;
    });
    renderTimeline();
    updatePlayhead();
  });

  $('#matchMaterialBtn').addEventListener('click', () => {
    const shot = shots[activeIndex];
    const match = materialLibrary.find((item) => item.scene === shot.scene) || materialLibrary[0];
    shot.material = match.name;
    renderMedia();
    renderBindCard();
    renderStage();
    showToast(`已匹配：${match.name}`);
  });

  $('#linkAllBtn').addEventListener('click', () => {
    shots.forEach((shot) => {
      const match = materialLibrary.find((item) => item.scene === shot.scene);
      if (match) shot.material = match.name;
    });
    renderEditor();
    showToast('已按分镜场景自动匹配素材（原型演示）');
  });

  $('#importMediaBtn').addEventListener('click', () => {
    materialLibrary.push({ name: `新素材_${String(materialLibrary.length + 1).padStart(2, '0')}`, scene: 'document', kind: 'image', tags: '待整理 · 未标注' });
    renderMedia();
    showToast('已添加一个演示素材');
  });

  $('#mediaSearch').addEventListener('input', () => {
    if (activeMediaTab === 'media') renderMedia();
  });

  $$('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      currentMediaFilter = chip.dataset.filter;
      $$('.filter-chip').forEach((item) => item.classList.toggle('is-active', item === chip));
      renderMedia();
    });
  });

  $('#mediaTabBtn').addEventListener('click', () => setMediaTab('media'));
  $('#storyboardTabBtn').addEventListener('click', () => setMediaTab('storyboard'));

  $('#backToEditorBtn').addEventListener('click', () => goStep(2));
  $('#chooseExportBtn').addEventListener('click', () => showToast('已选择导出目录（原型演示）'));
  $('#finishBtn').addEventListener('click', () => {
    showToast('项目已完成（原型演示）');
    goStep(1);
  });

  $$('.target-card').forEach((card) => {
    card.addEventListener('click', () => {
      selectedExportTarget = card.dataset.target;
      $$('.target-card').forEach((item) => item.classList.toggle('is-selected', item === card));
      $('#targetWarning').hidden = selectedExportTarget !== 'draft';
    });
  });

  $('#exportNowBtn').addEventListener('click', () => {
    const button = $('#exportNowBtn');
    const original = button.textContent;
    button.disabled = true;
    button.textContent = '正在整理导出清单…';
    setTimeout(() => {
      button.disabled = false;
      button.textContent = original;
      const targetName = { pack: '素材包 + 分镜表', draft: '剪映草稿', xml: 'XML / EDL / MLT' }[selectedExportTarget];
      showToast(`已准备 ${targetName}（原型演示，没有写入文件）`);
    }, 900);
  });

  $('#settingsBtn').addEventListener('click', () => { $('#apiModal').hidden = false; });
  $('#closeApiModal').addEventListener('click', () => { $('#apiModal').hidden = true; });
  $('#cancelApiModal').addEventListener('click', () => { $('#apiModal').hidden = true; });
  $('#saveApiModal').addEventListener('click', () => {
    $('#apiModal').hidden = true;
    updateAiService();
    showToast('设置已保存（原型演示）');
  });
  $('#apiModal').addEventListener('click', (event) => {
    if (event.target === $('#apiModal')) $('#apiModal').hidden = true;
  });

  document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    if (currentStep === 2 && event.code === 'Space') {
      event.preventDefault();
      togglePlayback();
    }
    if (currentStep === 2 && event.key === 'ArrowRight' && !playing) {
      setActiveShot(activeIndex + 1, true);
    }
    if (currentStep === 2 && event.key === 'ArrowLeft' && !playing) {
      setActiveShot(activeIndex - 1, true);
    }
  });
}

function init() {
  updateProjectView();
  updateAiService();
  updateCharCount();
  bindEvents();
  goStep(1);
}

init();
