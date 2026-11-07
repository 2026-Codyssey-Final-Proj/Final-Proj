// claude-drafted: 2026-10-17 — 화면 속 플로로(seal.js · seal.css)를 README에 쓸 SVG 파일로 뽑는다.
// seal.js나 seal.css를 고치면 다시 돌린다: node 02-frontend/assets/mascot/make-svg.js
// 만드는 것: floro.svg(저장소 첫 화면), floro-moods.svg(표정 6가지), floro-banner.svg(README 머리 — 가로로 긴 투명 틀 가운데에 floro와 같은 판, 2026-11-08 두승현 "중앙으로 정렬"). 손으로 고치지 않는다 — 이 파일을 고친다.
const fs = require("fs"), path = require("path");
const Seal = require("../../navigator/seal.js");
const css = fs.readFileSync(path.join(__dirname, "../../navigator/seal.css"), "utf8");

// 남색 둥근 판 위에 놓는다 — 하얀 플로로가 밝은 GitHub 화면에서도 보이게
const back = (w, h, x = 0) => `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A5FE0"/><stop offset="1" stop-color="#16226A"/></linearGradient></defs><rect${x ? ` x="${x}"` : ""} width="${w}" height="${h}" rx="28" fill="url(#bg)"/>`;
const at = (x, y, svg) => svg.replace("<svg ", `<svg x="${x}" y="${y}" `);
function save(name, w, h, inner, bw = w, bx = 0) {
  fs.writeFileSync(path.join(__dirname, name),
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style><![CDATA[${css}]]></style>${back(bw, h, bx)}${inner}</svg>\n`);
}

save("floro.svg", 200, 200, at(20, 24, Seal.svg("happy", 160, { hole: true })));
// README 머리: 1000 너비 투명 틀의 가운데(x 400)에 floro.svg와 같은 200 × 200 판 — 마크다운 그림은 왼쪽에 붙으니 틀을 넓혀 가운데로
save("floro-banner.svg", 1000, 200, at(420, 24, Seal.svg("happy", 160, { hole: true })), 200, 400);
const MOODS = ["idle", "happy", "think", "love", "wow", "sleep"];
save("floro-moods.svg", MOODS.length * 110 + 20, 130, MOODS.map((m, i) => at(10 + i * 110, 8, Seal.svg(m, 110, { hole: true }))).join(""));
