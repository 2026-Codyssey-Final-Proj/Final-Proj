/*! archi-board engine v1.0.0 — 무한 보드 위에 ArchiMate 창 · 객체 지도 · 데이터 지도 · 순서도를 그린다.
 * 데이터는 window.BOARD (board-data.js)에서 읽는다. 형식: https://github.com/gamercross/archi-board/blob/main/skills/archi-board/references/data-format.md
 * MIT License */
(() => {
'use strict';
const VERSION = '1.0.0';
if (!window.BOARD) { document.body.insertAdjacentHTML('afterbegin', '<p style="padding:24px;font:16px system-ui">board-data.js를 board.js보다 먼저 불러 window.BOARD를 채워 주세요.</p>'); return; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/*MODEL-START*/
/* ───────── 모델 ───────── */
const TYPES = {
  stakeholder:['이해관계자','Stakeholder','mot','cut'], driver:['동인','Driver','mot','cut'], assessment:['평가','Assessment','mot','cut'],
  goal:['목표','Goal','mot','cut'], outcome:['결과','Outcome','mot','cut'], principle:['원칙','Principle','mot','cut'], constraint:['제약','Constraint','mot','cut'],
  capability:['능력','Capability','str','round'], resource:['자원','Resource','str','square'], course:['행동 방침','Course of Action','str','round'],
  bactor:['업무 행위자','Business Actor','bus','square'], brole:['업무 역할','Business Role','bus','square'], bprocess:['업무 프로세스','Business Process','bus','round'],
  bservice:['업무 서비스','Business Service','bus','pill'], bobject:['업무 객체','Business Object','bus','square'], product:['상품','Product','bus','square'],
  acomp:['프로그램 구성요소','Application Component','app','square'], aiface:['프로그램 접점','Application Interface','app','square'],
  aservice:['프로그램 서비스','Application Service','app','pill'], dobject:['데이터 객체','Data Object','app','square'],
  node:['노드','Node','tec','square'], syssw:['시스템 소프트웨어','System Software','tec','square'], tservice:['기술 서비스','Technology Service','tec','pill'],
  artifact:['산출물','Artifact','tec','square'], plateau:['단계(고원)','Plateau','imp','square'], wp:['작업 묶음','Work Package','imp','round']
};
const LAYERS = [['mot','동기','Motivation'],['str','전략','Strategy'],['bus','업무','Business'],['app','프로그램','Application'],['tec','기술','Technology'],['imp','이행','Implementation & Migration']];
const LK = Object.fromEntries(LAYERS.map(l => [l[0], l[1]])); LK.seq = '순서';
const RELS = {
  realization:['실현한다','Realization'], serving:['지원한다','Serving'], assignment:['맡는다','Assignment'], access:['읽고 쓴다','Access'],
  flow:['넘겨준다','Flow'], triggering:['다음으로 이어진다','Triggering'], influence:['영향을 준다','Influence'],
  composition:['으로 이루어진다','Composition'], aggregation:['을 묶는다','Aggregation'], association:['와 관련된다','Association']
};
const ST = {done:'있음', part:'일부', todo:'없음', cand:'후보', gone:'뺌'};
/*MODEL-END*/

/* ───────── 데이터 읽기 — board-data.js가 window.BOARD에 둔 것을 엔진이 쓰는 모양으로 ───────── */
const B = window.BOARD || {};
const FORMAT = 1;
if (B.format && Math.floor(B.format) !== FORMAT) console.warn(`[archi-board] 데이터 형식 ${B.format}은 이 엔진(v${FORMAT})과 다릅니다. engine/v${Math.floor(B.format)}/를 쓰세요.`);
const arr = v => Array.isArray(v) ? v : [];
const FRAMES = arr(B.frames).map(f => Object.assign({kicker: '', title: f.id, weight: 3, w: 900, layout: 'rows', sub: '', desc: '', why: '', recent: [], ring: [], center: []}, f));
const E = arr(B.elements).map(x => Array.isArray(x)
  ? (([f, id, t, n, d, s, c, extra]) => Object.assign({f, id, t, n, d: d || '', s: s || 'rule', c: c || ''}, extra || {}))(x)
  : Object.assign({d: '', s: 'rule', c: ''}, x));
const R = arr(B.relations).map(r => Array.isArray(r) ? r : [r.from, r.to, r.type]);
const FLOWS = arr(B.flows).map(x => Array.isArray(x) ? x : [x.from, x.to, x.label || '', x.lift || 0]);
const TOUR = arr(B.tour).map(t => Object.assign({f: [], ids: [], p: ''}, t));
const LN = B.lanes || {};
const UC = arr(B.usecases).map(u => Object.assign({d: '', s: u.t || u.id, rel: []}, u, {
  steps: arr(u.steps).map(st => Array.isArray(st)
    ? {a: st[0], b: st[1], t: st[2], c: st[3] || '', r: !!(st[4] && st[4].r), alt: (st[4] && st[4].alt) || ''}
    : Object.assign({c: '', r: false, alt: ''}, st))
}));
const UCI = Object.fromEntries(UC.map(u => [u.id, u]));
const SCR = arr(B.screens).map(x => Object.assign({url: '', mv: '', fe: [], be: [], els: [], uc: '', k: 0}, x));
const IMG = B.images || {};
const MXR = arr(B.matrixRows);
const ROWN = B.rowNames || {};
function involve(u, el) {
  const keys = new Set(u.lanes.filter(k => LN[k] && LN[k][1] === el)), c = {o: 0, i: 0, sf: 0, first: -1, keys};
  u.steps.forEach((x, k) => {
    const A = keys.has(x.a), Bk = keys.has(x.b);
    if (A && Bk) c.sf++; else if (A) c.o++; else if (Bk) c.i++; else return;
    if (c.first < 0) c.first = k;
  });
  return c;
}
// 객체 지도
const OM = B.objectMap || {};
const PKG = arr(OM.packages).map(p => Object.assign({row: 0, l: 'app', d: '', ids: []}, p));
const OBJ = {}, ON = {}, OST = {};
Object.entries(OM.objects || {}).forEach(([id, o]) => {
  OBJ[id] = Object.assign({one: '', what: '', why: '', how: [], holds: [], api: [], calls: [], fails: [], rules: [], change: [], files: []}, o);
  ON[id] = o.name || id; OST[id] = o.kind || '';
});
const L2O = k => (OM.laneMap || {})[k] || (LN[k] ? LN[k][1] : k);
const EXTRA = arr(OM.extra);
const UCX = OM.usecaseNotes || {};
const JOURNEY = arr(OM.journey).filter(id => UCI[id]);
const OIDS = PKG.flatMap(p => p.ids).filter(id => OBJ[id]);
PKG.forEach(p => { p.ids = p.ids.filter(id => OBJ[id]); p.ids.forEach(id => { const o = OBJ[id]; o.id = id; o.pk = p; o.row = p.row; }); });
function involveO(u, oid) {
  const keys = new Set(u.lanes.filter(k => L2O(k) === oid)), c = {o: 0, i: 0, sf: 0, first: -1, keys};
  u.steps.forEach((x, k) => {
    const A = keys.has(x.a), Bk = keys.has(x.b);
    if (A && Bk) c.sf++; else if (A) c.o++; else if (Bk) c.i++; else return;
    if (c.first < 0) c.first = k;
  });
  return c;
}
const OUC = Object.fromEntries(OIDS.map(id => [id, UC.filter(u => !u.prop).map(u => ({u, c: involveO(u, id)})).filter(x => x.c.first >= 0)]));
const OEM = new Map();
UC.forEach(u => !u.prop && u.steps.forEach((x, k) => {
  if (x.r) return;
  const a = L2O(x.a), b = L2O(x.b);
  if (a === b || !OBJ[a] || !OBJ[b]) return;
  const key = a + '>' + b;
  let e = OEM.get(key);
  if (!e) OEM.set(key, e = {a, b, n: 0, list: []});
  e.n++; e.list.push({u, k});
}));
EXTRA.forEach(([a, b, t]) => { if (OBJ[a] && OBJ[b] && !OEM.has(a + '>' + b)) OEM.set(a + '>' + b, {a, b, n: 0, list: [], t}); });
const OE = [...OEM.values()];
function dirText(c) { return [c.o && `보냄 ${c.o}`, c.i && `받음 ${c.i}`, c.sf && `안에서 ${c.sf}`].filter(Boolean).join(' · '); }
// 데이터 지도
const DMAP = B.dataMap || {};
const DS = arr(DMAP.stores).map(s => Object.assign({l: 'app', life: '', d: ''}, s));
const DM = arr(DMAP.data).map(x => Object.assign({k: '', one: '', shape: [], w: [], r: [], lim: '—', life: '', never: '—', change: '—', tests: []}, x));
const DFLOW = arr(DMAP.flow).map(s => Object.assign({d: '', dm: []}, s));
const DMI = {}; DM.forEach(x => { DMI[x.id] = x; x.s = x.s || 'done'; });
const DSI = {}; DS.forEach(s => { DSI[s.id] = s; s.ids = DM.filter(x => x.st === s.id).map(x => x.id); });
const ODM = {};
DM.forEach(x => [['w','쓴다'],['r','읽는다'],['v','거친다']].forEach(([k, verb]) => (x[k] || []).forEach(([o]) => { if (!o) return; (ODM[o] = ODM[o] || []).push({x, verb}); })));

const SHELL = `<div class="app">
  <header class="top">
    <div class="top-row">
      <div class="brand"><h1>${esc(B.title || 'archi-board')}</h1><p>${esc(B.sub || '')}</p></div>
      <div class="acts">
        <button class="btn pri" id="bObj" type="button">객체 지도</button>
        <button class="btn" id="bData" type="button">데이터 지도</button>
        <button class="btn" id="bTour" type="button">흐름 따라가기</button>
        <button class="btn" id="bUC" type="button">순서 · 앱</button>
        <button class="btn" id="bFit" type="button">전체 보기</button>
        <button class="btn" id="bLegend" type="button">읽는 법</button>
      </div>
    </div>
    <nav class="chips" id="chips" aria-label="창으로 가기"></nav>
  </header>
  <main class="board far" id="board" aria-label="작업 보드. 끌어서 움직이고, Ctrl 또는 ⌘와 휠로 확대합니다.">
    <div class="world" id="world">
      <div class="layer" id="frames"></div>
      <svg class="layer" id="edges" aria-hidden="true"></svg>
      <div class="layer" id="els"></div>
      <div class="layer" id="seqs"></div>
      <div class="layer" id="sums"></div>
      <svg class="layer flows" id="flows" aria-hidden="true"></svg>
    </div>
    <div class="mini" id="mini" title="누르면 그 자리로 갑니다"><svg id="miniSvg"></svg></div>
    <div class="hint">끌어서 이동 · Ctrl/⌘ + 휠 또는 두 손가락으로 확대</div>
    <div class="zoom">
      <button type="button" id="zOut" aria-label="축소">−</button>
      <output id="zLv">100%</output>
      <button type="button" id="zIn" aria-label="확대">+</button>
    </div>
    <aside class="panel" id="panel" hidden>
      <header><div class="ph"><div class="pk" id="pK"></div><h2 id="pT"></h2></div><button class="x" id="pX" type="button" aria-label="닫기">✕</button></header>
      <div class="pb" id="pB"></div>
    </aside>
    <section class="tour" id="tour" hidden aria-live="polite">
      <div class="tn"><span id="tN"></span><span class="dots" id="tD"></span></div>
      <h2 id="tT"></h2>
      <p id="tP"></p>
      <div class="tb">
        <button class="btn" id="tSeq" type="button" hidden>순서도에서 보기</button>
        <button class="btn" id="tPlay" type="button">자동으로 넘기기</button>
        <button class="btn" id="tPrev" type="button">이전</button>
        <button class="btn pri" id="tNext" type="button">다음</button>
        <button class="btn" id="tClose" type="button">닫기</button>
      </div>
    </section>
    <div class="lightbox" id="lightbox" hidden role="dialog" aria-label="화면 크게 보기"><img id="lbImg" alt=""><p id="lbCap"></p></div>
    <section class="legend" id="legend" hidden>
      <button class="x" id="lX" type="button" aria-label="닫기">✕</button>
      <h2>읽는 법</h2>
      <p>보드 위의 창 하나가 일 하나다. <b>창이 클수록 중심</b>이고, 파란 테두리 창이 메인 흐름이다. 멀리서는 창 이름과 진행 막대만, 가까이 가면 창 안의 ArchiMate 상자가 보인다. 창 사이의 움직이는 선은 일이 넘어가는 방향이다. 상자를 누르면 이어진 상자가 다른 창에 있어도 함께 켜진다.</p>
      <p data-sec="lgQ">창 아래의 <b>순서</b> 칸은 사람과 앱 사이를 어떤 차례로 오가는지(유즈케이스)다. 세로 줄 하나가 사람이나 앱 하나이고, 위에서 아래로 시간이 흐른다. <b>▶ 따라가기</b>를 누르면 한 칸씩 짚어 준다.</p>
      <p data-sec="lgO"><b>객체 지도</b>는 프로그램을 이루는 부품 하나를 카드 하나로 그린 것이다. 카드를 누르면 맡은 일 · 안에서 도는 순서 · 실패할 때 · 고칠 때 볼 파일이 나온다. 카드 안의 작은 순서도를 누르면 카드 사이로 점이 움직이며 따라간다.</p>
      <p data-sec="lgD"><b>데이터 지도</b>는 데이터가 놓이는 곳과, 데이터마다 어느 부품이 쓰고(→) 읽는지(←)를 카드로 그린 것이다. 카드를 누르면 모양 · 한도 · 언제 사라지나 · 남기지 않는 것 · 바꿀 때 같이 고칠 곳이 나온다.</p>
      <h3 data-sec="lgO">객체 지도</h3><div class="lg" id="lgO" data-sec="lgO"></div>
      <h3 data-sec="lgD">데이터 지도</h3><div class="lg" id="lgD" data-sec="lgD"></div>
      <h3>층 (상자 색)</h3><div class="lg" id="lgL"></div>
      <h3>상자 모양</h3><div class="lg" id="lgS"></div>
      <h3>상태</h3><div class="lg" id="lgT"></div>
      <h3>관계 (선)</h3><div class="lg" id="lgR"></div>
      <h3 data-sec="lgQ">순서 (창 안의 유즈케이스)</h3><div class="lg" id="lgQ" data-sec="lgQ"></div>
    </section>
  </main>
</div>

`;
/* ───────── 배치 ───────── */
const EW = 180, EH = 78, G = 14, PAD = 24, HEAD = 84, LAB = 34, GX = 90, GY = 120;
const byId = {}; E.forEach(x => byId[x.id] = x);
const FR = {}; FRAMES.forEach(f => { FR[f.id] = f; f.items = E.filter(x => x.f === f.id); f.bands = []; });
const FL = l => FRAMES.find(f => f.layout === l) || null;
const FO = FL('objects'), FD = FL('datamap'), FM = FL('matrix'), FRING = FL('ring'), FSCR = FL('screens');

function place(it, x, y, w, h) { it.lx = x; it.ly = y; it.w = w; it.h = h; }
function rows(f, items, y) {
  const per = Math.max(1, Math.floor((f.w - 2 * PAD - LAB + G) / (EW + G)));
  for (const [lk] of LAYERS) {
    const its = items.filter(i => TYPES[i.t][2] === lk);
    if (!its.length) continue;
    const n = Math.ceil(its.length / per), bh = n * (EH + G) - G;
    f.bands.push({lk, y: y - 10, h: bh + 20});
    its.forEach((it, i) => place(it, PAD + LAB + (i % per) * (EW + G), y + Math.floor(i / per) * (EH + G), EW, EH));
    y += bh + 20 + G;
  }
  return y;
}
const SQ = {head: 64, lane: 52, row: 74, pad: 24, gap: 30, minLane: 160};
const seqH = u => SQ.head + SQ.lane + u.steps.length * SQ.row + SQ.pad;
function seqs(f, y) {
  const list = UC.filter(u => u.f === f.id);
  if (!list.length) return y;
  const avail = f.w - 2 * PAD - LAB, x0 = PAD + LAB, top = y, rowsU = [];
  let cur = [], used = 0;
  list.forEach(u => {
    const nat = u.lanes.length * SQ.minLane;
    if (cur.length && used + SQ.gap + nat > avail) { rowsU.push(cur); cur = []; used = 0; }
    used += (cur.length ? SQ.gap : 0) + nat; cur.push(u);
  });
  rowsU.push(cur);
  rowsU.forEach(row => {
    const w = (avail - (row.length - 1) * SQ.gap) / row.length;
    let hm = 0;
    row.forEach((u, i) => { u.lx = x0 + i * (w + SQ.gap); u.ly = y; u.w = w; u.h = seqH(u); hm = Math.max(hm, u.h); });
    y += hm + SQ.gap;
  });
  y -= SQ.gap;
  f.bands.push({lk: 'seq', y: top - 10, h: y - top + 20});
  return y + 20 + G;
}
// 객체 지도: 줄마다 묶음(패키지)을 가로로 놓고, 묶음 안에 객체 카드를 가로로 놓는다
const OC = {w: 440, gap: 24, pp: 20, ph: 84, pg: 70, rg: 200};
function obH(o) {
  const nu = OUC[o.id].length, api = Math.min(4, o.api.length);
  return 62 + 70 + (api ? 26 + api * 21 : 0) + (o.holds.length ? 26 + 44 : 0) + 26 + Math.max(1, Math.ceil(nu / 3)) * 104 + 40 + 16;
}
function layoutObjects(f) {
  const rowsP = [...new Set(PKG.map(p => p.row))].map(r => PKG.filter(p => p.row === r));
  const pw = p => OC.pp * 2 + p.ids.length * OC.w + (p.ids.length - 1) * OC.gap;
  const rw = row => row.reduce((a, p) => a + pw(p), 0) + (row.length - 1) * OC.pg;
  const maxW = Math.max(...rowsP.map(rw));
  let y = HEAD + 36;
  rowsP.forEach(row => {
    let x = PAD + (maxW - rw(row)) / 2, hmax = 0;
    row.forEach(p => {
      const ch = Math.max(...p.ids.map(id => obH(OBJ[id])));
      p.lx = x; p.ly = y; p.w = pw(p); p.h = OC.ph + ch + OC.pp;
      p.ids.forEach((id, i) => { const o = OBJ[id]; o.lx = x + OC.pp + i * (OC.w + OC.gap); o.ly = y + OC.ph; o.w = OC.w; o.h = ch; });
      x += p.w + OC.pg; hmax = Math.max(hmax, p.h);
    });
    y += hmax + OC.rg;
  });
  f.w = Math.max(f.w, maxW + 2 * PAD);
  return y - OC.rg + G;
}
function layoutData(f) {
  if (FO) f.w = FO.w;
  const fx = PAD + 16, fw = f.w - 2 * fx, n = DFLOW.length, bg = 70, bw = (fw - (n - 1) * bg) / n, bh = 150, fy = HEAD + 30;
  const cg = 44, cw = (fw - (DS.length - 1) * cg) / DS.length, pp = 22, hh = 140, ch = 262, gap = 22;
  const sy = fy + 46 + bh + 80, most = Math.max(...DS.map(s => s.ids.length)), sh = hh + most * (ch + gap) - gap + pp;
  f.dl = {fx, fy, fw, bw, bh, bg, sx: fx, sy, cw, cg, pp, hh, ch, gap, sh};
  return sy + sh + G;
}
function layout(f) {
  let bottom;
  if (f.layout === 'ring') {
    const RW = EW + 24, ry = 230, cx = f.w / 2, rx = f.w / 2 - PAD - RW / 2 - 8, cy = HEAD + 40 + ry + EH / 2;
    f.ring.forEach((id, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / f.ring.length; place(byId[id], cx + rx * Math.cos(a) - RW / 2, cy + ry * Math.sin(a) - EH / 2, RW, EH); });
    f.center.forEach((id, i) => place(byId[id], cx - RW / 2, cy - EH - 7 + i * (EH + 14), RW, EH));
    f.ringG = {cx, cy, rx, ry};
    const rest = f.items.filter(x => !f.ring.includes(x.id) && !f.center.includes(x.id));
    bottom = rows(f, rest, cy + ry + EH / 2 + 48);
  } else if (f.layout === 'time') {
    const cols = f.items.filter(x => x.t === 'plateau').sort((a, b) => a.col - b.col);
    const PW = 230, per = 3, ww = (f.w - 2 * PAD - PW - G - (per - 1) * G) / per, WH = 98;
    let y = HEAD + 22;
    cols.forEach(p => {
      const ws = f.items.filter(w => w.t === 'wp' && w.col === p.col);
      const n = Math.max(1, Math.ceil(ws.length / per)), bh = n * (WH + G) - G;
      place(p, PAD, y, PW, bh);
      ws.forEach((w, i) => place(w, PAD + PW + G + (i % per) * (ww + G), y + Math.floor(i / per) * (WH + G), ww, WH));
      y += bh + G + 16;
    });
    bottom = y - 16;
  } else if (f.layout === 'screens') {
    const cols = 4, gap = 30, cw = (f.w - 2 * PAD - (cols - 1) * gap) / cols, ih = Math.round(cw * 820 / 1280), ch = ih + 430;
    SCR.forEach((x, i) => { x.lx = PAD + (i % cols) * (cw + gap); x.ly = HEAD + 26 + Math.floor(i / cols) * (ch + gap); x.w = cw; x.h = ch; x.ih = ih; });
    bottom = HEAD + 26 + Math.ceil(SCR.length / cols) * (ch + gap) - gap + G;
  } else if (f.layout === 'matrix') {
    f.mx = {x: PAD, y: HEAD + 20, w: f.w - 2 * PAD, h: 70 + MXR.length * 39};
    bottom = f.mx.y + f.mx.h + G;
  } else if (f.layout === 'objects') bottom = layoutObjects(f);
  else if (f.layout === 'datamap') bottom = layoutData(f);
  else bottom = rows(f, f.items, HEAD + 26);
  bottom = seqs(f, bottom);
  f.h = Math.round(bottom + PAD - G);
}
[...FRAMES].sort((a, b) => (a.layout === 'datamap') - (b.layout === 'datamap')).forEach(layout);

// 배치: BOARD.arrange = [열, 열, …], 열 = [줄, 줄, …], 줄 = [창 id, …]. 없거나 빠진 창은 첫 열 아래에 셋씩 놓는다.
(function arrange() {
  const seen = new Set();
  const cols = (arr(B.arrange).length ? B.arrange : [[]]).map(c => arr(c).map(r => (Array.isArray(r) ? r : [r]).filter(id => FR[id] && !seen.has(id) && seen.add(id))).filter(r => r.length));
  const rest = FRAMES.filter(f => !seen.has(f.id)).map(f => f.id);
  for (let i = 0; i < rest.length; i += 3) cols[0].push(rest.slice(i, i + 3));
  let x0 = 0;
  cols.forEach(col => {
    let y = 0, wmax = 0;
    col.forEach(row => {
      let x = x0, hmax = 0;
      row.forEach(id => { const f = FR[id]; f.x = x; f.y = y; x += f.w + 60; hmax = Math.max(hmax, f.h); });
      wmax = Math.max(wmax, x - 60 - x0); y += hmax + GY;
    });
    x0 += wmax + GX * 2;
  });
})();
E.forEach(it => { const f = FR[it.f]; it.x = f.x + it.lx; it.y = f.y + it.ly; });
UC.forEach(u => { const f = FR[u.f]; u.x = f.x + u.lx; u.y = f.y + u.ly; });
if (FSCR) SCR.forEach(x => { const f = FSCR; x.x = f.x + x.lx; x.y = f.y + x.ly; });
const WORLD = FRAMES.reduce((a, f) => ({w: Math.max(a.w, f.x + f.w), h: Math.max(a.h, f.y + f.h)}), {w: 0, h: 0});

/* ───────── 그리기 ───────── */
const $ = s => document.querySelector(s);
document.title = B.title || 'archi-board';
document.body.insertAdjacentHTML('afterbegin', SHELL);
const board = $('#board'), world = $('#world');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function counts(items) {
  const c = {done: 0, part: 0, todo: 0, cand: 0, gone: 0};
  items.forEach(x => { if (c[x.s] !== undefined) c[x.s]++; });
  return c;
}
function meter(c) {
  const tot = c.done + c.part + c.todo + c.cand + c.gone;
  if (!tot) return '';
  return '<span class="mbar">' + ['done','part','todo','cand','gone'].map(k => c[k] ? `<i class="${k}" style="width:${c[k] / tot * 100}%"></i>` : '').join('') + '</span>';
}
function countText(c) { return ['done','part','todo','cand','gone'].filter(k => c[k]).map(k => `${ST[k]} ${c[k]}`).join(' · '); }

FRAMES.forEach(f => {
  f.c = counts(f.layout === 'datamap' ? DM : f.items);
  const d = document.createElement('section');
  d.className = `fr w${f.weight}` + (f.main ? ' main' : '');
  d.style.cssText = `left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px`;
  d.innerHTML = `<button class="fh" type="button"><span class="fk">${esc(f.kicker)}</span><span class="ft">${esc(f.title)}</span><span class="fm">${countText(f.c)} ${meter(f.c)}</span></button>` +
    f.bands.map(b => `<div class="band" data-l="${b.lk}" style="top:${b.y}px;height:${b.h}px"><span>${LK[b.lk]}</span></div>`).join('');
  d.querySelector('.fh').addEventListener('click', () => { if (!moved) openFrame(f.id); });
  $('#frames').append(d); f.dom = d;

  const s = document.createElement('button');
  s.type = 'button'; s.className = `sum w${f.weight}` + (f.main ? ' main' : '') + (f.layout === 'objects' || f.layout === 'datamap' ? ' objs' : '');
  s.style.cssText = `left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;--z:${Math.min(2.2, Math.max(1, Math.min(f.w / 800, f.h / 900))).toFixed(2)}`;
  s.innerHTML = `<span class="sk">${esc(f.kicker)}</span><span class="st">${esc(f.title)}</span>` + (f.h > 420 ? `<span class="ss">${esc(f.sub)}</span>` : '') + meter(f.c) + `<span class="sc">${countText(f.c)}</span>`;
  s.addEventListener('click', () => { if (!moved) openFrame(f.id); });
  $('#sums').append(s);

  const ch = document.createElement('button');
  ch.type = 'button'; ch.className = 'chipf' + (f.main ? ' main' : '');
  ch.innerHTML = `${esc(f.title)} ${meter(f.c)}`;
  ch.addEventListener('click', () => openFrame(f.id));
  $('#chips').append(ch);
});

E.forEach(it => {
  const [ko, , lk, sh] = TYPES[it.t];
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `el sh-${sh} st-${it.s}`;
  b.dataset.l = it.t === 'plateau' ? 'pla' : lk;
  b.style.cssText = `left:${it.x}px;top:${it.y}px;width:${it.w}px;height:${it.h}px`;
  b.innerHTML = `<span class="et"><i>${ko}</i>${ST[it.s] ? `<b class="chip ${it.s}">${ST[it.s]}</b>` : ''}</span><span class="en">${esc(it.n)}</span>` +
    (it.t === 'wp' ? `<span class="ew">${esc(it.when)} · ${esc(it.who)}</span>` : '');
  b.addEventListener('click', () => { if (!moved) select(it.id, false); });
  $('#els').append(b); it.dom = b;
});

// 창 안의 순서
const rowName = el => ROWN[el] || byId[el].n;
const layerOf = el => TYPES[byId[el].t][2];
UC.forEach(u => {
  const n = u.lanes.length, lw = u.w / n, cx = i => lw * (i + .5), li = {};
  u.lanes.forEach((k, i) => { li[k] = i; });
  const yAt = k => SQ.head + SQ.lane + k * SQ.row + SQ.row - 12;
  let h = `<div class="sqh"><div class="sqt"><small>유즈케이스 · ${u.steps.length}칸</small><b>${esc(u.t)}</b><span>${esc(u.d)}</span></div><button class="btn pri" type="button" data-play>▶ 따라가기</button></div>`;
  let sv = '', all = '';
  const top = SQ.head + SQ.lane;
  u.lanes.forEach((k, i) => {
    const el = LN[k][1];
    h += `<button class="lh" type="button" data-el="${el}" data-o="${L2O(k)}" data-l="${layerOf(el)}" style="left:${cx(i) - lw / 2 + 6}px;width:${lw - 12}px">${esc(LN[k][0])}</button>`;
    sv += `<line class="ll" x1="${cx(i)}" y1="${top - 4}" x2="${cx(i)}" y2="${u.h - 10}"/>`;
  });
  let labels = '';
  u.steps.forEach((x, k) => {
    const a = li[x.a], b = li[x.b], y = yAt(k);
    let p, L, W, self = a === b;
    if (self) {
      const c = cx(a); p = `M${c + 3} ${y - 18}H${c + 34}V${y}H${c + 9}`;
      L = c + 42; W = Math.max(Math.min(lw * 1.9, u.w - L - 8), 150);
      if (L + W > u.w - 4) L = u.w - 4 - W;
    } else {
      const x1 = cx(a) + (b > a ? 4 : -4), x2 = cx(b) + (b > a ? -7 : 7);
      p = `M${x1} ${y}H${x2}`;
      const lo = Math.min(x1, x2), span = Math.abs(x2 - x1);
      W = Math.max(span - 16, 230); L = clamp(lo + span / 2 - W / 2, 4, u.w - W - 4);
    }
    all += p;
    sv += `<path class="sa${x.r ? ' ret' : ''}" data-m="${x.r ? 'open' : 'triF'}" d="${p}" marker-end="url(#m-${x.r ? 'open' : 'triF'})"/>`;
    labels += `<div class="sl${self ? ' self' : ''}" style="left:${L}px;width:${W}px;top:${y - SQ.row + 12}px;height:${SQ.row - 18}px"><p><b class="n">${k + 1}</b>${x.alt ? `<span class="alt">${esc(x.alt)}</span>` : ''}${esc(x.t)}${x.c ? `<code>${esc(x.c)}</code>` : ''}</p></div>`;
  });
  const dot = reduce ? '' : `<circle class="sdot" r="5.5"><animateMotion dur="${(u.steps.length * 1.3).toFixed(1)}s" repeatCount="indefinite" path="${all}"/></circle>`;
  const d = document.createElement('div');
  d.className = 'seq';
  d.style.cssText = `left:${u.x}px;top:${u.y}px;width:${u.w}px;height:${u.h}px`;
  d.innerHTML = `<svg width="${u.w}" height="${u.h}" aria-hidden="true">${sv}${dot}</svg>` + h + labels;
  d.querySelector('[data-play]').addEventListener('click', () => { if (!moved) playUC(u.id, 0); });
  d.querySelectorAll('.lh').forEach(b => b.addEventListener('click', () => { if (moved) return; const o = b.dataset.o; if (OBJ[o]) openObj(o); else openApp(b.dataset.el); }));
  $('#seqs').append(d);
  u.dom = d; u.arrows = [...d.querySelectorAll('.sa')]; u.labels = [...d.querySelectorAll('.sl')]; u.heads = [...d.querySelectorAll('.lh')];
});

// 앱 화면 카드
if (FSCR) SCR.forEach((x, i) => {
  const d = document.createElement('article');
  d.className = 'scr';
  d.style.cssText = `left:${x.x}px;top:${x.y}px;width:${x.w}px;height:${x.h}px`;
  d.innerHTML = `<button class="shot" type="button" style="height:${x.ih}px" aria-label="${esc(x.t)} 크게 보기"><img src="${(IMG[x.img] || x.img)}" alt="${esc(x.t)}" loading="lazy" decoding="async"></button>` +
    `<div class="sb"><div class="st1"><em>${i + 1}</em><b>${esc(x.t)}</b></div><span class="url">${esc(x.url)}</span>` +
    `<h4>움직이면 이렇게 보인다</h4><p class="mv" style="margin:0">${esc(x.mv)}</p>` +
    `<h4>프론트 — 이어진 기능</h4><ul>${x.fe.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` +
    `<h4>백엔드 — 뒤에서 도는 길</h4><ul class="bk">${x.be.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` +
    `<div class="sacts">${UCI[x.uc] ? `<button class="btn pri" type="button" data-p>▶ ${esc(UCI[x.uc].t)}</button>` : ''}${x.els.map(id => `<button class="btn" type="button" data-e="${id}">${esc(byId[id].n)}</button>`).join('')}</div></div>`;
  d.querySelector('.shot').addEventListener('click', () => { if (!moved) openShot(i); });
  const dp = d.querySelector('[data-p]'); if (dp) dp.addEventListener('click', () => { if (!moved) playUC(x.uc, x.k); });
  d.querySelectorAll('[data-e]').forEach(b => b.addEventListener('click', () => { if (!moved) select(b.dataset.e, true); }));
  $('#seqs').append(d); x.dom = d;
});
const lb = $('#lightbox');
function openShot(i) { const x = SCR[i]; $('#lbImg').src = (IMG[x.img] || x.img); $('#lbImg').alt = x.t; $('#lbCap').textContent = `${i + 1}. ${x.t} · 누르면 닫힌다`; lb.hidden = false; }
lb.addEventListener('click', () => { lb.hidden = true; });
function showScreen(i) {
  stopTour(); clearFocus();
  const x = SCR[i];
  board.classList.add('focus'); x.dom.classList.add('on');
  x.els.forEach(id => byId[id].dom.classList.add('on'));
  fly(camFor({x: x.x, y: x.y, w: x.w, h: x.h}, 30));
}


// 객체 지도 그리기
const NS = 'http://www.w3.org/2000/svg';
const rectOf = o => ({x: o.x, y: o.y, w: o.w, h: o.h});
// 작은 순서도: 세로 줄은 사람이나 앱, 가로 줄은 한 칸. 이 객체의 줄과 이 객체가 닿는 칸만 파랗게.
function miniSeq(u, oid, W, H, cls) {
  const n = u.lanes.length, m = u.steps.length, X = i => 6 + (W - 12) * (i + .5) / n, Y = k => 7 + (H - 12) * (k + .5) / m, li = {};
  u.lanes.forEach((k, i) => { li[k] = i; });
  let s = '';
  u.lanes.forEach((k, i) => { s += `<line class="ml${L2O(k) === oid ? ' me' : ''}" x1="${X(i)}" y1="2" x2="${X(i)}" y2="${H - 2}"/>`; });
  u.steps.forEach((x, k) => {
    const a = X(li[x.a]), b = X(li[x.b]), y = Y(k), me = L2O(x.a) === oid || L2O(x.b) === oid, c = `ms${me ? ' me' : ''}${x.r ? ' r' : ''}`;
    if (a === b) s += `<path class="${c}" d="M${a} ${y - 2.5}h7v5h-6"/>`;
    else { const dir = b > a ? 1 : -1; s += `<path class="${c}" d="M${a} ${y}H${b - dir * 2}"/><path class="${c} hd" d="M${b} ${y}l${-dir * 5} -2.6v5.2z"/>`; }
  });
  return `<svg class="${cls || 'mseq'}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${s}</svg>`;
}
let OSVG = null;
const head = t => String(t).split(' — ')[0];
(function objects() {
  if (!FO) return;
  const f = FO, layer = $('#seqs');
  PKG.forEach(p => {
    p.x = f.x + p.lx; p.y = f.y + p.ly;
    const d = document.createElement('div');
    d.className = 'pkg'; d.dataset.l = p.l;
    d.style.cssText = `left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`;
    d.innerHTML = `<h4>${esc(p.n)}</h4><p>${esc(p.d)}</p>`;
    layer.append(d); p.dom = d;
  });
  OIDS.forEach(id => { const o = OBJ[id]; o.x = f.x + o.lx; o.y = f.y + o.ly; });
  // 선의 양 끝: 같은 줄이면 둘 다 위쪽, 다른 줄이면 위 객체의 아래쪽과 아래 객체의 위쪽. 한 변에 닿는 끝은 상대 위치 순서로 고르게 편다.
  const ends = new Map(), side = (id, s) => { const k = id + s; if (!ends.has(k)) ends.set(k, []); return ends.get(k); };
  OE.forEach(e => {
    const A = OBJ[e.a], B = OBJ[e.b];
    if (A.row === B.row) { e.sa = 't'; e.sb = 't'; } else if (A.row < B.row) { e.sa = 'b'; e.sb = 't'; } else { e.sa = 't'; e.sb = 'b'; }
    side(e.a, e.sa).push({e, end: 'a', ox: B.x + B.w / 2});
    side(e.b, e.sb).push({e, end: 'b', ox: A.x + A.w / 2});
  });
  ends.forEach((list, k) => {
    const o = OBJ[k.slice(0, -1)], s = k.slice(-1);
    list.sort((p, q) => p.ox - q.ox);
    list.forEach((p, i) => { p.e['p' + p.end] = [o.x + 24 + (o.w - 48) * (i + 1) / (list.length + 1), s === 't' ? o.y : o.y + o.h]; });
  });
  let sv = '', lab = '';
  OE.forEach((e, i) => {
    const [x1, y1] = e.pa, [x2, y2] = e.pb;
    let p1, p2;
    if (e.sa === e.sb) { const h = 46 + Math.min(120, Math.abs(x2 - x1) * .09); p1 = [x1, y1 - h]; p2 = [x2, y2 - h]; }
    else { const my = (y1 + y2) / 2; p1 = [x1, my]; p2 = [x2, my]; }
    const ye = y2 + (e.sb === 't' ? -3 : 3);
    e.d = `M${x1} ${y1}C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${x2} ${ye}`;
    const w = 1.4 + Math.min(e.n, 6) * .45;
    sv += `<path class="oe${e.n ? '' : ' x'}" data-i="${i}" d="${e.d}" stroke-width="${w.toFixed(2)}" marker-end="url(#m-triF)"/>`;
    const mx = (x1 + 3 * p1[0] + 3 * p2[0] + x2) / 8, my = (y1 + 3 * p1[1] + 3 * p2[1] + ye) / 8;
    const first = e.list[0], txt = e.n ? `${e.n}번 · ${e.list.map(x => x.u.s).filter((v, j, a) => a.indexOf(v) === j).join(' · ')}` : e.t;
    const tw = [...txt].length * 12.5 + 22;
    lab += `<g class="oel" data-i="${i}"><rect x="${mx - tw / 2}" y="${my - 15}" width="${tw}" height="30" rx="15"/><text x="${mx}" y="${my + 5}" text-anchor="middle">${esc(txt)}</text></g>`;
  });
  const g = document.createElementNS(NS, 'svg');
  g.setAttribute('class', 'oedges'); g.setAttribute('aria-hidden', 'true');
  g.setAttribute('width', f.x + f.w); g.setAttribute('height', f.y + f.h);
  g.innerHTML = sv + lab;
  layer.append(g);
  OSVG = g;
  const paths = [...g.querySelectorAll('path.oe')], labs = [...g.querySelectorAll('.oel')];
  OE.forEach((e, i) => { e.dom = paths[i]; e.lab = labs[i]; });
  OIDS.forEach(id => {
    const o = OBJ[id], st = byId[id] ? byId[id].s : 'done', ucs = OUC[id];
    const d = document.createElement('article');
    d.className = 'ob'; d.dataset.l = o.pk.l; d.dataset.o = id;
    d.style.cssText = `left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px`;
    d.innerHTML = `<button class="oh" type="button" data-open><i>«${esc(OST[id])}»</i><b>${esc(ON[id])}</b>${ST[st] ? `<b class="chip ${st}">${ST[st]}</b>` : ''}</button>` +
      `<div class="obb"><p class="one">${esc(o.one)}</p>` +
      (o.api.length ? `<h5>받는 일 · ${o.api.length}</h5><ul class="oapi">${o.api.slice(0, 4).map(t => `<li>${esc(head(t))}</li>`).join('')}</ul>` : '') +
      (o.holds.length ? `<h5>가진 것</h5><p class="ohold">${esc(o.holds[0])}</p>` : '') +
      `<h5>나오는 순서도 · ${ucs.length}</h5>` +
      (ucs.length ? `<div class="thumbs">${ucs.map(({u, c}) => `<button class="th" type="button" data-objuc="${u.id}:${c.first}" title="${esc(u.t)} · ${dirText(c)} — 누르면 객체 지도 위에서 따라간다">${miniSeq(u, id, 124, 70)}<span>${esc(u.s)}</span></button>`).join('')}</div>` : '<p class="ohold">순서도에는 나오지 않는다. 선은 코드에서 이어지는 길이다.</p>') +
      `</div><div class="obig"><i>«${esc(OST[id])}»</i><b>${esc(ON[id])}</b><p>${esc(o.one)}</p><small>순서도 ${ucs.length} · 받는 일 ${o.api.length}</small></div><div class="ofile">${esc((o.files || []).slice(0, 3).join(' · '))}</div>`;
    d.addEventListener('click', ev => {
      if (moved) return;
      const t = ev.target.closest('[data-objuc]');
      if (t) { const [u, k] = t.dataset.objuc.split(':'); playObj(u, +k); return; }
      openObj(id);
    });
    layer.append(d); o.dom = d;
  });
})();

// 앱 × 유즈케이스 표

// 데이터 지도 그리기 — 창 하나를 덮는 판 위에 한 줄 흐름과 놓이는 곳 넷
const objChip = o => !o ? '<span class="dob p">사람</span>' : OBJ[o] ? `<button class="dob" type="button" data-obj="${esc(o)}">${esc(ON[o])}</button>` : `<span class="dob p">${esc(o)}</span>`;
const uniq = a => a.filter((v, i) => a.indexOf(v) === i);
(function dataMap() {
  if (!FD) return;
  const f = FD, L = f.dl, box = document.createElement('div');
  box.className = 'dmap';
  box.style.cssText = `left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px`;
  let h = `<div class="dfh" style="left:${L.fx}px;top:${L.fy}px;width:${L.fw}px"><b>한 줄 흐름</b><span>Claude Code의 알림 하나가 들어와 판정이 남기까지 — 칸을 누르면 그 칸이 쓰고 읽는 데이터가 켜진다</span></div>`;
  DFLOW.forEach((s, i) => {
    h += `<button class="dfl" type="button" data-dflow="${i}" style="left:${L.fx + i * (L.bw + L.bg)}px;top:${L.fy + 46}px;width:${L.bw}px;height:${L.bh}px">` +
      `<em>${i + 1}</em><b>${esc(s.t)}</b><span>${esc(s.d)}</span><small>${esc(ON[s.o])}</small><i class="dbg">${i + 1}. ${esc(s.t)}</i></button>`;
  });
  DS.forEach((s, j) => {
    const x0 = L.sx + j * (L.cw + L.cg);
    h += `<section class="dst" data-l="${s.l}" style="left:${x0}px;top:${L.sy}px;width:${L.cw}px;height:${L.sh}px">` +
      `<h4>${esc(s.n)}</h4><p class="dlife">${esc(s.life)}</p><p class="dsd">${esc(s.d)}</p><i class="dbg">${esc(s.n)}<small>${esc(s.life)}</small></i></section>`;
    s.ids.forEach((id, k) => {
      const x = DMI[id], ws = uniq(x.w.map(([o]) => o)), rs = uniq(x.r.map(([o]) => o));
      x.lx = x0 + L.pp; x.ly = L.sy + L.hh + k * (L.ch + L.gap); x.w2 = L.cw - 2 * L.pp; x.h2 = L.ch;
      h += `<article class="dmc" data-d="${id}" data-l="${s.l}" style="left:${x.lx}px;top:${x.ly}px;width:${x.w2}px;height:${x.h2}px">` +
        `<header><b>${esc(x.n)}</b><code>${esc(x.k)}</code></header><p class="one">${esc(x.one)}</p>` +
        `<div class="dio"><span class="dv">쓴다 →</span>${ws.map(objChip).join('')}</div>` +
        (x.v ? `<div class="dio"><span class="dv v">거친다</span>${uniq(x.v.map(([o]) => o)).map(objChip).join('')}</div>` : '') +
        `<div class="dio"><span class="dv r">← 읽는다</span>${rs.map(objChip).join('')}</div>` +
        `<p class="dlim">${esc(x.lim !== '—' ? x.lim + ' ' : '')}${esc(x.life)}</p>` +
        `<div class="dbig"><b>${esc(x.n)}</b><p>${esc(x.one)}</p></div></article>`;
      x.x = f.x + x.lx; x.y = f.y + x.ly;
    });
  });
  box.innerHTML = h;
  box.addEventListener('click', ev => {
    if (moved) return;
    const o = ev.target.closest('[data-obj]'); if (o) { openObj(o.dataset.obj); return; }
    const fl = ev.target.closest('[data-dflow]'); if (fl) { openFlow(+fl.dataset.dflow); return; }
    const c = ev.target.closest('[data-d]'); if (c) openData(c.dataset.d);
  });
  $('#seqs').append(box);
  DM.forEach(x => { x.dom = box.querySelector(`[data-d="${x.id}"]`); });
  DFLOW.forEach((s, i) => { s.dom = box.querySelector(`[data-dflow="${i}"]`); s.x = f.x + L.fx + i * (L.bw + L.bg); s.y = f.y + L.fy + 46; s.w = L.bw; s.h = L.bh; });
})();

(function matrix() {
  if (!FM) return;
  const f = FM, M = f.mx, d = document.createElement('div');
  d.className = 'mx';
  d.style.cssText = `left:${f.x + M.x}px;top:${f.y + M.y}px;width:${M.w}px;height:${M.h}px;grid-template-columns:190px repeat(${UC.length},1fr);grid-template-rows:64px repeat(${MXR.length},36px)`;
  let h = '<div></div>' + UC.map(u => `<button class="mh" type="button" data-uc="${u.id}" data-k="0" title="${esc(u.t)} · ${esc(FR[u.f].title)}">${esc(u.s)}</button>`).join('');
  MXR.forEach(el => {
    h += `<button class="mr" type="button" data-app="${el}"><i style="background:var(--l-${layerOf(el)})"></i>${esc(rowName(el))}</button>`;
    UC.forEach(u => {
      const c = involve(u, el), tot = c.o + c.i + c.sf;
      h += tot ? `<button class="mc" type="button" data-uc="${u.id}" data-k="${c.first}" title="${esc(rowName(el))} · ${esc(u.t)}: 보냄 ${c.o} · 받음 ${c.i} · 안에서 ${c.sf}" style="background:color-mix(in srgb,var(--acc) ${Math.min(5 + tot * 3, 30)}%,var(--sheet))">` +
        (c.o ? `<span class="o">→${c.o}</span>` : '') + (c.i ? `<span class="i">←${c.i}</span>` : '') + (c.sf ? `<span class="s">⟳${c.sf}</span>` : '') + '</button>' : '<div class="mc"></div>';
    });
  });
  d.innerHTML = h;
  d.addEventListener('click', ev => {
    if (moved) return;
    const b = ev.target.closest('[data-uc],[data-app]');
    if (!b) return;
    if (b.dataset.app) (OBJ[b.dataset.app] ? openObj : openApp)(b.dataset.app); else playUC(b.dataset.uc, +b.dataset.k);
  });
  $('#seqs').append(d);
})();

// 선 모양: 점선, 시작 표시, 끝 표시
const ES = {
  realization:{d:'6 4', e:'triH'}, serving:{e:'open'}, assignment:{s:'dot', e:'triF'}, access:{d:'2 4', e:'openS'},
  flow:{d:'8 4', e:'triF'}, triggering:{e:'triF'}, influence:{d:'5 4', e:'open'}, composition:{s:'diaF'}, aggregation:{s:'diaH'}, association:{}
};
function markers(suf, cls) {
  const m = (id, vb, rx, ry, w, h, body) => `<marker id="m-${id}${suf}" viewBox="${vb}" refX="${rx}" refY="${ry}" markerWidth="${w}" markerHeight="${h}" markerUnits="userSpaceOnUse" orient="auto">${body}</marker>`;
  return m('triF','0 0 10 10',10,5,11,11,`<path class="mk ${cls}" d="M0 0L10 5L0 10z"/>`) +
    m('triH','0 0 10 10',10,5,12,12,`<path class="mk hol ${cls}" stroke-width="1.3" d="M1 1L10 5L1 9z"/>`) +
    m('open','0 0 10 10',10,5,11,11,`<path class="mk ${cls}" fill="none" style="fill:none" stroke-width="1.5" d="M0 0L10 5L0 10"/>`) +
    m('openS','0 0 10 10',10,5,8,8,`<path class="mk ${cls}" fill="none" style="fill:none" stroke-width="1.5" d="M0 0L10 5L0 10"/>`) +
    m('dot','0 0 10 10',5,5,7,7,`<circle class="mk ${cls}" cx="5" cy="5" r="4"/>`) +
    m('diaF','0 0 14 10',0,5,14,10,`<path class="mk ${cls}" d="M0 5L7 0L14 5L7 10z"/>`) +
    m('diaH','0 0 14 10',0,5,14,10,`<path class="mk hol ${cls}" stroke-width="1.2" d="M1 5L7 1L13 5L7 9z"/>`);
}
function anchor(a, b) {
  const ax = a.x + a.w / 2, ay = a.y + a.h / 2, dx = b.x + b.w / 2 - ax, dy = b.y + b.h / 2 - ay;
  if (!dx && !dy) return [ax, ay];
  const s = Math.min((a.w / 2 + 2) / Math.abs(dx || 1e-9), (a.h / 2 + 2) / Math.abs(dy || 1e-9));
  return [ax + dx * s, ay + dy * s];
}
const pairs = new Set(R.map(([a, b]) => a + '>' + b));
let svg = `<defs>${markers('', '')}${markers('-h', 'h')}</defs>`;
if (FRING) {
const lp = FRING.ringG;
svg += `<path id="ringpath" class="ringp" d="M${FRING.x + lp.cx} ${FRING.y + lp.cy - lp.ry}A${lp.rx} ${lp.ry} 0 1 1 ${FRING.x + lp.cx} ${FRING.y + lp.cy + lp.ry}A${lp.rx} ${lp.ry} 0 1 1 ${FRING.x + lp.cx} ${FRING.y + lp.cy - lp.ry}"/>`;
}
R.forEach(([a, b, t], i) => {
  const A = byId[a], B = byId[b], cross = A.f !== B.f, st = ES[t];
  let [x1, y1] = anchor(A, B), [x2, y2] = anchor(B, A);
  if (pairs.has(b + '>' + a)) { const L = Math.hypot(x2 - x1, y2 - y1) || 1, ox = -(y2 - y1) / L * 8, oy = (x2 - x1) / L * 8; x1 += ox; y1 += oy; x2 += ox; y2 += oy; }
  let d;
  if (cross) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    d = Math.abs(y2 - y1) > Math.abs(x2 - x1) ? `M${x1} ${y1}C${x1} ${my} ${x2} ${my} ${x2} ${y2}` : `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
  } else d = `M${x1} ${y1}L${x2} ${y2}`;
  svg += `<path class="e ${cross ? 'x' : 'in'}" data-i="${i}" data-s="${st.s || ''}" data-e="${st.e || ''}" d="${d}"` +
    (st.d ? ` stroke-dasharray="${st.d}"` : '') + (st.s ? ` marker-start="url(#m-${st.s})"` : '') + (st.e ? ` marker-end="url(#m-${st.e})"` : '') + '/>';
});
if (FRING && !reduce) svg += `<circle class="runner" r="11"><animateMotion dur="10s" repeatCount="indefinite" rotate="auto"><mpath href="#ringpath"/></animateMotion></circle>`;
const edgesSvg = $('#edges');
edgesSvg.setAttribute('width', WORLD.w); edgesSvg.setAttribute('height', WORLD.h);
edgesSvg.innerHTML = svg;
const EDGE = [...edgesSvg.querySelectorAll('path.e')];

// 창 사이 흐름
let fs = `<defs><marker id="fa" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="22" markerHeight="22" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--acc)"/></marker></defs>`;
const fbox = f => ({x: f.x, y: f.y, w: f.w, h: f.h});
FLOWS.forEach(([fa, fb, label, lift]) => {
  const A = fbox(FR[fa]), B = fbox(FR[fb]);
  let p0, p1, p2, p3;
  if (lift) {
    const x1 = A.x + A.w / 2, x2 = B.x + B.w / 2, top = Math.min(A.y, B.y) - lift;
    p0 = [x1, A.y - 4]; p1 = [x1, top]; p2 = [x2, top]; p3 = [x2, B.y - 10];
  } else {
    p0 = anchor(A, B); p3 = anchor(B, A);
    const v = Math.abs(p3[1] - p0[1]) > Math.abs(p3[0] - p0[0]), mx = (p0[0] + p3[0]) / 2, my = (p0[1] + p3[1]) / 2;
    p1 = v ? [p0[0], my] : [mx, p0[1]]; p2 = v ? [p3[0], my] : [mx, p3[1]];
    const L = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) || 1; p3 = [p3[0] - (p3[0] - p2[0]) / L * 8, p3[1] - (p3[1] - p2[1]) / L * 8];
  }
  const d = `M${p0[0]} ${p0[1]}C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`;
  fs += `<path class="flow-t" d="${d}"/><path class="flow" d="${d}" marker-end="url(#fa)"/>`;
  if (label) {
    const mx = (p0[0] + 3 * p1[0] + 3 * p2[0] + p3[0]) / 8, my = (p0[1] + 3 * p1[1] + 3 * p2[1] + p3[1]) / 8, w = [...label].length * 32 + 56;
    fs += `<g class="fl"><rect x="${mx - w / 2}" y="${my - 30}" width="${w}" height="60" rx="30"/><text x="${mx}" y="${my + 12}" text-anchor="middle">${esc(label)}</text></g>`;
  }
});
const flowsSvg = $('#flows');
flowsSvg.setAttribute('width', WORLD.w); flowsSvg.setAttribute('height', WORLD.h);
flowsSvg.innerHTML = fs;

// 작은 지도
const mini = $('#miniSvg');
mini.setAttribute('viewBox', `-60 -260 ${WORLD.w + 120} ${WORLD.h + 320}`);
mini.innerHTML = FRAMES.map(f => `<rect class="mf${f.main ? ' main' : ''}" x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="40"/>`).join('') + '<rect class="mv" id="mv" rx="30"/>';

/* ───────── 카메라 ───────── */
// 멀리 보기 기준은 둘뿐이다: FAR(창 이름 · 객체 큰 이름으로 바뀜), VFAR(객체 지도도 창 이름으로 바뀜).
// 경계에서 깜빡이지 않게, 켜진 뒤에는 기준보다 10% 더 가까이 가야 꺼진다.
const KMIN = 0.06, KMAX = 2.4, FAR = 0.45, VFAR = 0.12, HYS = 1.1;
let cam = {x: 0, y: 0, k: 1}, anim = 0;
const lvl = {far: null, vfar: null};
let uiRaf = 0, idle = 0, rk = 0;
const below = (on, k, at) => k < (on ? at * HYS : at);
function moving() {
  board.classList.add('moving');
  clearTimeout(idle); idle = setTimeout(() => { board.classList.remove('moving'); rk = 0; }, 180);
}
function apply() {
  world.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.k})`;
  // 움직이는 중에도 크기가 반이나 두 배로 바뀌면 층을 한 번 풀어 지금 크기로 다시 그린다
  if (!rk) rk = cam.k;
  else if (cam.k / rk > 2 || rk / cam.k > 2) { rk = cam.k; world.style.willChange = 'auto'; requestAnimationFrame(() => { world.style.willChange = ''; }); }
  const far = below(lvl.far, cam.k, FAR), vfar = below(lvl.vfar, cam.k, VFAR);
  if (far !== lvl.far) { lvl.far = far; board.classList.toggle('far', far); board.classList.toggle('oz', far); }
  if (vfar !== lvl.vfar) { lvl.vfar = vfar; board.classList.toggle('vfar', vfar); }
  moving();
  if (uiRaf) return;
  uiRaf = requestAnimationFrame(() => {
    uiRaf = 0;
    $('#zLv').textContent = Math.round(cam.k * 100) + '%';
    const mv = $('#mv');
    mv.setAttribute('x', -cam.x / cam.k); mv.setAttribute('y', -cam.y / cam.k);
    mv.setAttribute('width', board.clientWidth / cam.k); mv.setAttribute('height', board.clientHeight / cam.k);
  });
}
function viewBox() {
  const wide = innerWidth > 720;
  const pw = !$('#panel').hidden && wide ? $('#panel').offsetWidth + 24 : 0;
  const ph = !$('#panel').hidden && !wide ? $('#panel').offsetHeight + 16 : 0;
  const th = !$('#tour').hidden ? $('#tour').offsetHeight + 24 : 0;
  return {w: board.clientWidth - pw, h: board.clientHeight - Math.max(ph, th)};
}
function camFor(r, pad) {
  const v = viewBox(); pad = pad == null ? 36 : pad;
  const k = clamp(Math.min((v.w - pad * 2) / r.w, (v.h - pad * 2) / r.h), KMIN, KMAX);
  return {k, x: (v.w - r.w * k) / 2 - r.x * k, y: (v.h - r.h * k) / 2 - r.y * k};
}
function fly(t) {
  cancelAnimationFrame(anim);
  if (reduce) { cam = t; apply(); return; }
  const s = {...cam}, t0 = performance.now(), D = 700;
  const step = n => {
    const p = Math.min(1, (n - t0) / D), q = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    cam = {k: Math.exp(Math.log(s.k) + (Math.log(t.k) - Math.log(s.k)) * q), x: s.x + (t.x - s.x) * q, y: s.y + (t.y - s.y) * q};
    apply(); if (p < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
function union(rs) {
  const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y));
  return {x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y};
}
function zoomAt(px, py, f) {
  const k = clamp(cam.k * f, KMIN, KMAX), wx = (px - cam.x) / cam.k, wy = (py - cam.y) / cam.k;
  cam = {k, x: px - wx * k, y: py - wy * k}; apply();
}
const fitAll = () => fly(camFor({x: -40, y: -200, w: WORLD.w + 80, h: WORLD.h + 240}, 16));

/* ───────── 끌기 · 확대 ───────── */
const pts = new Map();
let moved = false, start = null, pinch = null;
const pinchOf = () => { const [a, b] = [...pts.values()]; return {d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2}; };
board.addEventListener('pointerdown', ev => {
  if (ev.target.closest('.panel,.tour,.legend,.zoom,.mini')) return;
  if (ev.pointerType === 'mouse' && ev.button !== 0) return;
  pts.set(ev.pointerId, {x: ev.clientX, y: ev.clientY});
  cancelAnimationFrame(anim);
  if (pts.size === 1) { start = {x: ev.clientX, y: ev.clientY, cx: cam.x, cy: cam.y}; moved = false; }
  else if (pts.size === 2) pinch = pinchOf();
});
addEventListener('pointermove', ev => {
  if (!pts.has(ev.pointerId)) return;
  pts.set(ev.pointerId, {x: ev.clientX, y: ev.clientY});
  if (pts.size === 1 && start) {
    const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) > 5) { moved = true; board.classList.add('dragging'); }
    if (moved) { cam.x = start.cx + dx; cam.y = start.cy + dy; apply(); }
  } else if (pts.size === 2 && pinch) {
    const p = pinchOf(), rc = board.getBoundingClientRect();
    zoomAt(p.mx - rc.left, p.my - rc.top, p.d / pinch.d);
    cam.x += p.mx - pinch.mx; cam.y += p.my - pinch.my; apply();
    pinch = p; moved = true;
  }
});
const up = ev => {
  if (!pts.has(ev.pointerId)) return;
  pts.delete(ev.pointerId);
  if (pts.size < 2) pinch = null;
  if (pts.size === 1) { const [p] = [...pts.values()]; start = {x: p.x, y: p.y, cx: cam.x, cy: cam.y}; }
  if (pts.size === 0) { board.classList.remove('dragging'); start = null; setTimeout(() => { moved = false; }, 0); }
};
addEventListener('pointerup', up); addEventListener('pointercancel', up);
board.addEventListener('wheel', ev => {
  if (ev.target.closest('.panel,.legend,.nl')) return;
  ev.preventDefault();
  cancelAnimationFrame(anim);
  const m = ev.deltaMode === 1 ? 16 : 1, rc = board.getBoundingClientRect();
  // 마우스 휠 한 칸(약 100)은 크게 튀므로 한 번에 움직이는 양을 묶는다. 트랙패드는 값이 작아 그대로다.
  if (ev.ctrlKey || ev.metaKey) zoomAt(ev.clientX - rc.left, ev.clientY - rc.top, Math.exp(-clamp(ev.deltaY * m, -30, 30) * 0.008));
  else { cam.x -= ev.deltaX * m; cam.y -= ev.deltaY * m; apply(); }
}, {passive: false});
board.addEventListener('click', ev => {
  if (moved) return;
  if (ev.target === board || ev.target.closest('#frames') && !ev.target.closest('.fh')) { clearFocus(); closePanel(); }
});
$('#zIn').addEventListener('click', () => zoomAt(board.clientWidth / 2, board.clientHeight / 2, 1.35));
$('#zOut').addEventListener('click', () => zoomAt(board.clientWidth / 2, board.clientHeight / 2, 1 / 1.35));
$('#bFit').addEventListener('click', () => { stopTour(); clearFocus(); closePanel(); fitAll(); });
$('#mini').addEventListener('click', ev => {
  const p = mini.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
  const w = p.matrixTransform(mini.getScreenCTM().inverse());
  fly({k: cam.k, x: board.clientWidth / 2 - w.x * cam.k, y: board.clientHeight / 2 - w.y * cam.k});
});
addEventListener('keydown', ev => {
  if (ev.target.closest && ev.target.closest('input,textarea')) return;
  const c = {x: board.clientWidth / 2, y: board.clientHeight / 2};
  if (ev.key === '+' || ev.key === '=') zoomAt(c.x, c.y, 1.25);
  else if (ev.key === '-') zoomAt(c.x, c.y, 0.8);
  else if (ev.key === '0') fitAll();
  else if (ev.key === 'Escape') { if (!lb.hidden) lb.hidden = true; else if (!$('#legend').hidden) $('#legend').hidden = true; else if (!$('#tour').hidden) stopTour(); else { clearFocus(); closePanel(); } }
  else if (ev.key.startsWith('Arrow') && ev.target === document.body) {
    const s = 90; cam.x += ev.key === 'ArrowLeft' ? s : ev.key === 'ArrowRight' ? -s : 0; cam.y += ev.key === 'ArrowUp' ? s : ev.key === 'ArrowDown' ? -s : 0; apply();
  }
});
addEventListener('resize', apply);

/* ───────── 켜기 · 옆 칸 ───────── */
function setHi(p, on) {
  const s = p.dataset.s, e = p.dataset.e, suf = on ? '-h' : '';
  if (s) p.setAttribute('marker-start', `url(#m-${s}${suf})`);
  if (e) p.setAttribute('marker-end', `url(#m-${e}${suf})`);
}
function focusOn(ids, edgeIdx, run) {
  board.classList.add('focus');
  E.forEach(it => { it.dom.classList.toggle('on', ids.has(it.id)); it.dom.classList.remove('sel'); });
  EDGE.forEach((p, i) => { const on = edgeIdx.has(i); p.classList.toggle('on', on); p.classList.toggle('run', on && run); setHi(p, on); });
  FRAMES.forEach(f => f.dom.classList.toggle('on', f.items.some(x => ids.has(x.id))));
}
function clearFocus() {
  board.classList.remove('focus');
  SCR.forEach(x => x.dom && x.dom.classList.remove('on'));
  E.forEach(it => it.dom.classList.remove('on', 'sel'));
  EDGE.forEach(p => { if (p.classList.contains('on')) { p.classList.remove('on', 'run'); setHi(p, false); } });
  FRAMES.forEach(f => f.dom.classList.remove('on'));
  board.classList.remove('ofocus');
  OIDS.forEach(id => OBJ[id].dom.classList.remove('on', 'sel', 'from', 'to'));
  OE.forEach(e => { e.dom.classList.remove('on', 'cur'); e.lab.classList.remove('on'); });
  DM.forEach(x => x.dom && x.dom.classList.remove('on'));
  DFLOW.forEach(x => x.dom && x.dom.classList.remove('on'));
}
const panel = $('#panel');
function openPanel(k, t, html, wide) {
  panel.classList.toggle('wide', !!wide);
  $('#pK').textContent = k; $('#pT').textContent = t; $('#pB').innerHTML = html; panel.hidden = false; $('#pB').scrollTop = 0;
  $('#pB').querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => select(b.dataset.go, true)));
  $('#pB').querySelectorAll('[data-fr]').forEach(b => b.addEventListener('click', () => openFrame(b.dataset.fr)));
  $('#pB').querySelectorAll('[data-uc]').forEach(b => b.addEventListener('click', () => playUC(b.dataset.uc, +b.dataset.k)));
  $('#pB').querySelectorAll('[data-app]').forEach(b => b.addEventListener('click', () => openApp(b.dataset.app)));
  $('#pB').querySelectorAll('[data-scr]').forEach(b => b.addEventListener('click', () => showScreen(+b.dataset.scr)));
  $('#pB').querySelectorAll('[data-scn]').forEach(b => b.addEventListener('click', () => showScene(+b.dataset.scn)));
  $('#pB').querySelectorAll('[data-sty]').forEach(b => b.addEventListener('click', () => showStory(+b.dataset.sty)));
  $('#pB').querySelectorAll('[data-obj]').forEach(b => b.addEventListener('click', () => openObj(b.dataset.obj)));
  $('#pB').querySelectorAll('[data-objuc]').forEach(b => b.addEventListener('click', () => { const [u, k] = b.dataset.objuc.split(':'); playObj(u, +k); }));
  $('#pB').querySelectorAll('[data-ucx]').forEach(b => b.addEventListener('click', () => openUCInfo(b.dataset.ucx)));
  $('#pB').querySelectorAll('[data-journey]').forEach(b => b.addEventListener('click', playJourney));
  $('#pB').querySelectorAll('[data-dm]').forEach(b => b.addEventListener('click', () => openData(b.dataset.dm)));
  $('#pB').querySelectorAll('[data-dmobj]').forEach(b => b.addEventListener('click', () => showDataObjs(b.dataset.dmobj)));
  $('#pB').querySelectorAll('[data-dflow]').forEach(b => b.addEventListener('click', () => openFlow(+b.dataset.dflow)));
}
function closePanel() { panel.hidden = true; }
$('#pX').addEventListener('click', () => { clearFocus(); closePanel(); });

