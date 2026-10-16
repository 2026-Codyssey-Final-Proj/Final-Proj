// claude-drafted: 2026-10-17
// 녹화·재생 — 진짜 AI의 답을 한 번 받아 파일에 두고, 같은 요청에는 토큰 0으로 그 답을 돌려준다.
// 요청(프롬프트+스키마)의 지문이 같아야 재생된다 — 글자 하나만 달라도 다른 요청이다.
// 이 파일은 AI를 부르지 않는다(호출은 provider.js 한 곳에서만).
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const keyOf = (prompt, schema) => crypto.createHash("sha256").update(`${prompt}\n${JSON.stringify(schema)}`).digest("hex").slice(0, 16);

function read(file) {
  try { const o = JSON.parse(fs.readFileSync(file, "utf8")); return o && typeof o === "object" ? o : {}; } catch { return {}; }
}
const load = (file) => { const o = read(file); return o.items && typeof o.items === "object" ? o.items : {}; };

// labels를 안 주면 파일에 있던 이름표를 그대로 둔다
function save(file, items, labels) {
  const prev = read(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({
    설명: "Navigator 시연용 녹화 — 진짜 AI의 답이다. NAV_REPLAY로 재생하면 토큰을 쓰지 않는다. 키·사용자 글은 담지 않는다.",
    녹화한날: new Date().toISOString().slice(0, 10),
    labels: labels || prev.labels || {},
    items,
  }, null, 2) + "\n");
}

const loadLabels = (file) => (read(file).labels && typeof read(file).labels === "object" ? read(file).labels : {});

module.exports = { keyOf, load, loadLabels, save };
