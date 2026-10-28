'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const types = ['地图', '人物', '档案', '遗址', '图表', '情景再现'];
const candidateMap = {
  地图: ['区域地图_01', '地形示意图', '路线图'],
  人物: ['人物资料图', '工作照', '群像'],
  档案: ['档案封面', '旧报纸版面', '手稿'],
  遗址: ['旧址空镜', '建筑细节', '街景'],
  图表: ['时间线图表', '结构示意图', '数据图'],
  情景再现: ['雨夜街道', '车站人流', '清晨村口'],
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatTime(seconds) {
  const value = Math.max(0, Math.round(seconds));
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function splitArticleSections(text) {
  const lines = String(text || '').split(/\r?\n/);
  const sections = [];
  let current = { title: '正文', body: [] };
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+/.test(trimmed)) {
      if (current.body.join('').trim()) sections.push(current);
      current = { title: trimmed.replace(/^##\s+/, ''), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.join('').trim()) sections.push(current);

  let result = sections
    .map((item) => ({
      title: item.title || '正文',
      text: item.body.join('\n').trim(),
    }))
    .filter((item) => item.text);

  if (!result.length) result = [{ title: '正文', text: String(text || '').trim() }];

  // 没有小标题的长文，按空行切成可处理的段落块。
  if (result.length === 1 && result[0].text.length > 1400) {
    const paragraphs = result[0].text.split(/\n{2,}/).filter(Boolean);
    const chunks = [];
    let buffer = [];
    let size = 0;
    for (const paragraph of paragraphs) {
      buffer.push(paragraph);
      size += paragraph.length;
      if (size > 800) {
        chunks.push(buffer.join('\n\n'));
        buffer = [];
        size = 0;
      }
    }
    if (buffer.length) chunks.push(buffer.join('\n\n'));
    result = chunks.map((chunk, index) => ({ title: `第 ${index + 1} 节`, text: chunk }));
  }
  return result;
}

function detectProofIssues(text) {
  const issues = [];
  const add = (type, safe, before, after, reason) => {
    if (!before || issues.some((issue) => issue.before === before)) return;
    issues.push({ id: `issue-${issues.length + 1}`, type, safe, before, after, reason, status: 'open' });
  };

  const spaces = text.match(/[ \t]{2,}/);
  if (spaces) add('空格', true, spaces[0], ' ', '中文句子中多了连续空格');

  const punctuation = [['.', '。'], [',', '，'], ['?', '？'], ['!', '！'], [':', '：'], [';', '；']];
  for (const [before, after] of punctuation) {
    if (text.includes(before)) {
      add('标点', true, before, after, `英文标点「${before}」应改成中文标点「${after}」`);
      break;
    }
  }

  const duplicate = text.match(/(你你|的的|了了|是是|在在)/);
  if (duplicate) add('重复', true, duplicate[0], duplicate[0][0], '相邻汉字重复');

  const repeated = text.match(/([，。！？；：])\1/);
  if (repeated) add('标点', true, repeated[0], repeated[1], '连续重复的标点只保留一个');

  return issues.slice(0, 8);
}

function inferShotType(sentence) {
  if (/地图|城市|铁路|港口|路线|地理|边界|河流|山脉/.test(sentence)) return '地图';
  if (/照片|人物|少年|工人|农民|商人|官员|士兵|他|她/.test(sentence)) return '人物';
  if (/档案|报纸|文件|记录|手稿|书信|资料|数据/.test(sentence)) return '档案';
  if (/遗址|老屋|建筑|街道|车站|码头|厂房|城墙/.test(sentence)) return '遗址';
  if (/图表|数字|增长|比例|统计|时间线|年代/.test(sentence)) return '图表';
  return '情景再现';
}

function buildShotsForSection(text, sectionTitle) {
  const sentences = String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[。！？!?])/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!sentences.length) return [];

  const groups = [];
  let buffer = '';
  for (const sentence of sentences) {
    if (buffer && (buffer.length + sentence.length > 96)) {
      groups.push(buffer);
      buffer = sentence;
    } else {
      buffer += sentence;
    }
  }
  if (buffer) groups.push(buffer);

  return groups.map((sentence, index) => {
    const clean = sentence.replace(/\s+/g, ' ').trim();
    const duration = clamp(Math.round(clean.length / 4.6), 8, 24);
    const type = inferShotType(clean);
    return {
      id: `shot-${index + 1}`,
      no: index + 1,
      duration,
      type,
      visual: `画面建议：${clean.slice(0, 46)}`,
      material: '',
      status: 'todo',
    };
  });
}

function buildProjectsFromArticles() {
  const articles = Array.isArray(window.SAMPLE_ARTICLES) && window.SAMPLE_ARTICLES.length
    ? window.SAMPLE_ARTICLES
    : [{
      title: '一座港口城市的形成',
      kind: '历史',
      text: '这是一篇没有加载到示例文章时使用的占位文稿。\n\n请把真实文稿粘贴到新建项目页面，或在 samples.js 中准备示例数据。',
    }];

  return articles.map((article, projectIndex) => {
    const sections = splitArticleSections(article.text).map((item, sectionIndex) => {
      const shots = buildShotsForSection(item.text, item.title);
      const duration = shots.reduce((sum, shot) => sum + shot.duration, 0);
      const issues = detectProofIssues(item.text);
      return {
        index: sectionIndex,
        code: `1.${sectionIndex + 1}`,
        title: item.title,
        status: 'pending',
        duration,
        shots,
        proofStatus: issues.length ? 'review' : 'unprocessed',
        proofIssues: issues,
        proofText: item.text,
        text: item.text,
      };
    });
    const totalDuration = sections.reduce((sum, section) => sum + section.duration, 0);
    const totalShots = sections.reduce((sum, section) => sum + section.shots.length, 0);
    const chapter = {
      id: `chapter-${projectIndex + 1}`,
      no: '第一章',
      title: '正文',
      sections,
    };
    const episode = {
      no: 1,
      title: `第一章 ${article.title}`,
      duration: formatTime(totalDuration),
      sections: sections.length,
      shots: totalShots,
      progress: 0,
      current: true,
      chapter,
    };
    return {
      id: `sample-${projectIndex + 1}`,
      title: article.title,
      subtitle: `${sections.length} 节 · ${formatTime(totalDuration)}`,
      kind: article.kind || '示例',
      episodes: [episode],
    };
  });
}

let projects = buildProjectsFromArticles();
try {
  const saved = JSON.parse(localStorage.getItem('storyboard-demo-projects-v3') || 'null');
  if (Array.isArray(saved) && saved.length) projects = saved;
} catch {}


const initialProject = projects[0];
const initialEpisode = initialProject.episodes[0];
const initialChapter = initialEpisode.chapter;
const state = {
  view: 'projects',
  project: initialProject,
  episode: initialEpisode,
  chapter: initialChapter,
  sectionIndex: 0,
  shotIndex: 0,
  mode: 'proof',
  proofView: 'compare',
  filter: 'all',
  expanded: new Set([0]),
  currentTime: 0,
  playing: false,
  playTimer: null,
  exportTarget: 0,
  playerSize: '16:9|1920×1080|1080p 横屏',
};

let toastTimer = null;

function totalShots() {
  return state.chapter.sections.reduce((sum, section) => sum + section.shots.length, 0);
}

function doneShots() {
  return state.chapter.sections.reduce((sum, section) => sum + section.shots.filter((shot) => shot.status === 'done').length, 0);
}

function doneSections() {
  return state.chapter.sections.filter((section) => section.status === 'done').length;
}

function proofDoneSections() {
  return state.chapter.sections.filter((section) => section.proofStatus === 'final').length;
}

function currentSection() {
  return state.chapter.sections[state.sectionIndex];
}

function currentShot() {
  return currentSection().shots[Math.min(state.shotIndex, currentSection().shots.length - 1)];
}

function sectionDuration(section) {
  return section.shots.reduce((sum, shot) => sum + shot.duration, 0);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function fallbackCopy(text, successMessage) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try { document.execCommand('copy'); showToast(successMessage); } catch { showToast('请手动选择复制'); }
  area.remove();
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showToast('整节文案已复制，可以粘贴进声音克隆'),
      () => fallbackCopy(text, '整节文案已复制，可以粘贴进声音克隆')
    );
    return;
  }
  fallbackCopy(text, '整节文案已复制');
}

