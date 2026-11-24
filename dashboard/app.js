/* 日本語道場 — dashboard engine.
   No build step, no server, no dependencies. Data arrives via <script src> globals.
   State lives in localStorage; Sync exports it to a file so Claude can read it. */
'use strict';

const KEY = 'nihongo.v1';
const DAILY_NEW = 15;
const TODAY = () => new Date().toISOString().slice(0, 10);
const NOW = () => Date.now();
const DAY = 86400000;

/* ---------- state ---------- */
const DEFAULT_STORE = {
  version: 1, sprint: 1, updated: null,
  srs: {},            // cardId -> {ease, interval(min), due(ms), reps, lapses}
  stats: {},          // date -> {reviewed, correct, minutes, fresh}
  blocks: {},         // date -> [block ids done]
  flags: { katakanaDone: false, romajiWeaned: false },
  settings: { dailyNew: DAILY_NEW }
};

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_STORE);
    const parsed = JSON.parse(raw);
    return Object.assign(structuredClone(DEFAULT_STORE), parsed);
  } catch (e) { return structuredClone(DEFAULT_STORE); }
}
function save() {
  S.updated = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
}
function today() {
  const d = TODAY();
  if (!S.stats[d]) S.stats[d] = { reviewed: 0, correct: 0, minutes: 0, fresh: 0 };
  return S.stats[d];
}

/* ---------- furigana ---------- */
// 漢字[かんじ] -> <ruby>漢字<rt>かんじ</rt></ruby>
function ruby(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/([^\s\[\]]+?)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
}
function plain(s) { return String(s || '').replace(/\[[^\]]*\]/g, ''); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/* ---------- card model ---------- */
// A card is {id, kind, mode, q, a, hint, extra, typed}
function allCards() {
  const out = [];
  const sp = S.sprint;

  for (const k of window.KANA) {
    if (k.type !== 'katakana') continue;
    if (sp < 1) continue;
    out.push({ id: k.id + ':recognise', kind: 'kana', mode: 'recognise', typed: true,
      q: k.kana, a: k.romaji, hint: k.mnemonic, extra: 'hiragana twin: ' + (k.hira || '—'), size: 'xl' });
    out.push({ id: k.id + ':produce', kind: 'kana', mode: 'produce', typed: false,
      q: k.romaji, a: k.kana, hint: k.mnemonic, extra: '', size: 'en' });
  }
  for (const k of window.KANJI) {
    if (k.sprint > sp) continue;
    out.push({ id: k.id + ':recognise', kind: 'kanji', mode: 'recognise', typed: false,
      q: k.char, a: k.keyword, hint: k.mnemonic,
      extra: 'parts: ' + k.components.join(' ') + ' · ' + k.strokes + ' strokes', size: 'xl' });
    (k.words || []).forEach(function (w, i) {
      out.push({ id: k.id + ':w' + i, kind: 'kanji', mode: 'reading', typed: false,
        q: plain(w.jp), a: w.reading + '  —  ' + w.en, hint: '', extra: k.char + ' = ' + k.keyword, size: 'lg' });
    });
  }
  for (const v of window.VOCAB) {
    if (v.sprint > sp) continue;
    out.push({ id: v.id + ':recognise', kind: 'vocab', mode: 'recognise', typed: false,
      q: v.jp, a: v.en, hint: '', extra: v.sentence.jp + '  —  ' + v.sentence.en, size: 'lg', jpq: true });
    out.push({ id: v.id + ':produce', kind: 'vocab', mode: 'produce', typed: false,
      q: v.en + '  (' + v.pos + ')', a: v.jp, hint: '', extra: v.sentence.jp, size: 'en', jpa: true });
  }
  for (const g of window.GRAMMAR) {
    if (g.sprint > sp) continue;
    (g.drill || []).forEach(function (d, i) {
      out.push({ id: g.id + ':c' + i, kind: 'grammar', mode: 'cloze', typed: false,
        q: d.prompt, a: d.answer, hint: g.form, extra: g.title + ' — ' + g.gloss, size: 'md', jpq: true, jpa: true });
    });
  }
  return out;
}

function cardState(id) { return S.srs[id] || null; }
function dueCards(cards) {
  const now = NOW();
  return cards.filter(function (c) { const st = cardState(c.id); return st && st.due <= now; });
}
function newCards(cards) {
  return cards.filter(function (c) { return !cardState(c.id); });
}
function freshBudget() { return Math.max(0, (S.settings.dailyNew || DAILY_NEW) - today().fresh); }

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* ---------- scheduler (SM-2 derivative, see curriculum/STANDARDS.md) ---------- */
function grade(cardId, g) {
  let st = S.srs[cardId];
  if (!st) { st = { ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 }; S.srs[cardId] = st; today().fresh++; }
  const t = today();
  t.reviewed++;
  if (g >= 2) t.correct++;

  if (g === 0) {
    st.lapses++; st.ease = Math.max(1.3, st.ease - 0.20); st.interval = 10 / 1440;
  } else {
    st.ease = Math.min(3.0, Math.max(1.3, st.ease + (g === 1 ? -0.15 : g === 3 ? 0.15 : 0)));
    if (st.reps === 0) st.interval = g === 1 ? 10 / 1440 : g === 3 ? 3 : 1;
    else if (st.interval < 1) st.interval = 1;
    else st.interval = Math.max(1, Math.round(st.interval * st.ease * (g === 1 ? 0.6 : 1)));
  }
  st.reps++;
  st.due = NOW() + st.interval * DAY;
  save();
}
function maturity(id) {
  const st = cardState(id);
  if (!st) return 'new';
  if (st.interval >= 21) return 'known';
  return 'learning';
}
function itemMaturity(prefix) {
  const ids = Object.keys(S.srs).filter(function (k) { return k.split(':')[0] === prefix; });
  if (!ids.length) return 'new';
  if (ids.every(function (i) { return maturity(i) === 'known'; })) return 'known';
  return 'learning';
}

/* ---------- router ---------- */
const VIEWS = {};
let current = 'today';
function go(v) { current = v; render(); }
function render() {
  document.querySelectorAll('nav button[data-v]').forEach(function (b) {
    b.classList.toggle('on', b.dataset.v === current);
  });
  const cards = allCards();
  const d = dueCards(cards).length;
  const badge = document.getElementById('dueBadge');
  badge.textContent = d || '';
  badge.style.display = d ? '' : 'none';
  document.getElementById('main').innerHTML = VIEWS[current]();
  if (afterRender[current]) afterRender[current]();
}
const afterRender = {};