const goBtn = id => { const x = byId[id]; return `<button class="go" type="button" data-go="${x.id}">${esc(x.n)}<small>${esc(FR[x.f].title)}</small></button>`; };
function select(id, flyTo) {
  stopTour();
  const it = byId[id], ids = new Set([id]), ei = new Set(), out = [], inn = [];
  R.forEach(([a, b, t], i) => {
    if (a === id) { ids.add(b); ei.add(i); out.push([b, t]); }
    if (b === id) { ids.add(a); ei.add(i); inn.push([a, t]); }
  });
  focusOn(ids, ei, true);
  it.dom.classList.add('sel');
  const [ko, en, lk] = TYPES[it.t];
  let h = '';
  if (ST[it.s]) h += `<div><b class="chip ${it.s}">${ST[it.s]}</b></div>`;
  if (it.d) h += `<p>${esc(it.d)}</p>`;
  if (it.t === 'wp') h += `<p><b>언제</b> ${esc(it.when)} · <b>누가</b> ${esc(it.who)}</p>`;
  if (it.c) h += `<div><h3>코드 · 파일 위치</h3><code>${esc(it.c)}</code></div>`;
  if (OBJ[id]) h += `<div><button class="go" type="button" data-obj="${id}">객체 지도에서 자세히 보기<small>${esc(OBJ[id].one)}</small></button></div>`;
  h += `<div><h3>들어 있는 창</h3><button class="go" type="button" data-fr="${it.f}">${esc(FR[it.f].title)}</button></div>`;
  if (out.length) h += `<div><h3>이것에서 나가는 연결</h3><ul>${out.map(([b, t]) => `<li><span class="verb">${RELS[t][0]} →</span>${goBtn(b)}</li>`).join('')}</ul></div>`;
  const inv = UC.map(u => [u, involve(u, id)]).filter(([, c]) => c.first >= 0);
  if (inv.length) h += `<div><h3>이 상자가 나오는 순서</h3><ul>${inv.map(([u, c]) => `<li><button class="go wide" type="button" data-uc="${u.id}" data-k="${c.first}">▶ ${esc(u.t)}<small>${dirText(c)}</small></button></li>`).join('')}</ul></div>` +
    `<div><button class="go" type="button" data-app="${id}">이 상자가 오가는 방향 모두 보기</button></div>`;
  const shots = SCR.map((x, i) => [x, i]).filter(([x]) => x.els.includes(id) || UCI[x.uc].rel.includes(id));
  if (shots.length) h += `<div><h3>이 상자가 보이는 화면</h3><ul>${shots.map(([x, i]) => `<li><button class="go wide" type="button" data-scr="${i}">${i + 1}. ${esc(x.t)}</button></li>`).join('')}</ul></div>`;
  const rel = UC.filter(u => u.rel.includes(id));
  if (rel.length) h += `<div><h3>이 일을 실제로 돌리는 순서</h3><ul>${rel.map(u => `<li><button class="go wide" type="button" data-uc="${u.id}" data-k="0">▶ ${esc(u.t)}<small>${esc(FR[u.f].title)}</small></button></li>`).join('')}</ul></div>`;
  if (inn.length) h += `<div><h3>이것으로 들어오는 연결</h3><ul>${inn.map(([a, t]) => `<li>${goBtn(a)}<span class="verb">→ ${RELS[t][0]}</span></li>`).join('')}</ul></div>`;
  openPanel(`${ko} · ${en} · ${LK[lk]} 층`, it.n, h);
  if (flyTo || cam.k < FAR) {
    const nb = [...ids].map(x => byId[x]);
    const sameFrame = nb.filter(x => x.f === it.f);
    fly(camFor(union((nb.length <= 8 ? nb : sameFrame).concat([it]).map(x => ({x: x.x, y: x.y, w: x.w, h: x.h}))), 70));
  }
}
function openFrame(id) {
  if (FO && id === FO.id) return openObjects();
  if (FD && id === FD.id) return openDataMap();
  stopTour();
  const f = FR[id];
  clearFocus(); f.dom.classList.add('on');
  let h = `<p>${esc(f.desc)}</p><p class="why"><b>이 크기인 까닭</b> ${esc(f.why)}</p>`;
  h += `<div class="cnt">${meter(f.c)}<span>${countText(f.c) || '상태가 없는 원칙 · 목표만 있다'}</span></div>`;
  if (f.recent.length) h += `<div><h3>최근 한 일</h3><ul class="recent">${f.recent.map(([d, t]) => `<li><time>${esc(d)}</time><span>${esc(t)}</span></li>`).join('')}</ul></div>`;
  const fu = UC.filter(u => u.f === id);
  if (fu.length) h += `<div><h3>이 창 안의 순서</h3><ul>${fu.map(u => `<li><button class="go wide" type="button" data-uc="${u.id}" data-k="0">▶ ${esc(u.t)}<small>${u.steps.length}칸</small></button></li>`).join('')}</ul></div>`;
  if (FM && id === FM.id) h += `<div><button class="go" type="button" id="toList">유즈케이스 · 앱 목록 열기</button></div>`;
  const outF = new Set(), inF = new Set();
  R.forEach(([a, b]) => { const fa = byId[a].f, fb = byId[b].f; if (fa === id && fb !== id) outF.add(fb); if (fb === id && fa !== id) inF.add(fa); });
  const linked = [...new Set([...outF, ...inF])];
  if (linked.length) h += `<div><h3>이어진 창</h3><ul>${linked.map(x => `<li><button class="go" type="button" data-fr="${x}">${esc(FR[x].title)}</button></li>`).join('')}</ul></div>`;
  for (const [lk, ko] of LAYERS) {
    const its = f.items.filter(x => TYPES[x.t][2] === lk);
    if (its.length) h += `<div><h3>${ko} 층 · ${its.length}</h3><ul>${its.map(x => `<li>${goBtn(x.id).replace(/<small>.*?<\/small>/, '')}${ST[x.s] ? `<b class="chip ${x.s}">${ST[x.s]}</b>` : ''}</li>`).join('')}</ul></div>`;
  }
  openPanel(f.kicker, f.title, h);
  const tl = $('#toList'); if (tl) tl.addEventListener('click', openList);
  fly(camFor(fbox(f), 28));
}