function sceneSvg(type) {
  const wrap = (bg, inner) => `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="800" height="450" fill="${bg}"/>${inner}</svg>`;
  if (type === '人物') {
    return wrap('#211b16', `
      <rect x="205" y="58" width="390" height="334" fill="#2c241c" stroke="#6e5942" stroke-width="1.5"/>
      <ellipse cx="400" cy="228" rx="103" ry="118" fill="#b8845d" opacity=".75"/>
      <path d="M302 361 C318 298 356 278 400 278 C444 278 482 298 498 361Z" fill="#16120e"/>
      <path d="M356 192 C372 163 428 163 444 192" fill="none" stroke="#5f442e" stroke-width="7" opacity=".7"/>
      <circle cx="367" cy="224" r="5" fill="#2b1e14"/><circle cx="433" cy="224" r="5" fill="#2b1e14"/>
      <path d="M380 266 Q400 278 420 266" fill="none" stroke="#5f392b" stroke-width="3" opacity=".7"/>
      <text x="50" y="416" font-family="Georgia,serif" font-size="10" fill="#bca283" letter-spacing="3">PORTRAIT · ARCHIVE</text>
    `);
  }
  if (type === '档案') {
    return wrap('#1d1915', `
      <g transform="translate(170 58) rotate(-3)">
        <rect width="470" height="330" fill="#ddcbaa"/>
        <rect x="22" y="22" width="426" height="286" fill="none" stroke="#b49a72" opacity=".6"/>
        <text x="44" y="62" font-family="Georgia,serif" font-size="12" fill="#765b3c" letter-spacing="4">DOCUMENT · 1978</text>
        ${Array.from({length: 9}, (_, i) => `<path d="M44 ${102 + i * 22} H${i === 8 ? 340 : 414}" stroke="#a98d67" stroke-width="2" opacity=".55"/>`).join('')}
        <circle cx="395" cy="260" r="30" fill="#a94f3a" opacity=".72"/>
        <circle cx="395" cy="260" r="22" fill="none" stroke="#e5cda9" opacity=".6"/>
        <text x="395" y="265" text-anchor="middle" font-family="Georgia,serif" font-size="8" fill="#f0dfc5">档案</text>
      </g>
      <text x="50" y="416" font-family="Georgia,serif" font-size="10" fill="#bda276" opacity=".7" letter-spacing="3">PAPER · MEMORY</text>
    `);
  }
  if (type === '遗址') {
    return wrap('#17130f', `
      <path d="M0 348 C130 330 270 342 400 332 C560 318 690 342 800 368 L800 450 L0 450Z" fill="#100d0a"/>
      <g fill="#5a4633"><rect x="130" y="126" width="27" height="210"/><rect x="176" y="126" width="27" height="210"/><rect x="222" y="126" width="27" height="210"/><rect x="268" y="126" width="27" height="210"/><rect x="116" y="112" width="190" height="15" fill="#71563e"/><rect x="126" y="332" width="170" height="12" fill="#71563e"/></g>
      <path d="M420 300 C450 240 530 222 600 252 C650 274 676 318 682 352 L420 352Z" fill="#2b241b"/>
      <path d="M70 320 C180 290 300 300 400 330" stroke="#8a6a4d" stroke-width="2" fill="none" opacity=".5"/>
      <text x="50" y="416" font-family="Georgia,serif" font-size="10" fill="#bda276" opacity=".65" letter-spacing="3">SITE · RUINS</text>
    `);
  }
  if (type === '图表') {
    return wrap('#e3d6bf', `
      <g opacity=".16" stroke="#6f5a43">${[100,180,260,340,420,500,580,660,740].map((x) => `<path d="M${x} 0v450"/>`).join('')}${[80,150,220,290,360,430].map((y) => `<path d="M0 ${y}h800"/>`).join('')}</g>
      <g fill="#b05d40"><rect x="160" y="255" width="66" height="130"/><rect x="255" y="208" width="66" height="177"/><rect x="350" y="163" width="66" height="222"/><rect x="445" y="116" width="66" height="269"/><rect x="540" y="70" width="66" height="315"/></g>
      <path d="M160 242 L270 190 L380 146 L500 94 L620 54" stroke="#4e7768" stroke-width="4" fill="none"/>
      <text x="52" y="62" font-family="Georgia,serif" font-size="12" fill="#66513d" letter-spacing="4">DATA · STRUCTURE</text>
    `);
  }
  if (type === '情景再现') {
    return wrap('#241d16', `
      <path d="M0 330 C120 300 220 328 320 308 C450 282 580 320 800 286 L800 450 L0 450Z" fill="#17120d"/>
      <path d="M88 340 C180 250 300 210 420 230 C520 246 600 292 690 340" fill="none" stroke="#5e4b37" stroke-width="3" opacity=".6"/>
      <g fill="#0f0c09"><circle cx="250" cy="275" r="16"/><path d="M220 360 C220 310 232 292 250 292 C272 292 286 310 280 360Z"/><circle cx="515" cy="290" r="13"/><path d="M490 360 C490 320 500 304 515 304 C532 304 542 320 538 360Z"/></g>
      <path d="M0 70 L800 70" stroke="#d3a774" stroke-width="1" opacity=".18"/>
      <text x="50" y="416" font-family="Georgia,serif" font-size="10" fill="#bda276" opacity=".65" letter-spacing="3">RECONSTRUCTION</text>
    `);
  }
  return wrap('#191612', `
    <g opacity=".2" stroke="#9b8062">${[100,180,260,340,420,500,580,660,740].map((x) => `<path d="M${x} 0v450"/>`).join('')}${[80,150,220,290,360,430].map((y) => `<path d="M0 ${y}h800"/>`).join('')}</g>
    <path d="M60 320 C130 250 260 220 360 260 C480 308 560 282 720 220 L760 420 L40 420Z" fill="#8e5b43" opacity=".8"/>
    <path d="M60 320 C190 282 330 314 450 356 C560 394 680 368 760 334" fill="none" stroke="#d1a070" stroke-width="2" opacity=".5"/>
    <text x="50" y="80" font-family="Georgia,serif" font-size="12" fill="#d2b18a" opacity=".65" letter-spacing="4">MAP · TERRITORY</text>
    <text x="500" y="300" font-family="Georgia,serif" font-size="18" fill="#f1dfc7" opacity=".75">1958</text>
  `);
}

/* ---------------- project library ---------------- */
function renderProjectPage() {
  const current = projects.find((project) => project.id === state.project?.id) || projects[0] || null;
  const currentPlayable = Boolean(current?.episodes[0]?.chapter);
  const currentDone = currentPlayable ? proofDoneSections() : 0;
  const currentTotal = currentPlayable ? state.chapter.sections.length : 0;
  const currentShots = currentPlayable ? doneShots() : 0;
  const currentShotsTotal = currentPlayable ? totalShots() : 0;

  $('#projectStats').innerHTML = `
    <div class="stat-card"><small>项目</small><strong>${projects.length} 个</strong><em>本地项目库</em></div>
    <div class="stat-card"><small>当前项目</small><strong>${current?.title || '未选择'}</strong><em>${current?.subtitle || '点项目进入'}</em></div>
    <div class="stat-card"><small>当前文稿进度</small><strong>${currentDone}/${currentTotal || 0} 节</strong><em>${currentShots}/${currentShotsTotal || 0} 镜已配</em></div>
    <div class="stat-card"><small>项目状态</small><strong>进行中</strong><em>一条视频 = 一个项目</em></div>
  `;

  $('#projectCount').textContent = `${projects.length} 个项目`;
  if (!projects.length) {
    $('#projectList').innerHTML = '<div class="projects-empty">还没有项目。点右上角「＋ 新建项目」开始。</div>';
    return;
  }

  $('#projectList').innerHTML = projects.map((project, index) => {
    const isCurrent = project.id === current?.id;
    const isPlayable = Boolean(project.episodes[0]?.chapter);
    const isActive = project.id === state.project?.id;
    const done = isPlayable && isActive ? proofDoneSections() : 0;
    const total = isPlayable ? project.episodes[0].chapter.sections.length : project.episodes.reduce((sum, episode) => sum + episode.sections, 0);
    const percent = total ? Math.round((done / total) * 100) : 0;
    return `<article class="project-card ${isCurrent ? 'is-current' : ''}">
      <button class="project-open" data-project="${project.id}">
        <span class="project-index">${pad(index + 1)}</span>
        <span class="project-copy">
          <span class="project-kicker">${project.kind}</span>
          <strong class="project-title">${project.title}</strong>
          <span class="project-subtitle">${project.episodes.length ? `${project.episodes.length} 集` : '还没有分集'}</span>
          <span class="project-card-foot"><span class="progress-bar"><i style="width:${percent}%"></i></span><span>${isPlayable ? `${done}/${total} 节` : '未开始'}</span><span class="project-enter">进入项目 →</span></span>
        </span>
      </button>
      <button class="project-delete" data-delete="${project.id}" title="删除项目" aria-label="删除项目">×</button>
    </article>`;
  }).join('');

  $$('.project-open').forEach((button) => {
    button.addEventListener('click', () => {
      const project = projects.find((item) => item.id === button.dataset.project);
      if (project) openProject(project);
    });
  });

  $$('.project-delete').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const project = projects.find((item) => item.id === button.dataset.delete);
      if (!project) return;
      if (!window.confirm(`删除项目「${project.title}」？本地演示会立即移除。`)) return;
      const index = projects.findIndex((item) => item.id === project.id);
      if (index >= 0) projects.splice(index, 1);
      if (state.project?.id === project.id) state.project = projects[0] || null;
      renderProjectPage();
      showToast(`已删除项目「${project.title}」`);
      saveProjects();
    });
  });
}

