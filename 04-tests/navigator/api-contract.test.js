// claude-drafted: 2026-10-18 — 이재엽의 요청("남은 요구사항 작업")으로 Claude가 썼다. 이슈 #19(API 계약 테스트, 담당 두승현) · 약속 문서 #7.
// 로컬 API 약속(03-backend/navigator/API.md)대로 서버가 답하는지 주소마다 본다 — 성공 모양(칸 이름·타입·개수), 거절마다 상태 코드, 등급, 확인 값.
//
// 진짜 AI는 부르지 않는다. provider.js의 재생 모드(NAV_REPLAY)에 이 시험이 만든 임시 녹화 파일을 준다:
//   녹화 키는 서버가 만들 요청문(navigator.js의 judgePrompt 등)과 스키마로 recording.js keyOf가 만든다 — 서버와 같은 함수라 같은 요청이면 재생된다.
//   녹화에 없는 요청은 AI를 부르지 않고 502로 끝난다. 그래서 400이 나오면 "AI를 부르기 전에 거절했다"는 뜻이다.
//   재생이 깨져도 돈이 들거나 밖으로 나가지 않게: 가짜 키 + 닫힌 로컬 주소(ANTHROPIC_BASE_URL)로 둔다 — claude -p로 새지도 않는다.
// 할 일 문장은 적어 두지 않는다 — navigator.js criteriaFor로 세고 비교한다(판정 규칙이 바뀌어도 이 시험은 그대로).
// AI 답 자리에는 연습 예시(동아리 행사 등록 앱, scenario.js)의 미리 만든 답을 넣는다.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const Nav = require(path.join(BACK, "navigator.js"));
const REC = require(path.join(BACK, "recording.js"));
const S = require(path.join(BACK, "scenario.js"));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-contract-"));
// 시험 안에서만 쓰는 가짜 비밀값 — 소스에 키 모양이 그대로 남지 않게 실행할 때 만든다(check-secrets.sh)
const FAKE_KEY = "sk-" + "Zq9x".repeat(6);
const URL_SECRET = "relay-" + "p4th".repeat(3);

// ── 서버를 불러오기 전에 정할 것: 환경과 녹화 파일(provider.js는 불러올 때 한 번 읽는다) ──
Object.assign(process.env, {
  NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"),
  NAV_USAGE_FILE: path.join(TMP, "usage.json"),
  NAV_REPLAY: path.join(TMP, "replay.json"),
  ANTHROPIC_API_KEY: FAKE_KEY,
  ANTHROPIC_BASE_URL: `http://127.0.0.1:9/${URL_SECRET}`,
});
for (const k of ["NAV_RECORD", "NAV_PLAN", "NAV_TOKEN_BUDGET", "NAV_TESTER", "NAV_TESTER_BUDGET", "NAV_MODEL", "NAV_COMPAT", "NAV_PURPOSE", "NAV_USE_RESERVE"]) delete process.env[k];

// 서버가 만들 요청문 — server.js와 같은 함수·같은 인자여야 재생된다
function requestOf(route, b) {
  if (route === "/api/judge") return [Nav.judgePrompt(b.text, b.stage, b.tier), Nav.JUDGE_SCHEMA];
  if (route === "/api/answer") return [Nav.answerPrompt(b.stage, Array.isArray(b.hard) ? b.hard.map(String) : [], b.question, b.text), Nav.ANSWER_SCHEMA];
  if (route === "/api/draft") return [Nav.draftPrompt(b.stage, b.text, b.tier), Nav.DRAFT_SCHEMA];
  return [Nav.reviewPrompt(b.stage, b.text, b.doc, b.tier), Nav.REVIEW_SCHEMA];
}
const items = {};
// 녹화해 둔다: 이 요청에는 이 AI 답. 돌려주는 것은 보낼 요청
function rec(route, body, answer) { items[REC.keyOf(...requestOf(route, body))] = answer; return { route, body }; }

const EX = S.examples[0];                     // 연습 1 · 하는 중 — 2단계
const textAt = (n) => S.examples.find((e) => e.text && e.judgement.stage === n);
const NEXT = EX.judgement.next;
const blank = (n, tier) => Nav.criteriaFor(n, tier).map(() => ({ met: false, evidence: "" }));
const judgeRaw = (n, tier, over = {}) => ({ reason: "아직 하는 중이에요.", criteria: blank(n, tier), next: NEXT, ...over });
const LONG = "동아리 행사 신청 ".repeat(5000).slice(0, 40_000 - JSON.stringify({ text: "", stage: 0 }).length);   // 본문이 딱 40,000자