/* ───────── 흐름 따라가기 ───────── */
let ti = -1, timer = 0, mode = 'tour', cur = null;
const tour = $('#tour');
function endUC() {
  if (!cur) return;
  const u = cur.u;
  u.dom.classList.remove('play', 'stepping');
  u.arrows.forEach(p => { p.classList.remove('cur', 'past'); p.setAttribute('marker-end', `url(#m-${p.dataset.m})`); });
  u.labels.forEach(l => l.classList.remove('cur', 'past'));
  u.heads.forEach(x => x.classList.remove('cur'));
  cur = null;
}
function playUC(id, k) {
  endObj();
  const u = UCI[id];
  clearInterval(timer); timer = 0; $('#tPlay').textContent = '자동으로 넘기기';
  if (cur && cur.u !== u) endUC();
  if (!cur) clearFocus();
  mode = 'uc'; cur = {u, k: 0};
  ucStep(k || 0);
}
function ucStep(k) {
  const u = cur.u, n = u.steps.length;
  k = (k + n) % n; cur.k = k;
  const x = u.steps[k];
  if (innerWidth <= 720) closePanel();
  tour.hidden = false;
  u.dom.classList.add('play', 'stepping');
  u.arrows.forEach((p, i) => { p.classList.toggle('cur', i === k); p.classList.toggle('past', i < k); p.setAttribute('marker-end', `url(#m-${p.dataset.m}${i === k ? '-h' : ''})`); });
  u.labels.forEach((l, i) => { l.classList.toggle('cur', i === k); l.classList.toggle('past', i < k); });
  u.heads.forEach((hd, i) => hd.classList.toggle('cur', u.lanes[i] === x.a || u.lanes[i] === x.b));
  focusOn(new Set([LN[x.a][1], LN[x.b][1]]), new Set(), false);
  $('#tN').textContent = `${u.t} · ${k + 1} / ${n}`;
  $('#tD').innerHTML = u.steps.map((_, i) => `<i class="${i === k ? 'on' : ''}"></i>`).join('');
  $('#tT').textContent = x.a === x.b ? `${LN[x.a][0]} 안에서` : `${LN[x.a][0]} → ${LN[x.b][0]}${x.r ? ' (답)' : ''}`;
  $('#tP').textContent = (x.alt ? `[${x.alt}] ` : '') + x.t + (x.c ? ` · ${x.c}` : '');
  $('#tNext').textContent = k === n - 1 ? '처음부터' : '다음';
  $('#tSeq').hidden = !!u.prop; $('#tSeq').textContent = '객체 지도에서 보기';
  const y = u.y + SQ.head + SQ.lane + k * SQ.row;
  fly(camFor({x: u.x - 20, y: Math.max(u.y - 20, y - 230), w: u.w + 40, h: 470}, 18));
}
function openApp(el) {
  stopTour();
  const parts = UC.map(u => [u, involve(u, el)]).filter(([, c]) => c.first >= 0);
  let h = `<p>이 상자가 유즈케이스마다 누구에게 보내고(→), 누구에게서 받고(←), 안에서 무엇을 하는지(⟳) 순서대로 모았다. 줄을 누르면 그 칸부터 따라간다.</p>`;
  h += `<div><button class="go" type="button" data-go="${el}">보드에서 이 상자 보기<small>${esc(FR[byId[el].f].title)}</small></button></div>`;
  if (OBJ[el]) h += `<div><button class="go" type="button" data-obj="${el}">객체 지도에서 자세히 보기</button></div>`;
  parts.forEach(([u, c]) => {
    h += `<div><h3>${esc(u.t)} · ${esc(FR[u.f].title)} · ${dirText(c)}</h3><ul>${u.steps.map((x, k) => {
      const A = c.keys.has(x.a), B = c.keys.has(x.b);
      if (!A && !B) return '';
      const v = A && B ? '⟳ 안에서' : A ? `→ ${LN[x.b][0]}` : `← ${LN[x.a][0]}`;
      return `<li><button class="go wide" type="button" data-uc="${u.id}" data-k="${k}"><span class="verb">${k + 1} · ${esc(v)}</span>${x.alt ? `<span class="alt">${esc(x.alt)}</span>` : ''}${esc(x.t)}</button></li>`;
    }).join('')}</ul></div>`;
  });
  if (!parts.length) h += '<p>이 상자가 나오는 순서는 아직 없다.</p>';
  focusOn(new Set([el]), new Set(), false);
  openPanel('앱으로 보기 · 오가는 방향', rowName(el), h);
}
function openList() {
  stopTour(); clearFocus();
  let h = `<p>창마다 아래쪽 "순서" 칸에 그 창의 일이 사람과 앱 사이를 어떤 차례로 오가는지 그렸다. ▶를 누르면 한 칸씩 따라간다. 앱을 고르면 그 앱이 보내고 받는 방향만 모아 본다.</p>`;
  h += `<div><h3>유즈케이스 ${UC.length}</h3><ul>${UC.map(u => `<li><button class="go wide" type="button" data-uc="${u.id}" data-k="0">▶ ${esc(u.t)}<small>${esc(FR[u.f].title)} · ${u.steps.length}칸</small></button></li>`).join('')}</ul></div>`;
  h += `<div><h3>앱으로 보기</h3><ul>${MXR.map(el => {
    const cs = UC.map(u => involve(u, el)), n = cs.filter(c => c.first >= 0).length, o = cs.reduce((a, c) => a + c.o, 0), i = cs.reduce((a, c) => a + c.i, 0);
    return `<li><button class="go wide" type="button" data-app="${el}">${esc(rowName(el))}<small>유즈케이스 ${n} · 보냄 ${o} · 받음 ${i}</small></button></li>`;
  }).join('')}</ul></div>`;
  h += `<div><h3>앱 화면 ${SCR.length}</h3><ul>${SCR.map((x, i) => `<li><button class="go wide" type="button" data-scr="${i}">${i + 1}. ${esc(x.t)}<small>${esc(UCI[x.uc].s)}</small></button></li>`).join('')}</ul></div>`;
  h += `<div><button class="go" type="button" data-fr="matrix">앱 × 유즈케이스 표로 가기</button> <button class="go" type="button" data-fr="screens">앱 화면 창으로 가기</button></div>`;
  openPanel('창 안의 순서', '유즈케이스 · 앱', h);
}