function openProject(project) {
  state.project = project;
  state.episode = project.episodes[0] || null;
  state.chapter = state.episode?.chapter || null;
  state.sectionIndex = 0;
  state.shotIndex = 0;
  state.view = 'series';
  stopPlayback();
  $('#projectsView').hidden = true;
  $('#newProjectView').hidden = true;
  $('#seriesView').hidden = false;
  $('#workspaceView').hidden = true;
  $('#topCrumb').textContent = `项目库 / ${project.title}`;
  $('#seriesTitle').textContent = project.title;
  $('#seriesSubtitle').textContent = project.subtitle;
  renderSeries();
}

function backToProjects() {
  stopPlayback();
  state.view = 'projects';
  $('#workspaceView').hidden = true;
  $('#seriesView').hidden = true;
  $('#newProjectView').hidden = true;
  $('#projectsView').hidden = false;
  $('#topCrumb').textContent = '项目库';
  renderProjectPage();
}

function openNewProject() {
  stopPlayback();
  state.view = 'new';
  $('#projectsView').hidden = true;
  $('#seriesView').hidden = true;
  $('#workspaceView').hidden = true;
  $('#newProjectView').hidden = false;
  $('#topCrumb').textContent = '项目库 / 新建项目';
  $('#newProjectName').value = '未命名项目';
  $('#newProjectScript').value = '';
  updateNewProjectCount();
}

function updateNewProjectCount() {
  const value = $('#newProjectScript').value.trim();
  $('#newProjectCharCount').textContent = `${value.replace(/\s/g, '').length} 字`;
}

function saveProjects() {
  try { localStorage.setItem('storyboard-demo-projects-v3', JSON.stringify(projects)); } catch {}
}

function downloadProjectCsv() {
  const project = state.project;
  if (!project) return;
  const rows = [['项目', '小节编号', '小节', '镜头号', '时长(秒)', '画面建议', '类型', '素材', '状态', '整节文案']];
  for (const section of state.chapter.sections) {
    if (!section.shots.length) {
      rows.push([project.title, section.code, section.title, '', '', '', '', '', section.proofStatus, section.text]);
    }
    for (const shot of section.shots) {
      rows.push([project.title, section.code, section.title, shot.no, shot.duration, shot.visual, shot.type, shot.material || '', shot.status, shot.no === 1 ? section.text : '']);
    }
  }
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.title.replace(/[\\/:*?"<>|]/g, '_')}_分镜.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast('CSV 已下载，可以用 Excel 打开');
}

function detectDraftIssues(text) {
  const issues = [];
  const spaces = text.match(/[ \t]{2,}/);
  if (spaces) {
    issues.push({ id: 'space', type: '空格', safe: true, before: spaces[0], after: ' ', reason: '中文句子中多了连续空格', status: 'open' });
  }
  const duplicate = text.match(/([\u4e00-\u9fa5])\1/);
  if (duplicate) {
    issues.push({ id: 'dup', type: '重复', safe: true, before: duplicate[0], after: duplicate[1], reason: '相邻汉字重复', status: 'open' });
  }
  if (text.includes('.')) {
    issues.push({ id: 'period', type: '标点', safe: true, before: '.', after: '。', reason: '英文句号应改成中文句号', status: 'open' });
  }
  return issues.slice(0, 3);
}

function buildDraftChapter(manuscript) {
  const issues = detectProofIssues(manuscript);
  const shots = buildShotsForSection(manuscript, '原始文稿');
  const section = {
    index: 0,
    code: '1.1',
    title: '原始文稿',
    status: 'pending',
    duration: shots.reduce((sum, shot) => sum + shot.duration, 0),
    shots,
    proofStatus: issues.length ? 'review' : 'unprocessed',
    proofIssues: issues,
    proofText: manuscript,
    text: manuscript,
  };
  return {
    id: `draft-${Date.now()}`,
    no: '第一章',
    title: '未命名章节',
    sections: [section],
  };
}

function createProjectFromForm() {
  const name = $('#newProjectName').value.trim();
  const manuscript = $('#newProjectScript').value.trim();
  if (!name) { showToast('先给项目起一个名字'); $('#newProjectName').focus(); return; }
  if (!manuscript) { showToast('先把原始文稿贴进来'); $('#newProjectScript').focus(); return; }
  const draftChapter = buildDraftChapter(manuscript);
  const episode = {
    no: 1,
    title: '第一章 未命名章节',
    duration: formatTime(draftChapter.sections[0].duration),
    sections: 1,
    shots: draftChapter.sections[0].shots.length,
    progress: 0,
    current: true,
    chapter: draftChapter,
  };
  const project = {
    id: `project-${Date.now()}`,
    title: name,
    subtitle: '1 集 · 新项目',
    kind: '新项目',
    episodes: [episode],
  };
  projects.push(project);
  state.project = project;
  state.episode = episode;
  state.chapter = draftChapter;
  state.sectionIndex = 0;
  state.shotIndex = 0;
  state.mode = 'proof';
  $('#newProjectView').hidden = true;
  $('#projectsView').hidden = true;
  $('#seriesView').hidden = true;
  $('#workspaceView').hidden = false;
  $('#topCrumb').textContent = `项目库 / ${project.title} / 第1集 / 第一章`;
  renderWorkspace();
  showToast('项目已创建：先处理原始文稿，再设计镜头表');
  saveProjects();
}

function renameCurrentProject() {
  if (!state.project) return;
  const name = window.prompt('修改项目名称', state.project.title);
  if (!name || !name.trim()) return;
  state.project.title = name.trim();
  $('#seriesTitle').textContent = state.project.title;
  $('#topCrumb').textContent = `项目库 / ${state.project.title}`;
  renderSeries();
  showToast('项目名称已更新');
  saveProjects();
}

/* ---------------- series home ---------------- */
function renderSeries() {
  const project = state.project;
  if (!project) { backToProjects(); return; }
  const projectEpisodes = project.episodes;
  const playable = Boolean(projectEpisodes[0]?.chapter);
  const done = playable ? proofDoneSections() : 0;
  const materialDone = playable ? doneSections() : 0;
  const total = playable ? state.chapter.sections.length : 0;
  const shotsDone = playable ? doneShots() : 0;
  const shotsTotal = playable ? totalShots() : 0;
  const next = playable ? currentSection() : projectEpisodes[0];

  $('#seriesTitle').textContent = project.title;
  $('#seriesSubtitle').textContent = project.subtitle;
  $('#episodeCount').textContent = `${projectEpisodes.length} 集`;
  const continueBtn = $('#continueBtn');
  continueBtn.disabled = !playable;
  continueBtn.textContent = playable ? '继续第 1 集' : '暂无镜头';

  $('#seriesStats').innerHTML = `
    <div class="stat-card"><small>本系列</small><strong>${projectEpisodes.length} 集</strong><em>${project.kind} · 本地演示</em></div>
    <div class="stat-card"><small>当前集</small><strong>${projectEpisodes[0]?.title || '未添加'}</strong><em>${projectEpisodes[0] ? `${projectEpisodes[0].duration} · ${playable ? total : projectEpisodes[0].sections} 节` : '还没有分集'}</em></div>
    <div class="stat-card"><small>本集进度</small><strong>${playable ? `${done}/${total} 节` : '0 节'}</strong><em>${playable ? `已配 ${materialDone}/${total} 节` : '点进项目后展开'}</em></div>
    <div class="stat-card"><small>已配画面</small><strong>${playable ? `${shotsDone}/${shotsTotal} 镜` : '0 镜'}</strong><em>${playable ? '先完成一小节' : '演示项目'}</em></div>
  `;

  $('#episodeList').innerHTML = projectEpisodes.length ? projectEpisodes.map((episode) => {
    const isCurrent = playable && episode.no === 1;
    const progress = isCurrent ? done : 0;
    const percent = isCurrent && total ? Math.round((done / total) * 100) : 0;
    const sectionsLabel = isCurrent ? total : episode.sections;
    const shotsLabel = isCurrent ? shotsTotal : episode.shots;
    return `<button class="episode-card ${isCurrent ? 'is-current' : ''}" data-episode="${episode.no}">
      <span class="episode-no">${pad(episode.no)}</span>
      <span class="episode-body">
        <span class="episode-topline"><strong class="episode-title">${episode.title}</strong><span class="episode-status ${isCurrent ? 'active' : ''}">${isCurrent ? '进行中' : '未开始'}</span></span>
        <span class="episode-meta">${episode.duration} · ${sectionsLabel} 节 · ${shotsLabel} 镜</span>
        <span class="episode-progress"><span class="progress-bar"><i style="width:${percent}%"></i></span><span>${isCurrent ? `${progress}/${total} 节` : '0 节'}</span></span>
      </span>
    </button>`;
  }).join('') : '<div class="projects-empty">这个项目还没有分集。下一步可以在这里添加第 1 集。</div>';

  $$('.episode-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (playable && Number(card.dataset.episode) === 1) {
        openWorkspace();
      } else {
        showToast('本地演示只展开了当前示例项目的第 1 集；其他集用于展示系列结构');
      }
    });
  });

  if (playable) {
    $('#seriesSide').innerHTML = `
      <section class="side-card">
        <div class="mini-label">NEXT WORK</div>
        <h3>继续第 1 集</h3>
        <p>先完成「${next.code} ${next.title}」，再进入下一节。不要从全片开始做。</p>
        <div class="side-progress">
          <div class="progress-bar"><i style="width:${Math.round((done / total) * 100)}%"></i></div>
          <div class="side-progress-label"><span>${done}/${total} 节定稿</span><span>${shotsDone}/${shotsTotal} 镜已配</span></div>
        </div>
        <div class="side-next"><strong>下一节：</strong>${next.code} ${next.title}<br><span>${next.shots.length} 镜 · 约 ${formatTime(sectionDuration(next))}</span></div>
        <div class="side-actions">
          <button class="btn btn-soft" id="sideSeriesHelp">看流程</button>
          <button class="btn btn-primary" id="sideContinue">继续本节 →</button>
        </div>
      </section>
      <section class="side-card">
        <div class="mini-label">WORKBOOK</div>
        <h3>一集一个工作簿</h3>
        <p><strong>第1集_第一章_分镜.xlsx</strong><br>00 总览 + 本集章节 sheet；每节保留整节文案，方便声音克隆。</p>
        <div class="side-actions"><button class="btn btn-ghost" id="sideWorkbook">导出工作簿</button></div>
      </section>`;
    $('#sideContinue').addEventListener('click', openWorkspace);
    $('#sideSeriesHelp').addEventListener('click', () => showToast('系列 → 集 → 章 → 节 → 镜头；先完成一小节'));
    $('#sideWorkbook').addEventListener('click', () => showToast('本地演示：会导出 00 总览 + 章节 sheet（尚未写入文件）'));
  } else {
    $('#seriesSide').innerHTML = `
      <section class="side-card">
        <div class="mini-label">PROJECT SHELL</div>
        <h3>项目结构</h3>
        <p>这个项目目前只有分集结构，还没有展开章节和镜头。点「返回项目库」可以继续新建项目。</p>
        <div class="side-progress">
          <div class="progress-bar"><i style="width:0%"></i></div>
          <div class="side-progress-label"><span>0/${projectEpisodes.length} 集完成</span><span>${projectEpisodes.length} 集结构</span></div>
        </div>
        <div class="side-actions"><button class="btn btn-primary" id="sideBackProjects">返回项目库</button></div>
      </section>`;
    $('#sideBackProjects').addEventListener('click', backToProjects);
  }
}

