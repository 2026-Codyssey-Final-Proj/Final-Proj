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

const TURNS_MAX = 2000, CHANGES_MAX = 2000, TEXT_MAX = 2000, TITLE_MAX = 60, ADD_MAX = 20, STAGE_MAX = 7, PATH_MAX = 400;
const WHO = new Set(["me", "floro", "sys"]);
const CHANGE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

const dirOf = (env = process.env, home = os.homedir()) => env.NAV_CHAT_DIR || (env.NAV_USAGE_FILE ? env.NAV_USAGE_FILE.replace(/(\.json)?$/, "-chats") : path.join(home, ".navigator-chats"));
const realDir = (p) => { try { return fs.realpathSync.native(String(p)); } catch { return path.resolve(String(p)); } };
const fileOf = (dir, projectDir) => path.join(dir, `${crypto.createHash("sha256").update(realDir(projectDir)).digest("hex").slice(0, 16)}.json`);
const blank = (project = "") => ({ v: 1, project, dropped: 0, turns: [], changes: [] });   // project — 사람이 이 폴더를 열어 볼 때 어느 프로젝트의 파일인지 알게(이름만, 가림)
const text = (t, max) => (typeof t === "string" && t.trim() && t.length <= max ? t.trim() : null);

// 말 하나를 검사하고 가린다 — 말 { stage, who, text } · 구분선 { stage, mark: true, title } · 가져온 것 { stage, carry }. at은 서버가 붙인다(받지 않는다). 틀리면 null
function cleanTurn(t, redact = Sensitive.redact) {
  if (!t || typeof t !== "object" || Array.isArray(t) || !Number.isInteger(t.stage) || t.stage < 0 || t.stage > STAGE_MAX) return null;
  const keys = Object.keys(t).sort().join();
  if (keys === "stage,text,who") { const x = text(t.text, TEXT_MAX); return WHO.has(t.who) && x ? { stage: t.stage, who: t.who, text: redact(x) } : null; }
  if (keys === "mark,stage,title") { const x = text(t.title, TITLE_MAX); return t.mark === true && x ? { stage: t.stage, mark: true, title: redact(x) } : null; }
  if (keys === "carry,stage") { const x = text(t.carry, TEXT_MAX); return x ? { stage: t.stage, carry: redact(x) } : null; }
  return null;
}
// 쌓기 — 검사 · 가림을 거친 말들(cleanTurn)에 at을 붙여 뒤에. 2,000개를 넘으면 앞에서 덜고 덜어낸 수(dropped)를 센다 — 화면에는 publicOf가 맨 앞 한 줄로
function addTurns(data, cleaned, { now = Date.now } = {}) {
  const at = now(), all = [...data.turns, ...cleaned.map((t) => ({ at, ...t }))], cut = Math.max(0, all.length - TURNS_MAX);
  return { ...data, dropped: (data.dropped || 0) + cut, turns: cut ? all.slice(cut) : all };
}
// 바뀐 파일 — 이 기록에서 처음 보는 경로의 Write면 new, 아니면 edit. 2,000개까지(앞에서 덜기)
function addChange(data, { path: p, tool }, { now = Date.now } = {}) {
  if (!CHANGE_TOOLS.has(tool) || typeof p !== "string" || !p) return data;
  const how = tool === "Write" && !data.changes.some((c) => c.path === p) ? "new" : "edit";
  return { ...data, changes: [...data.changes, { at: now(), path: p, how }].slice(-CHANGES_MAX) };
}
// 작업 폴더 기준 경로 — file은 그 세션 폴더(cwd) 안의 상대 경로(steps.js fileOf). cwd는 절대 경로만, 작업 폴더 밖이면 ""(쌓지 않는다)
function projectPath(projectDir, cwd, file) {
  if (!projectDir || typeof cwd !== "string" || !path.isAbsolute(cwd) || typeof file !== "string" || !file || file.length > PATH_MAX || path.isAbsolute(file)) return "";
  const rel = path.relative(realDir(projectDir), path.resolve(realDir(cwd), file)).split(path.sep).join("/");
  return !rel || rel === ".." || rel.startsWith("../") || path.isAbsolute(rel) ? "" : rel;
}

// 읽기 — 없으면 빈 기록. 다른 판 · 깨진 파일은 덮어쓰지 않게 .bak으로 옮겨 두고 빈 기록(앱을 옛 판으로 되돌려도 기록이 사라지지 않게)
//   없는 게 아니라 못 읽으면(잠김 · 권한) 던진다 — 빈 기록으로 보면 다음 저장이 대화를 덮어 지웠다(F-119)
function load(file, project = "") {
  let raw; try { raw = fs.readFileSync(file, "utf8"); } catch (e) { if (e && e.code === "ENOENT") return blank(project); throw e; }
  let j = null; try { j = JSON.parse(raw); } catch {}
  if (!j || j.v !== 1 || !Array.isArray(j.turns) || !Array.isArray(j.changes)) { fs.renameSync(file, `${file}.bak-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`); return blank(project); }   // 못 옮기면 던진다 — 빈 기록을 주면 다음 저장이 그 파일을 덮었다(F-119 새 맥락 리뷰)
  return { v: 1, project, dropped: Number.isInteger(j.dropped) && j.dropped > 0 ? j.dropped : 0, turns: j.turns.filter((t) => t && Number.isFinite(t.at)),
    changes: j.changes.filter((c) => c && typeof c.path === "string" && (c.how === "new" || c.how === "edit")) };
}
// 쓰기 — 임시 파일(600)에 쓰고 바꿔 끼운다(쓰다 끊겨도 반쪽 파일이 남지 않게). 폴더 700
function save(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  try { fs.chmodSync(path.dirname(file), 0o700); } catch {}
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600 });
  fs.renameSync(tmp, file);
}
// 지우기 — 없으면 그대로(force), 못 지우면 던진다(서버가 500 — 지웠다고 거짓말하지 않게)
const clear = (file) => fs.rmSync(file, { force: true });
// 화면에 주는 모양 — 덜어냈으면 맨 앞에 sys 한 줄
const publicOf = (data) => ({ project: data.project, turns: data.dropped ? [{ at: (data.turns[0] || {}).at || 0, stage: (data.turns[0] || {}).stage || 0, who: "sys", text: `앞 대화 ${data.dropped}개를 덜어냈어요` }, ...data.turns] : data.turns, changes: data.changes });

module.exports = { TURNS_MAX, CHANGES_MAX, TEXT_MAX, TITLE_MAX, ADD_MAX, PATH_MAX, CHANGE_TOOLS, dirOf, fileOf, blank, cleanTurn, addTurns, addChange, projectPath, load, save, clear, publicOf };