/* ---------- view: today ---------- */
const BLOCKS = [
  ['srs', 'SRS review — everything due', 25, 'review'],
  ['new', 'New intake — kanji, vocab, one grammar point', 25, 'kanji'],
  ['gram', 'Grammar drill — cloze + transformation', 20, 'grammar'],
  ['input', 'Input — graded reading or audio', 25, null],
  ['out', 'Output — five original sentences', 15, null],
  ['hand', 'Handwriting — printed worksheet, with a pen', 10, null]
];

function streak() {
  let n = 0;
  for (let i = 0; ; i++) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    const s = S.stats[d];
    if (s && s.reviewed > 0) n++;
    else if (i > 0) break;
    else if (!s || !s.reviewed) { continue; }
  }
  return n;
}
function retention(days) {
  let r = 0, c = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    const s = S.stats[d]; if (!s) continue;
    r += s.reviewed; c += s.correct;
  }
  return r ? Math.round(c / r * 100) : null;
}

VIEWS.today = function () {
  const cards = allCards();
  const due = dueCards(cards).length;
  const fresh = Math.min(newCards(cards).length, freshBudget());
  const t = today();
  const doneBlocks = S.blocks[TODAY()] || [];
  const ret = retention(14);
  const sprintInfo = ['', 'Katakana + survival grammar', 'First 80 kanji + particles',
    'Kanji 81-180, adjectives, て-form', 'N5 closure'][S.sprint] || 'Sprint ' + S.sprint;

  return `
  <h1>今日 — today</h1>
  <div class="sub">Sprint ${S.sprint} · ${esc(sprintInfo)} · ${new Date().toDateString()}</div>

  <div class="grid cols4">
    <div class="stat aka"><div class="n">${due}</div><div class="l">due now</div></div>
    <div class="stat"><div class="n">${fresh}</div><div class="l">new available</div></div>
    <div class="stat mid"><div class="n">${ret === null ? '—' : ret + '%'}</div><div class="l">retention 14d</div></div>
    <div class="stat kin"><div class="n">${streak()}</div><div class="l">day streak</div></div>
  </div>

  ${!S.placement ? `<div class="card" style="border-color:var(--aka);margin-top:22px">
    <strong>Start here — the placement drill</strong>
    <div class="small muted" style="margin:5px 0 11px">Eight minutes. It measures your hiragana speed,
      your control of dakuten / yōon / small っ, and your particle pronunciation. Everything in the
      plan is currently built on assumptions about those three things. Measure first, then teach.</div>
    <button class="btn" onclick="go('placement')">Run the placement drill</button>
  </div>` : ''}

  <h2>Session</h2>
  <div class="row" style="margin-bottom:16px">
    <button class="btn" onclick="go('review')">${due ? 'Review ' + due + ' due cards' : (fresh ? 'Learn ' + fresh + ' new cards' : 'Nothing due — free study')}</button>
    <button class="btn ghost" onclick="go('kana')">Katakana lab</button>
    <button class="btn ghost" onclick="go('kanji')">Kanji lab</button>
    <button class="btn ghost" onclick="window.open('../worksheets/index.html','_blank')">Worksheets</button>
  </div>

  <div class="blocks">
    ${BLOCKS.map(function (b) {
      const on = doneBlocks.indexOf(b[0]) >= 0;
      return `<div class="blk ${on ? 'done' : ''}" onclick="toggleBlock('${b[0]}')">
        <div class="box">✓</div><div>${esc(b[1])}</div><div class="mins">${b[2]} min</div></div>`;
    }).join('')}
  </div>
  <div class="small dim" style="margin-top:10px">
    Logged today: ${t.reviewed} reviews, ${t.reviewed ? Math.round(t.correct / t.reviewed * 100) : 0}% correct.
    A 25-minute SRS-only day still counts as a day. Protect the streak over the session length.
  </div>

  <h2>Where you are</h2>
  <div class="card small">
    <strong>Target:</strong> JLPT N3, December 2027 — exam-ready by 2027-08-31.<br>
    <strong>Right now:</strong> Sprint 1 of 16. The one thing standing between you and reading
    actual Japanese text is katakana — 46 characters, roughly four days of work.
    <div class="bar"><i style="width:${Math.round(S.sprint / 16 * 100)}%"></i></div>
    <div class="dim" style="margin-top:6px">Sprint ${S.sprint} / 16 · full plan in <code>curriculum/ROADMAP.md</code></div>
  </div>`;
};
window.toggleBlock = function (id) {
  const d = TODAY();
  S.blocks[d] = S.blocks[d] || [];
  const i = S.blocks[d].indexOf(id);
  if (i >= 0) S.blocks[d].splice(i, 1); else S.blocks[d].push(id);
  save(); render();
};

/* ---------- view: review ---------- */
let Q = null;     // {queue:[], i:0, results:[]}
let revealed = false;
let sessionStart = 0;