/* ---------------- workspace ---------------- */
function openWorkspace() {
  if (!state.chapter || !state.chapter.sections.length) {
    showToast('这个项目还没有展开章节和镜头');
    return;
  }
  state.episode = state.project?.episodes[0] || state.episode;
  state.view = 'workspace';
  state.currentTime = 0;
  stopPlayback();
  $('#projectsView').hidden = true;
  $('#newProjectView').hidden = true;
  $('#seriesView').hidden = true;
  $('#workspaceView').hidden = false;
  $('#topCrumb').textContent = `项目库 / ${state.project.title} / 第1集 / ${state.chapter.no}`;
  renderWorkspace();
}

function backToSeries() {
  stopPlayback();
  state.view = 'series';
  $('#workspaceView').hidden = true;
  $('#projectsView').hidden = true;
  $('#seriesView').hidden = false;
  $('#topCrumb').textContent = `项目库 / ${state.project.title}`;
  renderSeries();
}

function renderWorkspace() {
  const section = currentSection();
  const total = state.chapter.sections.length;
  const done = doneSections();
  const shotsDone = doneShots();
  const shotsTotal = totalShots();
  const proofDone = state.chapter.sections.filter((item) => item.proofStatus === 'final').length;
  const proofOpen = state.chapter.sections.reduce((sum, item) => sum + item.proofIssues.filter((issue) => issue.status === 'open').length, 0);

  $('#workspaceKicker').textContent = `第 ${state.episode?.no || 1} 集 · 项目`;
  $('#workspaceName').textContent = `${state.chapter.no} ${state.chapter.title}`;
  $('#workspaceProgressLabel').textContent = state.mode === 'proof' ? `${proofDone}/${total} 节已定稿` : `${done}/${total} 节`;
  $('#workspaceShotsLabel').textContent = state.mode === 'proof' ? `${proofOpen} 处待处理` : `${shotsDone}/${shotsTotal} 镜`;
  $('#workspaceProgressBar').style.width = state.mode === 'proof' ? `${(proofDone / total) * 100}%` : `${(shotsDone / shotsTotal) * 100}%`;
  $('#statusEpisode').textContent = `${state.episode?.title || ''}`;
  $('#statusSection').textContent = `${section.code} ${section.title}`;
  $('#statusProgress').textContent = state.mode === 'proof' ? `${proofDone}/${total} 节定稿 · ${proofOpen} 处待处理` : `${done}/${total} 节 · ${shotsDone}/${shotsTotal} 镜`;
  $('#sheetChapter').textContent = `01 ${state.chapter.no} ${state.chapter.title}`;
  const missing = shotsTotal - shotsDone;
  const missingEl = $('#exportMissing');
  if (missingEl) missingEl.textContent = missing ? `还有 ${missing} 个镜头未绑定素材` : '全部镜头都已绑定素材';
  const missingRow = $('#exportMissingRow');
  if (missingRow) missingRow.hidden = missing === 0;
  const exportSummary = $('#exportCheckSummary');
  if (exportSummary) exportSummary.textContent = missing ? '3 项通过 · 1 项提醒' : '4 项通过';

  renderTree();
  renderMode();
  renderRight();
}

