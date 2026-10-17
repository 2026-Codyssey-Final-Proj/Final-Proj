// claude-drafted: 2026-10-17 — 화면 속 플로로(seal.js · seal.css)를 README에 쓸 SVG 파일로 뽑는다.
// seal.js나 seal.css를 고치면 다시 돌린다: node 02-frontend/assets/mascot/make-svg.js
// 만드는 것: floro.svg(저장소 첫 화면), floro-moods.svg(표정 6가지). 손으로 고치지 않는다 — 이 파일을 고친다.
const fs = require("fs"), path = require("path");
const Seal = require("../../navigator/seal.js");
const css = fs.readFileSync(path.join(__dirname, "../../navigator/seal.css"), "utf8");

// 남색 둥근 판 위에 놓는다 — 하얀 플로로가 밝은 GitHub 화면에서도 보이게
const back = (w, h) => `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A5FE0"/><stop offset="1" stop-color="#16226A"/></linearGradient></defs><rect width="${w}" height="${h}" rx="28" fill="url(#bg)"/>`;
const at = (x, y, svg) => svg.replace("<svg ", `<svg x="${x}" y="${y}" `);
function save(name, w, h, inner) {
  fs.writeFileSync(path.join(__dirname, name),
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style><![CDATA[${css}]]></style>${back(w, h)}${inner}</svg>\n`);
}

save("floro.svg", 200, 200, at(20, 24, Seal.svg("happy", 160, { hole: true })));
const MOODS = ["idle", "happy", "think", "love", "wow", "sleep"];
save("floro-moods.svg", MOODS.length * 110 + 20, 130, MOODS.map((m, i) => at(10 + i * 110, 8, Seal.svg(m, 110, { hole: true }))).join(""));