/* ───────── 객체 지도: 자세히 보기 · 따라가기 ───────── */
const objBtn = id => `<button class="go" type="button" data-obj="${id}">${esc(ON[id])}<small>${esc(OST[id])}</small></button>`;
const liT = t => `<li>${esc(t)}</li>`;
const apiLi = t => { const [a, ...b] = String(t).split(' — '); return `<li><code>${esc(a)}</code>${b.length ? ` ${esc(b.join(' — '))}` : ''}</li>`; };
function objLinks(id) {
  const out = OE.filter(e => e.a === id), inn = OE.filter(e => e.b === id);
  const row = (e, other, dir) => `<li>${dir === 'o' ? '<span class="verb">→ 보낸다</span>' : '<span class="verb">← 받는다</span>'}${objBtn(other)}<small class="eln">${e.n ? `${e.n}번 · ${esc([...new Set(e.list.map(x => x.u.s))].join(' · '))}` : esc(e.t)}</small></li>`;
  return (out.length ? `<div><h3>이 객체가 보내는 곳 · ${out.length}</h3><ul>${out.map(e => row(e, e.b, 'o')).join('')}</ul></div>` : '') +
    (inn.length ? `<div><h3>이 객체로 들어오는 곳 · ${inn.length}</h3><ul>${inn.map(e => row(e, e.a, 'i')).join('')}</ul></div>` : '');
}
function openObj(id) {
  stopTour(); clearFocus();
  const o = OBJ[id], nb = new Set([id]);
  OE.forEach(e => { if (e.a === id) nb.add(e.b); if (e.b === id) nb.add(e.a); });
  board.classList.add('focus', 'ofocus');
  OIDS.forEach(x => OBJ[x].dom.classList.toggle('on', nb.has(x)));
  o.dom.classList.add('sel');
  OE.forEach(e => { const on = e.a === id || e.b === id; e.dom.classList.toggle('on', on); e.lab.classList.toggle('on', on); });
  const st = byId[id] ? byId[id].s : 'done';
  let h = `<div class="tags"><span class="verb">«${esc(OST[id])}»</span><span class="verb">${esc(o.pk.n)}</span>${ST[st] ? `<b class="chip ${st}">${ST[st]}</b>` : ''}</div>`;
  h += `<p class="lead">${esc(o.one)}</p><p>${esc(o.what)}</p><p class="why"><b>왜 따로 있나</b> ${esc(o.why)}</p>`;
  if (o.how.length) h += `<div><h3>안에서 도는 순서</h3><ol>${o.how.map(liT).join('')}</ol></div>`;
  if (o.parts) h += `<div><h3>이 화면 안의 부분 · ${o.parts.length}</h3><ul class="parts">${o.parts.map(p => `<li><b>${esc(p.n)}</b> ${esc(p.d)} <code>${esc(p.fn)}</code></li>`).join('')}</ul></div>`;
  if (o.holds.length) h += `<div><h3>가진 것 · 기억하는 것</h3><ul class="dot">${o.holds.map(liT).join('')}</ul></div>`;
  if (o.api.length) h += `<div><h3>받는 입구 · ${o.api.length}</h3><ul class="dot api">${o.api.map(apiLi).join('')}</ul></div>`;
  if (o.calls.length) h += `<div><h3>부르는 것</h3><ul class="dot">${o.calls.map(liT).join('')}</ul></div>`;
  h += dataOfObj(id);
  h += objLinks(id);
  const ucs = OUC[id];
  if (ucs.length) {
    h += `<div><h3>유즈케이스에서 맡는 일 · ${ucs.length}</h3><p class="note">파란 세로 줄이 이 객체, 파란 화살표가 이 객체가 보내거나 받는 칸이다.</p></div>`;
    ucs.forEach(({u, c}) => {
      h += `<div class="ucb"><div class="ucbh"><b>${esc(u.t)}</b><small>${dirText(c)}</small></div>${miniSeq(u, id, 480, Math.max(64, u.steps.length * 9 + 14), 'mseq big')}` +
        `<ul>${u.steps.map((x, k) => {
          const A = c.keys.has(x.a), B = c.keys.has(x.b);
          if (!A && !B) return '';
          const v = A && B ? '⟳ 안에서' : A ? `→ ${ON[L2O(x.b)]}` : `← ${ON[L2O(x.a)]}`;
          return `<li><button class="go wide" type="button" data-objuc="${u.id}:${k}"><span class="verb">${k + 1} · ${esc(v)}</span>${x.alt ? `<span class="alt">${esc(x.alt)}</span>` : ''}${esc(x.t)}</button></li>`;
        }).join('')}</ul>` +
        `<div class="row"><button class="btn pri" type="button" data-objuc="${u.id}:${c.first}">▶ 객체 지도에서 따라가기</button><button class="btn" type="button" data-uc="${u.id}" data-k="${c.first}">순서도에서</button><button class="btn" type="button" data-ucx="${u.id}">유즈케이스 설명</button></div></div>`;
    });
  }
  if (o.fails.length) h += `<div><h3>실패하거나 막을 때</h3><ul class="dot warn">${o.fails.map(liT).join('')}</ul></div>`;
  if (o.rules.length) h += `<div><h3>꼭 지키는 약속</h3><ul class="dot">${o.rules.map(liT).join('')}</ul></div>`;
  if (o.change.length) h += `<div><h3>고칠 때 볼 것</h3><ul class="dot">${o.change.map(liT).join('')}</ul></div>`;
  if (o.files.length) h += `<div><h3>파일</h3><ul class="files">${o.files.map(t => `<li><code>${esc(t)}</code></li>`).join('')}</ul></div>`;
  const shots = SCR.map((x, i) => [x, i]).filter(([x]) => x.els.includes(id) || OUC[id].some(({u}) => u.id === x.uc));
  if (shots.length) h += `<div><h3>이 객체가 움직이는 화면 · ${shots.length}</h3><div class="shots">${shots.map(([x, i]) => `<button type="button" data-scr="${i}" title="${esc(x.t)}"><img src="${(IMG[x.img] || x.img)}" alt="${esc(x.t)}" loading="lazy"><span>${i + 1}. ${esc(x.t)}</span></button>`).join('')}</div></div>`;
  if (byId[id]) h += `<div><h3>보드의 상자</h3><button class="go" type="button" data-go="${id}">${esc(byId[id].n)}<small>${esc(FR[byId[id].f].title)}</small></button></div>`;
  openPanel(`객체 · ${o.pk.n}`, ON[id], h, true);
  const list = [...nb].map(x => rectOf(OBJ[x]));
  fly(camFor(union(nb.size <= 7 ? list : [rectOf(o)]), 60));
}
function openUCInfo(id) {
  stopTour(); clearFocus();
  const u = UCI[id], x = UCX[id] || {}, objs = [...new Set(u.lanes.map(L2O))];
  let h = `<p class="lead">${esc(u.d)}</p>`;
  h += `<div class="ucx"><div><h3>언제 시작하나</h3><p>${esc(x.when || '')}</p></div><div><h3>끝나면 남는 것</h3><p>${esc(x.end || '')}</p></div><div><h3>안 될 때</h3><p>${esc(x.fail || '')}</p></div></div>`;
  h += `<div class="row"><button class="btn pri" type="button" data-objuc="${id}:0">▶ 객체 지도에서 따라가기</button><button class="btn" type="button" data-uc="${id}" data-k="0">순서도에서 따라가기</button></div>`;
  h += `<div><h3>나오는 객체 · ${objs.length}</h3><ul>${objs.map(o => `<li>${objBtn(o)}<small class="eln">${dirText(involveO(u, o))}</small></li>`).join('')}</ul></div>`;
  h += `<div><h3>칸 · ${u.steps.length}</h3><ol class="steps">${u.steps.map((s, k) => `<li><button class="go wide" type="button" data-objuc="${id}:${k}"><span class="verb">${esc(s.a === s.b ? ON[L2O(s.a)] + ' 안에서' : ON[L2O(s.a)] + ' → ' + ON[L2O(s.b)])}${s.r ? ' (답)' : ''}</span>${s.alt ? `<span class="alt">${esc(s.alt)}</span>` : ''}${esc(s.t)}${s.c ? ` <code>${esc(s.c)}</code>` : ''}</button></li>`).join('')}</ol></div>`;
  const shots = SCR.map((s, i) => [s, i]).filter(([s]) => s.uc === id);
  if (shots.length) h += `<div><h3>이 순서가 보이는 화면</h3><div class="shots">${shots.map(([s, i]) => `<button type="button" data-scr="${i}" title="${esc(s.t)}"><img src="${(IMG[s.img] || s.img)}" alt="${esc(s.t)}" loading="lazy"><span>${i + 1}. ${esc(s.t)}</span></button>`).join('')}</div></div>`;
  h += `<div><h3>들어 있는 창</h3><button class="go" type="button" data-fr="${u.f}">${esc(FR[u.f].title)}</button></div>`;
  openPanel(`유즈케이스 · ${u.steps.length}칸`, u.t, h, true);
  board.classList.add('focus', 'ofocus');
  OIDS.forEach(o => OBJ[o].dom.classList.toggle('on', objs.includes(o)));
  const used = new Set(u.steps.filter(s => !s.r).map(s => L2O(s.a) + '>' + L2O(s.b)));
  OE.forEach(e => { const on = used.has(e.a + '>' + e.b); e.dom.classList.toggle('on', on); e.lab.classList.toggle('on', on); });
  fly(camFor(union(objs.map(o => rectOf(OBJ[o]))), 50));
}

