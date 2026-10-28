// claude-drafted: 2026-10-29 — 작업실 개편 C-63 2차 백엔드 T23 · T26 서버 쪽(API.md 3-32, 결정 모음 A-20 '이 컴퓨터의 앱 저장 곳' · A-21 이재엽 쪽 세션).
// 프로젝트마다 대화 하나와 그 폴더에서 바뀐 파일을 이 컴퓨터의 앱 저장 곳에 둔다 — 작업 폴더에는 쓰지 않는다(커밋되지 않게).
//   자리: NAV_CHAT_DIR(앱은 Electron userData/chats), 없으면 NAV_USAGE_FILE 옆(시험), 없으면 홈의 .navigator-chats. 폴더 700 · 파일 600.
//   파일 이름: 작업 폴더 실제 경로의 sha256 앞 16자 — 폴더 이름 · 경로가 파일 이름에 드러나지 않게.
//   말은 저장하기 전에 가린다(sensitive.js). 서버는 단계를 모른다 — 화면이 구분선의 at으로 단계마다 나눈다. 시험 04-tests/navigator/chat-store.test.js
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const Sensitive = require("./sensitive.js");

const TURNS_MAX = 2000, CHANGES_MAX = 2000, TEXT_MAX = 2000, TITLE_MAX = 60, ADD_MAX = 20, STAGE_MAX = 7;
const WHO = new Set(["me", "floro", "sys"]);
const CHANGE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

const dirOf = (env = process.env, home = os.homedir()) => env.NAV_CHAT_DIR || (env.NAV_USAGE_FILE ? env.NAV_USAGE_FILE.replace(/(\.json)?$/, "-chats") : path.join(home, ".navigator-chats"));
const realDir = (p) => { try { return fs.realpathSync.native(String(p)); } catch { return path.resolve(String(p)); } };
const fileOf = (dir, projectDir) => path.join(dir, `${crypto.createHash("sha256").update(realDir(projectDir)).digest("hex").slice(0, 16)}.json`);
const blank = (project = "") => ({ v: 1, project, turns: [], changes: [] });
const text = (t, max) => (typeof t === "string" && t.trim() && t.length <= max ? t.trim() : null);

// 말 하나 — 말 { stage, who, text } · 구분선 { stage, mark: true, title } · 가져온 것 { stage, carry }. at은 서버가 붙인다(받지 않는다). 틀리면 null
function cleanTurn(t) {
  if (!t || typeof t !== "object" || Array.isArray(t) || "at" in t || !Number.isInteger(t.stage) || t.stage < 0 || t.stage > STAGE_MAX) return null;
  const keys = Object.keys(t).sort().join();
  if (keys === "stage,text,who") { const x = text(t.text, TEXT_MAX); return WHO.has(t.who) && x ? { stage: t.stage, who: t.who, text: x } : null; }
  if (keys === "mark,stage,title") { const x = text(t.title, TITLE_MAX); return t.mark === true && x ? { stage: t.stage, mark: true, title: x } : null; }
  if (keys === "carry,stage") { const x = text(t.carry, TEXT_MAX); return x ? { stage: t.stage, carry: x } : null; }
  return null;
}
const redactTurn = (t, redact) => ({ ...t, ...(t.text ? { text: redact(t.text) } : {}), ...(t.title ? { title: redact(t.title) } : {}), ...(t.carry ? { carry: redact(t.carry) } : {}) });

// 쌓기 — 말들을 다듬고(cleanTurn) 가린 뒤 at을 붙여 뒤에. 2,000개를 넘으면 앞에서 덜고, 맨 앞 한 줄(sys)이 덜어낸 수를 말한다(그 줄도 2,000개 안)
function addTurns(data, turns, { now = Date.now, redact = Sensitive.redact } = {}) {
  const at = now(), add = turns.map(cleanTurn).filter(Boolean).map((t) => ({ at, ...redactTurn(t, redact) }));
  const note = data.turns[0] && data.turns[0].trimmed ? data.turns[0] : null;
  let body = [...(note ? data.turns.slice(1) : data.turns), ...add], dropped = note ? note.trimmed : 0;
  if (dropped || body.length > TURNS_MAX) { const keep = TURNS_MAX - 1; if (body.length > keep) { dropped += body.length - keep; body = body.slice(-keep); } }
  return { ...data, turns: dropped ? [{ at, stage: body.length ? body[0].stage : 0, who: "sys", text: `앞 대화 ${dropped}개를 덜어냈어요`, trimmed: dropped }, ...body] : body };
}
// 바뀐 파일 — 이 기록에서 처음 보는 경로의 Write면 new, 아니면 edit. 2,000개까지(앞에서 덜기)
function addChange(data, { path: p, tool }, { now = Date.now } = {}) {
  if (!CHANGE_TOOLS.has(tool) || typeof p !== "string" || !p) return data;
  const how = tool === "Write" && !data.changes.some((c) => c.path === p) ? "new" : "edit";
  return { ...data, changes: [...data.changes, { at: now(), path: p, how }].slice(-CHANGES_MAX) };
}
// 작업 폴더 기준 경로 — 훅 알림의 what은 그 세션 폴더(cwd) 기준이다. 작업 폴더 밖이면 ""(쌓지 않는다)
function projectPath(projectDir, cwd, what) {
  if (!projectDir || !cwd || typeof what !== "string" || !what || path.isAbsolute(what)) return "";
  const rel = path.relative(realDir(projectDir), path.resolve(realDir(cwd), what)).split(path.sep).join("/");
  return !rel || rel === ".." || rel.startsWith("../") || path.isAbsolute(rel) ? "" : rel;
}

function load(file, project = "") {
  let j; try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return blank(project); }
  if (!j || j.v !== 1 || !Array.isArray(j.turns) || !Array.isArray(j.changes)) return blank(project);
  return { v: 1, project, turns: j.turns.filter((t) => t && Number.isFinite(t.at)), changes: j.changes.filter((c) => c && typeof c.path === "string" && (c.how === "new" || c.how === "edit")) };
}
// 쓰기 — 임시 파일에 쓰고 바꿔 끼운다(쓰다 끊겨도 반쪽 파일이 남지 않게). 폴더 700 · 파일 600
function save(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  try { fs.chmodSync(path.dirname(file), 0o700); } catch {}
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}
const clear = (file) => { try { fs.rmSync(file, { force: true }); } catch {} };
// 화면에 주는 모양 — 덜어낸 수 표시(trimmed)는 빼고 그대로
const publicOf = (data) => ({ project: data.project, turns: data.turns.map(({ trimmed, ...t }) => t), changes: data.changes });

module.exports = { TURNS_MAX, CHANGES_MAX, TEXT_MAX, TITLE_MAX, ADD_MAX, CHANGE_TOOLS, dirOf, fileOf, blank, cleanTurn, addTurns, addChange, projectPath, load, save, clear, publicOf };
