// 자리표시 — 다른 에이전트의 steps.js로 바뀐다 (C-12 AI 진행의 뒤쪽: 훅 · /api/steps · 순수 모듈). merge 때 팀장 세션이 진짜 파일로 바꾼다.
// claude-drafted: 2026-10-20 — 이재엽 요청(C-11 모아 보기 창). 모아 보기 창(02-frontend/hub)이 이 파일을 부르는데, 없으면 "아직 준비 중이에요"를 보인다.
(function (root) { root.NavSteps = null; })(typeof window !== "undefined" ? window : globalThis);