const R = {
  judge: rec("/api/judge", { text: EX.text, stage: 2 }, EX.judgement),
  stages: Nav.STAGES.map((s) => rec("/api/judge", { text: textAt(s.n).text, stage: s.n }, textAt(s.n).judgement)),
  tiers: [1, 5].flatMap((n) => ["Xpress", "Lite"].map((tier) => rec("/api/judge", { text: textAt(n).text, stage: n, tier }, judgeRaw(n, tier)))),
  wrongCount: rec("/api/judge", { text: "동아리 행사 등록 앱 — 등급과 개수가 다른 답", stage: 5, tier: "Lite" }, judgeRaw(5, "Full")),
  evidence: rec("/api/judge", { text: "동아리 행사 등록 앱을 만들 거예요. 회원이 행사를 신청해요.", stage: 0 }, judgeRaw(0, undefined, {
    stage: 7,   // AI가 다른 단계를 말해도
    criteria: [{ met: true, evidence: "글에 없는 구절" }, { met: true, evidence: "동아리  행사" }, { met: false, evidence: "회원이" }, { met: true, evidence: "" }],
  })),
  badJudge: [
    judgeRaw(2, undefined, { next: { ...NEXT, options: ["하나뿐"] } }),
    judgeRaw(2, undefined, { next: { ...NEXT, options: ["가", "나", "다", "라", "마"] } }),
    judgeRaw(2, undefined, { reason: "" }),
    judgeRaw(2, undefined, { criteria: blank(2).slice(1) }),
    judgeRaw(2, undefined, { next: { ...NEXT, what: "" } }),
  ].map((a, i) => rec("/api/judge", { text: `동아리 행사 등록 앱 — 모양이 틀린 판정 ${i}`, stage: 2 }, a)),
  long: rec("/api/judge", { text: LONG, stage: 0 }, judgeRaw(0)),
  answer: rec("/api/answer", { stage: 2, hard: [Nav.criteriaFor(2)[1].text], question: "'30초 안에'면 충분히 빠른 건가요?", text: EX.text }, { answer: S.answers[2][1] }),
  answerNoHard: rec("/api/answer", { stage: 2, hard: [], question: "헷갈린 곳을 안 골랐어요", text: EX.text }, { answer: S.answers[2][0] }),
  badAnswer: [{ answer: "" }, { answer: { 글: "모양이 다름" } }, {}].map((a, i) => rec("/api/answer", { stage: 2, hard: [], question: `모양이 틀린 답 ${i}`, text: EX.text }, a)),
  drafts: [1, 2, 3, 4].map((n) => rec("/api/draft", { stage: n, text: textAt(n).text }, { draft: S.drafts[n].draft, say: S.drafts[n].say })),
  draftLite: rec("/api/draft", { stage: 1, text: "동아리 행사 등록 앱 — 등급 시험", tier: "Lite" }, { draft: "아이디어 정리표 초안", say: "빈칸 0개예요." }),
  draftLong: rec("/api/draft", { stage: 3, text: "동아리 행사 등록 앱 — 긴 초안" }, { draft: "가".repeat(5000), say: "길게 써 봤어요." }),
  badDraft: [{ draft: "", say: "말" }, { draft: "초안" }].map((a, i) => rec("/api/draft", { stage: 4, text: `동아리 행사 등록 앱 — 모양이 틀린 초안 ${i}` }, a)),
  review: rec("/api/review", { stage: 2, text: EX.text, doc: S.drafts[2].draft }, S.reviewFixture(S.drafts[2].draft, 2)),
  reviewTrim: rec("/api/review", { stage: 2, text: EX.text, doc: "1. 회원이 신청 버튼을 누르면, 앱은 신청서를 보여 준다." }, {
    say: "고칠 곳이 있어요.", good: ["가", "나", "다", "라", "마"], ready: true,
    fix: [1, 2, 3, 4].map((i) => ({ where: `구절 ${i}`, why: "이유", hint: "방향", 덤: "버릴 칸" })),
  }),
  reviewReady: rec("/api/review", { stage: 2, text: EX.text, doc: "빈칸을 다 채운 기능 목록" }, { say: "확정해도 돼요.", good: [], fix: [], ready: true }),
  reviewXpress: rec("/api/review", { stage: 1, text: "동아리 행사 등록 앱 — 등급 시험", doc: "1. 신청", tier: "Xpress" }, { say: "좋아요.", good: [], fix: [], ready: true }),
  badReview: [
    { say: "말", good: [""], fix: [], ready: false },
    { say: "말", good: [], fix: [{ where: "구절", why: "이유" }], ready: false },
    { say: "말", good: [], fix: [], ready: "예" },
  ].map((a, i) => rec("/api/review", { stage: 2, text: EX.text, doc: `모양이 틀린 다시 보기 ${i}` }, a)),
};
REC.save(process.env.NAV_REPLAY, items);

let Srv, port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const token = () => fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();

