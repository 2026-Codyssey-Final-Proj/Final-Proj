// claude-drafted: 2026-10-29 — 지식 퀘스트 C-52(지식 퀘스트 PRD 6절 · 9절 10번 이재엽 버튼 "저장소마다 처음 한 번"). 시험 04-tests/navigator/knowledge-guard.test.js
// 기록을 사용자 저장소에 올리기 전에, 그 저장소가 공개(또는 공개인지 모름)이면 "누구나 볼 수 있어요"를 한 번 더 묻는다 — 저장소마다 처음 한 번.
//   '올릴게요'를 받은 저장소의 열쇠(github.js visibility의 key — 원격 주소 지문)만 이 컴퓨터의 파일에 둔다. 주소 · 이름은 남기지 않는다. 파일 600.
//   자리: NAV_PUBLIC_OK_FILE, 없으면 NAV_USAGE_FILE 옆(시험이 홈 폴더에 쓰지 않게), 없으면 홈의 .navigator-public-ok.json. 파일이 깨졌으면 다시 묻는다(지나가지 않는다)
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const KEYS_MAX = 200;
const fileOf = (env = process.env, home = os.homedir()) => env.NAV_PUBLIC_OK_FILE || (env.NAV_USAGE_FILE ? env.NAV_USAGE_FILE.replace(/(\.json)?$/, "-public-ok.json") : path.join(home, ".navigator-public-ok.json"));
function keysOf(file) {
  try { const j = JSON.parse(fs.readFileSync(file, "utf8")); return j && j.v === 1 && Array.isArray(j.keys) ? j.keys.filter((k) => typeof k === "string") : []; } catch { return []; }
}
function remember(file, key) {
  const keys = [...keysOf(file).filter((k) => k !== key), key].slice(-KEYS_MAX);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ v: 1, keys }), { mode: 0o600 });
  fs.renameSync(tmp, file);
}
const SAY = {
  public: "이 저장소는 누구나 볼 수 있어요 — 올리면 지워도 이력에 남아요. 그래도 올릴까요?",
  unknown: "이 저장소가 공개인지 확인하지 못했어요 — 공개라면 누구나 볼 수 있어요 — 올리면 지워도 이력에 남아요. 그래도 올릴까요?",
};
// 물을 말 — 묻지 않아도 되면 "". ok(사람이 '올릴게요')면 열쇠를 남기고 "". 남기지 못하면 던진다(서버가 500 — 허락받았다고 거짓말하지 않게)
function ask(v, { file = fileOf(), ok = false } = {}) {
  if (!v || v.vis === "private" || !v.key) return "";
  if (keysOf(file).includes(v.key)) return "";
  if (ok) { remember(file, v.key); return ""; }
  return v.vis === "public" ? SAY.public : SAY.unknown;
}

module.exports = { fileOf, ask, SAY, KEYS_MAX };
