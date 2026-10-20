종류: 큰 묶음
누가: 이재엽
무엇: FR-17 대화로 일 넘기기 · 섬에서 허용 · 거절(C-4) — 할 일 적기 → 요구 문장 정리 → 고쳐 확정 → 허락하면 연결한 폴더에서 Claude Code를 열고, 허락을 구하면(PermissionRequest 훅) 섬의 승인 카드로 허용 · 거절. 대신 허용 없음 · 결정은 요청과 짝이 맞을 때만 · 위험한 일은 한 번 더. 묶은 앱은 훅 파일 전부를 asar 밖에
건드린 곳: `03-backend/navigator/`(새 `approve.js` · `approve-hook.js`, `server.js` · `connect.js` · `provider.js` · `navigator.js` · `API.md`, 담당 두승현) · `02-frontend/navigator/`(담당 임유정) · `02-frontend/electron/package.json`(asarUnpack) · `04-tests/` · `01-docs/` · `.claude/rules/security-records.md`