before(async () => {
  port = await freePort();
  process.env.NAV_PORT = String(port);   // allowed()가 보는 주소의 포트
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken();   // 서버를 켤 때처럼 확인 값을 만든다
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });

// body: 객체면 JSON으로, raw: 글자 그대로 보낸다
function call(method, url, { headers = {}, body, raw } = {}) {
  return new Promise((resolve, reject) => {
    const data = raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body);
    const h = { ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), ...headers };
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: h, timeout: 10_000 }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, headers: res.headers, json, text }); });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error(`${method} ${url} 응답 없음`)));
    req.end(data);
  });
}
const post = (r) => call("POST", r.route, { body: r.body });
const withToken = () => ({ "X-Nav-Token": token() });
const JSON_TYPE = "application/json; charset=utf-8";

// 약속 2절: 거절은 언제나 {ok:false, reason} 두 칸, JSON
function refused(r, status, reason, what = "") {
  assert.equal(r.status, status, `${what} ${r.text}`);
  assert.equal(r.headers["content-type"], JSON_TYPE, what);
  assert.deepEqual(Object.keys(r.json).sort(), ["ok", "reason"], what);
  assert.equal(r.json.ok, false, what);
  if (reason instanceof RegExp) assert.match(r.json.reason, reason, what);
  else assert.equal(r.json.reason, reason, what);
}
function succeeded(r, keys, what = "") {
  assert.equal(r.status, 200, `${what} ${r.text}`);
  assert.equal(r.headers["content-type"], JSON_TYPE, what);
  assert.deepEqual(Object.keys(r.json).sort(), ["ok", ...keys].sort(), what);
  assert.equal(r.json.ok, true, what);
}
const isText = (v) => typeof v === "string" && v.trim() !== "";

// ════════ 2. 공통 약속 ════════

test("공통: 다른 Host·다른 Origin·파일로 연 화면(Origin: null)은 어느 주소든 403 — localhost와 127.0.0.1은 서로 바꿔 써도 된다", async () => {
  const no = "이 컴퓨터의 화면에서만 부를 수 있음";
  for (const [method, url] of [["GET", "/"], ["GET", "/api/usage"], ["POST", "/api/judge"], ["GET", "/api/events"], ["GET", "/no-such-page"]]) {
    refused(await call(method, url, { headers: { Host: "evil.example" } }), 403, no, `${url} Host`);
    refused(await call(method, url, { headers: { Origin: "https://evil.example" } }), 403, no, `${url} Origin`);
    refused(await call(method, url, { headers: { Origin: "null" } }), 403, no, `${url} Origin null`);
    refused(await call(method, url, { headers: { Host: `127.0.0.1:${port + 1}` } }), 403, no, `${url} 다른 포트`);
  }
  assert.equal((await call("GET", "/api/usage", { headers: { Host: `localhost:${port}`, Origin: `http://127.0.0.1:${port}` } })).status, 200);
  assert.equal((await call("GET", "/api/usage")).status, 200, "Origin이 없으면(curl·훅) Host만 본다");
});

test("공통: 없는 주소·맞지 않는 방법(메서드)은 본문과 상관없이 404 '없는 주소'", async () => {
  for (const [method, url, body] of [["GET", "/api/nothing"], ["POST", "/api/nothing", {}], ["POST", "/api/nothing", { text: "글" }], ["POST", "/", {}],
    ["GET", "/api/judge"], ["PUT", "/api/judge", { text: "글", stage: 2 }], ["DELETE", "/api/usage"], ["POST", "/api/usage", {}]]) {
    refused(await call(method, url, { body }), 404, "없는 주소", `${method} ${url}`);
  }
});

test("공통: 본문은 40,000자까지 — 넘으면 413, 딱 40,000자는 받고 긴 한글도 글자 그대로 판정에 넘긴다", async () => {
  assert.equal(JSON.stringify(R.long.body).length, 40_000);
  assert.ok(Buffer.byteLength(JSON.stringify(R.long.body)) > 65_536, "읽기 조각(64KB)보다 길어서 한글이 조각 경계에 걸린다");
  const ok = await post(R.long);
  succeeded(ok, ["judgement", "tokens"], "40,000자");
  for (const [route, body] of [["/api/judge", { ...R.long.body, text: `${LONG}가` }], ["/api/event", { hook_event_name: "Stop", last_assistant_message: "가".repeat(40_001) }]]) {
    const headers = route === "/api/event" ? withToken() : {};
    refused(await call("POST", route, { body, headers }), 413, /40,000자/, route);
  }
});

test("공통: JSON이 아닌 본문은 400 — AI 주소는 '작업 내용이 비어 있음', 알림은 '알 수 없는 알림'", async () => {
  for (const url of ["/api/judge", "/api/answer", "/api/draft", "/api/review"]) {
    refused(await call("POST", url, { raw: "{깨진 JSON" }), 400, "작업 내용이 비어 있음", url);
    refused(await call("POST", url, { raw: "" }), 400, "작업 내용이 비어 있음", `${url} 빈 본문`);
  }
  refused(await call("POST", "/api/event", { raw: "{깨진 JSON", headers: withToken() }), 400, "알 수 없는 알림");
});