/* ───────── 데이터 지도 ───────── */
const dRect = x => ({x: x.x, y: x.y, w: x.w2, h: x.h2});
function dmRows(list) {
  return `<ul class="dot">${list.map(([o, how]) => `<li>${objChip(o)}${how ? ` <span class="eln">${esc(how)}</span>` : ''}</li>`).join('')}</ul>`;
}
function openData(id) {
  stopTour(); clearFocus();
  const x = DMI[id], s = DSI[x.st];
  board.classList.add('focus'); x.dom.classList.add('on');
  let h = `<div class="tags"><span class="verb">${esc(s.n)}</span><span class="verb">${esc(s.life)}</span></div>`;
  h += `<p class="lead">${esc(x.one)}</p><p><code>${esc(x.k)}</code></p>`;
  h += `<div><h3>모양 · 무엇이 들어 있나</h3><ul class="dot">${x.shape.map(liT).join('')}</ul></div>`;
  h += `<div><h3>쓰는 곳 →</h3>${dmRows(x.w)}</div>`;
  if (x.v) h += `<div><h3>거쳐 가는 곳</h3>${dmRows(x.v)}</div>`;
  h += `<div><h3>← 읽는 곳</h3>${dmRows(x.r)}</div>`;
  h += `<div class="row"><button class="btn pri" type="button" data-dmobj="${id}">객체 지도에서 쓰는 곳 · 읽는 곳 보기</button></div>`;
  if (x.lim !== '—') h += `<div><h3>한도</h3><p>${esc(x.lim)}</p></div>`;
  h += `<div><h3>언제 사라지나</h3><p>${esc(x.life)}</p></div>`;
  if (x.never !== '—') h += `<div><h3>남기지 않는 것</h3><ul class="dot warn"><li>${esc(x.never)}</li></ul></div>`;
  if (x.change !== '—') h += `<div><h3>바꿀 때 같이 고칠 것</h3><p>${esc(x.change)}</p></div>`;
  if (x.tests.length) h += `<div><h3>지켜보는 시험</h3><ul class="files">${x.tests.map(t => `<li><code>${esc(t)}</code></li>`).join('')}</ul></div>`;
  const same = s.ids.filter(k => k !== id);
  if (same.length) h += `<div><h3>같은 곳의 다른 데이터</h3><ul>${same.map(k => `<li><button class="go" type="button" data-dm="${k}">${esc(DMI[k].n)}</button></li>`).join('')}</ul></div>`;
  openPanel(`데이터 · ${s.n}`, x.n, h, true);
  fly(camFor(dRect(x), 120));
}
function showDataObjs(id) {
  const x = DMI[id], ws = new Set(x.w.map(([o]) => o).filter(Boolean)), rs = new Set(x.r.map(([o]) => o).filter(Boolean)), vs = (x.v || []).map(([o]) => o);
  clearFocus();
  board.classList.add('focus', 'ofocus');
  x.dom.classList.add('on');
  const all = new Set([...ws, ...rs, ...vs].filter(o => OBJ[o]));
  all.forEach(o => { OBJ[o].dom.classList.add('on'); if (ws.has(o) && !rs.has(o)) OBJ[o].dom.classList.add('from'); else if (rs.has(o) && !ws.has(o)) OBJ[o].dom.classList.add('to'); else OBJ[o].dom.classList.add('sel'); });
  if (all.size) fly(camFor(union([...all].map(o => rectOf(OBJ[o]))), 80));
}
function openFlow(i) {
  stopTour(); clearFocus();
  const s = DFLOW[i];
  board.classList.add('focus'); s.dom.classList.add('on');
  s.dm.forEach(k => DMI[k].dom.classList.add('on'));
  let h = `<p class="lead">${esc(s.t)}</p><p>${esc(s.d)}</p>`;
  h += `<div><h3>이 칸의 부품</h3><ul><li>${objChip(s.o)}</li></ul></div>`;
  h += `<div><h3>이 칸이 쓰고 읽는 데이터</h3><ul>${s.dm.map(k => `<li><button class="go" type="button" data-dm="${k}">${esc(DMI[k].n)}<small>${esc(DSI[DMI[k].st].n)}</small></button></li>`).join('')}</ul></div>`;
  h += `<div class="row">${i ? `<button class="btn" type="button" data-dflow="${i - 1}">← ${i}. ${esc(DFLOW[i - 1].t)}</button>` : ''}${i < DFLOW.length - 1 ? `<button class="btn pri" type="button" data-dflow="${i + 1}">${i + 2}. ${esc(DFLOW[i + 1].t)} →</button>` : ''}</div>`;
  openPanel(`한 줄 흐름 · ${i + 1} / ${DFLOW.length}`, s.t, h);
  fly(camFor(union([s, ...s.dm.map(k => dRect(DMI[k]))]), 80));
}
function openDataMap() {
  stopTour(); clearFocus();
  const f = FD;
  f.dom.classList.add('on');
  let h = `<p>${esc(f.desc)}</p><p class="why"><b>이 자리인 까닭</b> ${esc(f.why)}</p>`;
  h += `<div><h3>한 줄 흐름</h3><ol>${DFLOW.map((s, i) => `<li><button class="go" type="button" data-dflow="${i}">${esc(s.t)}<small>${esc(ON[s.o])}</small></button></li>`).join('')}</ol></div>`;
  DS.forEach(s => {
    h += `<div><h3>${esc(s.n)} · ${s.ids.length}</h3><p class="note">${esc(s.life)}</p><ul>${s.ids.map(k => `<li><button class="go" type="button" data-dm="${k}">${esc(DMI[k].n)}<small>${esc(DMI[k].k)}</small></button></li>`).join('')}</ul></div>`;
  });
  openPanel(f.kicker, f.title, h, true);
  fly(camFor(fbox(f), 24));
}
function dataOfObj(id) {
  const list = ODM[id];
  if (!list || !list.length) return '';
  const by = new Map();
  list.forEach(({x, verb}) => { const v = by.get(x.id) || []; if (!v.includes(verb)) v.push(verb); by.set(x.id, v); });
  return `<div><h3>쓰고 읽는 데이터 · ${by.size}</h3><ul>${[...by].map(([k, v]) => `<li><span class="verb">${v.join(' · ')}</span><button class="go" type="button" data-dm="${k}">${esc(DMI[k].n)}<small>${esc(DSI[DMI[k].st].n)}</small></button></li>`).join('')}</ul></div>`;
}