VIEWS.review = function () {
  if (!Q) {
    const cards = allCards();
    const due = shuffle(dueCards(cards));
    const fresh = shuffle(newCards(cards)).slice(0, freshBudget());
    // interleave: due first but sprinkle new ones in, never a block of 15 identical-type cards
    const queue = shuffle(due.concat(fresh));
    if (!queue.length) {
      return `<h1>復習 — review</h1><div class="sub">The queue is empty.</div>
        <div class="card center pad">
          <div class="jp" style="font-size:46px">お疲[つか]れさま</div>
          <p class="muted">Nothing is due and the new-card budget for today is spent.<br>
          Raise the intake cap if you want more — but the cap exists so the backlog cannot explode.</p>
          <div class="row" style="justify-content:center">
            <button class="btn ghost" onclick="bumpNew(10)">+10 new cards today</button>
            <button class="btn ghost" onclick="go('kana')">Free drill instead</button>
          </div>
        </div>`;
    }
    Q = { queue: queue, i: 0, results: [] };
    revealed = false;
    sessionStart = NOW();
  }
  if (Q.i >= Q.queue.length) {
    const ok = Q.results.filter(function (r) { return r >= 2; }).length;
    const n = Q.results.length;
    const mins = Math.round((NOW() - sessionStart) / 60000);
    today().minutes += mins; save();
    const acc = Math.round(ok / n * 100);
    Q = null;
    return `<h1>復習 — done</h1><div class="sub">${n} cards in ${mins} min</div>
      <div class="grid cols3">
        <div class="stat mid"><div class="n">${acc}%</div><div class="l">accuracy</div></div>
        <div class="stat"><div class="n">${n}</div><div class="l">cards</div></div>
        <div class="stat"><div class="n">${mins}</div><div class="l">minutes</div></div>
      </div>
      <div class="card small" style="margin-top:16px">
        ${acc >= 90 ? 'Above 90% means the material is too easy — the target band is 80-85%. Raise the intake cap.' :
          acc >= 78 ? 'That is in the target band. Desirable difficulty: this is what learning feels like.' :
          'Below 78% means intake is outrunning consolidation. Hold new cards for a day and let the queue settle.'}
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn" onclick="go('review')">Another round</button>
        <button class="btn ghost" onclick="go('today')">Back to today</button>
      </div>`;
  }

  const c = Q.queue[Q.i];
  const kindLabel = { kana: 'katakana', kanji: 'kanji', vocab: 'vocabulary', grammar: 'grammar' }[c.kind];
  const modeLabel = { recognise: 'recognise', produce: 'produce', reading: 'reading', cloze: 'fill the blank' }[c.mode];
  const qcls = c.size === 'xl' ? 'prompt-xl jp' : c.size === 'lg' ? 'prompt-lg jp'
    : c.size === 'md' ? 'prompt-md jp' : 'prompt-en';
  const qhtml = (c.jpq || c.size !== 'en') ? ruby(c.q) : esc(c.q);

  return `
  <div id="review">
    <div class="progressline">${Q.queue.map(function (_, i) {
      const cl = i < Q.i ? (Q.results[i] >= 2 ? 'ok' : 'no') : i === Q.i ? 'now' : '';
      return '<i class="' + cl + '"></i>';
    }).join('')}</div>
    <div class="row small dim" style="justify-content:space-between;margin-bottom:10px">
      <span><span class="tag">${kindLabel}</span> <span class="tag">${modeLabel}</span></span>
      <span>${Q.i + 1} / ${Q.queue.length}${cardState(c.id) ? '' : ' · new'}</span>
    </div>
    <div class="q">
      <div class="${qcls}">${qhtml}</div>
      ${!revealed && c.typed ? `<input id="typed" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="romaji">` : ''}
      ${revealed ? `<div class="ans">${c.jpa ? '<span class="jp">' + ruby(c.a) + '</span>' : esc(c.a)}</div>` : ''}
      ${revealed && c.hint ? `<div class="mn">${esc(c.hint)}</div>` : ''}
      ${revealed && c.extra ? `<div class="exw">${ruby(c.extra)}</div>` : ''}
    </div>
    ${revealed ? `<div class="grades">
      <button class="g0" onclick="ans(0)">Again<small>1 · forgot</small></button>
      <button class="g1" onclick="ans(1)">Hard<small>2</small></button>
      <button class="g2" onclick="ans(2)">Good<small>3</small></button>
      <button class="g3" onclick="ans(3)">Easy<small>4</small></button>
    </div>` : `<div class="row" style="margin-top:14px;justify-content:center">
      <button class="btn" onclick="reveal()">Show answer <span class="dim">· space</span></button>
    </div>`}
    <div class="center small dim" style="margin-top:16px">
      Grade honestly. "Easy" on something you hesitated over is how a deck rots.
    </div>
  </div>`;
};
afterRender.review = function () {
  const t = document.getElementById('typed');
  if (t) { t.focus(); t.onkeydown = function (e) { if (e.key === 'Enter') reveal(); }; }
};
window.reveal = function () {
  const c = Q.queue[Q.i];
  if (c && c.typed) {
    const t = document.getElementById('typed');
    if (t) { c._typedVal = t.value.trim().toLowerCase(); }
  }
  revealed = true; render();
};
window.ans = function (g) {
  const c = Q.queue[Q.i];
  if (c.typed && c._typedVal !== undefined && c._typedVal !== c.a.toLowerCase() && g > 1) g = 0;
  grade(c.id, g);
  Q.results[Q.i] = g;
  if (g === 0) Q.queue.push(Object.assign({}, c, { _typedVal: undefined })); // re-show lapses this session
  Q.i++; revealed = false; render();
};
window.bumpNew = function (n) { S.settings.dailyNew = (S.settings.dailyNew || DAILY_NEW) + n; save(); Q = null; render(); };

document.addEventListener('keydown', function (e) {
  if (current !== 'review' || !Q) return;
  if (document.activeElement && document.activeElement.id === 'typed' && e.key !== ' ') return;
  if (e.key === ' ') { e.preventDefault(); if (!revealed) reveal(); }
  if (revealed && ['1', '2', '3', '4'].indexOf(e.key) >= 0) ans(parseInt(e.key, 10) - 1);
});

