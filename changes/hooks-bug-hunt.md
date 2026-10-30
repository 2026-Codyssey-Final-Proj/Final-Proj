종류: 작은 고침
누가: 임유정
무엇: 훅 · CI 코드 점검 묶음 F-105(8개) — 한글 이름 파일도 비밀값 검사, 강제 푸시 · main 막기 · 병합된 브랜치 푸시 막기의 빈틈(env · bash -c · git -C · gh -R · 뒤에 붙은 --force · HEAD)을 공용 도우미 gitcmd.py로, 틀린 조각이 있어도 정상 조각은 합치고 실패 표시, PR 번호 · 합친 버전마다 Jira 릴리스, 커밋 시험은 이 저장소 커밋에만, jq · node가 없어도 main 막기가 열리지 않게, Windows에서도 Mermaid 검사
건드린 곳: `.claude/hooks/`(담당 이재엽 — 이 줄이 알림) · `.github/` · `04-tests/hooks/` · `04-tests/repo/` · `01-docs/` · `CLAUDE.md`