function openObjects() {
  stopTour(); clearFocus();
  const f = FO, n = JOURNEY.reduce((a, id) => a + UCI[id].steps.length, 0);
  f.dom.classList.add('on');
  let h = `<p>${esc(f.desc)}</p><p class="why"><b>읽는 법</b> 카드 하나가 객체 하나다. 카드 안의 작은 그림은 그 객체가 나오는 순서도이고, 파란 줄이 그 객체다. 카드 사이 선은 순서도에서 한쪽이 다른 쪽에게 보내는 화살표를 모아 센 것이라, 굵을수록 자주 오간다. 점선은 순서도에는 없지만 코드에서 이어지는 길이다.</p>`;
  h += `<div class="row"><button class="btn pri" type="button" data-journey>▶ 전체 여정 따라가기 · ${n}칸</button></div>`;
  h += `<div><h3>여정 순서 · 유즈케이스 ${UC.length}</h3><ul>${[...JOURNEY.map(id => UCI[id]), ...UC.filter(u => !u.prop && !JOURNEY.includes(u.id))].map(u => `<li><button class="go wide" type="button" data-ucx="${u.id}">${JOURNEY.includes(u.id) ? `<span class="verb">${JOURNEY.indexOf(u.id) + 1}</span>` : '<span class="verb">따로</span>'}${esc(u.t)}<small>${u.steps.length}칸 · 객체 ${new Set(u.lanes.map(L2O)).size}</small></button></li>`).join('')}</ul></div>`;
  PKG.forEach(p => { h += `<div><h3>${esc(p.n)} · ${p.ids.length}</h3><p class="note">${esc(p.d)}</p><ul>${p.ids.map(id => `<li>${objBtn(id)}<small class="eln">${esc(OBJ[id].one)}</small></li>`).join('')}</ul></div>`; });
  openPanel(f.kicker, f.title, h, true);
  fly(camFor(fbox(f), 24));
}
let oc = null;
function endObj() {
  if (!oc) return;
  if (oc.dot) oc.dot.remove();
  OIDS.forEach(id => OBJ[id].dom.classList.remove('on', 'from', 'to', 'sel'));
  OE.forEach(e => { e.dom.classList.remove('on', 'cur'); e.lab.classList.remove('on'); });
  board.classList.remove('ofocus');
  oc = null;
}
function startObj(list, i, label) {
  clearInterval(timer); timer = 0; $('#tPlay').textContent = '자동으로 넘기기';
  endUC(); endObj(); clearFocus();
  closePanel();
  mode = 'obj'; oc = {list, i: 0, label, dot: null};
  objStep(i || 0);
}
const playObj = (id, k) => { const u = UCI[id]; startObj(u.steps.map((_, i) => ({u, k: i})), k || 0, ''); };
function playJourney() {
  const list = [];
  JOURNEY.forEach(id => UCI[id].steps.forEach((_, k) => list.push({u: UCI[id], k})));
  startObj(list, 0, '전체 여정');
}
function camAround(r, k) { const v = viewBox(); return {k, x: v.w / 2 - (r.x + r.w / 2) * k, y: v.h / 2 - (r.y + r.h / 2) * k}; }
function objStep(i) {
  const L = oc.list, n = L.length;
  i = (i + n) % n; oc.i = i;
  const {u, k} = L[i], x = u.steps[k], A = L2O(x.a), B = L2O(x.b);
  if (innerWidth <= 720) closePanel();
  tour.hidden = false;
  board.classList.add('focus', 'ofocus');
  OIDS.forEach(id => { const d = OBJ[id].dom; d.classList.toggle('on', id === A || id === B); d.classList.toggle('from', id === A); d.classList.toggle('to', id === B && A !== B); });
  OE.forEach(e => { e.dom.classList.remove('on', 'cur'); e.lab.classList.remove('on'); });
  if (oc.dot) { oc.dot.remove(); oc.dot = null; }
  const r = union([A, B].map(id => rectOf(OBJ[id])));
  let cm = camFor(r, 60);
  if (cm.k > .75) cm = camAround(r, .75);
  if (A !== B) {
    let e = OEM.get(A + '>' + B), rev = false, d;
    if (!e) { e = OEM.get(B + '>' + A); rev = !!e; }
    if (e) { e.dom.classList.add('on', 'cur'); e.lab.classList.add('on'); d = e.d; }
    else { const a = OBJ[A], b = OBJ[B]; d = `M${a.x + a.w / 2} ${a.y + a.h / 2}L${b.x + b.w / 2} ${b.y + b.h / 2}`; }
    if (!reduce) {
      const c = document.createElementNS(NS, 'circle'), am = document.createElementNS(NS, 'animateMotion');
      c.setAttribute('class', 'odot'); c.setAttribute('r', String(Math.max(11, 9 / cm.k)));
      am.setAttribute('dur', '1.1s'); am.setAttribute('fill', 'freeze'); am.setAttribute('begin', 'indefinite'); am.setAttribute('path', d);
      if (rev) { am.setAttribute('keyPoints', '1;0'); am.setAttribute('keyTimes', '0;1'); am.setAttribute('calcMode', 'linear'); }
      c.append(am); OSVG.append(c); oc.dot = c;
      try { am.beginElement(); } catch (_) {}
    }
  }
  $('#tN').textContent = `${oc.label ? oc.label + ' · ' : ''}${u.s} · ${k + 1} / ${u.steps.length}`;
  $('#tD').innerHTML = u.steps.map((_, j) => `<i class="${j === k ? 'on' : ''}"></i>`).join('');
  $('#tT').textContent = A === B ? `${ON[A]} 안에서` : `${ON[A]} → ${ON[B]}${x.r ? ' (답)' : ''}`;
  $('#tP').textContent = (x.alt ? `[${x.alt}] ` : '') + x.t + (x.c ? ` · ${x.c}` : '');
  $('#tNext').textContent = i === n - 1 ? '처음부터' : '다음';
  $('#tSeq').hidden = false; $('#tSeq').textContent = '순서도에서 보기';
  fly(cm);
}