/* ---------- view: kana ---------- */
let kanaFilter = 'base';
VIEWS.kana = function () {
  const rows = { base: ['vowels', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'n-final'],
    dakuten: ['dakuten', 'handakuten'], yoon: ['yoon'] };
  const list = window.KANA.filter(function (k) { return rows[kanaFilter].indexOf(k.row) >= 0; });
  const learned = window.KANA.filter(function (k) { return itemMaturity(k.id) !== 'new'; }).length;

  return `
  <h1>カタカナ — katakana lab</h1>
  <div class="sub">${learned} / ${window.KANA.length} characters in the system.
    Katakana is a 5×10 phonetic grid, not 46 unrelated shapes — read down the columns, not across.</div>

  <div class="row" style="margin-bottom:14px">
    <button class="btn ${kanaFilter === 'base' ? '' : 'ghost'}" onclick="setKana('base')">Base 46</button>
    <button class="btn ${kanaFilter === 'dakuten' ? '' : 'ghost'}" onclick="setKana('dakuten')">Dakuten ゛ ゜</button>
    <button class="btn ${kanaFilter === 'yoon' ? '' : 'ghost'}" onclick="setKana('yoon')">Yōon ャュョ</button>
    <span style="flex:1"></span>
    <button class="btn ghost" onclick="trapDrill()">Trap drill — confusion pairs</button>
    <button class="btn ghost" onclick="window.open('../worksheets/katakana-trace.html','_blank')">Print tracing sheet</button>
  </div>

  <div class="kgrid">
    ${list.map(function (k) {
      return `<div class="kcell ${itemMaturity(k.id)}" onclick="showKana('${k.id}')">
        <div class="c">${k.kana}</div><div class="r">${k.romaji}</div></div>`;
    }).join('')}
  </div>

  <details class="gitem" style="margin-bottom:18px">
    <summary>How the system works — read this once before drilling anything</summary>
    <div class="gbody small">
      <p><strong>You are not learning 46 new sounds. You are learning a second set of labels for
      sounds you already have.</strong> Katakana encodes exactly the same syllabary as hiragana —
      same five vowels, same nine consonant rows, same ん. あ and ア are the same sound. So this is
      a relabelling job, and relabelling is far cheaper than learning. That is why two weeks is
      realistic rather than optimistic.</p>
      <p><strong>Why katakana looks angular and hiragana looks round.</strong> Both descend from
      kanji, but differently. Hiragana came from cursive, flowing whole characters. Katakana came
      from monks taking <em>fragments</em> of kanji as shorthand in the margins of texts —
      カ is the left part of 加, ロ is 呂, ム is 牟, ニ is 二. Angular because it is a clipping,
      not a flourish. Knowing this stops the shapes feeling arbitrary.</p>
      <p><strong>Where it is used:</strong> loanwords (コーヒー, パソコン), foreign names
      (インド, ジャンメジャイ), onomatopoeia, scientific names, and emphasis — roughly what italics
      do in English. Which means: every menu, every sign, every product name. This is why it comes
      before kanji.</p>
      <p><strong>Learn it down the columns, not across the alphabet.</strong> ア イ ウ エ オ, then
      カ キ ク ケ コ, then サ シ ス セ ソ. Each row is one consonant married to the five vowels you
      already know. Five characters a day, in rows, is the correct rate.</p>
      <p class="dim" style="margin-bottom:0">Dakuten (゛) and handakuten (゜) are not new characters —
      they are one mechanical transform: k→g, s→z, t→d, h→b, and h→p with the circle. 58 of the
      104 entries in this lab are generated by that rule rather than memorised.</p>
    </div>
  </details>

  <h2>The confusion sets — where every learner loses marks</h2>
  <div class="card small" style="margin-bottom:12px">
    <strong>The one rule that solves シ/ツ and ソ/ン: look at the stroke direction, not the shape.</strong>
    <p style="margin:6px 0 0">Each one inherits its direction from its hiragana twin.
    <span class="jp">シ</span> comes from <span class="jp">し</span> — し sweeps <em>upward</em> from
    the bottom, so シ's long stroke is written bottom-left → top-right, and the two dots stack on the
    <em>left</em>. <span class="jp">ツ</span> comes from <span class="jp">つ</span> — つ starts at the
    <em>top</em>, so ツ's long stroke comes down from the top-right, and the two dots sit along the
    <em>top</em>. Same test for <span class="jp">ン</span> (from ん, upward) and
    <span class="jp">ソ</span> (from そ, downward). You never have to compare the shapes — just ask
    which direction the hand moves.</p>
  </div>
  <div class="card small">
    <div class="row" style="gap:20px">
      <div><span class="jp" style="font-size:26px">シ ツ</span><br><span class="dim">shi / tsu — dots LEFT &amp; sweep UP vs dots TOP &amp; sweep DOWN</span></div>
      <div><span class="jp" style="font-size:26px">ソ ン</span><br><span class="dim">so / n — tick leans RIGHT vs tick leans LEFT</span></div>
      <div><span class="jp" style="font-size:26px">ク ワ ケ</span><br><span class="dim">ku / wa / ke</span></div>
      <div><span class="jp" style="font-size:26px">ス ヌ メ</span><br><span class="dim">su / nu / me</span></div>
      <div><span class="jp" style="font-size:26px">ネ ホ オ</span><br><span class="dim">ne / ho / o</span></div>
    </div>
  </div>

  <h2>Read these cold — Sprint 1 exit test</h2>
  <div class="card jp" style="font-size:19px;line-height:2.2">
    ${window.LOANWORDS.map(function (w) { return '<span title="' + esc(w.en) + '" style="margin-right:18px">' + w.kana + '</span>'; }).join('')}
  </div>
  <div class="small dim" style="margin-top:8px">Hover for the meaning. The exit bar is all 46 in under 90 seconds and 20 of these read cold.</div>
  <div id="modal"></div>`;
};
window.setKana = function (f) { kanaFilter = f; render(); };
window.showKana = function (id) {
  const k = window.KANA.find(function (x) { return x.id === id; });
  document.getElementById('modal').innerHTML = `
    <div class="detail" onclick="closeModal(event)">
      <div class="inner" onclick="event.stopPropagation()">
        <div class="big">${k.kana}</div>
        <div class="center muted" style="font-size:19px">${k.romaji}</div>
        <dl>
          <dt>Mnemonic</dt><dd>${esc(k.mnemonic)}</dd>
          <dt>Hiragana</dt><dd class="jp" style="font-size:22px">${k.hira || '—'}</dd>
          ${k.confuse && k.confuse.length ? `<dt>Confused with</dt><dd class="jp" style="font-size:22px">${k.confuse.join('  ')}</dd>` : ''}
          <dt>Row</dt><dd>${k.row}</dd>
          <dt>SRS</dt><dd>${srsLine(k.id)}</dd>
        </dl>
      </div></div>`;
};
window.closeModal = function (e) { if (e) document.getElementById('modal').innerHTML = ''; };
function srsLine(prefix) {
  const ids = Object.keys(S.srs).filter(function (k) { return k.split(':')[0] === prefix; });
  if (!ids.length) return '<span class="dim">not yet introduced</span>';
  return ids.map(function (i) {
    const st = S.srs[i];
    const d = Math.max(0, Math.round((st.due - NOW()) / DAY));
    return i.split(':')[1] + ': ' + (st.interval < 1 ? '<1d' : st.interval + 'd') +
      ' · due in ' + d + 'd · ease ' + st.ease.toFixed(2);
  }).join('<br>');
}
window.trapDrill = function () {
  const pool = window.KANA.filter(function (k) { return k.confuse && k.confuse.length >= 2; });
  const queue = shuffle(pool).map(function (k) {
    return { id: k.id + ':trap', kind: 'kana', mode: 'recognise', typed: true,
      q: k.kana, a: k.romaji, hint: k.mnemonic, extra: 'confusable with ' + k.confuse.join(' '), size: 'xl' };
  });
  Q = { queue: queue, i: 0, results: [] }; revealed = false; sessionStart = NOW(); go('review');
};