test("공통: 물음표 뒤 값은 API 주소를 바꾸지 않는다 — 화면 파일은 정확한 경로만", async () => {
  succeeded(await call("GET", "/api/usage?view=1"), ["provider", "model", "host", "compat", "used", "budget", "state", "replay"]);
  assert.equal((await call("POST", "/api/judge?x=1", { body: R.judge.body })).status, 200);
  refused(await call("GET", "/app.js?v=2"), 404, "없는 주소");
});

// ════════ 3-1. 화면 파일 ════════

const PAGES = ["/", "/index.html", "/navigator/index.html", "/library/index.html", "/library/sky.html", "/share/index.html"];

test("화면 파일: 페이지(html)는 확인 값 쿠키(HttpOnly·SameSite=Strict·Path=/api/events)와 no-store, 스크립트·스타일은 쿠키 없이", async () => {
  for (const page of PAGES) {
    const r = await call("GET", page);
    assert.equal(r.status, 200, page);
    assert.equal(r.headers["content-type"], "text/html; charset=utf-8", page);
    assert.equal(r.headers["cache-control"], "no-store", page);
    const cookie = (r.headers["set-cookie"] || []).find((c) => c.startsWith("nav_event_token="));
    assert.ok(cookie, page);
    assert.equal(cookie.split(";")[0], `nav_event_token=${token()}`);
    for (const part of [/;\s*HttpOnly/i, /;\s*SameSite=Strict/i, /;\s*Path=\/api\/events(;|$)/]) assert.match(cookie, part, page);
    assert.ok(!r.text.includes(token()), `${page} 글에 확인 값이 없다`);
  }
  for (const [url, type] of [["/app.js", "text/javascript"], ["/app.css", "text/css"], ["/03-backend/navigator/navigator.js", "text/javascript"]]) {
    const r = await call("GET", url);
    assert.equal(r.status, 200, url);
    assert.equal(r.headers["content-type"], `${type}; charset=utf-8`, url);
    assert.equal(r.headers["set-cookie"], undefined, url);
  }
});

test("화면 파일: 서버가 내주는 페이지가 부르는 이 컴퓨터의 파일(src·href)은 모두 서버가 내준다", async () => {
  const missing = [];
  for (const page of PAGES) {
    const html = (await call("GET", page)).text;
    for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue;   // 밖의 주소(글꼴 등)·같은 페이지 안
      const url = new URL(ref, `http://127.0.0.1:${port}${page}`).pathname;
      if ((await call("GET", url)).status !== 200) missing.push(`${page} → ${ref}`);
    }
  }
  assert.deepEqual(missing, [], "목록(server.js STATIC)에 빠진 파일");
});

// ════════ 3-2~3-4. 알림 (훅 → 서버 → 화면) ════════

const hookEvent = (session, over = {}) => ({ hook_event_name: "UserPromptSubmit", session_id: session, cwd: "/Users/me/club-app", prompt: "행사 목록 화면 만들어 줘", ...over });
const postEvent = (body, headers = withToken()) => call("POST", "/api/event", { body, headers });
const getEvents = (since = 0, headers = withToken()) => call("GET", `/api/events?since=${since}`, { headers });

test("확인 값: 알림 세 주소는 값이 없거나 틀리면 403 — 방법(메서드)이 틀려도 값부터 본다", async () => {
  const no = /^확인 값이 없거나 맞지 않음/;
  for (const headers of [{}, { "X-Nav-Token": "wrong-value" }, { Cookie: "nav_event_token=wrong-value" }]) {   // 머리글은 ASCII만 실린다
    refused(await call("POST", "/api/event", { body: hookEvent("t"), headers }), 403, no);
    refused(await call("GET", "/api/events", { headers }), 403, no);
    refused(await call("POST", "/api/events/clear", { headers }), 403, no);
    refused(await call("DELETE", "/api/events", { headers }), 403, no);
  }
  refused(await call("DELETE", "/api/events", { headers: withToken() }), 404, "없는 주소", "값이 맞으면 그다음에 주소를 본다");
});

test("확인 값: 머리글(X-Nav-Token)이 있으면 머리글만 본다 — 틀린 머리글에 맞는 쿠키를 같이 보내도 403", async () => {
  const cookie = `nav_event_token=${token()}`;
  assert.equal((await getEvents(0, { Cookie: cookie })).status, 200, "쿠키만으로도 된다(화면)");
  assert.equal((await getEvents(0, { "X-Nav-Token": "wrong-value", Cookie: cookie })).status, 403);
  assert.equal((await getEvents(0, { "X-Nav-Token": token(), Cookie: "nav_event_token=wrong-value" })).status, 200);
});

