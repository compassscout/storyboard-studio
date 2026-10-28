/* 分镜台 Studio v0.3 — 制作台原型交互层
   纯静态、无依赖。小节状态一律由 scriptDone / shotsConfirmed / 素材缺口派生。 */
(function () {
  'use strict';

  const DB = window.STUDIO_DB;
  if (!DB) return;
  const project = DB.project;
  const sections = project.sections;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  /* ---------- inline lucide icons (no external deps) ---------- */
  const ICONS = {
    'plus': '<path d="M5 12h14M12 5v14"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'file-plus': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6M12 12v6"/>',
    'file-input': '<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m5 12-3 3 3 3M2 15h10"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
    'package': '<path d="M11 21.7a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7z"/><path d="M12 22V12"/><path d="m3.3 7 7.7 4.4a2 2 0 0 0 2 0L20.7 7"/><path d="m7.5 4.3 9 5.2"/>',
    'play': '<path d="M6 3.5 20 12 6 20.5z"/>',
    'pause': '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'alert': '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4M12 17h.01"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    'pen': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    'grip': '<circle cx="9" cy="6" r="1.1"/><circle cx="9" cy="12" r="1.1"/><circle cx="9" cy="18" r="1.1"/><circle cx="15" cy="6" r="1.1"/><circle cx="15" cy="12" r="1.1"/><circle cx="15" cy="18" r="1.1"/>',
    'trash': '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M10 11v6M14 11v6"/>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'undo': '<path d="M3 3v5h5"/><path d="M3 8a9 9 0 1 0 2.6-4.6L3 6"/>',
    'copy': '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    'film': '<rect x="2" y="2" width="20" height="20" rx="2.2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',
    'image': '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>'
  };
  function icon(name, size) {
    const s = size || 16;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || '') + '</svg>';
  }
  function fillIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = icon(el.getAttribute('data-icon'));
    });
  }

  /* ---------- state ---------- */
  const state = {
    activeId: 's3',
    step: 1,
    filter: 'all',
    query: '',
    activeIssue: null,
    editing: false,
    draftText: '',
    activeShot: null,
    story: { i: 0, playing: false, timer: null },
    exportSel: null,
    toastTimer: null,
    undo: null
  };

  /* ---------- derived ---------- */
  const current = () => sections.find((s) => s.id === state.activeId) || sections[0];
  const sectionDuration = (s) => s.shots.reduce((n, k) => n + (Number(k.duration) || 0), 0);
  const openIssues = (s) => (s.issues || []).filter((i) => i.status === 'open');
  const missingAssets = (s) => s.shots.filter((k) => k.assetStatus === 'todo' || k.assetStatus === 'candidate');
  const statusOf = (s) => {
    if (!s.scriptDone) return openIssues(s).length ? 'proof' : 'draft';
    if (!s.shotsConfirmed) return 'shots';
    if (missingAssets(s).length) return 'assets';
    return 'ready';
  };
  const STATUS = {
    draft: { label: '草稿', tone: 'draft' },
    proof: { label: '待定稿', tone: 'warn' },
    shots: { label: '待确认分镜', tone: 'warn' },
    assets: { label: '待补素材', tone: 'warn' },
    ready: { label: '可交付', tone: 'ok' }
  };
  function projectStats() {
    const all = { total: sections.length, ready: 0, shots: 0, missing: 0, doneScripts: 0, confirmed: 0 };
    sections.forEach((s) => {
      const st = statusOf(s);
      if (st === 'ready') all.ready += 1;
      if (s.scriptDone) all.doneScripts += 1;
      if (s.shotsConfirmed) all.confirmed += 1;
      all.shots += s.shots.length;
      all.missing += missingAssets(s).length;
    });
    return all;
  }
  const charsOf = (text) => (text || '').replace(/\s/g, '').length;
  const secondsOfText = (text) => Math.max(1, Math.round(charsOf(text) / 4.2));
  const fmtClock = (sec) => {
    const s = Math.max(0, Math.round(sec || 0));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const fmtSrt = (sec) => {
    const ms = Math.max(0, Math.round((sec || 0) * 1000));
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' +
      String(s).padStart(2, '0') + ',' + String(ms % 1000).padStart(3, '0');
  };

  /* ---------- text checks (real, deterministic) ---------- */
  function scanIssues(text) {
    const out = [];
    const push = (type, before, after, reason, safe) => {
      if (out.length >= 12) return;
      out.push({ id: 'x' + (out.length + 1), type, safe, before, after, reason, status: 'open' });
    };
    let m;
    const period = /(\d)\.(?![0-9.])/g;
    while ((m = period.exec(text)) && out.length < 12) {
      push('标点', m[1] + '.', m[1] + '。', '英文句号应改成中文句号', true);
    }
    const space = /([\u4e00-\u9fa5])[ \t]{2,}([\u4e00-\u9fa5])/g;
    while ((m = space.exec(text)) && out.length < 12) {
      push('空格', m[1] + '  ' + m[2], m[1] + m[2], '中文句子中多了连续空格', true);
    }
    const dup = /([\u4e00-\u9fa5]{2})\1/g;
    while ((m = dup.exec(text)) && out.length < 12) {
      push('重复', m[1] + m[1], m[1], '疑似重复用词，请确认是否保留强调语气', false);
    }
    return out;
  }

  /* ---------- deterministic frame artwork (no external images) ---------- */
  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 9973;
    return h;
  }
  function frameSVG(shot) {
    const type = (shot && shot.type) || '空镜';
    const seed = hashStr((shot && ((shot.id || '') + (shot.visual || ''))) || 'frame');
    const j = seed % 9;
    const accent = '#b0522f';
    const sand = '#c9a98a';
    let art = '';
    if (type === '图表') {
      const bars = [26, 40, 33, 54, 47, 66].map((h, i) =>
        '<rect x="' + (30 + i * 17) + '" y="' + (72 - h - j * 0.4) + '" width="10" height="' + (h + j * 0.4) +
        '" rx="1.5" fill="' + (i === 5 ? accent : sand) + '" opacity="' + (i === 5 ? '.9' : '.42') + '"/>').join('');
      art = '<path d="M22 74h120" stroke="' + sand + '" stroke-width=".8" opacity=".4"/>' +
        '<path d="M24 30 44 24 70 34 96 18 118 26 140 12" fill="none" stroke="' + accent + '" stroke-width="1.2" opacity=".75"/>' + bars;
    } else if (type === '地图') {
      art = '<g stroke="' + sand + '" stroke-width=".5" opacity=".28"><path d="M0 22h160M0 45h160M0 68h160M30 0v90M70 0v90M110 0v90M145 0v90"/></g>' +
        '<path d="M14 66c22-8 30-24 48-22s22 14 38 10 26-16 46-12" fill="none" stroke="' + sand + '" stroke-width="1.1" opacity=".8"/>' +
        '<circle cx="' + (100 + j) + '" cy="' + (35 + j % 5) + '" r="3" fill="' + accent + '"/>' +
        '<circle cx="' + (100 + j) + '" cy="' + (35 + j % 5) + '" r="8" fill="none" stroke="' + accent + '" opacity=".45"/>';
    } else if (type === '人物') {
      art = '<circle cx="80" cy="36" r="14" fill="' + sand + '" opacity=".55"/>' +
        '<path d="M52 82c3-18 13-26 28-26s25 8 28 26z" fill="' + sand + '" opacity=".38"/>' +
        '<rect x="0" y="0" width="160" height="90" fill="' + accent + '" opacity=".08"/>';
    } else if (type === '档案') {
      art = '<g fill="' + sand + '" opacity=".5"><rect x="46" y="24" width="42" height="50" rx="1.5" transform="rotate(-4 46 24)"/><rect x="72" y="18" width="44" height="52" rx="1.5" opacity=".7"/></g>' +
        '<g stroke="#17120e" stroke-width="1" opacity=".55"><path d="M80 30h28M80 37h22M80 44h28M80 51h16M54 36h26M54 43h20M54 50h26M54 57h14"/></g>';
    } else if (type === '情景再现') {
      art = '<path d="M0 90 58 12h44L160 90z" fill="' + accent + '" opacity=".16"/>' +
        '<path d="M34 90 76 26M126 90 90 26" stroke="' + sand + '" stroke-width=".8" opacity=".5"/>' +
        '<circle cx="' + (70 + j) + '" cy="' + (30 + j % 6) + '" r="2.2" fill="' + sand + '"/>';
    } else if (type === '遗址') {
      art = '<g fill="#2a2118"><rect x="18" y="44" width="24" height="34"/><rect x="48" y="34" width="20" height="44"/><rect x="74" y="50" width="30" height="28"/><rect x="110" y="26" width="18" height="52"/></g>' +
        '<path d="M0 78h160" stroke="' + sand + '" stroke-width=".9" opacity=".55"/>' +
        '<path d="M128 26v-16h16M136 10v8" stroke="' + accent + '" stroke-width="1" fill="none"/>' +
        '<circle cx="' + (120 + j) + '" cy="18" r="6" fill="' + sand + '" opacity=".3"/>';
    } else {
      art = '<path d="M0 66 34 42 58 58 86 30 112 54 138 38 160 58v32H0z" fill="#2a2118"/>' +
        '<path d="M0 74h160" stroke="' + sand + '" stroke-width=".7" opacity=".4"/>' +
        '<circle cx="' + (112 + j) + '" cy="24" r="7" fill="' + sand + '" opacity=".28"/>';
    }
    return '<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(type) + ' 画面示意">' +
      '<rect width="160" height="90" fill="#17120e"/>' + art +
      '<rect x=".5" y=".5" width="159" height="89" fill="none" stroke="#3a2c20" stroke-width=".8"/></svg>';
  }

  /* ---------- toast ---------- */
  function toast(msg, actionLabel, action) {
    const box = $('toast');
    $('toastMsg').textContent = msg;
    const btn = $('toastAction');
    if (actionLabel && action) {
      btn.hidden = false;
      btn.textContent = actionLabel;
      btn.onclick = () => {
        action();
        hideToast();
      };
    } else {
      btn.hidden = true;
      btn.onclick = null;
    }
    box.hidden = false;
    announce(msg);
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(hideToast, 4200);
  }
  function hideToast() {
    $('toast').hidden = true;
    clearTimeout(state.toastTimer);
  }
  function announce(msg) {
    const el = $('srAnnounce');
    if (el) el.textContent = msg;
  }
  function flashSaved() {
    const el = $('saveState');
    el.classList.add('is-saving');
    $('saveLabel').textContent = '保存中…';
    setTimeout(() => {
      el.classList.remove('is-saving');
      $('saveLabel').textContent = '已保存';
    }, 480);
  }
  function snapshot(s) {
    return JSON.parse(JSON.stringify({
      text: s.text, issues: s.issues, scriptDone: s.scriptDone, shotsConfirmed: s.shotsConfirmed, shots: s.shots
    }));
  }
  function restore(s, snap) {
    s.text = snap.text;
    s.issues = snap.issues;
    s.scriptDone = snap.scriptDone;
    s.shotsConfirmed = snap.shotsConfirmed;
    s.shots = snap.shots;
  }

  /* ---------- topbar / queue ---------- */
  function renderTopbar() {
    const st = projectStats();
    $('crumbProject').textContent = project.title;
    $('topProgress').textContent = st.missing
      ? st.ready + '/' + st.total + ' 可交付 · ' + st.missing + ' 镜缺素材'
      : st.ready + '/' + st.total + ' 可交付 · 素材齐全';
    if (!$('saveState').classList.contains('is-saving')) $('saveLabel').textContent = '已保存';
  }

  function matches(s) {
    const q = state.query.trim().toLowerCase();
    if (q && !((s.title + ' ' + s.text).toLowerCase().includes(q))) return false;
    const st = statusOf(s);
    if (state.filter === 'todo') return st !== 'ready';
    if (state.filter === 'ready') return st === 'ready';
    return true;
  }

  function renderQueue() {
    const st = projectStats();
    $('queueCount').textContent = sections.length + ' 节';
    $('countAll').textContent = st.total;
    $('countTodo').textContent = st.total - st.ready;
    $('countReady').textContent = st.ready;
    $('queueFilters').querySelectorAll('.chip').forEach((chip) => {
      chip.classList.toggle('is-active', chip.dataset.filter === state.filter);
    });

    const list = sections.filter(matches);
    if (!list.length) {
      $('sectionList').innerHTML = '<div class="queue-empty">没有匹配的小节。<br>换个关键词，或切换筛选。</div>';
      return;
    }
    let html = '<div class="chapter-label">' + esc(project.chapter) + '</div>';
    list.forEach((s) => {
      const idx = sections.indexOf(s) + 1;
      const stat = STATUS[statusOf(s)];
      const issues = openIssues(s).length;
      const miss = missingAssets(s).length;
      const dur = sectionDuration(s);
      const tone = stat.tone === 'ok' ? 'tone-ok' : stat.tone === 'warn' ? 'tone-warn' : '';
      const sub = issues ? issues + ' 条校对' : miss ? miss + ' 镜缺素材' : s.shots.length + ' 镜';
      let badges = s.scriptDone
        ? '<span class="mini-badge is-ok">' + icon('check', 10) + '配音稿</span>'
        : '<span class="mini-badge is-draft">' + icon('lock', 10) + '配音稿</span>';
      if (s.shotsConfirmed) {
        badges += '<span class="mini-badge is-ok">' + icon('check', 10) + '分镜</span>';
      } else if (s.scriptDone) {
        badges += '<span class="mini-badge is-warn">' + icon('alert', 10) + '待确认分镜</span>';
      }
      if (miss) badges += '<span class="mini-badge is-warn">' + icon('image', 10) + miss + ' 缺素材</span>';
      html += '<button class="section-row' + (s.id === state.activeId ? ' is-active' : '') + '" data-id="' + s.id +
        '" draggable="true" style="--i:' + idx + '" aria-current="' + (s.id === state.activeId) + '">' +
        '<span class="drag-handle" aria-hidden="true">' + icon('grip', 13) + '</span>' +
        '<span class="sec-index">' + String(idx).padStart(2, '0') + '</span>' +
        '<span class="sec-main"><span class="sec-title">' + esc(s.title) + '</span>' +
        '<span class="sec-meta"><i class="dot ' + tone + '"></i>' + stat.label + '<i class="dot"></i>' + esc(sub) + '</span>' +
        '<span class="sec-badges">' + badges + '</span></span>' +
        '<span class="sec-duration">' + (dur ? dur + 's' : '—') + '</span></button>';
    });
    $('sectionList').innerHTML = html;
  }

  /* ---------- stage header / stepper ---------- */
  function renderHeader() {
    const s = current();
    const idx = sections.indexOf(s) + 1;
    const miss = missingAssets(s).length;
    const stat = STATUS[statusOf(s)];
    $('sectionKicker').textContent = project.chapter + ' / ' + String(idx).padStart(2, '0');
    $('crumbSection').textContent = '第 ' + String(idx).padStart(2, '0') + ' 节';
    $('sectionTitle').textContent = s.title;
    const pill = $('sectionStatus');
    pill.textContent = stat.label;
    pill.className = 'status-pill tone-' + stat.tone;
    const dur = sectionDuration(s);
    const timeText = (dur ? dur + 's' : '约 ' + secondsOfText(s.text) + 's') + ' / 目标 ' + s.target + 's';
    const shotText = s.shots.length ? s.shots.length + ' 镜' : '还没拆分镜';
    $('sectionMeta').textContent = timeText + ' · ' + shotText +
      (miss ? ' · ' + miss + ' 镜缺素材' : s.shots.length ? ' · 素材齐全' : '');

    const hints = ['点击高亮，右侧查看修改', '改动镜头后需要重新确认', '缺素材不阻塞交付，只做提示'];
    $('editHint').textContent = hints[state.step - 1];

    const s1done = s.scriptDone;
    const s2done = s.scriptDone && s.shotsConfirmed;
    const s3done = statusOf(s) === 'ready';
    $('stepper').querySelectorAll('.step').forEach((btn) => {
      const n = Number(btn.dataset.step);
      const done = n === 1 ? s1done : n === 2 ? s2done : s3done;
      const locked = n === 2 ? !s1done : n === 3 ? !s2done : false;
      btn.classList.toggle('is-current', n === state.step);
      btn.classList.toggle('is-done', done && n !== state.step);
      btn.classList.toggle('is-locked', locked);
      const box = btn.querySelector('.step-state');
      box.innerHTML = done ? icon('check', 14) : locked ? icon('lock', 12) : '';
    });
  }

  function canOpenStep(n) {
    const s = current();
    if (n === 2 && !s.scriptDone) return '先完成配音稿定稿，再拆分镜。';
    if (n === 3 && !s.shotsConfirmed) return '先确认这一节的镜头，再看素材与交付。';
    return '';
  }

  /* ---------- step 1: script ---------- */
  function paperHTML(s) {
    const used = {};
    return s.text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => {
      let html = esc(p);
      openIssues(s).forEach((issue) => {
        if (used[issue.id]) return;
        const before = esc(issue.before);
        const at = html.indexOf(before);
        if (at < 0) return;
        used[issue.id] = true;
        const cls = 'issue-mark' + (issue.type === '空格' ? ' is-space' : '') +
          (state.activeIssue === issue.id ? ' is-active' : '');
        html = html.slice(0, at) + '<button type="button" class="' + cls + '" data-act="issue-focus" data-id="' +
          esc(issue.id) + '" title="' + esc(issue.reason) + '">' + before + '</button>' +
          html.slice(at + before.length);
      });
      return '<p>' + html + '</p>';
    }).join('');
  }

  function renderStep1(s) {
    const idx = sections.indexOf(s) + 1;
    const issues = openIssues(s);
    const safe = issues.filter((i) => i.safe).length;
    const chars = charsOf(s.text);
    const est = secondsOfText(s.text);
    let html = '';
    if (!state.editing && issues.length) {
      html += '<div class="notice">' + icon('alert', 14) + '<div><strong>还有 ' + issues.length +
        ' 条待处理</strong>：' + safe + ' 条是安全项可直接采用，' + (issues.length - safe) +
        ' 条需要你判断是否保留。点正文高亮或右侧卡片查看。</div></div>';
    }
    html += '<div class="doc-toolbar"><div class="doc-title">' + icon('file-text', 15) +
      '<strong>配音稿</strong><small>' + s.text.split(/\n{2,}/).filter((p) => p.trim()).length +
      ' 段 · ' + chars + ' 字 · 约 ' + est + 's</small></div><div class="doc-actions">' +
      '<button class="btn btn-soft btn-sm" data-act="copy-script">' + icon('copy', 14) + '复制配音稿</button>' +
      (state.editing
        ? ''
        : '<button class="btn btn-soft btn-sm" data-act="edit-script">' + icon('pen', 14) + '编辑正文</button>') +
      '</div></div>';

    if (state.editing) {
      html += '<div class="edit-area-wrap"><textarea class="edit-area" id="editArea" spellcheck="false">' +
        esc(state.draftText) + '</textarea><div class="edit-actions">' +
        '<span class="edit-note">保存后会回到「待定稿」，已确认的分镜需要重新确认。</span>' +
        '<button class="btn btn-soft btn-sm" data-act="cancel-edit">取消</button>' +
        '<button class="btn btn-primary btn-sm" data-act="save-script">保存修改</button></div></div>';
    } else {
      html += '<div class="paper"><div class="paper-head"><span>SCRIPT · 第 ' + String(idx).padStart(2, '0') +
        ' 节</span><span class="paper-stamp">' + (s.scriptDone ? '已定稿' : '待定稿') + '</span></div>' +
        '<div class="paper-text">' + paperHTML(s) + '</div>' +
        '<div class="paper-foot"><span class="word-count">' + chars + ' 字 · 约 ' + est + 's</span>' +
        '<span>目标 ' + s.target + 's · 保护词 ' + project.protectionWords.length + ' 个</span></div></div>';
    }
    return html;
  }

  /* ---------- step 2: shots ---------- */
  const SHOT_TYPES = ['遗址', '档案', '人物', '地图', '图表', '情景再现', '空镜'];
  const ASSET_LABEL = { todo: '未找到', candidate: '候选素材', ready: '已下载', licensed: '已授权' };
  const findShot = (id) => current().shots.find((k) => k.id === id);

  function renderStep2(s) {
    const dur = sectionDuration(s);
    const over = dur > s.target;
    const pct = Math.min(100, s.target ? Math.round(dur / s.target * 100) : 0);
    const miss = missingAssets(s).length;
    let html = '<div class="shots-card"><div class="shots-head"><div><h2>镜头表<small>' +
      s.shots.length + ' 镜 · ' + dur + 's</small></h2></div><div class="shots-actions">' +
      '<button class="btn btn-soft btn-sm" data-act="story-open">' + icon('play', 13) + '故事板</button>' +
      '<button class="btn btn-soft btn-sm" data-act="add-shot">' + icon('plus', 13) + '添加镜头</button>' +
      (s.shotsConfirmed
        ? '<button class="btn btn-soft btn-sm" disabled>' + icon('check', 13) + '已确认</button>'
        : '<button class="btn btn-primary btn-sm" data-act="confirm-shots"' +
          (s.shots.length ? '' : ' disabled') + '>确认分镜</button>') +
      '</div></div>';

    if (!s.shots.length) {
      html += '<div class="empty-card"><div class="empty-icon">' + icon('film', 22) + '</div><strong>还没有镜头</strong>' +
        '<p>先把这一节的配音稿拆成可以拍的镜头。每镜写清画面，再决定素材从哪里来。</p>' +
        '<button class="btn btn-soft btn-sm" data-act="add-shot">' + icon('plus', 13) + '添加第一个镜头</button></div></div>';
      return html;
    }

    html += '<div class="shot-table-wrap"><table class="shot-table"><thead><tr><th>镜号</th><th>画面建议</th>' +
      '<th class="col-duration">时长(s)</th><th class="col-type">类型</th><th class="col-asset">素材文件</th>' +
      '<th class="col-actions"></th></tr></thead><tbody>';
    s.shots.forEach((k, i) => {
      const active = state.activeShot === k.id;
      const options = SHOT_TYPES.map((t) => '<option value="' + t + '"' + (t === k.type ? ' selected' : '') + '>' + t + '</option>').join('');
      html += '<tr class="' + (active ? 'is-active' : '') + '"><td class="shot-no">' + String(i + 1).padStart(2, '0') + '</td>' +
        '<td><input class="cell-input" data-shot="' + k.id + '" data-field="visual" value="' + esc(k.visual) +
        '" placeholder="这镜拍什么？"></td>' +
        '<td><input class="cell-duration" type="number" min="1" max="120" step="1" data-shot="' + k.id +
        '" data-field="duration" value="' + (k.duration || 0) + '"></td>' +
        '<td><select class="type-select" data-shot="' + k.id + '" data-field="type">' + options + '</select></td>' +
        '<td><div class="asset-line"><i class="asset-dot ' + k.assetStatus + '"></i>' +
        '<input class="asset-name" data-shot="' + k.id + '" data-field="assetName" value="' + esc(k.assetName) +
        '" placeholder="文件名 / 占位"></div></td>' +
        '<td><button class="row-delete" data-act="shot-delete" data-id="' + k.id + '" title="删除这一镜" aria-label="删除镜头 ' +
        (i + 1) + '">' + icon('trash', 13) + '</button></td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div class="shots-summary"><div class="time-budget"><span>时长预算</span><span class="time-bar">' +
      '<i class="' + (over ? 'is-over' : '') + '" style="width:' + pct + '%"></i></span><span>' + dur + 's / ' + s.target + 's</span></div>' +
      '<span class="summary-spacer"></span><span class="summary-note">' + (miss ? miss + ' 镜缺素材' : '素材已齐') + '</span></div></div>';
    return html;
  }

  /* ---------- step 3: assets ---------- */
  const ASSET_STATES = ['todo', 'candidate', 'ready', 'licensed'];

  function renderStep3(s) {
    const dur = sectionDuration(s);
    const ready = s.shots.filter((k) => k.assetStatus === 'ready' || k.assetStatus === 'licensed').length;
    const miss = missingAssets(s).length;
    let html = '<div class="asset-summary">' +
      '<span class="stat-line">镜头 <strong>' + s.shots.length + '</strong></span>' +
      '<span class="stat-line">已就绪 <strong>' + ready + '</strong></span>' +
      '<span class="stat-line' + (miss ? ' is-warn' : '') + '">缺素材 <strong>' + miss + '</strong></span>' +
      '<span class="stat-line">总时长 <strong>' + dur + 's</strong></span></div>';

    if (!s.shots.length) {
      html += '<div class="empty-card"><div class="empty-icon">' + icon('film', 22) + '</div>' +
        '<strong>还没有镜头，也就没有素材清单</strong><p>回到「分镜」把这一节拆成镜头，素材会在这里逐条出现。</p>' +
        '<button class="btn btn-soft btn-sm" data-act="goto-step" data-step="2">' + icon('arrow-left', 13) + '回到分镜</button></div>';
      return html;
    }

    html += '<div class="asset-grid">';
    s.shots.forEach((k, i) => {
      const isMiss = k.assetStatus === 'todo' || k.assetStatus === 'candidate';
      const options = ASSET_STATES.map((v) => '<option value="' + v + '"' + (v === k.assetStatus ? ' selected' : '') + '>' +
        ASSET_LABEL[v] + '</option>').join('');
      const hint = k.assetStatus === 'todo' ? '还没有素材，可以只记一个占位文件名'
        : k.assetStatus === 'candidate' ? '候选素材，还需要确认授权与画质'
        : k.assetStatus === 'ready' ? '已下载，等待入轨'
        : '已授权，可以直接使用';
      html += '<article class="asset-card' + (isMiss ? ' is-missing' : '') + '" data-card="' + k.id +
        '" style="--i:' + i + '">' +
        '<div class="asset-thumb">' + frameSVG(k) + '<span class="thumb-tag">SHOT ' +
        String(i + 1).padStart(2, '0') + ' · ' + esc(k.type) + '</span></div>' +
        '<div class="asset-body"><div class="asset-topline"><span class="asset-shot">镜 ' + String(i + 1).padStart(2, '0') +
        ' · ' + (k.duration || 0) + 's</span><span class="asset-shot">' + ASSET_LABEL[k.assetStatus] + '</span></div>' +
        '<div class="asset-title">' + esc(k.visual || '（还没有写画面建议）') + '</div>' +
        '<div class="asset-controls"><select class="asset-status ' + (isMiss ? 'is-missing' : 'is-ready') +
        '" data-shot="' + k.id + '" data-field="assetStatus">' + options + '</select>' +
        '<input class="asset-name-full" data-shot="' + k.id + '" data-field="assetName" value="' + esc(k.assetName) +
        '" placeholder="文件名"></div>' +
        '<div class="asset-hint' + (isMiss ? ' is-warn' : '') + '">' + (isMiss ? icon('alert', 11) : icon('check', 11)) +
        hint + '</div></div></article>';
    });
    html += '</div>';
    return html;
  }

  /* ---------- inspector ---------- */
  function protectionBlock() {
    return '<div class="inspector-section"><div class="inspector-section-label"><span>保护词</span><strong>' +
      project.protectionWords.length + ' 个</strong></div><div class="protect-list">' +
      project.protectionWords.map((w) => '<span class="protect-pill">' + icon('check', 9) + esc(w) + '</span>').join('') +
      '</div><p class="inspector-sub" style="margin:7px 0 0">校对和导出都不会改动这些词。</p></div>';
  }

  function issueCard(issue) {
    return '<div class="issue-card' + (state.activeIssue === issue.id ? ' is-focused' : '') + '">' +
      '<div class="issue-topline"><span class="issue-type">' + esc(issue.type) + '</span><span class="issue-tag ' +
      (issue.safe ? 'safe">安全' : 'review">需判断') + '</span></div>' +
      '<p class="issue-reason">' + esc(issue.reason) + '</p>' +
      '<div class="issue-diff"><del>' + esc(issue.before) + '</del> → <ins>' + esc(issue.after) + '</ins></div>' +
      '<div class="issue-actions"><button class="btn btn-primary btn-sm" data-act="issue-adopt" data-id="' +
      issue.id + '">采用</button><button class="btn btn-ghost btn-sm" data-act="issue-keep" data-id="' +
      issue.id + '">保留原样</button></div></div>';
  }

  function missingList(s) {
    const miss = missingAssets(s);
    if (!miss.length) {
      return '<div class="missing-empty">' + icon('check-circle', 13) + '这一节没有素材缺口。</div>';
    }
    return '<div class="missing-list">' + miss.map((k) => '<button class="missing-item" data-act="jump-asset" data-id="' +
      k.id + '"><i class="dot"></i><span>镜 ' + String(s.shots.indexOf(k) + 1).padStart(2, '0') + ' · ' +
      esc(k.visual.slice(0, 16) || '（无画面建议）') + '</span><strong>' + (k.assetStatus === 'todo' ? '未找到' : '候选') +
      '</strong></button>').join('') + '</div>';
  }

  function inspectorScript(s) {
    const issues = openIssues(s);
    let html = '<h3 class="inspector-title">校对与定稿</h3><p class="inspector-sub">原型只提示字句问题，不会自动改你的稿子。采用建议才会改正文。</p>';
    if (issues.length) {
      const safe = issues.filter((i) => i.safe).length;
      html += '<div class="inspector-section"><div class="inspector-section-label"><span>待处理</span><strong>' +
        issues.length + ' 条</strong></div>' + issues.map(issueCard).join('');
      if (safe) {
        html += '<button class="btn btn-soft btn-sm btn-block" data-act="adopt-safe">' + icon('check', 13) +
          '采用全部安全项（' + safe + '）</button>';
      }
      html += '</div>';
    } else {
      html += '<div class="inspector-section"><div class="inspector-section-label"><span>校对</span><strong>通过</strong></div>' +
        '<div class="check-row"><span class="check-icon">' + icon('check-circle', 14) +
        '</span><span>没有发现标点、连续空格或重复用词问题。</span></div></div>';
    }
    const sec = secondsOfText(s.text);
    html += '<div class="inspector-section"><div class="inspector-section-label"><span>脚本检查</span></div>' +
      '<div class="check-row"><span class="check-icon">' + icon('check-circle', 14) + '</span><span>' +
      s.text.split(/\n{2,}/).filter((p) => p.trim()).length + ' 个段落，结构没有被改动。</span></div>' +
      '<div class="check-row' + (sec > s.target ? ' is-warn' : '') + '"><span class="check-icon">' +
      icon(sec > s.target ? 'alert' : 'check-circle', 14) + '</span><span>约 <strong>' + sec + 's</strong> / 目标 ' +
      s.target + 's' + (sec > s.target ? '，读起来可能偏长。' : '。') + '</span></div></div>';
    return html + protectionBlock();
  }

  function inspectorShots(s) {
    const dur = sectionDuration(s);
    const miss = missingAssets(s).length;
    const noVisual = s.shots.filter((k) => !k.visual.trim()).length;
    let html = '<h3 class="inspector-title">分镜检查</h3><p class="inspector-sub">镜头是配音稿的画面拆解。改动任何一镜，都需要重新确认。</p>' +
      '<div class="stat-grid"><div class="stat-box"><small>镜头</small><strong>' + s.shots.length + '</strong></div>' +
      '<div class="stat-box"><small>总时长</small><strong>' + dur + 's</strong></div></div>';
    html += '<div class="inspector-section"><div class="inspector-section-label"><span>预算</span><strong>' +
      s.target + 's</strong></div><div class="mini-bar"><i style="width:' + Math.min(100, Math.round(dur / s.target * 100)) +
      '%"></i></div><p class="inspector-sub" style="margin-bottom:0">' + (dur > s.target ? '超出目标 ' + (dur - s.target) +
      's，可以删镜或缩短单镜。' : '还剩 ' + (s.target - dur) + 's 余量。') + '</p></div>';
    html += '<div class="inspector-section"><div class="inspector-section-label"><span>检查</span></div>' +
      '<div class="check-row' + (noVisual ? ' is-warn' : '') + '"><span class="check-icon">' +
      icon(noVisual ? 'alert' : 'check-circle', 14) + '</span><span>' +
      (noVisual ? noVisual + ' 镜还没有写画面建议。' : '每一镜都写了画面建议。') + '</span></div>' +
      '<div class="check-row' + (miss ? ' is-warn' : '') + '"><span class="check-icon">' +
      icon(miss ? 'alert' : 'check-circle', 14) + '</span><span>' +
      (miss ? miss + ' 镜还是候选或没有素材。' : '所有镜头都有可用素材。') + '</span></div></div>';
    html += '<div class="inspector-section"><div class="inspector-section-label"><span>素材缺口</span><strong>' +
      miss + '</strong></div>' + missingList(s) + '</div>';
    return html + protectionBlock();
  }

  function inspectorAssets(s) {
    const ready = s.shots.filter((k) => k.assetStatus === 'ready' || k.assetStatus === 'licensed').length;
    const miss = missingAssets(s).length;
    let html = '<h3 class="inspector-title">交付检查</h3><p class="inspector-sub">素材缺口会在交付包里列清楚，但不会阻止你导出。</p>' +
      '<div class="stat-grid"><div class="stat-box"><small>已就绪</small><strong>' + ready + '</strong></div>' +
      '<div class="stat-box"><small>缺素材</small><strong>' + miss + '</strong></div></div>';
    html += '<div class="inspector-section"><div class="inspector-section-label"><span>这一节</span></div>' +
      '<div class="check-row"><span class="check-icon">' + icon('check-circle', 14) + '</span><span>配音稿已定稿。</span></div>' +
      '<div class="check-row"><span class="check-icon">' + icon('check-circle', 14) + '</span><span>镜头已确认，共 ' +
      s.shots.length + ' 镜 / ' + sectionDuration(s) + 's。</span></div>' +
      '<div class="check-row' + (miss ? ' is-warn' : '') + '"><span class="check-icon">' +
      icon(miss ? 'alert' : 'check-circle', 14) + '</span><span>' +
      (miss ? '还有 <strong>' + miss + '</strong> 镜缺素材，会写进素材清单。' : '素材齐全。') + '</span></div></div>';
    html += '<div class="inspector-section"><div class="inspector-section-label"><span>缺口清单</span><strong>' +
      miss + '</strong></div>' + missingList(s) + '</div>';
    return html + protectionBlock();
  }

  function renderInspector(s) {
    const issues = openIssues(s).length;
    const miss = missingAssets(s).length;
    $('inspectorBadge').textContent = state.step === 1 ? issues + ' 条校对'
      : state.step === 2 ? s.shots.length + ' 镜' : miss + ' 缺素材';
    $('inspectorBody').innerHTML = state.step === 1 ? inspectorScript(s)
      : state.step === 2 ? inspectorShots(s) : inspectorAssets(s);
  }

  /* ---------- next card ---------- */
  function renderNext(s) {
    let kicker = 'NEXT';
    let text = '';
    let btn = '';
    if (state.step === 1) {
      if (state.editing) {
        text = '正在编辑正文。保存后才会离开编辑状态。';
        btn = '<button class="btn btn-primary" disabled>先保存正文</button>';
      } else if (!s.scriptDone) {
        const left = openIssues(s).length;
        text = left ? '还有 <strong>' + left + ' 条校对</strong>。定稿不会自动改字，未处理的建议会保留。'
          : '这一节的配音稿可以定稿了。定稿后才能拆镜头。';
        btn = '<button class="btn btn-primary" data-act="finish-script">完成配音稿</button>';
      } else {
        text = '配音稿已定稿。下一步把这一节拆成可拍的镜头。';
        btn = '<button class="btn btn-primary" data-act="goto-step" data-step="2">下一步：分镜</button>';
      }
    } else if (state.step === 2) {
      if (!s.scriptDone) {
        text = '配音稿还没有定稿，分镜暂时锁住。';
        btn = '<button class="btn btn-primary" disabled>' + icon('lock', 14) + '先定稿配音稿</button>';
      } else if (!s.shots.length) {
        text = '还没有镜头。先加一镜，再确认分镜。';
        btn = '<button class="btn btn-primary" data-act="add-shot">添加第一个镜头</button>';
      } else if (!s.shotsConfirmed) {
        text = '共 <strong>' + s.shots.length + ' 镜 · ' + sectionDuration(s) + 's</strong>。确认后才能进入素材与交付。';
        btn = '<button class="btn btn-primary" data-act="confirm-shots">确认分镜</button>';
      } else {
        text = '分镜已确认。下一步核对素材缺口，生成交付包。';
        btn = '<button class="btn btn-primary" data-act="goto-step" data-step="3">下一步：素材与交付</button>';
      }
    } else {
      const miss = missingAssets(s).length;
      text = miss ? '还有 <strong>' + miss + ' 镜缺素材</strong>。缺口会写进素材清单，不会阻止导出。'
        : '这一节的素材齐全，可以生成交付包了。';
      btn = '<button class="btn btn-primary" data-act="export-open">' + icon('package', 14) + '打开交付包</button>';
    }
    $('nextCard').innerHTML = '<div class="next-kicker">' + kicker + '</div><p class="next-text">' + text + '</p>' + btn;
  }

  function render() {
    const s = current();
    renderTopbar();
    renderQueue();
    renderHeader();
    $('stepContent').innerHTML = state.step === 1 ? renderStep1(s)
      : state.step === 2 ? renderStep2(s) : renderStep3(s);
    renderInspector(s);
    renderNext(s);
    if (state.editing) {
      const ta = $('editArea');
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }
  }

  /* ---------- delivery package ---------- */
  const csvCell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const csvOf = (rows) => '\ufeff' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

  function scriptTxt() {
    const lines = [project.title, project.kind + ' · ' + project.chapter, '目标时长 ' + project.target + 's', ''];
    sections.forEach((s, i) => {
      lines.push('## ' + String(i + 1).padStart(2, '0') + ' ' + s.title);
      lines.push(s.text);
      lines.push('');
    });
    return lines.join('\r\n');
  }
  function shotsCSV() {
    const rows = [['小节', '镜号', '时长(秒)', '画面建议', '类型', '素材状态', '素材文件']];
    sections.forEach((s) => s.shots.forEach((k, i) => {
      rows.push([s.title, i + 1, k.duration, k.visual, k.type, ASSET_LABEL[k.assetStatus], k.assetName]);
    }));
    return csvOf(rows);
  }
  function assetsCSV() {
    const rows = [['小节', '镜号', '画面建议', '素材状态', '素材文件', '缺口说明']];
    sections.forEach((s) => s.shots.forEach((k, i) => {
      const miss = k.assetStatus === 'todo' ? '未找到素材' : k.assetStatus === 'candidate' ? '候选素材待确认' : '';
      rows.push([s.title, i + 1, k.visual, ASSET_LABEL[k.assetStatus], k.assetName, miss]);
    }));
    return csvOf(rows);
  }
  function srtOf() {
    const out = [];
    let t = 0;
    let n = 1;
    sections.forEach((s) => s.shots.forEach((k) => {
      const d = Number(k.duration) || 0;
      out.push(n, fmtSrt(t) + ' --> ' + fmtSrt(t + d), (k.visual || s.title), '');
      t += d;
      n += 1;
    }));
    return out.join('\r\n');
  }
  function exportFiles() {
    return [
      { id: 'script', name: '配音稿.txt', label: '配音稿', desc: '全部小节正文，按小节分段', mime: 'text/plain;charset=utf-8', content: scriptTxt() },
      { id: 'shots', name: '分镜表.csv', label: '分镜表', desc: '镜号、时长、画面、类型、素材状态', mime: 'text/csv;charset=utf-8', content: shotsCSV() },
      { id: 'assets', name: '素材清单.csv', label: '素材清单', desc: '素材文件与缺口说明，可直接交给剪辑', mime: 'text/csv;charset=utf-8', content: assetsCSV() },
      { id: 'srt', name: '字幕.srt', label: '字幕 SRT', desc: '按镜头时长顺序生成的时间轴', mime: 'text/plain;charset=utf-8', content: srtOf() },
      { id: 'json', name: '项目数据.json', label: '项目数据', desc: '完整结构化备份，可再次导入', mime: 'application/json', content: JSON.stringify(project, null, 2) }
    ];
  }
  function fmtBytes(n) {
    return n > 1024 ? (n / 1024).toFixed(1) + ' KB' : n + ' B';
  }
  function initExportSel() {
    if (state.exportSel) return;
    state.exportSel = {};
    exportFiles().forEach((f) => { state.exportSel[f.id] = true; });
  }

  function renderExport() {
    const st = projectStats();
    const totalSec = sections.reduce((n, s) => n + sectionDuration(s), 0);
    const checks = [
      { ok: st.doneScripts === st.total, text: '配音稿定稿 <strong>' + st.doneScripts + '/' + st.total + '</strong> 节' + (st.doneScripts === st.total ? '。' : '，未定稿的小节会标注在文件里。') },
      { ok: st.confirmed === st.total, text: '分镜确认 <strong>' + st.confirmed + '/' + st.total + '</strong> 节' },
      { ok: st.missing === 0, text: st.missing ? '仍有 <strong>' + st.missing + '</strong> 镜缺素材，已写入素材清单。' : '所有镜头都有可用素材。' },
      { ok: true, text: '保护词 <strong>' + project.protectionWords.length + '</strong> 个，导出不改写正文。' },
      { ok: true, text: '全片镜头总时长 <strong>' + totalSec + 's</strong>。' }
    ];
    $('exportChecks').innerHTML = checks.map((c) => '<div class="check-row' + (c.ok ? '' : ' is-warn') + '">' +
      '<span class="check-icon">' + icon(c.ok ? 'check-circle' : 'alert', 14) + '</span><span>' + c.text + '</span></div>').join('');

    initExportSel();
    $('exportFiles').innerHTML = exportFiles().map((f) => {
      const bytes = new TextEncoder().encode(f.content).length;
      return '<label class="file-option"><input type="checkbox" data-file="' + f.id + '"' +
        (state.exportSel[f.id] ? ' checked' : '') + '><span class="file-copy"><strong>' + esc(f.label) +
        '</strong><small>' + esc(f.name) + ' · ' + esc(f.desc) + '</small></span><span class="file-size">' +
        fmtBytes(bytes) + '</span></label>';
    }).join('');
    updateGenerateBtn();
  }
  function updateGenerateBtn() {
    const any = Object.keys(state.exportSel || {}).some((k) => state.exportSel[k]);
    $('generateBtn').disabled = !any;
  }

  /* store-mode zip writer (no dependencies) */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let j = 0; j < 8; j += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zipStore(files) {
    const enc = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    const date = 33; // 1980-01-01
    const time = 0;
    files.forEach((f) => {
      const name = enc.encode(f.name);
      const data = enc.encode(f.content);
      const crc = crc32(data);
      const local = new Uint8Array(30 + name.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, time, true);
      lv.setUint16(12, date, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, name.length, true);
      lv.setUint16(28, 0, true);
      local.set(name, 30);
      chunks.push(local, data);

      const cen = new Uint8Array(46 + name.length);
      const cv = new DataView(cen.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, time, true);
      cv.setUint16(14, date, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, name.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      cen.set(name, 46);
      central.push(cen);
      offset += local.length + data.length;
    });
    const cenSize = central.reduce((n, c) => n + c.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cenSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);
    return new Blob(chunks.concat(central, [eocd]), { type: 'application/zip' });
  }
  function saveBlob(blob, name) {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1200);
  }

  function generatePackage() {
    initExportSel();
    const picked = exportFiles().filter((f) => state.exportSel[f.id]);
    if (!picked.length) {
      toast('至少勾选一个文件。');
      return;
    }
    const blob = zipStore(picked);
    const slug = project.title.replace(/[\\/:*?"<>|\s]+/g, '_');
    saveBlob(blob, slug + '_交付包.zip');
    const res = $('exportResult');
    res.innerHTML = icon('check-circle', 14) + '已生成 ' + picked.length + ' 个文件 · ' + fmtBytes(blob.size) + '，下载已开始。';
    res.classList.add('is-visible');
    toast('交付包已生成：' + picked.length + ' 个文件。');
  }

  /* ---------- storyboard preview ---------- */
  function renderStory() {
    const s = current();
    const shots = s.shots;
    if (!shots.length) return;
    const i = Math.max(0, Math.min(state.story.i, shots.length - 1));
    state.story.i = i;
    const k = shots[i];
    $('storyStage').innerHTML = frameSVG(k);
    $('storyNo').textContent = '镜 ' + String(i + 1).padStart(2, '0') + ' / ' + String(shots.length).padStart(2, '0');
    $('storyVisual').textContent = k.visual || '（没有画面建议）';
    $('storyDuration').textContent = (k.duration || 0) + 's';
    $('storyStrip').innerHTML = shots.map((x, n) =>
      '<button class="story-chip' + (n === i ? ' is-active' : '') + '" data-act="story-jump" data-i="' + n +
      '" aria-label="跳到镜头 ' + (n + 1) + '">' + frameSVG(x) + '<span>镜 ' + String(n + 1).padStart(2, '0') + '</span></button>').join('');
    const before = shots.slice(0, i).reduce((n, x) => n + (Number(x.duration) || 0), 0);
    $('storyTime').textContent = fmtClock(before) + ' / ' + fmtClock(sectionDuration(s));
    const slot = $('storyPlay').querySelector('.icon-slot');
    if (slot) slot.innerHTML = icon(state.story.playing ? 'pause' : 'play');
    $('storyPlayLabel').textContent = state.story.playing ? '暂停' : '播放故事板';
  }
  function openStory() {
    if (!current().shots.length) {
      toast('这一节还没有镜头，先在「分镜」里添加。');
      return;
    }
    state.story.i = 0;
    state.story.playing = false;
    $('storyOverlay').hidden = false;
    renderStory();
  }
  function stopStory() {
    state.story.playing = false;
    clearInterval(state.story.timer);
    state.story.timer = null;
  }
  function toggleStory() {
    if (state.story.playing) {
      stopStory();
      renderStory();
      return;
    }
    if (current().shots.length < 2) {
      toast('只有一镜，不需要播放。');
      return;
    }
    state.story.playing = true;
    renderStory();
    state.story.timer = setInterval(() => {
      if (state.story.i >= current().shots.length - 1) {
        stopStory();
        renderStory();
        return;
      }
      state.story.i += 1;
      renderStory();
    }, 1500);
  }
  function closeStory() {
    stopStory();
    $('storyOverlay').hidden = true;
    $('storyboardBtn').focus();
  }

  /* ---------- import / split ---------- */
  function autoTitle(text) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return '未命名小节';
    const first = (clean.match(/^[^。！？!?]+/) || [clean])[0].trim();
    const cut = first.length > 16 ? first.slice(0, 16) + '…' : first;
    return cut || '未命名小节';
  }
  function splitScript(text) {
    const t = String(text || '').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').trim();
    if (!t) return [];
    const lines = t.split('\n');
    const hasHeading = lines.some((l) => /^#{1,3}\s+\S/.test(l));
    if (hasHeading) {
      const parts = [];
      let cur = { title: '', body: [] };
      lines.forEach((l) => {
        const m = l.match(/^#{1,3}\s+(.+)$/);
        if (m) {
          if (cur.title || cur.body.join('').trim()) parts.push(cur);
          cur = { title: m[1].trim(), body: [] };
        } else {
          cur.body.push(l);
        }
      });
      if (cur.title || cur.body.join('').trim()) parts.push(cur);
      return parts.map((p) => {
        const body = p.body.join('\n').trim();
        return { title: p.title || autoTitle(body), text: body };
      }).filter((p) => p.text);
    }
    const blocks = t.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    if (blocks.length > 1) return blocks.map((b) => ({ title: autoTitle(b), text: b }));
    const sents = blocks[0].match(/[^。！？!?]*[。！？!?]|[^。！？!?]+$/g) || [blocks[0]];
    const chunks = [];
    let buf = '';
    sents.forEach((sent) => {
      if (buf && (buf + sent).length > 420) {
        chunks.push(buf);
        buf = sent;
      } else {
        buf += sent;
      }
    });
    if (buf) chunks.push(buf);
    return (chunks.length > 1 ? chunks : blocks).map((b) => ({ title: autoTitle(b), text: b.trim() }));
  }
  function demoText() {
    return sections.map((s) => '## ' + s.title + '\n\n' + s.text).join('\n\n');
  }
  function renderSplit() {
    const parts = splitScript($('importText').value);
    $('splitCount').textContent = parts.length + ' 节';
    $('splitList').innerHTML = parts.length
      ? parts.map((p, i) => '<div class="split-item"><span class="split-no">' + String(i + 1).padStart(2, '0') +
        '</span><span class="split-title">' + esc(p.title) + '</span><span class="split-size">' +
        charsOf(p.text) + ' 字</span></div>').join('')
      : '<div class="split-empty">粘贴文稿后，这里会预览自动分节结果。支持 ## 小标题，也支持按空行分节。</div>';
    $('importCreate').disabled = !parts.length || !$('importName').value.trim();
  }
  function openImport() {
    $('importOverlay').hidden = false;
    if (!$('importText').value.trim()) {
      $('importName').value = '未命名项目';
    }
    renderSplit();
    setTimeout(() => $('importName').focus(), 60);
  }
  function closeImport() {
    $('importOverlay').hidden = true;
    $('newProjectBtn').focus();
  }
  function createProject() {
    const parts = splitScript($('importText').value);
    if (!parts.length) return;
    const name = $('importName').value.trim() || '未命名项目';
    project.title = name;
    project.chapter = '第一章 正文';
    project.sections.length = 0;
    parts.forEach((p, i) => {
      sections.push({
        id: 'n' + (i + 1) + '-' + Date.now().toString(36),
        title: p.title,
        target: Math.max(20, Math.round(secondsOfText(p.text) * 1.15)),
        scriptDone: false,
        shotsConfirmed: false,
        issues: scanIssues(p.text),
        text: p.text,
        shots: []
      });
    });
    state.activeId = sections[0].id;
    state.step = 1;
    state.editing = false;
    state.draftText = '';
    state.activeIssue = null;
    state.activeShot = null;
    state.exportSel = null;
    state.query = '';
    state.filter = 'all';
    $('sectionSearch').value = '';
    closeImport();
    render();
    flashSaved();
    toast('已创建「' + name + '」，共 ' + sections.length + ' 节。');
  }

  /* ---------- actions ---------- */
  function scrollStageTop() {
    const st = document.querySelector('.stage');
    if (st) st.scrollTop = 0;
  }
  function selectSection(id) {
    if (!id || id === state.activeId) return;
    state.activeId = id;
    state.editing = false;
    state.activeIssue = null;
    state.activeShot = null;
    const s = current();
    state.step = !s.scriptDone ? 1 : !s.shotsConfirmed ? 2 : 3;
    render();
    flashSaved();
    scrollStageTop();
  }
  function stepSection(delta) {
    const idx = sections.indexOf(current()) + delta;
    if (idx >= 0 && idx < sections.length) selectSection(sections[idx].id);
  }
  function goStep(n) {
    const blocked = canOpenStep(n);
    if (blocked) {
      toast(blocked);
      return;
    }
    state.step = n;
    state.editing = false;
    state.activeIssue = null;
    render();
    scrollStageTop();
  }
  function finishScript(s) {
    if (state.editing) return;
    if (!s.text.trim()) {
      toast('正文还是空的，先写一点再定稿。');
      return;
    }
    s.scriptDone = true;
    state.activeIssue = null;
    flashSaved();
    render();
    const left = openIssues(s).length;
    toast(left ? '配音稿已定稿。还有 ' + left + ' 条建议保留着，没有改动正文。' : '配音稿已定稿，可以拆分镜了。');
  }
  function adoptIssue(s, issue) {
    if (!s.text.includes(issue.before)) {
      issue.status = 'kept';
      render();
      toast('正文里已经找不到这段文字，已标记为保留。');
      return;
    }
    const snap = snapshot(s);
    s.text = s.text.replace(issue.before, issue.after);
    issue.status = 'accepted';
    s.scriptDone = false;
    s.shotsConfirmed = false;
    state.editing = false;
    flashSaved();
    render();
    toast('已改正文：' + issue.before + ' → ' + issue.after, '撤销', () => {
      restore(s, snap);
      render();
      flashSaved();
    });
  }
  function adoptSafe(s) {
    const safe = openIssues(s).filter((i) => i.safe);
    if (!safe.length) return;
    const snap = snapshot(s);
    let changed = 0;
    safe.forEach((i) => {
      if (s.text.includes(i.before)) {
        s.text = s.text.replace(i.before, i.after);
        i.status = 'accepted';
        changed += 1;
      } else {
        i.status = 'kept';
      }
    });
    s.scriptDone = false;
    s.shotsConfirmed = false;
    state.editing = false;
    flashSaved();
    render();
    toast('已采用 ' + changed + ' 条安全修改。', '撤销', () => {
      restore(s, snap);
      render();
      flashSaved();
    });
  }
  function saveScript(s) {
    const ta = $('editArea');
    const next = (ta ? ta.value : state.draftText).trim();
    if (!next) {
      toast('正文不能为空。');
      return;
    }
    if (next === s.text) {
      state.editing = false;
      render();
      toast('没有改动。');
      return;
    }
    const snap = snapshot(s);
    s.text = next;
    s.issues = scanIssues(s.text);
    s.scriptDone = false;
    s.shotsConfirmed = false;
    state.editing = false;
    state.activeIssue = null;
    flashSaved();
    render();
    toast('正文已保存，回到待定稿。', '撤销', () => {
      restore(s, snap);
      state.editing = false;
      render();
      flashSaved();
    });
  }
  function addShot() {
    const s = current();
    if (!s.scriptDone) {
      toast('先完成配音稿，再拆分镜。');
      return;
    }
    const shot = {
      id: 'k' + Date.now().toString(36),
      no: s.shots.length + 1,
      duration: 10,
      visual: '',
      type: '遗址',
      assetStatus: 'todo',
      assetName: ''
    };
    s.shots.push(shot);
    s.shotsConfirmed = false;
    state.activeShot = shot.id;
    state.step = 2;
    flashSaved();
    render();
    setTimeout(() => {
      const el = document.querySelector('[data-shot="' + shot.id + '"][data-field="visual"]');
      if (el) el.focus();
    }, 40);
  }
  function deleteShot(id) {
    const s = current();
    const i = s.shots.findIndex((k) => k.id === id);
    if (i < 0) return;
    const snap = snapshot(s);
    s.shots.splice(i, 1);
    s.shotsConfirmed = false;
    state.activeShot = null;
    flashSaved();
    render();
    toast('已删除这一镜。', '撤销', () => {
      restore(s, snap);
      render();
      flashSaved();
    });
  }
  function copyScript(s) {
    const text = s.text;
    const done = () => toast('配音稿已复制，可以直接读稿。');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (err) {
      toast('复制失败，请手动选正文。');
    }
    ta.remove();
  }
  function openExport() {
    $('exportOverlay').hidden = false;
    $('exportResult').classList.remove('is-visible');
    renderExport();
  }
  function closeExport() {
    $('exportOverlay').hidden = true;
    $('exportOpenBtn').focus();
  }
  function closeByOverlay(id) {
    if (id === 'storyOverlay') closeStory();
    else if (id === 'exportOverlay') closeExport();
    else if (id === 'importOverlay') closeImport();
  }

  function handleAction(act, ds) {
    const s = current();
    if (act === 'issue-focus') {
      state.activeIssue = state.activeIssue === ds.id ? null : ds.id;
      render();
      setTimeout(() => {
        const el = document.querySelector('.issue-card.is-focused');
        if (el) el.scrollIntoView({ block: 'nearest' });
      }, 20);
    } else if (act === 'issue-adopt') {
      const issue = (s.issues || []).find((i) => i.id === ds.id);
      if (issue) adoptIssue(s, issue);
    } else if (act === 'issue-keep') {
      const issue = (s.issues || []).find((i) => i.id === ds.id);
      if (issue) {
        issue.status = 'kept';
        state.activeIssue = null;
        render();
        toast('已保留原样。');
      }
    } else if (act === 'adopt-safe') {
      adoptSafe(s);
    } else if (act === 'edit-script') {
      state.editing = true;
      state.draftText = s.text;
      render();
    } else if (act === 'cancel-edit') {
      state.editing = false;
      render();
    } else if (act === 'save-script') {
      saveScript(s);
    } else if (act === 'copy-script') {
      copyScript(s);
    } else if (act === 'finish-script') {
      finishScript(s);
    } else if (act === 'goto-step') {
      goStep(Number(ds.step));
    } else if (act === 'add-shot') {
      addShot();
    } else if (act === 'shot-delete') {
      deleteShot(ds.id);
    } else if (act === 'confirm-shots') {
      if (!s.shots.length) return;
      s.shotsConfirmed = true;
      state.activeShot = null;
      flashSaved();
      render();
      toast('分镜已确认，可以核对素材了。');
    } else if (act === 'jump-asset') {
      state.step = 3;
      state.editing = false;
      render();
      setTimeout(() => {
        const el = document.querySelector('[data-card="' + ds.id + '"]');
        if (el) el.scrollIntoView({ block: 'center' });
      }, 30);
    } else if (act === 'story-open') {
      openStory();
    } else if (act === 'story-jump') {
      state.story.i = Number(ds.i) || 0;
      renderStory();
    } else if (act === 'export-open') {
      openExport();
    }
  }

  /* ---------- new section ---------- */
  function addSection() {
    const s = current();
    const idx = sections.indexOf(s);
    const sec = {
      id: 's' + Date.now().toString(36),
      title: '新小节 ' + (sections.length + 1),
      target: 60,
      scriptDone: false,
      shotsConfirmed: false,
      issues: [],
      text: '',
      shots: []
    };
    sections.splice(idx + 1, 0, sec);
    state.activeId = sec.id;
    state.step = 1;
    state.editing = true;
    state.draftText = '';
    state.activeIssue = null;
    state.activeShot = null;
    state.exportSel = null;
    state.query = '';
    state.filter = 'all';
    $('sectionSearch').value = '';
    render();
    flashSaved();
    toast('已新增小节，直接写正文。');
  }

  function handleShotChange(e) {
    const el = e.target;
    if (!el || !el.dataset || !el.dataset.shot) return;
    const s = current();
    const k = s.shots.find((x) => x.id === el.dataset.shot);
    if (!k) return;
    const field = el.dataset.field;
    if (field === 'duration') {
      let v = parseInt(el.value, 10);
      if (!isFinite(v) || v < 1) v = 1;
      if (v > 120) v = 120;
      k.duration = v;
    } else if (field === 'visual') {
      k.visual = el.value.trim();
    } else if (field === 'assetName') {
      k.assetName = el.value.trim();
    } else if (field === 'type') {
      k.type = el.value;
    } else if (field === 'assetStatus') {
      k.assetStatus = el.value;
    } else {
      return;
    }
    if (field === 'visual' || field === 'duration' || field === 'type') {
      s.shotsConfirmed = false;
    }
    flashSaved();
    render();
  }

  /* ---------- bindings ---------- */
  function bind() {
    fillIcons();

    let dragId = null;
    const list = $('sectionList');
    list.addEventListener('click', (e) => {
      const row = e.target.closest('.section-row');
      if (row && !e.target.closest('.drag-handle')) selectSection(row.dataset.id);
    });
    list.addEventListener('dragstart', (e) => {
      const row = e.target.closest('.section-row');
      if (!row) return;
      dragId = row.dataset.id;
      row.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch (err) { /* ignore */ }
    });
    list.addEventListener('dragend', () => {
      list.querySelectorAll('.is-dragging, .drop-before').forEach((x) => {
        x.classList.remove('is-dragging');
        x.classList.remove('drop-before');
      });
      dragId = null;
    });
    list.addEventListener('dragover', (e) => {
      const row = e.target.closest('.section-row');
      if (!row || !dragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.drop-before').forEach((x) => x.classList.remove('drop-before'));
      if (row.dataset.id !== dragId) row.classList.add('drop-before');
    });
    list.addEventListener('drop', (e) => {
      const row = e.target.closest('.section-row');
      if (!row || !dragId) return;
      e.preventDefault();
      const from = sections.findIndex((s) => s.id === dragId);
      let to = sections.findIndex((s) => s.id === row.dataset.id);
      if (from < 0 || to < 0 || from === to) return;
      const moved = sections.splice(from, 1)[0];
      if (from < to) to -= 1;
      sections.splice(to, 0, moved);
      dragId = null;
      render();
      flashSaved();
      toast('小节顺序已更新。');
    });

    $('sectionSearch').addEventListener('input', (e) => {
      state.query = e.target.value;
      renderQueue();
    });
    $('queueFilters').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      state.filter = chip.dataset.filter;
      renderQueue();
    });

    $('stepper').addEventListener('click', (e) => {
      const btn = e.target.closest('.step');
      if (btn) goStep(Number(btn.dataset.step));
    });
    $('storyboardBtn').addEventListener('click', openStory);

    $('newProjectBtn').addEventListener('click', openImport);
    $('exportOpenBtn').addEventListener('click', openExport);
    $('addSectionBtn').addEventListener('click', addSection);
    $('importOpenBtn').addEventListener('click', openImport);
    $('brandHome').addEventListener('click', (e) => {
      e.preventDefault();
      toast('一条视频就是一个项目。这里已经是制作台。');
    });

    $('importText').addEventListener('input', renderSplit);
    $('importName').addEventListener('input', renderSplit);
    $('loadDemoBtn').addEventListener('click', () => {
      $('importText').value = demoText();
      renderSplit();
      toast('已载入示例文稿，可以创建项目。');
    });
    $('importClose').addEventListener('click', closeImport);
    $('importCancel').addEventListener('click', closeImport);
    $('importCreate').addEventListener('click', createProject);

    $('exportClose').addEventListener('click', closeExport);
    $('generateBtn').addEventListener('click', generatePackage);
    $('exportFiles').addEventListener('change', (e) => {
      const box = e.target.closest('input[data-file]');
      if (!box) return;
      state.exportSel[box.dataset.file] = box.checked;
      updateGenerateBtn();
    });

    $('storyClose').addEventListener('click', closeStory);
    $('storyPlay').addEventListener('click', toggleStory);

    ['importOverlay', 'exportOverlay', 'storyOverlay'].forEach((id) => {
      $(id).addEventListener('mousedown', (e) => {
        if (e.target === $(id)) closeByOverlay(id);
      });
    });

    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled) return;
      e.preventDefault();
      handleAction(el.dataset.act, el.dataset);
    });

    $('stepContent').addEventListener('change', handleShotChange);
    $('stepContent').addEventListener('input', (e) => {
      if (e.target.id === 'editArea') state.draftText = e.target.value;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!$('storyOverlay').hidden) closeStory();
        else if (!$('exportOverlay').hidden) closeExport();
        else if (!$('importOverlay').hidden) closeImport();
        return;
      }
      if (!$('storyOverlay').hidden) {
        if (e.key === ' ') {
          e.preventDefault();
          toggleStory();
        } else if (e.key === 'ArrowRight') {
          state.story.i = Math.min(current().shots.length - 1, state.story.i + 1);
          renderStory();
        } else if (e.key === 'ArrowLeft') {
          state.story.i = Math.max(0, state.story.i - 1);
          renderStory();
        }
        return;
      }
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const btn = $('nextCard').querySelector('.btn-primary:not([disabled])');
        if (btn) btn.click();
        return;
      }
      if (e.key === 'j' || e.key === 'J') stepSection(1);
      if (e.key === 'k' || e.key === 'K') stepSection(-1);
    });
  }

  function init() {
    if (!sections.length) return;
    if (!sections.some((s) => s.id === state.activeId)) state.activeId = sections[0].id;
    const s = current();
    state.step = !s.scriptDone ? 1 : !s.shotsConfirmed ? 2 : 3;
    bind();
    render();
  }

  init();
})();