/* ---------- view: kanji ---------- */
VIEWS.kanji = function () {
  const unlocked = window.KANJI.filter(function (k) { return k.sprint <= S.sprint; });
  const known = unlocked.filter(function (k) { return itemMaturity(k.id) === 'known'; }).length;
  return `
  <h1>漢字 — kanji lab</h1>
  <div class="sub">${known} known / ${unlocked.length} unlocked / ${window.KANJI.length} loaded.
    Every character below decomposes into parts you already know. Nothing here is memorised blind.</div>
  ${S.sprint < 2 ? `<div class="card small" style="margin-bottom:16px;border-color:var(--kin)">
    Kanji unlock in Sprint 2. You can browse now — but finish katakana first. Reading kanji without
    kana is like reading equations without knowing the digits.</div>` : ''}
  <div class="row" style="margin-bottom:14px">
    <button class="btn ghost" onclick="window.open('../worksheets/kanji-trace.html','_blank')">Print tracing sheet</button>
    <span class="small dim">Border colour: grey = new, gold = learning, green = mature (21d+)</span>
  </div>
  <div class="kgrid">
    ${window.KANJI.map(function (k) {
      return `<div class="kcell ${itemMaturity(k.id)}" onclick="showKanji('${k.id}')">
        <div class="c">${k.char}</div><div class="r">${esc(k.keyword)}</div></div>`;
    }).join('')}
  </div>
  <div id="modal"></div>`;
};
window.showKanji = function (id) {
  const k = window.KANJI.find(function (x) { return x.id === id; });
  document.getElementById('modal').innerHTML = `
    <div class="detail" onclick="closeModal(event)">
      <div class="inner" onclick="event.stopPropagation()">
        <div class="big">${k.char}</div>
        <div class="center" style="font-size:20px;color:var(--aka);font-weight:600">${esc(k.keyword)}</div>
        <div class="center small dim">${k.strokes} strokes · ${k.level} · sprint ${k.sprint}</div>
        <dl>
          <dt>Parts</dt><dd class="jp" style="font-size:24px">${k.components.join('　')}</dd>
          <dt>Mnemonic</dt><dd>${esc(k.mnemonic)}</dd>
          <dt>On'yomi</dt><dd class="jp">${k.on.length ? k.on.join('、') : '—'}</dd>
          <dt>Kun'yomi</dt><dd class="jp">${k.kun.length ? k.kun.join('、') : '—'}</dd>
          <dt>Words</dt><dd><div class="wordlist">${k.words.map(function (w) {
            return '<div class="w">' + ruby(w.jp) + ' <em>' + esc(w.en) + '</em></div>'; }).join('')}</div></dd>
          ${k.note ? `<dt>Watch out</dt><dd>${esc(k.note)}</dd>` : ''}
          <dt>SRS</dt><dd class="small">${srsLine(k.id)}</dd>
        </dl>
      </div></div>`;
};

/* ---------- view: vocab ---------- */
VIEWS.vocab = function () {
  const v = window.VOCAB.filter(function (x) { return x.sprint <= S.sprint; });
  return `
  <h1>単語 — vocabulary</h1>
  <div class="sub">${v.length} words unlocked of ${window.VOCAB.length} loaded. Every one carries its own sentence.</div>
  <table><thead><tr><th>Word</th><th>Reading</th><th>Meaning</th><th></th><th>Sentence</th><th>SRS</th></tr></thead><tbody>
  ${v.map(function (x) {
    return `<tr><td class="jp">${ruby(x.jp)}</td><td class="jp">${x.kana}</td><td>${esc(x.en)}</td>
      <td><span class="tag">${x.pos}</span></td>
      <td class="jp small">${ruby(x.sentence.jp)}<div class="dim" style="font-family:Inter">${esc(x.sentence.en)}</div></td>
      <td class="small dim">${itemMaturity(x.id)}</td></tr>`;
  }).join('')}
  </tbody></table>`;
};

/* ---------- view: grammar ---------- */
VIEWS.grammar = function () {
  const g = window.GRAMMAR.filter(function (x) { return x.sprint <= S.sprint; });
  const locked = window.GRAMMAR.filter(function (x) { return x.sprint > S.sprint; });
  return `
  <h1>文法 — grammar</h1>
  <div class="sub">${g.length} points unlocked. Read the mechanism, then drill the contrast —
    the "confused with" line is where the actual learning is.</div>
  <div class="row" style="margin-bottom:14px">
    <button class="btn" onclick="grammarDrill()">Drill all unlocked cloze items</button>
  </div>
  ${g.map(gitem).join('')}
  ${locked.length ? `<h2>Locked — sprint ${S.sprint + 1} and beyond</h2>
    ${locked.map(function (x) { return `<div class="gitem"><summary style="opacity:.45">
      <span class="jp">${esc(x.title)}</span> <span class="gl">${esc(x.gloss)} · sprint ${x.sprint}</span></summary></div>`; }).join('')}` : ''}`;
};
function gitem(x) {
  return `<details class="gitem">
    <summary><span class="jp">${esc(x.title)}</span> <span class="gl">${esc(x.gloss)} · sprint ${x.sprint}</span></summary>
    <div class="gbody">
      <div class="form">${esc(x.form)}</div>
      <p>${esc(x.explain)}</p>
      ${x.examples.map(function (e) {
        return `<div class="ex">${ruby(e.jp)}</div><div class="ent">${esc(e.en)}</div>`; }).join('')}
      ${x.contrast ? `<div class="contrast"><strong>Confused with:</strong> ${ruby(x.contrast)}</div>` : ''}
    </div></details>`;
}
window.grammarDrill = function () {
  const queue = [];
  window.GRAMMAR.filter(function (g) { return g.sprint <= S.sprint; }).forEach(function (g) {
    (g.drill || []).forEach(function (d, i) {
      queue.push({ id: g.id + ':c' + i, kind: 'grammar', mode: 'cloze', typed: false,
        q: d.prompt, a: d.answer, hint: g.form, extra: g.title + ' — ' + g.gloss, size: 'md', jpq: true, jpa: true });
    });
  });
  Q = { queue: shuffle(queue), i: 0, results: [] }; revealed = false; sessionStart = NOW(); go('review');
};