test("POST /api/event: 훅 알림을 받으면 {ok, seq} — seq는 하나씩 는다. 모르는 알림은 400 '알 수 없는 알림'", async () => {
  const a = await postEvent(hookEvent("seq"));
  succeeded(a, ["seq"]);
  assert.ok(Number.isInteger(a.json.seq) && a.json.seq > 0);
  const b = await postEvent(hookEvent("seq", { hook_event_name: "Stop", prompt: undefined, last_assistant_message: "만들었어요" }));
  assert.equal(b.json.seq, a.json.seq + 1);
  for (const name of ["PreToolUse", "", undefined]) refused(await postEvent(hookEvent("seq", { hook_event_name: name })), 400, "알 수 없는 알림", String(name));
});

test("GET /api/events: {ok, latest, events[]} — 알림은 seq·at·kind·tool·project·work, since보다 뒤의 것만", async () => {
  const { latest } = (await getEvents()).json;
  await postEvent(hookEvent("shape", { cwd: "/Users/me/club-app" }));
  await postEvent(hookEvent("shape", { hook_event_name: "Stop", prompt: undefined, last_assistant_message: "행사 목록을 날짜순으로 보여 줘요.", tool: "codex" }));
  const r = await getEvents(latest);
  succeeded(r, ["latest", "events"]);
  assert.equal(r.json.latest, latest + 2);
  assert.equal(r.json.events.length, 2, "since 뒤의 두 개만");
  for (const e of r.json.events) {
    assert.deepEqual(Object.keys(e).sort(), ["at", "kind", "project", "seq", "tool", "work"]);
    assert.ok(Number.isInteger(e.seq) && e.seq > latest);
    assert.ok(Number.isFinite(e.at) && Math.abs(Date.now() - e.at) < 60_000, "밀리초 시각");
    assert.equal(e.project, "club-app", "작업 폴더 이름만");
  }
  const [p, s] = r.json.events;
  assert.deepEqual([p.kind, p.tool, s.kind, s.tool], ["prompt", "claude", "stop", "codex"]);
  assert.equal(p.work, "[사용자] 행사 목록 화면 만들어 줘");
  assert.equal(s.work, "[Codex] 행사 목록을 날짜순으로 보여 줘요.", "Codex 세션은 Claude Code 세션과 따로 모인다");
  assert.equal((await getEvents("abc")).json.events.length, (await getEvents(0)).json.events.length, "since가 숫자가 아니면 0");
});

test("GET /api/events: 알림은 최근 20개, 한 세션의 대화는 최근 말 20개·4,000자 안에서", async () => {
  for (let i = 0; i < 25; i++) await postEvent(hookEvent("cap", { hook_event_name: "Stop", prompt: `p${i}`, last_assistant_message: `a${i}` }));
  const r = (await getEvents(0)).json;
  assert.equal(r.events.length, 20, "25개를 보냈어도");
  assert.equal(r.events.at(-1).seq, r.latest);
  const lines = r.events.at(-1).work.split("\n");
  assert.equal(lines.length, 20, "한 알림에 두 말이 와도 20개");
  assert.equal(lines[0], "[사용자] p15", "오래된 말부터 버린다");
  await postEvent(hookEvent("long", { prompt: "가".repeat(5000) }));
  assert.equal((await getEvents(0)).json.events.at(-1).work.length, 4000);
});

test("POST /api/events/clear: {ok, cleared} — 비운 뒤 events는 비고, latest는 그대로", async () => {
  await postEvent(hookEvent("clear"));
  const before = (await getEvents(0)).json;
  const r = await call("POST", "/api/events/clear", { headers: withToken() });
  succeeded(r, ["cleared"]);
  assert.equal(r.json.cleared, before.events.length);
  const now = (await getEvents(0)).json;
  assert.deepEqual([now.events, now.latest], [[], before.latest]);
});

// ════════ 3-5. 사용량 ════════

const USAGE_KEYS = ["ok", "provider", "model", "host", "compat", "used", "budget", "state", "buckets", "testers", "replay", "record"];

test("GET /api/usage: 공급자·모델·호스트·사용량만 — 키 값과 주소의 경로는 담지 않는다", async () => {
  const r = await call("GET", "/api/usage");
  assert.equal(r.status, 200);
  assert.equal(r.headers["content-type"], JSON_TYPE);
  const u = r.json;
  for (const k of Object.keys(u)) assert.ok(USAGE_KEYS.includes(k), `약속에 없는 칸: ${k}`);
  assert.equal(u.ok, true);
  assert.equal(u.provider, "api", "키가 있으면 api");
  assert.ok(isText(u.model));
  assert.equal(u.host, "127.0.0.1:9", "호스트만");
  assert.equal(typeof u.compat, "boolean");
  assert.equal(u.used, 0);
  assert.equal(u.budget, null);
  assert.ok(["ok", "warn", "full"].includes(u.state));
  assert.equal(u.replay, true);
  assert.ok(!r.text.includes(FAKE_KEY) && !r.text.includes(URL_SECRET), "키·주소 경로가 새면 안 된다");
});

