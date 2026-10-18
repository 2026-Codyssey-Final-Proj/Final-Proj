// claude-drafted: 2026-10-18 — 이재엽 결정 "GitHub Action + API 토큰"(버전을 Jira 릴리스로, 01-docs/00-overview/jira.md 3절).
// main에 올라올 때마다(.github/workflows/jira-release.yml) CHANGELOG.md 맨 위 버전을 Jira 프로젝트의 버전으로 만들어 릴리스하고,
// 이번 push의 커밋 메시지(병합 커밋에는 브랜치 이름 · PR 제목이 들어 있다)에 적힌 Jira 키의 이슈에 그 버전을 붙인다.
// Jira 자동화를 쓰지 않는 이유: 무료 요금제는 한 달 150걸음인데 팀은 하루 13~17개를 병합한다(jira.md 3절).
// 비밀값이 없으면 건너뛴다 — 설정 전에도 main이 빨개지지 않게. 값은 어디에도 찍지 않는다(버전 이름과 이슈 키만).
// 실패는 숨기지 않는다(security-records.md 6-1): 1·2·4초 간격으로 3번까지 다시 해 보고, 이슈 하나가 실패해도 나머지를 한 뒤 빠진 것을 적고 실패로 끝낸다.
"use strict";

const KEY = /^[A-Z][A-Z0-9]{1,9}$/;

// CHANGELOG 맨 위 버전 줄 — 칸: 버전 | 날짜 | 누가 | 무엇이 달라졌나 | 건드린 곳 (04-tests/repo/test_changelog.py와 같은 줄 모양)
function topVersion(text) {
  const line = String(text || "").split("\n").find((l) => /^\| v\d+\.\d+ \| \d{4}-\d{2}-\d{2} \|/.test(l));
  if (!line) return null;
  const [version, date, , what = ""] = line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
  return { version, date, what: what.replace(/\*\*|`/g, "").slice(0, 250) };
}

// 커밋 메시지에서 이 프로젝트의 키만 — FR-13 · F-03 같은 우리 문서 번호는 키가 아니다
function issueKeys(messages, projectKey) {
  if (!KEY.test(projectKey || "")) return [];
  const rx = new RegExp(`(?<![A-Za-z0-9])${projectKey}-\\d+(?![A-Za-z0-9])`, "g");
  const keys = new Set();
  for (const m of messages || []) for (const k of String(m || "").match(rx) || []) keys.add(k);
  return [...keys].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

function config(env) {
  const missing = ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_PROJECT_KEY"].filter((k) => !env[k]);
  if (missing.length) return { skip: `비밀값 · 변수가 없어요: ${missing.join(", ")}` };
  let url;
  try { url = new URL(env.JIRA_BASE_URL); } catch { return { error: "JIRA_BASE_URL이 주소 모양이 아니에요" }; }
  // 토큰을 Atlassian 밖으로 보내지 않는다 — 잘못 넣은 주소도 여기서 멈춘다(주소 값은 찍지 않는다)
  if (url.protocol !== "https:" || !url.hostname.endsWith(".atlassian.net")) return { error: "JIRA_BASE_URL은 https://<사이트>.atlassian.net 이어야 해요" };
  if (!KEY.test(env.JIRA_PROJECT_KEY)) return { error: "JIRA_PROJECT_KEY는 대문자 프로젝트 키여야 해요" };
  return { base: url.origin, key: env.JIRA_PROJECT_KEY, auth: "Basic " + Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString("base64") };
}

async function call(io, cfg, method, path, body) {
  for (let i = 0; ; i++) {
    let res = null;
    try {
      res = await io.fetch(cfg.base + path, {
        method,
        headers: { Authorization: cfg.auth, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {}
    const again = !res || res.status === 429 || res.status >= 500;
    if (!again || i === 3) {
      if (!res) throw new Error(`${method} ${path}: 연결 실패`);
      if (!res.ok) throw new Error(`${method} ${path}: ${res.status}`);
      return res.status === 204 ? null : res.json();
    }
    await io.sleep(1000 * 2 ** i);
  }
}

async function run(env, io) {
  const cfg = config(env);
  if (cfg.skip) { io.log(`::notice::Jira 릴리스 건너뜀 — ${cfg.skip} (01-docs/00-overview/jira.md 3절)`); return 0; }
  if (cfg.error) { io.log(`::error::${cfg.error}`); return 1; }
  const top = topVersion(io.read("CHANGELOG.md"));
  if (!top) { io.log("::error::CHANGELOG.md 맨 위에 버전 줄이 없어요"); return 1; }
  let event = {};
  try { event = JSON.parse(io.read(env.GITHUB_EVENT_PATH || "") || "{}"); } catch {}
  const keys = issueKeys((event.commits || []).map((c) => c && c.message), cfg.key);

  try {
    const project = await call(io, cfg, "GET", `/rest/api/3/project/${cfg.key}`);
    const versions = await call(io, cfg, "GET", `/rest/api/3/project/${cfg.key}/versions`);
    const found = (versions || []).find((v) => v.name === top.version);
    if (!found) {
      await call(io, cfg, "POST", "/rest/api/3/version", { name: top.version, projectId: Number(project.id), description: top.what, released: true, releaseDate: top.date });
      io.log(`${top.version}: 만들고 릴리스함`);
    } else if (!found.released) {
      await call(io, cfg, "PUT", `/rest/api/3/version/${found.id}`, { released: true, releaseDate: top.date });
      io.log(`${top.version}: 릴리스함`);
    } else io.log(`${top.version}: 이미 릴리스돼 있음`);
  } catch (e) { io.log(`::error::Jira 버전을 만들지 못했어요 — ${e.message}`); return 1; }

  if (!keys.length) io.log(`이번 push에 ${cfg.key}- 키가 없어요 — 이슈에는 붙이지 않았어요`);
  const failed = [];
  for (const k of keys) {
    try {
      await call(io, cfg, "PUT", `/rest/api/3/issue/${k}`, { update: { fixVersions: [{ add: { name: top.version } }] } });
      io.log(`${k} ← ${top.version}`);
    } catch (e) { failed.push(`${k}(${e.message.split(": ").pop()})`); }
  }
  if (failed.length) { io.log(`::error::이슈에 버전을 붙이지 못했어요: ${failed.join(", ")}`); return 1; }
  return 0;
}

module.exports = { topVersion, issueKeys, config, run };

if (require.main === module) {
  const fs = require("node:fs");
  const io = {
    fetch: globalThis.fetch,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    log: (s) => console.log(s),
    read: (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } },
  };
  run(process.env, io).then((code) => { process.exitCode = code; });
}