/* ---------- view: progress ---------- */
VIEWS.progress = function () {
  const cards = allCards();
  const mature = cards.filter(function (c) { return maturity(c.id) === 'known'; }).length;
  const learning = cards.filter(function (c) { return maturity(c.id) === 'learning'; }).length;
  const totalMin = Object.values(S.stats).reduce(function (a, s) { return a + (s.minutes || 0); }, 0);
  const totalRev = Object.values(S.stats).reduce(function (a, s) { return a + (s.reviewed || 0); }, 0);
  const days = [];
  for (let i = 69; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    const s = S.stats[d];
    const n = s ? s.reviewed : 0;
    days.push('<i class="' + (n === 0 ? '' : n < 20 ? 'h1' : n < 50 ? 'h2' : n < 100 ? 'h3' : 'h4') + '" title="' + d + ': ' + n + '"></i>');
  }
  const hrsNeeded = 560, hrsDone = totalMin / 60;
  return `
  <h1>進捗 — progress</h1>
  <div class="sub">Honest numbers. If they look bad, the plan changes, not the numbers.</div>
  <div class="grid cols4">
    <div class="stat mid"><div class="n">${mature}</div><div class="l">mature cards</div></div>
    <div class="stat kin"><div class="n">${learning}</div><div class="l">learning</div></div>
    <div class="stat"><div class="n">${totalRev}</div><div class="l">total reviews</div></div>
    <div class="stat aka"><div class="n">${hrsDone.toFixed(1)}</div><div class="l">hours logged</div></div>
  </div>

  <h2>Hours against the N3 budget</h2>
  <div class="card">
    <div class="small muted">${hrsDone.toFixed(1)} of ~${hrsNeeded} efficient hours to be N3-ready by Aug 2027.</div>
    <div class="bar"><i style="width:${Math.min(100, hrsDone / hrsNeeded * 100).toFixed(1)}%"></i></div>
    <div class="small dim" style="margin-top:7px">Only dashboard minutes are counted. Handwriting, Duolingo,
      film and reading are real study but are not instrumented — so the real figure is higher than this bar.</div>
  </div>

  <h2>Last 70 days</h2>
  <div class="card"><div class="heat">${days.join('')}</div></div>

  <h2>Retention</h2>
  <div class="grid cols3">
    <div class="stat"><div class="n">${retention(7) === null ? '—' : retention(7) + '%'}</div><div class="l">7 days</div></div>
    <div class="stat"><div class="n">${retention(30) === null ? '—' : retention(30) + '%'}</div><div class="l">30 days</div></div>
    <div class="stat"><div class="n">${retention(9999) === null ? '—' : retention(9999) + '%'}</div><div class="l">all time</div></div>
  </div>
  <div class="card small" style="margin-top:12px">
    Target band is <strong>80-85%</strong>. Above 90% the material is too easy and you are wasting
    reps. Below 78% intake is outrunning consolidation — cut new cards before adding anything.
  </div>

  <h2>Sync &amp; control</h2>
  <div class="card">
    <div class="row">
      <button class="btn" onclick="exportProgress()">Sync — download progress file</button>
      <label class="btn ghost" style="cursor:pointer">Import a progress file
        <input type="file" accept=".json" style="display:none" onchange="importProgress(this)"></label>
      <button class="btn ghost" onclick="advanceSprint()">Advance to sprint ${S.sprint + 1}</button>
      <button class="btn ghost" onclick="resetAll()">Reset everything</button>
    </div>
    <div class="small dim" style="margin-top:10px">
      A local page cannot write to disk, so Sync downloads <code>nihongo-progress-&lt;date&gt;.json</code>.
      Claude copies the newest one from your Downloads folder into <code>learner/progress.json</code> at
      the start of each session. Click Sync before you close the tab if you want the session on record.
      <br>Daily new-card cap: <strong>${S.settings.dailyNew || DAILY_NEW}</strong>.
      Advancing a sprint is gated on the exit test in the roadmap — don't advance on feel.
    </div>
  </div>`;
};
window.exportProgress = function () {
  save();
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nihongo-progress-' + TODAY() + '.json';
  a.click();
};
window.importProgress = function (input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = function () {
    try { S = Object.assign(structuredClone(DEFAULT_STORE), JSON.parse(r.result)); save(); render(); }
    catch (e) { alert('That file could not be parsed.'); }
  };
  r.readAsText(f);
};
window.advanceSprint = function () {
  if (!confirm('Advance to sprint ' + (S.sprint + 1) + '? Only do this after passing the exit test in the roadmap.')) return;
  S.sprint++; save(); render();
};
window.resetAll = function () {
  if (!confirm('This erases all SRS progress on this browser. Export first. Continue?')) return;
  S = structuredClone(DEFAULT_STORE); save(); render();
};