test("GET /api/usage: 예산 통(NAV_PLAN)이 있으면 buckets {통: {used, limit}}, 테스터가 쓰면 testers {이름: 토큰}", () => {
  const P = require(path.join(BACK, "provider.js"));
  const mem = { s: null, load() { return this.s; }, save(x) { this.s = JSON.parse(JSON.stringify(x)); } };
  const meter = P.createMeter(null, mem, { plan: P.parsePlan("default") });
  meter.add(120, { bucket: "test", tester: "A" });
  const d = P.describe({ ANTHROPIC_API_KEY: FAKE_KEY, NAV_PLAN: "default" }, meter);
  for (const k of Object.keys(d)) assert.ok(USAGE_KEYS.includes(k), k);
  assert.deepEqual(Object.keys(d.buckets), Object.keys(P.DEFAULT_PLAN));
  for (const b of Object.values(d.buckets)) assert.deepEqual(Object.keys(b).sort(), ["limit", "used"]);
  assert.deepEqual([d.buckets.test.used, d.testers], [120, { A: 120 }]);
  assert.ok(!JSON.stringify(d).includes(FAKE_KEY));
});

test("녹화·사용량 파일에는 키도 보낸 글도 남지 않는다 — 요청 지문(16자리)과 AI의 답, 토큰 수만", async () => {
  const P = require(path.join(BACK, "provider.js"));
  const recFile = path.join(TMP, "rec-out.json"), usageFile = path.join(TMP, "usage-out.json");
  const reply = { stop_reason: "end_turn", usage: { input_tokens: 12, output_tokens: 3 }, content: [{ type: "text", text: JSON.stringify({ answer: "짧게 답해요." }) }] };
  const client = { beta: { messages: { create: async () => reply } }, messages: { create: async () => reply } };   // 가짜 클라이언트 — 밖으로 안 나간다
  const callClaude = P.createCaller({ env: { ANTHROPIC_API_KEY: FAKE_KEY, NAV_RECORD: recFile }, makeClient: () => client, meter: P.createMeter(null, P.fileStore(usageFile)) });
  const r = await callClaude(Nav.answerPrompt(2, [], "질문", "회원 명단 메모-QX17"), Nav.ANSWER_SCHEMA);
  assert.deepEqual(r.data, { answer: "짧게 답해요." });
  const saved = fs.readFileSync(recFile, "utf8"), used = fs.readFileSync(usageFile, "utf8");
  for (const t of [saved, used]) assert.ok(!t.includes(FAKE_KEY) && !t.includes("QX17"));
  assert.ok(Object.keys(JSON.parse(saved).items).every((k) => /^[0-9a-f]{16}$/.test(k)));
  assert.deepEqual(JSON.parse(used), { used: 15, byPurpose: {}, byTester: {} });
});

// ════════ 3-6. 판정 ════════

// 판정 모양 — 약속 3-6. stage·tier로 할 일을 세고 문장을 서버 데이터와 맞댄다
function judgementShape(j, stage, tier) {
  assert.deepEqual(Object.keys(j).sort(), ["criteria", "next", "reason", "stage"]);
  assert.equal(j.stage, stage);
  assert.ok(isText(j.reason));
  const todo = Nav.criteriaFor(stage, tier);
  assert.equal(j.criteria.length, todo.length, `${stage}단계 ${tier || "등급 없음"} 할 일 개수`);
  j.criteria.forEach((c, i) => {
    assert.deepEqual(Object.keys(c).sort(), ["evidence", "met", "term", "text"]);
    assert.deepEqual([c.text, c.term], [todo[i].text, todo[i].term], "문장은 우리 데이터");
    assert.equal(typeof c.met, "boolean");
    assert.equal(typeof c.evidence, "string");
    if (c.met) assert.ok(c.evidence && c.evidence.length > 0, "했다면 근거가 있다");
  });
  assert.deepEqual(Object.keys(j.next).sort(), ["action", "options", "question", "what", "why"]);
  for (const k of ["what", "why", "question", "action"]) assert.ok(isText(j.next[k]), k);
  assert.ok(j.next.options.length >= 2 && j.next.options.length <= 4 && j.next.options.every(isText));
}