function renderTree() {
  const section = currentSection();
  const isProof = state.mode === 'proof';
  const done = isProof
    ? state.chapter.sections.filter((item) => item.proofStatus === 'final').length
    : doneSections();
  const total = state.chapter.sections.length;
  $('#treeMeta').textContent = isProof ? `${done}/${total} 已定稿` : `${done}/${total} 已完成`;
  const filterButtons = $$('#treeFilter .filter-chip');
  if (filterButtons[0]) filterButtons[0].textContent = '全部';
  if (filterButtons[1]) filterButtons[1].textContent = isProof ? '待处理' : '待配';
  if (filterButtons[2]) filterButtons[2].textContent = isProof ? '已定稿' : '已完成';

  const visibleSections = state.chapter.sections.filter((item) => {
    if (state.filter === 'done') return isProof ? item.proofStatus === 'final' : item.status === 'done';
    if (state.filter === 'todo') return isProof ? item.proofStatus !== 'final' : item.status !== 'done';
    return true;
  });

  const rows = visibleSections.map((item) => {
    const isActive = item.index === state.sectionIndex;
    const isDone = isProof ? item.proofStatus === 'final' : item.status === 'done';
    const isExpanded = !isProof && state.expanded.has(item.index);
    const statusClass = isDone ? 'is-done' : isActive ? 'is-active' : '';
    const proofLabel = item.proofStatus === 'final' ? '已定稿' : item.proofStatus === 'review' ? '待确认' : '未处理';
    const meta = isProof
      ? `${item.shots.length} 镜 · ${formatTime(sectionDuration(item))} · ${proofLabel}`
      : `${item.shots.length} 镜 · ${formatTime(sectionDuration(item))} · ${item.status === 'done' ? '已完成' : isActive ? '进行中' : '未开始'}`;
    const shots = isExpanded ? `<div class="tree-shots">${item.shots.map((shot) => {
      const activeShot = isActive && shot.no === state.shotIndex + 1;
      return `<button class="tree-shot ${activeShot ? 'is-active' : ''} ${shot.status === 'done' ? 'is-bound' : ''}" data-section="${item.index}" data-shot="${shot.no - 1}">
        <span class="tree-shot-no">${pad(shot.no)}</span>
        <span class="tree-shot-name">${shot.visual.split('：')[1] || shot.visual}</span>
        <span class="tree-shot-state">${shot.status === 'done' ? '已配' : '待配'}</span>
      </button>`;
    }).join('')}</div>` : '';
    return `<div class="tree-section ${isActive ? 'is-active' : ''} ${statusClass}">
      <button class="tree-section-head" data-section="${item.index}" data-toggle="true">
        <span class="tree-check">${isDone ? '✓' : isActive ? '•' : ''}</span>
        <span class="tree-section-copy"><span class="tree-section-name">${item.code} ${item.title}</span><span class="tree-section-meta">${meta}</span></span>
        <span class="tree-section-index">${isProof ? '' : isExpanded ? '▾' : '▸'}</span>
      </button>
      ${shots}
    </div>`;
  }).join('');

  $('#sectionTree').innerHTML = `<div class="tree-chapter">${state.chapter.no} ${state.chapter.title}<small>第 ${state.episode?.no || 1} 集 · ${state.chapter.sections.length} 节 · ${totalShots()} 镜 · ${formatTime(state.chapter.sections.reduce((sum, item) => sum + sectionDuration(item), 0))}</small></div>${rows || '<div class="tree-empty">没有匹配的小节</div>'}`;

  $$('.tree-section-name').forEach((name) => {
    name.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      const sectionIndex = Number(name.closest('.tree-section-head').dataset.section);
      const section = state.chapter.sections[sectionIndex];
      const nextTitle = window.prompt('小节名称', section.title);
      if (nextTitle && nextTitle.trim()) {
        section.title = nextTitle.trim();
        renderWorkspace();
        showToast('小节名称已更新（本地演示）');
      }
    });
  });

  $$('.tree-section-head').forEach((row) => {
    row.addEventListener('click', () => {
      const index = Number(row.dataset.section);
      if (isProof) {
        selectSection(index);
        return;
      }
      if (state.sectionIndex === index && state.expanded.has(index)) {
        state.expanded.delete(index);
      } else {
        state.expanded.add(index);
        selectSection(index);
      }
      renderTree();
    });
  });

  $$('.tree-shot').forEach((row) => {
    row.addEventListener('click', () => {
      const sectionIndex = Number(row.dataset.section);
      state.sectionIndex = sectionIndex;
      state.shotIndex = Number(row.dataset.shot);
      state.expanded.add(sectionIndex);
      stopPlayback();
      renderWorkspace();
    });
  });
}

function selectSection(index) {
  if (index < 0 || index >= state.chapter.sections.length) return;
  state.sectionIndex = index;
  state.shotIndex = 0;
  state.currentTime = 0;
  state.expanded.add(index);
  stopPlayback();
  renderWorkspace();
}