/* ---------- view: plan ---------- */
VIEWS.plan = function () {
  return `
  <h1>計画 — the plan</h1>
  <div class="sub">Sixteen sprints, Nov 2026 → Nov 2027. Every sprint has an exit test. No sprint advances on vibes.</div>
  <div class="card">
    <table><thead><tr><th>#</th><th>Sprint</th><th>Weeks</th><th>Exit test</th></tr></thead><tbody>
    ${[
      [1, 'Katakana + survival grammar', 2, '46/46 katakana under 90s; 20 loanwords read cold'],
      [2, 'First 80 kanji + particles', 3, 'Kanji recognition ≥90%; particle cloze ≥85%'],
      [3, 'Kanji 81-180, adjectives, て-form', 3, '20 unseen verbs/adjectives in 6 forms, no errors'],
      [4, 'N5 closure + first real reading', 2, 'Full N5 mock ≥85%'],
      [5, 'Plain form, casual speech, conjunctions', 3, 'Convert a polite passage to casual, no errors'],
      [6, 'Potential, volitional, と/ば/たら/なら', 3, 'Four-way conditional discrimination ≥85%'],
      [7, 'Passive, causative, causative-passive', 3, 'Transformation table from memory'],
      [8, 'Keigo foundations + あげる/くれる/もらう', 3, 'Direction-of-benefit drill ≥85%'],
      [9, 'N4 consolidation', 2, 'N4 mock ≥80% → sit July 2027 N4'],
      [10, 'N3 modality: そう/よう/らしい/みたい', 3, 'Evidentiality discrimination ≥80%'],
      [11, 'Compound particles', 3, 'Cloze ≥80% on unseen items'],
      [12, 'Nominalisation: こと/の/ところ/わけ/はず', 3, 'Cloze ≥80%'],
      [13, 'Kanji sprint — compounds, on-reading prediction', 4, 'Predict readings of unseen compounds ≥70%'],
      [14, 'Reading velocity', 3, 'N3 passage set inside exam time'],
      [15, 'Listening at speed', 3, 'Drama episode, no subtitles, ≥70% comprehension'],
      [16, 'Mock exams and weak-area surgery', 4, 'Three N3 mocks ≥75%']
    ].map(function (r) {
      return `<tr style="${r[0] === S.sprint ? 'background:var(--bg3)' : ''}">
        <td>${r[0] === S.sprint ? '<strong style="color:var(--aka)">▸ ' + r[0] + '</strong>' : r[0]}</td>
        <td>${esc(r[1])}</td><td class="dim">${r[2]}w</td><td class="small muted">${esc(r[3])}</td></tr>`;
    }).join('')}
    </tbody></table>
  </div>
  <h2>Running alongside, the whole way</h2>
  <div class="grid cols3">
    <div class="card small"><strong>Reading ladder</strong><br><span class="muted">Tadoku graded readers →
      NHK News Web Easy → よつばと! → essays → 夏目漱石『こころ』 → 宮沢賢治</span></div>
    <div class="card small"><strong>Listening &amp; film</strong><br><span class="muted">Nihongo con Teppei →
      日本語の森 → Ghibli (JP subs) → 深夜食堂 → documentary → 小津『東京物語』 → ゆる言語学ラジオ</span></div>
    <div class="card small"><strong>Poetry</strong><br><span class="muted">Bashō haiku from Sprint 6 —
      17 syllables of complete, memorisable Japanese. Then Buson, Issa, 石川啄木's tanka.</span></div>
  </div>
  <div class="card small" style="margin-top:12px">
    Full detail, including the hour budget and why 2 h/day is the threshold:
    <code>curriculum/ROADMAP.md</code>. Pedagogical standards: <code>CLAUDE.md</code>.
  </div>`;
};

/* ---------- view: placement diagnostic ----------
   Measures what is currently only self-reported. Three phases, no teaching, no feedback
   until the end — feedback mid-test would contaminate the measurement. */
let P = null;

const PH = [
  { n: 1, title: 'Hiragana recognition speed', unit: 'character',
    blurb: 'All 46 basic hiragana, one at a time, in random order. Type the romaji and press Enter. ' +
           'Do not stop to think — if it does not come in two seconds, it is not automatic, and that ' +
           'is exactly what is being measured. Accuracy and speed both count.' },
  { n: 2, title: 'Dakuten, yōon and small っ', unit: 'word',
    blurb: 'Twenty words. These are the four things that quietly break for people who "know hiragana": ' +
           'voicing marks, the small ゃゅょ glides, the small っ that doubles the next consonant, and ' +
           'long vowels. Type the romaji for the whole word.' },
  { n: 3, title: 'Particle pronunciation', unit: 'particle',
    blurb: 'Five sentences. Type how the underlined particle is PRONOUNCED, not how it is written. ' +
           'This separates real knowledge from pattern-matching.' }
];

function placementItems(phase) {
  if (phase === 1) return shuffle(window.HIRAGANA).map(function (h) {
    return { q: h.kana, a: h.romaji, why: '' }; });
  if (phase === 2) return window.PLACEMENT_WORDS.map(function (w) {
    return { q: w[0], a: w[1], why: w[2] }; });
  return window.PLACEMENT_PARTICLES.map(function (w) {
    return { q: w[0], a: w[1], why: w[2] }; });
}

VIEWS.placement = function () {
  if (!P) {
    return `<h1>診断 — placement drill</h1>
    <div class="sub">Before anything is taught, four claims in your profile get measured.
      This takes about eight minutes and it is not a test you can fail — it is a baseline.</div>
    <div class="card">
      <p class="small muted" style="margin-top:0">Right now the course assumes you read hiragana fluently,
        handle dakuten and yōon, and have some grammar from Duolingo. All three are self-reported.
        If any of them is weaker than assumed, teaching katakana on top of it builds on sand — so
        we check first. Results are stored and the sprint plan adjusts to them.</p>
      ${PH.map(function (p) {
        return `<div style="border-left:2px solid var(--line);padding-left:12px;margin:14px 0">
          <strong>Phase ${p.n} — ${esc(p.title)}</strong>
          <div class="small dim">${esc(p.blurb)}</div></div>`; }).join('')}
      <div class="small dim" style="margin:16px 0 12px">No feedback until the end. Answer in romaji,
        lower case, Enter to submit. Nothing here is graded into your SRS.</div>
      <button class="btn" onclick="startPlacement()">Begin — phase 1</button>
    </div>
    ${S.placement ? `<h2>Previous result — ${S.placement.date}</h2>
      <div class="card small">${placementVerdict(S.placement, true)}</div>` : ''}`;
  }

  if (P.phase > 3) return placementResults();

  const ph = PH[P.phase - 1];
  const it = P.items[P.i];
  const big = P.phase === 1 ? 'prompt-xl' : P.phase === 2 ? 'prompt-lg' : 'prompt-md';
  return `<div id="review">
    <div class="progressline">${P.items.map(function (_, i) {
      return '<i class="' + (i < P.i ? 'ok' : i === P.i ? 'now' : '') + '"></i>'; }).join('')}</div>
    <div class="row small dim" style="justify-content:space-between;margin-bottom:10px">
      <span><span class="tag">phase ${P.phase} of 3</span> <span class="tag">${esc(ph.title)}</span></span>
      <span>${P.i + 1} / ${P.items.length}</span>
    </div>
    <div class="q">
      <div class="${big} jp">${esc(it.q)}</div>
      <input id="pin" autocomplete="off" autocapitalize="off" spellcheck="false"
        placeholder="${P.phase === 3 ? 'pronunciation' : 'romaji'}">
    </div>
    <div class="center small dim" style="margin-top:14px">Enter to submit. No going back.</div>
  </div>`;
};
afterRender.placement = function () {
  const t = document.getElementById('pin');
  if (!t) return;
  t.focus();
  t.onkeydown = function (e) {
    if (e.key !== 'Enter') return;
    const v = t.value.trim().toLowerCase();
    if (!v) return;
    const it = P.items[P.i];
    P.answers.push({ q: it.q, a: it.a, given: v, ok: v === it.a, ms: NOW() - P.t0, why: it.why });
    P.i++;
    P.t0 = NOW();
    if (P.i >= P.items.length) {
      P.results[P.phase] = P.answers;
      P.phase++; P.i = 0; P.answers = [];
      if (P.phase <= 3) { P.items = placementItems(P.phase); P.t0 = NOW(); }
    }
    render();
  };
};
window.startPlacement = function () {
  P = { phase: 1, i: 0, items: placementItems(1), answers: [], results: {}, t0: NOW() };
  render();
};