test("POST /api/judge: 연습 예시(동아리 행사 등록 앱 2단계)에 {ok, judgement, tokens}로 답한다 — 근거가 있는 할 일만 했다", async () => {
  const r = await post(R.judge);
  succeeded(r, ["judgement", "tokens"]);
  judgementShape(r.json.judgement, 2);
  assert.equal(r.json.tokens, 0, "재생은 토큰 0");
  assert.deepEqual(r.json.judgement.criteria.map((c) => c.met), EX.judgement.criteria.map((c) => c.met));
  for (const c of r.json.judgement.criteria.filter((x) => x.met)) assert.ok(EX.text.includes(c.evidence), "근거는 보낸 글에 있는 구절");
  assert.deepEqual(r.json.judgement.next, NEXT);
});

test("POST /api/judge: 0~7단계 모두 할 일 개수는 criteriaFor(단계).length", async () => {
  for (const req of R.stages) judgementShape((await post(req)).json.judgement, req.body.stage);
});

test("POST /api/judge: 등급 — 안 보냄·null·'Full'은 같은 요청이고, Xpress·Lite는 그 등급의 할 일만 받는다", async () => {
  const base = (await post(R.stages[1])).json;
  for (const tier of [null, "Full"]) assert.deepEqual((await call("POST", "/api/judge", { body: { ...R.stages[1].body, tier } })).json, base, String(tier));
  for (const req of R.tiers) {
    const r = await post(req);
    succeeded(r, ["judgement", "tokens"], `${req.body.stage}단계 ${req.body.tier}`);
    judgementShape(r.json.judgement, req.body.stage, req.body.tier);
  }
  assert.ok(Nav.criteriaFor(1, "Lite").length < Nav.criteriaFor(1).length, "시험이 뜻이 있으려면 개수가 달라야 한다");
});

test("POST /api/judge: 등급과 개수가 다른 AI 답·모양이 틀린 AI 답은 502 '판정 형식이 맞지 않음'", async () => {
  refused(await post(R.wrongCount), 502, "판정 형식이 맞지 않음", "Lite에 Full 개수");
  for (const req of R.badJudge) refused(await post(req), 502, "판정 형식이 맞지 않음", req.body.text);
});

test("POST /api/judge: 근거가 글에 없으면 met=false, 띄어쓰기만 다르면 근거로 친다, AI가 다른 단계를 말해도 보낸 단계", async () => {
  const j = (await post(R.evidence)).json.judgement;
  judgementShape(j, 0);
  assert.deepEqual(j.criteria.map((c) => [c.met, c.evidence]), [[false, ""], [true, "동아리 행사"], [false, "회원이"], [false, ""]]);
});

test("POST /api/judge: 녹화에 없는 요청(AI 실패)은 502와 공급자가 준 이유", async () => {
  refused(await call("POST", "/api/judge", { body: { text: "녹화하지 않은 글", stage: 2 } }), 502, /^녹화에 없는 요청이에요/);
});

// 네 AI 주소가 같이 쓰는 거절 — 본문 칸 순서: 글 → 등급 → 주소별 칸
const AI_ROUTES = ["/api/judge", "/api/answer", "/api/draft", "/api/review"];
const good = { stage: 2, question: "질문", doc: "1. 신청" };

test("AI 네 주소 공통: 글이 없거나 비면 400 '작업 내용이 비어 있음', 모르는 등급은 400 '모르는 등급' — AI를 부르지 않는다", async () => {
  for (const url of AI_ROUTES) {
    for (const text of [undefined, "", "   \n", 42, ["글"]]) refused(await call("POST", url, { body: { ...good, text } }), 400, "작업 내용이 비어 있음", `${url} ${JSON.stringify(text)}`);
    for (const tier of ["Huge", "full", "즉시처리", "", 3]) refused(await call("POST", url, { body: { ...good, text: "글", tier } }), 400, "모르는 등급", `${url} ${JSON.stringify(tier)}`);
  }
});

test("POST /api/judge·/api/answer: 단계가 정수 0~7이 아니면 400 '지금 단계가 없음'", async () => {
  for (const url of ["/api/judge", "/api/answer"]) {
    for (const stage of [undefined, null, -1, 8, 1.5, "2", "length", true]) {
      refused(await call("POST", url, { body: { text: "글", stage, question: "질문" } }), 400, "지금 단계가 없음", `${url} ${JSON.stringify(stage)}`);
    }
  }
});

// ════════ 3-7. 물어보기 ════════

test("POST /api/answer: {ok, answer, tokens} — 헷갈린 곳(hard)이 목록이 아니면 고르지 않은 것으로 본다", async () => {
  const r = await post(R.answer);
  succeeded(r, ["answer", "tokens"]);
  assert.equal(r.json.answer, S.answers[2][1]);
  assert.equal(r.json.tokens, 0);
  assert.equal((await call("POST", "/api/answer", { body: { ...R.answerNoHard.body, hard: "목록 아님" } })).json.answer, S.answers[2][0]);
  assert.equal((await call("POST", "/api/answer", { body: { ...R.answerNoHard.body, hard: undefined } })).json.answer, S.answers[2][0]);
});