$('#bUC').addEventListener('click', () => { $('#legend').hidden = true; openList(); });
function showStep(i) {
  endUC(); endObj(); mode = 'tour'; $('#tSeq').hidden = true;
  ti = (i + TOUR.length) % TOUR.length;
  const s = TOUR[ti], ids = new Set(s.ids), ei = new Set();
  R.forEach(([a, b], k) => { if (ids.has(a) && ids.has(b)) ei.add(k); });
  closePanel(); tour.hidden = false;
  $('#tN').textContent = `${ti + 1} / ${TOUR.length}`;
  $('#tD').innerHTML = TOUR.map((_, k) => `<i class="${k === ti ? 'on' : ''}"></i>`).join('');
  $('#tT').textContent = s.t; $('#tP').textContent = s.p;
  $('#tNext').textContent = ti === TOUR.length - 1 ? '처음부터' : '다음';
  focusOn(ids, ei, true);
  fly(camFor(union(s.f.map(id => fbox(FR[id]))), 30));
}
function stopTour() { clearInterval(timer); timer = 0; $('#tPlay').textContent = '자동으로 넘기기'; if (!tour.hidden) { tour.hidden = true; clearFocus(); } endUC(); endObj(); $('#tSeq').hidden = true; mode = 'tour'; }
const stepNext = () => mode === 'obj' && oc ? objStep(oc.i + 1) : mode === 'uc' && cur ? ucStep(cur.k + 1) : showStep(ti + 1);
const stepPrev = () => mode === 'obj' && oc ? objStep(oc.i - 1) : mode === 'uc' && cur ? ucStep(cur.k - 1) : showStep(ti - 1);
$('#tSeq').addEventListener('click', () => {
  if (mode === 'obj' && oc) { const {u, k} = oc.list[oc.i]; playUC(u.id, k); }
  else if (mode === 'uc' && cur) playObj(cur.u.id, cur.k);
});
$('#bObj').addEventListener('click', () => { $('#legend').hidden = true; openObjects(); });
$('#bData').addEventListener('click', () => { $('#legend').hidden = true; openDataMap(); });
$('#bTour').addEventListener('click', () => { $('#legend').hidden = true; showStep(0); });
$('#tNext').addEventListener('click', stepNext);
$('#tPrev').addEventListener('click', stepPrev);
$('#tClose').addEventListener('click', stopTour);
$('#tPlay').addEventListener('click', () => {
  if (timer) { clearInterval(timer); timer = 0; $('#tPlay').textContent = '자동으로 넘기기'; return; }
  $('#tPlay').textContent = '멈추기'; timer = setInterval(stepNext, mode === 'tour' ? 7000 : 3000);
});