function renderMode() {
  $$('.mode-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.mode === state.mode));
  $('#proofMode').hidden = state.mode !== 'proof';
  $('#scriptMode').hidden = state.mode !== 'script';
  $('#assemblyMode').hidden = state.mode !== 'assembly';
  $('#exportMode').hidden = state.mode !== 'export';
  if (state.mode === 'proof') renderProof();
  if (state.mode === 'script') renderScript();
  if (state.mode === 'assembly') renderAssembly();
}

function escapeHtml(text) {
  const node = document.createElement('div');
  node.textContent = text;
  return node.innerHTML;
}

function displayDiffText(text) {
  return String(text).replaceAll(' ', '␠').replaceAll('\n', '↵');
}

function revisedProofText(section) {
  let text = section.proofText;
  section.proofIssues.forEach((issue) => {
    if (issue.status === 'accepted') text = text.replaceAll(issue.before, issue.after);
  });
  return text;
}

function renderProofDocument(section) {
  const issues = section.proofIssues;
  return section.proofText.split('\n').map((paragraph) => {
    if (state.proofView === 'original') return `<p>${escapeHtml(paragraph)}</p>`;
    let html = escapeHtml(paragraph);
    issues.forEach((issue) => {
      if (issue.status === 'kept') return;
      const before = escapeHtml(issue.before);
      const after = escapeHtml(issue.after);
      if (!html.includes(before)) return;
      if (issue.status === 'accepted') {
        html = html.replace(before, state.proofView === 'compare' ? `<del>${before}</del><ins>${after}</ins>` : after);
      } else if (state.proofView === 'compare') {
        html = html.replace(before, `<span class="proof-suggest" data-issue="${issue.id}">${before}</span>`);
      }
    });
    return `<p>${html}</p>`;
  }).join('');
}

function renderProof() {
  const section = currentSection();
  const issues = section.proofIssues;
  const open = issues.filter((issue) => issue.status === 'open');
  const statusLabel = section.proofStatus === 'final' ? '已定稿' : section.proofStatus === 'review' ? '待确认' : '未处理';
  $('#proofKicker').textContent = `第 ${state.episode?.no || 1} 集 / ${state.chapter.no} / ${section.code}`;
  $('#proofTitle').textContent = section.title;
  $('#proofStatus').textContent = statusLabel;
  $('#proofStatus').className = `status-badge ${section.proofStatus === 'final' ? 'is-done' : section.proofStatus === 'review' ? 'is-active' : 'is-todo'}`;
  $('#proofMeta').textContent = issues.length ? `${issues.length} 处修改 · ${open.length} 项待处理` : '尚未检查本节文稿';
  $('#proofPaperTitle').textContent = `${section.code} ${section.title}`;
  $('#completeProofBtn').textContent = section.proofStatus === 'final' ? '本节已定稿' : '完成本节 →';
  $('#completeProofBtn').disabled = section.proofStatus === 'final';
  $('#checkProofBtn').textContent = issues.length ? '重新检查' : '检查本节';
  $('#proofDocument').innerHTML = renderProofDocument(section);
  $$('.proof-view').forEach((button) => button.classList.toggle('is-active', button.dataset.view === state.proofView));
  $$('.proof-suggest').forEach((suggest) => {
    suggest.addEventListener('click', () => showToast('在右侧修改清单里采用或保留这一条'));
  });
}

function checkProofSection() {
  const section = currentSection();
  if (!section.proofIssues.length) {
    const issues = detectProofIssues(section.proofText);
    if (!issues.length) {
      section.proofStatus = 'final';
      renderWorkspace();
      saveProjects();
      showToast('没有发现基础错误，本节已标记为定稿');
      return;
    }
    section.proofIssues = issues;
    section.proofStatus = 'review';
    renderWorkspace();
    saveProjects();
    showToast(`检查完成：发现 ${section.proofIssues.length} 处基础问题`);
  } else {
    showToast(`本节已有 ${section.proofIssues.length} 处修改`);
  }
}

function acceptSafeProof() {
  const section = currentSection();
  section.proofIssues.forEach((issue) => {
    if (issue.safe && issue.status === 'open') issue.status = 'accepted';
  });
  renderWorkspace();
  saveProjects();
  showToast('安全项已采用');
}

function acceptProofIssue(id) {
  const section = currentSection();
  const issue = section.proofIssues.find((item) => item.id === id);
  if (!issue) return;
  issue.status = 'accepted';
  renderWorkspace();
  saveProjects();
}

function keepProofIssue(id) {
  const section = currentSection();
  const issue = section.proofIssues.find((item) => item.id === id);
  if (!issue) return;
  issue.status = 'kept';
  renderWorkspace();
  saveProjects();
}

function completeProofSection() {
  const section = currentSection();
  if (section.proofStatus === 'final') {
    showToast('本节文稿已经定稿');
    return;
  }
  const openReview = section.proofIssues.filter((issue) => issue.status === 'open' && !issue.safe);
  if (openReview.length) {
    showToast(`还有 ${openReview.length} 项需确认：先采用或保留`);
    return;
  }
  section.proofIssues.forEach((issue) => { if (issue.status === 'open') issue.status = 'accepted'; });
  section.proofStatus = 'final';
  const next = state.chapter.sections[state.sectionIndex + 1];
  if (next) {
    state.sectionIndex += 1;
    state.shotIndex = 0;
    showToast(`「${section.code} ${section.title}」文稿已定稿，下一节：${next.code} ${next.title}`);
  } else {
    showToast('本章最后一节已定稿');
  }
  renderWorkspace();
  saveProjects();
}

function renderScript() {
  const section = currentSection();
  const bound = section.shots.filter((shot) => shot.status === 'done').length;
  const proofLocked = section.proofStatus !== 'final';
  $('#scriptProofNotice').hidden = !proofLocked;
  $('#regenSectionBtn').disabled = proofLocked;
  $('#scriptKicker').textContent = `第 ${state.episode?.no || 1} 集 / ${state.chapter.no} / ${section.code}`;
  $('#scriptTitle').textContent = section.title;
  $('#scriptStatus').textContent = section.status === 'done' ? '已完成' : section.status === 'active' ? '进行中' : '未开始';
  $('#scriptStatus').className = `status-badge ${section.status === 'done' ? 'is-done' : section.status === 'active' ? 'is-active' : 'is-todo'}`;
  $('#scriptMeta').textContent = `${section.shots.length} 镜 · ${formatTime(sectionDuration(section))} · 已配 ${bound}/${section.shots.length} 镜`;
  $('#scriptChars').textContent = `约 ${section.text.replace(/\s/g, '').length} 字`;
  $('#scriptText').innerHTML = section.text.split('\n').map((paragraph) => `<p>${paragraph}</p>`).join('');
  $('#tableCount').textContent = `${section.shots.length} 行`;
  $('#shotTableBody').innerHTML = section.shots.map((shot, index) => `
    <tr class="${index === state.shotIndex ? 'is-active' : ''}" data-shot-row="${index}">
      <td class="num">${pad(shot.no)}</td>
      <td>${shot.duration}s</td>
      <td class="desc">${shot.visual}</td>
      <td>${shot.type}</td>
      <td class="state ${shot.status === 'done' ? 'done' : 'todo'}">${shot.status === 'done' ? '已配' : '待配'}</td>
    </tr>
  `).join('');
  $$('#shotTableBody tr').forEach((row) => {
    row.addEventListener('click', () => {
      state.shotIndex = Number(row.dataset.shotRow);
      state.mode = 'assembly';
      renderWorkspace();
    });
  });
  $('#copySectionBtn').onclick = () => copyText(section.text);
  $('#regenSectionBtn').onclick = () => showToast(`本地演示：只重拆「${section.title}」这一节（不会真调用 AI）`);
}

function applyPlayerSize() {
  const wrap = $('#playerWrap');
  const frame = $('#playerFrame');
  const stage = $('#playerCanvas');
  if (!wrap || !frame || !stage) return;
  const [ratio, resolution] = state.playerSize.split('|');
  const [rw, rh] = ratio.split(':').map(Number);
  const center = $('#assemblyMode');
  const maxW = Math.max(220, (center?.clientWidth || 760) - 40);
  const maxH = window.innerHeight <= 850 ? 300 : 380;
  if (!maxW) {
    requestAnimationFrame(applyPlayerSize);
    return;
  }
  let width = maxW;
  let height = width * rh / rw;
  if (height > maxH) {
    height = maxH;
    width = height * rw / rh;
  }
  wrap.style.width = `${Math.floor(width)}px`;
  stage.style.height = `${Math.floor(height)}px`;
  frame.style.width = '100%';
  frame.style.height = '100%';
  const meta = $('#playerSizeMeta');
  if (meta) meta.textContent = `${ratio} · ${resolution}`;
}

function renderAssembly() {
  const section = currentSection();
  const shot = currentShot();
  const duration = sectionDuration(section);
  $('#sizeSelect').value = state.playerSize;
  $('#assemblyKicker').textContent = `第 ${state.episode?.no || 1} 集 / ${state.chapter.no} / ${section.code}`;
  $('#assemblyTitle').textContent = section.title;
  $('#assemblyStatus').textContent = section.status === 'done' ? '已完成' : section.status === 'active' ? '进行中' : '未开始';
  $('#assemblyStatus').className = `status-badge ${section.status === 'done' ? 'is-done' : section.status === 'active' ? 'is-active' : 'is-todo'}`;
  $('#playerFrame').innerHTML = sceneSvg(shot.type);
  $('#playerBadge').textContent = `镜头 ${pad(shot.no)} / ${section.shots.length}`;
  $('#playerVisual').textContent = shot.visual;
  applyPlayerSize();
  $('#timelineMeta').textContent = `${section.shots.length} 镜 · ${formatTime(duration)}`;
  $('#timelineSectionName').textContent = `${section.code} ${section.title}`;
  $('#timelineTrack').innerHTML = section.shots.map((item, index) => `
    <button class="timeline-clip ${index === state.shotIndex ? 'is-active' : ''}" data-shot="${index}" style="width:${Math.max(62, item.duration * 4.4)}px">
      <strong>${pad(item.no)}</strong>
      <span>${item.type} · ${item.duration}s</span>
    </button>
  `).join('');
  const marks = [0, Math.round(duration * .33), Math.round(duration * .66), duration];
  $('#timelineRuler').innerHTML = marks.map((value) => `<span style="left:${(value / duration) * 100}%">${formatTime(value)}</span>`).join('');
  $$('.timeline-clip').forEach((clip) => {
    clip.addEventListener('click', () => {
      state.shotIndex = Number(clip.dataset.shot);
      state.currentTime = section.shots.slice(0, state.shotIndex).reduce((sum, item) => sum + item.duration, 0);
      stopPlayback();
      renderWorkspace();
    });
  });
  updatePlaybackUI();
  $('#playBtn').onclick = togglePlayback;
}

function updatePlaybackUI() {
  const section = currentSection();
  const total = sectionDuration(section);
  $('#playerTime').textContent = `${formatTime(state.currentTime)} / ${formatTime(total)}`;
  $('#playerProgress').style.width = `${Math.min(100, (state.currentTime / total) * 100)}%`;
}

function togglePlayback() {
  if (state.playing) { stopPlayback(); return; }
  state.playing = true;
  const section = currentSection();
  const total = sectionDuration(section);
  if (state.currentTime >= total) state.currentTime = 0;
  state.playTimer = setInterval(() => {
    state.currentTime += .25;
    if (state.currentTime >= total) {
      state.currentTime = total;
      updatePlaybackUI();
      stopPlayback();
      showToast('本节预演结束');
      return;
    }
    updatePlaybackUI();
    let cursor = 0;
    let nextIndex = 0;
    section.shots.forEach((shot, index) => {
      if (state.currentTime >= cursor) nextIndex = index;
      cursor += shot.duration;
    });
    if (nextIndex !== state.shotIndex) {
      state.shotIndex = nextIndex;
      renderWorkspace();
    }
  }, 250);
}

function stopPlayback() {
  if (state.playTimer) clearInterval(state.playTimer);
  state.playTimer = null;
  state.playing = false;
}

function renderRight() {
  const section = currentSection();
  const shot = currentShot();
  if (state.mode === 'proof') {
    const issues = section.proofIssues;
    const open = issues.filter((issue) => issue.status === 'open');
    const safeOpen = open.filter((issue) => issue.safe);
    const reviewOpen = open.filter((issue) => !issue.safe);
    const statusLabel = section.proofStatus === 'final' ? '已定稿' : section.proofStatus === 'review' ? '待确认' : '未处理';
    const issueHtml = (issue) => `<div class="proof-issue">
      <div class="proof-issue-top"><span class="proof-issue-type">${issue.type}</span><span class="muted">${issue.safe ? '安全项' : '需确认'}</span></div>
      <div class="proof-issue-reason">${issue.reason}</div>
      <div class="proof-issue-diff"><del>${escapeHtml(displayDiffText(issue.before))}</del> → <ins>${escapeHtml(displayDiffText(issue.after))}</ins></div>
      <div class="proof-issue-actions"><button class="btn btn-soft" data-accept="${issue.id}">采用</button><button class="btn btn-ghost" data-keep="${issue.id}">保留原句</button></div>
    </div>`;
    $('#rightPanel').innerHTML = `
      <div class="right-section">
        <div class="panel-kicker">PROOFREADING</div>
        <h3 class="panel-title">文稿处理</h3>
        <div class="proof-right-stats">
          <div class="proof-right-stat"><small>状态</small><strong>${statusLabel}</strong></div>
          <div class="proof-right-stat"><small>修改</small><strong>${issues.length}</strong></div>
          <div class="proof-right-stat"><small>待处理</small><strong>${open.length}</strong></div>
          <div class="proof-right-stat"><small>已处理</small><strong>${issues.length - open.length}</strong></div>
        </div>
        <button class="btn btn-soft proof-accept-all" id="acceptSafeBtn" ${safeOpen.length ? '' : 'disabled'}>接受全部安全项（${safeOpen.length}）</button>
        ${issues.length ? `
          ${safeOpen.length ? `<div class="proof-issue-group"><div class="proof-issue-group-head"><strong>安全项</strong><span>${safeOpen.length} 处</span></div>${safeOpen.map(issueHtml).join('')}</div>` : ''}
          ${reviewOpen.length ? `<div class="proof-issue-group"><div class="proof-issue-group-head"><strong>需确认</strong><span>${reviewOpen.length} 处</span></div>${reviewOpen.map(issueHtml).join('')}</div>` : ''}
          ${!open.length ? '<div class="proof-protect">这一节的修改已经处理完，可以定稿。</div>' : ''}
        ` : '<div class="proof-protect">还没有检查这一节。点「检查本节」开始基础校订。</div>'}
        <button class="btn btn-primary proof-complete" id="proofCompleteRight">${section.proofStatus === 'final' ? '本节已定稿' : '完成本节并进入下一节'}</button>
        <div class="proof-protect"><strong>保护词：</strong>专名 / 人名 / 发音保护词。只改错别字、标点、空格、重复和明显病句。</div>
      </div>`;
    $('#acceptSafeBtn').addEventListener('click', acceptSafeProof);
    $('#proofCompleteRight').addEventListener('click', completeProofSection);
    $$('[data-accept]').forEach((button) => button.addEventListener('click', () => acceptProofIssue(button.dataset.accept)));
    $$('[data-keep]').forEach((button) => button.addEventListener('click', () => keepProofIssue(button.dataset.keep)));
    return;
  }

  if (state.mode === 'script') {
    const bound = section.shots.filter((item) => item.status === 'done').length;
    const next = state.chapter.sections[state.sectionIndex + 1];
    $('#rightPanel').innerHTML = `
      <div class="right-section">
        <div class="panel-kicker">SECTION WORK</div>
        <h3 class="panel-title">本节工作</h3>
        <div class="stat-grid">
          <div class="stat"><small>镜头</small><strong>${section.shots.length}</strong></div>
          <div class="stat"><small>预计时长</small><strong>${formatTime(sectionDuration(section))}</strong></div>
          <div class="stat"><small>已配画面</small><strong>${bound}/${section.shots.length}</strong></div>
          <div class="stat"><small>状态</small><strong>${section.status === 'done' ? '完成' : section.status === 'active' ? '进行中' : '未开始'}</strong></div>
        </div>
        <div class="section-progress">
          <div class="progress-bar"><i style="width:${Math.round((bound / section.shots.length) * 100)}%"></i></div>
          <div class="progress-label"><span>${section.code} ${section.title}</span><span>${Math.round((bound / section.shots.length) * 100)}%</span></div>
        </div>
        <button class="btn btn-primary complete-btn" id="completeSectionBtn" ${section.proofStatus !== 'final' ? 'disabled' : ''}>${section.proofStatus !== 'final' ? '先完成文稿处理' : section.status === 'done' ? '本节已完成' : '完成本节，进入下一节'}</button>
        <div class="next-line">${next ? `下一节：${next.code} ${next.title}` : '这是本章最后一节'}</div>
      </div>
      <div class="right-section">
        <div class="panel-kicker">EXCEL</div>
        <h3 class="panel-title">工作簿对应</h3>
        <p class="section-mini">章节 sheet：<strong>01 第一章</strong></p>
        <p class="section-mini">整节文案：<strong>已保留</strong></p>
        <div class="excel-note">本节的整节文案和镜头表会在同一个 sheet 里；小节用带颜色的标题行隔开，方便复制和筛选。</div>
        <button class="btn btn-soft" style="width:100%;height:34px;margin-top:9px" id="copyFromRight">复制本节文案</button>
      </div>`;
    $('#completeSectionBtn').addEventListener('click', completeCurrentSection);
    $('#copyFromRight').addEventListener('click', () => copyText(section.text));
    return;
  }

  if (state.mode === 'assembly') {
    const bound = section.shots.filter((item) => item.status === 'done').length;
    const candidates = candidateMap[shot.type];
    $('#rightPanel').innerHTML = `
      <div class="right-section">
        <div class="panel-kicker">SHOT SUGGESTION</div>
        <h3 class="panel-title">镜头 ${pad(shot.no)}</h3>
        <div class="suggestion-top"><span class="suggestion-no">${section.code} / 镜 ${pad(shot.no)}</span><span class="suggestion-type">${shot.type}</span></div>
        <div class="suggestion-duration"><span>建议时长</span><strong>${shot.duration}s</strong></div>
        <p class="suggestion-desc">${shot.visual}</p>
        <div class="candidate-list">
          ${candidates.map((candidate, index) => `<button class="candidate" data-candidate="${index}"><span class="candidate-thumb">${sceneSvg(shot.type)}</span><span class="candidate-copy"><strong>${candidate}</strong><small>${index === 0 ? '本地素材 · 可优先使用' : '候选素材 · 需确认授权'}</small></span><span class="candidate-mark">${index === 0 ? '推荐' : '＋'}</span></button>`).join('')}
        </div>
        <div class="source-line"><span>来源 / 授权</span><strong>本地素材库 · 待确认</strong></div>
        <div class="right-actions"><button class="btn btn-soft" id="adoptBtn">采用建议</button><button class="btn btn-ghost" id="refreshBtn">换一组</button></div>
      </div>
      <div class="right-section">
        <div class="panel-kicker">SECTION PROGRESS</div>
        <h3 class="panel-title">本节完成度</h3>
        <div class="section-progress"><div class="progress-bar"><i style="width:${Math.round((bound / section.shots.length) * 100)}%"></i></div><div class="progress-label"><span>${bound}/${section.shots.length} 镜已配</span><span>${Math.round((bound / section.shots.length) * 100)}%</span></div></div>
        <button class="btn btn-primary complete-btn" id="completeSectionBtn" ${section.proofStatus !== 'final' ? 'disabled' : ''}>${section.proofStatus !== 'final' ? '先完成文稿处理' : section.status === 'done' ? '本节已完成' : '完成本节，进入下一节'}</button>
      </div>`;
    $('#adoptBtn').addEventListener('click', () => {
      shot.status = 'done';
      shot.material = candidates[0];
      section.status = section.shots.every((item) => item.status === 'done') ? 'done' : 'active';
      renderWorkspace();
      saveProjects();
      showToast(`已采用「${candidates[0]}」，镜头 ${pad(shot.no)} 标记为已配`);
    });
    $('#refreshBtn').addEventListener('click', () => showToast('本地演示：换一组候选素材还没有接入'));
    $$('.candidate').forEach((candidate) => candidate.addEventListener('click', () => {
      showToast(`演示：选中「${candidates[Number(candidate.dataset.candidate)]}」`);
    }));
    $('#completeSectionBtn').addEventListener('click', completeCurrentSection);
    return;
  }

  const done = doneSections();
  const total = state.chapter.sections.length;
  const shotsDone = doneShots();
  $('#rightPanel').innerHTML = `
    <div class="right-section">
      <div class="panel-kicker">EXPORT STATUS</div>
      <h3 class="panel-title">本集交付</h3>
      <div class="stat-grid">
        <div class="stat"><small>小节</small><strong>${done}/${total}</strong></div>
        <div class="stat"><small>镜头</small><strong>${shotsDone}/${totalShots()}</strong></div>
      </div>
      <div class="section-progress"><div class="progress-bar"><i style="width:${Math.round((shotsDone / totalShots()) * 100)}%"></i></div><div class="progress-label"><span>本集素材覆盖</span><span>${Math.round((shotsDone / totalShots()) * 100)}%</span></div></div>
      <p class="next-line">建议先导出 Excel 工作簿，再导出素材包。不要等全片结束才导出。</p>
    </div>
    <div class="right-section">
      <div class="panel-kicker">MILESTONE</div>
      <h3 class="panel-title">完成本集</h3>
      <p class="next-line">完成 18 个小节后，本集可以单独导出，并进入下一集。系列进度也会前进一格。</p>
      <button class="btn btn-soft complete-btn" id="finishEpisodeBtn">标记本集完成（演示）</button>
    </div>`;
  $('#finishEpisodeBtn').addEventListener('click', () => {
    showToast(`演示：本集完成 ${doneSections()}/${state.chapter.sections.length} 节，还不能真正交付`);
  });
}

function addSection() {
  const index = state.chapter.sections.length;
  const title = `新小节 ${index + 1}`;
  const shots = Array.from({ length: 3 }, (_, i) => {
    const type = types[i % types.length];
    return {
      id: `${index + 1}-${i + 1}`,
      no: i + 1,
      duration: 15,
      type,
      visual: `${title}：${visualPhrases[i % visualPhrases.length]}`,
      material: '',
      status: 'todo',
    };
  });
  state.chapter.sections.push({
    index,
    code: `1.${index + 1}`,
    title,
    status: 'pending',
    duration: shots.reduce((sum, shot) => sum + shot.duration, 0),
    shots,
    proofStatus: 'unprocessed',
    proofIssues: [],
    proofText: `这是「${title}」这一节的演示文案。`,
    text: [
      `这是「${title}」这一节的演示文案。`,
      '新增小节后，镜头表、时长和文案都会出现在同一个工作区里。',
      '后续可以把它写回同一个 Excel sheet，并按小节标题行分组。',
    ].join('\n'),
  });
  state.sectionIndex = index;
  state.shotIndex = 0;
  state.expanded.add(index);
  renderWorkspace();
  saveProjects();
  showToast(`已新增「${title}」，可以在左侧继续编辑`);
}

function completeCurrentSection() {
  const section = currentSection();
  if (section.proofStatus !== 'final') {
    showToast('先到「文稿处理」完成本节定稿');
    return;
  }
  if (section.status === 'done') {
    showToast('本节已经完成');
    return;
  }
  section.status = 'done';
  section.shots.forEach((shot) => {
    shot.status = 'done';
    shot.material = shot.material || candidateMap[shot.type][0];
  });
  const next = state.chapter.sections[state.sectionIndex + 1];
  if (next) {
    state.sectionIndex += 1;
    state.shotIndex = 0;
    state.currentTime = 0;
    state.expanded.add(state.sectionIndex);
    showToast(`「${section.code} ${section.title}」完成，下一节：${next.code} ${next.title}`);
  } else {
    showToast('本章最后一节完成');
  }
  stopPlayback();
  renderWorkspace();
  saveProjects();
}

/* ---------------- theme ---------------- */
function applyTheme(theme) {
  const next = ['white', 'gray', 'dark'].includes(theme) ? theme : 'white';
  document.body.dataset.theme = next;
  $$('.theme-dot').forEach((dot) => dot.classList.toggle('is-active', dot.dataset.theme === next));
  try { localStorage.setItem('storyboard-demo-theme', next); } catch {}
}

/* ---------------- events ---------------- */
function bindEvents() {
  $('#brandHome').addEventListener('click', (event) => { event.preventDefault(); backToProjects(); });
  $('#backToSeries').addEventListener('click', backToSeries);
  $('#backToProjectsBtn').addEventListener('click', backToProjects);
  $('#newProjectBtn').addEventListener('click', openNewProject);
  $('#newProjectBack').addEventListener('click', backToProjects);
  $('#newProjectCreate').addEventListener('click', createProjectFromForm);
  $('#newProjectSample').addEventListener('click', () => {
    $('#newProjectName').value = '新项目：示例文稿';
    $('#newProjectScript').value = `这是原始文稿的第一段，里面有一些基础错误。\n这一节  的文字中间多了空格，需要处理。\n整段文案最后多了一个英文句号.\n这一节还没有拆分镜头，先处理文稿，再设计镜头表。`;
    updateNewProjectCount();
  });
  $('#newProjectFile').addEventListener('click', () => $('#newProjectFileInput').click());
  $('#newProjectFileInput').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $('#newProjectName').value = file.name.replace(/\.(txt|md)$/i, '') || '未命名项目';
      $('#newProjectScript').value = String(reader.result || '');
      updateNewProjectCount();
      showToast(`已读取 ${file.name}`);
    };
    reader.onerror = () => showToast('文件读取失败');
    reader.readAsText(file, 'utf-8');
  });
  $('#newProjectScript').addEventListener('input', updateNewProjectCount);
  $('#renameProjectBtn').addEventListener('click', renameCurrentProject);
  $('#continueBtn').addEventListener('click', openWorkspace);
  $$('.theme-dot').forEach((dot) => dot.addEventListener('click', () => applyTheme(dot.dataset.theme)));
  $('#seriesHelp').addEventListener('click', () => showToast('顺序：项目 → 系列 → 第1集 → 第一章 → 小节 → 镜头；先完成一小节'));
  $('#helpBtn').addEventListener('click', () => showToast('这是本地界面演示：一集 = 项目，章 = Excel sheet，小节 = 工作单元'));
  $('#exportWorkbook').addEventListener('click', () => showToast('本地演示：导出 00 总览 + 本集章节 sheet（尚未写入文件）'));
  $('#sheetOverview').addEventListener('click', () => showToast('00 总览在 Excel 工作簿里：系列 / 每集 / 每章进度'));
  $('#newChapterSheet').addEventListener('click', () => showToast('本地演示：新增章 sheet 还没有接入；一个 sheet 对应一个大章'));
  $('#sheetChapter').addEventListener('click', () => showToast('当前打开：第一章（1 个 chapter sheet）'));
  $('#addSectionBtn').addEventListener('click', addSection);
  $('#exportNowBtn').addEventListener('click', () => {
    showToast(`已准备导出（演示）：${$('.export-card.is-selected strong')?.textContent || '本集初稿'}`);
  });
  $('#exportCsvBtn').addEventListener('click', downloadProjectCsv);
  $$('.export-card').forEach((card) => card.addEventListener('click', () => {
    $$('.export-card').forEach((item) => item.classList.toggle('is-selected', item === card));
  }));
  $$('.mode-tab').forEach((tab) => tab.addEventListener('click', () => {
    state.mode = tab.dataset.mode;
    stopPlayback();
    renderWorkspace();
  }));
  $$('.proof-view').forEach((button) => button.addEventListener('click', () => {
    state.proofView = button.dataset.view;
    renderProof();
  }));
  $('#checkProofBtn').addEventListener('click', checkProofSection);
  $('#completeProofBtn').addEventListener('click', completeProofSection);
  $('#copyProofBtn').addEventListener('click', () => copyText(revisedProofText(currentSection())));
  $$('#treeFilter .filter-chip').forEach((chip) => chip.addEventListener('click', () => {
    state.filter = chip.dataset.filter;
    $$('#treeFilter .filter-chip').forEach((item) => item.classList.toggle('is-active', item === chip));
    renderTree();
  }));
  $$('.scope-chip').forEach((chip) => chip.addEventListener('click', () => {
    $$('.scope-chip').forEach((item) => item.classList.toggle('is-active', item === chip));
    showToast(`播放范围：${chip.textContent}（演示）`);
  }));
  $('#prevSectionBtn').addEventListener('click', () => selectSection(state.sectionIndex - 1));
  $('#nextSectionBtn').addEventListener('click', () => selectSection(state.sectionIndex + 1));
  $('#sizeSelect').addEventListener('change', (event) => {
    state.playerSize = event.target.value;
    if (state.mode === 'assembly') renderWorkspace();
    const [ratio, resolution] = state.playerSize.split('|');
    showToast(`播放器尺寸：${ratio} · ${resolution}`);
  });
  window.addEventListener('resize', () => {
    if (state.mode === 'assembly') applyPlayerSize();
  });
  document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    if (event.code === 'Space' && state.mode === 'assembly') {
      event.preventDefault();
      togglePlayback();
    }
  });
}

let initialTheme = 'white';
try { initialTheme = localStorage.getItem('storyboard-demo-theme') || 'white'; } catch {}
applyTheme(initialTheme);
renderProjectPage();
bindEvents();