test("POST /api/answer: 질문이 비면 400 '질문이 비어 있음', 답이 글이 아니면 502 '답 형식이 맞지 않음'", async () => {
  for (const question of [undefined, "", "  "]) refused(await call("POST", "/api/answer", { body: { ...R.answer.body, question } }), 400, "질문이 비어 있음", JSON.stringify(question));
  for (const req of R.badAnswer) refused(await post(req), 502, "답 형식이 맞지 않음", req.body.question);
});

// ════════ 3-8. 설계도 초안 ════════

test("POST /api/draft: 1~4단계에 {ok, draft, say, tokens} — 초안은 4,000자까지", async () => {
  for (const req of R.drafts) {
    const r = await post(req);
    succeeded(r, ["draft", "say", "tokens"], `${req.body.stage}단계`);
    assert.deepEqual([r.json.draft, r.json.say], [S.drafts[req.body.stage].draft, S.drafts[req.body.stage].say]);
  }
  assert.equal((await post(R.draftLong)).json.draft.length, 4000);
});

test("POST /api/draft: 등급은 요청문에 들어간다 — Lite로 녹화한 것은 Lite로 보낼 때만 재생된다", async () => {
  succeeded(await post(R.draftLite), ["draft", "say", "tokens"]);
  refused(await call("POST", "/api/draft", { body: { ...R.draftLite.body, tier: undefined } }), 502, /^녹화에 없는 요청/);
});

test("POST /api/draft·/api/review: 설계도가 없는 단계(0·5·6·7)나 정수가 아닌 단계는 400 '설계도를 만드는 단계가 아님'", async () => {
  for (const url of ["/api/draft", "/api/review"]) {
    for (const stage of [0, 5, 6, 7, 8, undefined, "2", "length"]) refused(await call("POST", url, { body: { text: "글", stage, doc: "1. 신청" } }), 400, "설계도를 만드는 단계가 아님", `${url} ${JSON.stringify(stage)}`);
  }
  assert.deepEqual(Nav.STAGES.filter((s) => s.doc).map((s) => s.n), [1, 2, 3, 4], "설계도가 있는 단계");
});

test("POST /api/draft: 초안·건네는 말이 비면 502 '초안 형식이 맞지 않음'", async () => {
  for (const req of R.badDraft) refused(await post(req), 502, "초안 형식이 맞지 않음", req.body.text);
});

// ════════ 3-9. 다시 봐 주기 ════════

test("POST /api/review: {ok, review:{say, good, fix[{where, why, hint}], ready}, tokens}", async () => {
  const r = await post(R.review);
  succeeded(r, ["review", "tokens"]);
  const v = r.json.review;
  assert.deepEqual(Object.keys(v).sort(), ["fix", "good", "ready", "say"]);
  assert.ok(isText(v.say) && v.good.every(isText));
  for (const f of v.fix) assert.deepEqual(Object.keys(f).sort(), ["hint", "where", "why"]);
  assert.deepEqual(v.fix.map((f) => f.where), Nav.blanks(S.drafts[2].draft).map((w) => `[채워 주세요: ${w}]`), "남은 빈칸을 고칠 곳으로");
  assert.equal(v.ready, false);
});

test("POST /api/review: 잘한 점·고칠 곳은 3개까지, 다른 칸은 버리고, 고칠 곳이 있으면 ready는 false", async () => {
  const v = (await post(R.reviewTrim)).json.review;
  assert.equal(v.good.length, 3);
  assert.equal(v.fix.length, 3);
  for (const f of v.fix) assert.deepEqual(Object.keys(f).sort(), ["hint", "where", "why"]);
  assert.equal(v.ready, false, "AI가 ready=true라고 해도");
  assert.equal((await post(R.reviewReady)).json.review.ready, true, "고칠 곳이 없을 때만 true");
  succeeded(await post(R.reviewXpress), ["review", "tokens"], "Xpress 등급");
  refused(await call("POST", "/api/review", { body: { ...R.reviewXpress.body, tier: "Lite" } }), 502, /^녹화에 없는 요청/, "등급이 요청문에 들어간다");
});

test("POST /api/review: 설계도가 비면 400 '설계도가 비어 있음', 모양이 틀린 AI 답은 502", async () => {
  for (const doc of [undefined, "", "  "]) refused(await call("POST", "/api/review", { body: { ...R.review.body, doc } }), 400, "설계도가 비어 있음", JSON.stringify(doc));
  for (const req of R.badReview) refused(await post(req), 502, "다시 봐 준 결과의 형식이 맞지 않음", req.body.doc);
});