function phaseStats(rows) {
  if (!rows || !rows.length) return null;
  const ok = rows.filter(function (r) { return r.ok; }).length;
  const times = rows.map(function (r) { return r.ms; }).sort(function (a, b) { return a - b; });
  return { n: rows.length, ok: ok, acc: Math.round(ok / rows.length * 100),
    median: times[Math.floor(times.length / 2)],
    errors: rows.filter(function (r) { return !r.ok; }) };
}

function placementResults() {
  const p1 = phaseStats(P.results[1]), p2 = phaseStats(P.results[2]), p3 = phaseStats(P.results[3]);
  const rec = { date: TODAY(),
    p1: { acc: p1.acc, median: p1.median, errors: p1.errors.map(function (e) { return e.q + '→' + e.given; }) },
    p2: { acc: p2.acc, median: p2.median, errors: p2.errors.map(function (e) { return e.q + '→' + e.given + ' (' + e.why + ')'; }) },
    p3: { acc: p3.acc, median: p3.median, errors: p3.errors.map(function (e) { return e.q + '→' + e.given + ' (' + e.why + ')'; }) } };
  S.placement = rec; save();
  const out = `<h1>診断 — result</h1>
  <div class="sub">Measured ${rec.date}. This is now the baseline the sprint plan is built on.</div>
  <div class="grid cols4">
    <div class="stat ${p1.acc >= 95 ? 'mid' : 'aka'}"><div class="n">${p1.acc}%</div><div class="l">hiragana accuracy</div></div>
    <div class="stat ${p1.median <= 1500 ? 'mid' : 'kin'}"><div class="n">${(p1.median / 1000).toFixed(2)}s</div><div class="l">median per char</div></div>
    <div class="stat ${p2.acc >= 80 ? 'mid' : 'aka'}"><div class="n">${p2.acc}%</div><div class="l">dakuten / yōon / っ</div></div>
    <div class="stat ${p3.acc === 100 ? 'mid' : 'aka'}"><div class="n">${p3.acc}%</div><div class="l">particles</div></div>
  </div>
  <h2>What this means</h2>
  <div class="card">${placementVerdict(rec, false)}</div>
  ${[['Hiragana misses', p1], ['Dakuten / yōon / っ misses', p2], ['Particle misses', p3]].map(function (pair) {
    const s = pair[1];
    if (!s.errors.length) return '';
    return `<h2>${pair[0]}</h2><div class="card small"><div class="wordlist">${s.errors.map(function (e) {
      return '<div class="w"><span>' + esc(e.q) + '</span> <em>you said "' + esc(e.given) +
        '", answer is "' + esc(e.a) + '"' + (e.why ? ' — ' + esc(e.why) : '') + '</em></div>'; }).join('')}</div></div>`;
  }).join('')}
  <div class="row" style="margin-top:20px">
    <button class="btn" onclick="exportProgress()">Sync — send this to Claude</button>
    <button class="btn ghost" onclick="go('kana')">On to katakana</button>
    <button class="btn ghost" onclick="P=null;render()">Run it again</button>
  </div>
  <div class="small dim" style="margin-top:10px">Click Sync, then tell Claude it's done — the result
    file lands in your Downloads folder and Claude reads it at the start of the next session.</div>`;
  P = null;
  return out;
}

function placementVerdict(r, terse) {
  const L = [];
  if (r.p1.acc >= 98 && r.p1.median <= 1200)
    L.push('<strong>Hiragana is solid and automatic.</strong> Nothing to fix. Katakana can start today.');
  else if (r.p1.acc >= 95)
    L.push('<strong>Hiragana is accurate but slow</strong> (' + (r.p1.median / 1000).toFixed(2) +
      's per character against a 1.0–1.2s target). Accuracy at reading speed is not the same as ' +
      'accuracy with time to think, and slow kana recognition throttles everything downstream — ' +
      'you cannot read a sentence if each character costs a conscious lookup. Fix: five minutes of ' +
      'timed kana drill daily until the median drops under 1.2s. This runs alongside katakana, not before it.');
  else
    L.push('<strong>Hiragana is not yet reliable</strong> (' + r.p1.acc + '%). This is the one case ' +
      'where the plan changes: katakana waits two days while the gaps above are repaired. Building ' +
      'a second script on an unreliable first one doubles the confusion instead of adding to it.');

  if (r.p2.acc >= 90) L.push('<strong>Dakuten, yōon and small っ are under control.</strong> That is the half of hiragana most people skip.');
  else if (r.p2.acc >= 70) L.push('<strong>Dakuten/yōon/っ are shaky</strong> (' + r.p2.acc + '%). ' +
    'Specifically the small っ and long-vowel spellings. These are not advanced — they are in every ' +
    'other word, and they are why listening collapses later. They get drilled in Sprint 1 alongside katakana.');
  else L.push('<strong>Dakuten/yōon/っ are a real gap</strong> (' + r.p2.acc + '%). "Knows hiragana" ' +
    'usually means the 46 basic characters; the combining rules are the other half of the system. ' +
    'Sprint 1 now has a second objective and may run three weeks rather than two.');

  if (r.p3.acc === 100) L.push('<strong>Particle pronunciation is correct.</strong> は→wa, へ→e, を→o are in place — that is a good sign about the Duolingo exposure.');
  else L.push('<strong>Particle pronunciation has errors.</strong> は read as "ha" when it is a particle, ' +
    'or を as "wo", is the single most audible beginner tell. Corrected immediately in Sprint 1 — it ' +
    'is one rule, not a skill.');

  if (!terse) L.push('<span class="dim">Full re-plan happens in chat. Click Sync so Claude sees these numbers.</span>');
  return L.map(function (x) { return '<p>' + x + '</p>'; }).join('');
}

/* ---------- boot ---------- */
window.go = go;
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('nav button[data-v]').forEach(function (b) {
    b.onclick = function () { Q = null; go(b.dataset.v); };
  });
  render();
});