/* ───────── 읽는 법 ───────── */
$('#lgL').innerHTML = LAYERS.map(([k, ko, en]) => `<div><span class="sw" style="background:var(--l-${k})"></span><span>${ko} <small style="color:var(--mute)">${en}</small></span></div>`).join('') +
  `<div><span class="sw" style="background:var(--l-pla)"></span><span>이행의 단계 <small style="color:var(--mute)">Plateau</small></span></div>`;
$('#lgS').innerHTML = [['cut','0 12px 0 12px','동기 (목표 · 원칙 · 제약)'],['round','10px','능력 · 프로세스 · 작업 묶음'],['pill','20px','서비스'],['square','3px','행위자 · 구성요소 · 객체 · 노드']]
  .map(([, br, t]) => `<div><span class="sw" style="border-radius:${br};background:var(--soft)"></span><span>${t}</span></div>`).join('');
$('#lgT').innerHTML = Object.entries(ST).map(([k, v]) => `<div><b class="chip ${k}">${v}</b><span>${{done:'만들어서 돈다',part:'일부만 있거나 가상 데이터',todo:'아직 없다 (점선)',cand:'후보, 정하지 않음 (점선)',gone:'뺐다'}[k]}</span></div>`).join('');
$('#lgR').innerHTML = Object.entries(RELS).map(([k, [ko, en]]) => {
  const st = ES[k];
  return `<div><svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true"><path class="e" style="opacity:1" d="M6 8L58 8"${st.d ? ` stroke-dasharray="${st.d}"` : ''}${st.s ? ` marker-start="url(#m-${st.s})"` : ''}${st.e ? ` marker-end="url(#m-${st.e})"` : ''}/></svg><span>${ko} <small style="color:var(--mute)">${en}</small></span></div>`;
}).join('') + `<div><svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true"><path class="flow" style="stroke-width:3" d="M4 8L60 8"/></svg><span>창 사이로 일이 넘어감</span></div>`;
$('#lgQ').innerHTML = [
  ['<span class="sw" style="background:var(--l-app)"></span>', '세로 줄: 사람이나 앱 하나'],
  ['<svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true"><path class="sa" d="M6 8H56" marker-end="url(#m-triF)"/></svg>', '보낸다 (부탁 · 요청)'],
  ['<svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true"><path class="sa ret" d="M6 8H56" marker-end="url(#m-open)"/></svg>', '돌려준다 (답)'],
  ['<svg width="64" height="20" viewBox="0 0 64 20" aria-hidden="true"><path class="sa" d="M14 3H44V17H20" marker-end="url(#m-triF)"/></svg>', '그 앱 안에서 한다'],
  ['<span class="alt">아니요</span>', '갈래: 그 경우에만 지나는 칸'],
  ['<svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true"><circle class="sdot" cx="32" cy="8" r="5.5"/></svg>', '움직이는 점: 순서가 흐르는 방향']
].map(([g, t]) => `<div>${g}<span>${t}</span></div>`).join('');
$('#lgO').innerHTML = [
  ['<span class="sw" style="background:var(--l-app);border-radius:6px"></span>', '카드: 부품(객체) 하나'],
  ['<span class="sw" style="background:none;border:2px dashed var(--line2);border-radius:6px"></span>', '점선 칸: 같은 곳에서 도는 묶음'],
  ['<svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true"><path class="oe" style="opacity:1" stroke-width="3" d="M6 8H56" marker-end="url(#m-triF)"/></svg>', '선: 순서도에서 보내는 횟수, 굵을수록 자주'],
  ['<svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true"><path class="oe x" style="opacity:1" stroke-width="1.4" d="M6 8H56" marker-end="url(#m-triF)"/></svg>', '점선: 순서도엔 없고 코드에서 이어짐'],
  ['<svg width="64" height="30" viewBox="0 0 64 30" aria-hidden="true" class="mseq"><line class="ml" x1="14" y1="2" x2="14" y2="28"/><line class="ml me" x1="32" y1="2" x2="32" y2="28"/><line class="ml" x1="50" y1="2" x2="50" y2="28"/><path class="ms me" d="M14 10H30"/><path class="ms" d="M32 20H48"/></svg>', '카드 안 작은 순서도: 파란 줄이 이 객체'],
  ['<svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true"><circle class="odot" cx="32" cy="8" r="6"/></svg>', '따라가기 점: 보내는 쪽 → 받는 쪽']
].map(([g, t]) => `<div>${g}<span>${t}</span></div>`).join('');
$('#lgD').innerHTML = [
  ['<span class="sw" style="background:none;border:2px dashed var(--line2);border-radius:6px"></span>', '점선 칸: 데이터가 놓이는 곳'],
  ['<span class="sw" style="background:var(--l-app);border-radius:6px"></span>', '카드: 데이터 하나 (파랑은 화면 · 서버, 초록은 파일)'],
  ['<span class="dv">쓴다 →</span>', '이 데이터를 만들거나 바꾸는 부품'],
  ['<span class="dv r">← 읽는다</span>', '이 데이터를 꺼내 쓰는 부품'],
  ['<span class="dv v">거친다</span>', '저장 전에 가리는 등, 지나가며 손대는 부품'],
  ['<span class="dob p">사람</span>', '사람이 직접 한다 (코드 PR · .env 복사)']
].map(([g, t]) => `<div>${g}<span>${t}</span></div>`).join('');
$('#bLegend').addEventListener('click', () => { $('#legend').hidden = !$('#legend').hidden; });
$('#lX').addEventListener('click', () => { $('#legend').hidden = true; });

/* ───────── 시작 ───────── */
// 쓰지 않는 기능의 단추와 읽는 법 칸은 숨긴다
[['#bObj', FO], ['#bData', FD], ['#bTour', TOUR.length], ['#bUC', UC.length]].forEach(([s, on]) => { if (!on) $(s).hidden = true; });
[['lgO', FO], ['lgD', FD], ['lgQ', UC.length]].forEach(([id, on]) => { if (!on) document.querySelectorAll(`[data-sec="${id}"]`).forEach(x => { x.hidden = true; }); });
const first = FR[B.start] || FO || FRAMES.find(f => f.main) || null;
if (first) { cam = camFor(fbox(first), 20); apply(); } else { apply(); fitAll(); }
const mainF = FRAMES.find(f => f.main);
if (innerWidth <= 720 && mainF) { cam = camFor(fbox(mainF), 12); apply(); }
window.ArchiBoard = {version: VERSION, format: FORMAT, openFrame, openObj: id => OBJ[id] && openObj(id), openData: id => DMI[id] && openData(id)};
})();
