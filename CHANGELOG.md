<!-- claude-drafted: 2026-10-18 — 이재엽의 결정("각자가 작업하고 업데이트 한 상황들을 v n.m으로 표기해서 업데이트 방향성으로" · "N=큰 묶음, M=작은 고침" · "동의 없이 병합 + 버전 기록으로 알림")으로 Claude가 틀과 v1.0 줄을 썼다. -->

# 버전 기록 — vN.M

올릴 때마다 **맨 위에 한 줄**을 더한다. 이 한 줄과 PR이 다른 사람에게 가는 알림이다 — **동의를 기다리지 않고 병합한다.**

| 무엇이 바뀌었나 | 버전 | 예 |
|---|---|---|
| **큰 묶음** — 기능을 더하거나 바꿨다 | N을 하나 올리고 M은 0 | v1.3 → v2.0 |
| **작은 고침** — 버그 · 문서 · 시험 | M을 하나 올린다 | v1.3 → v1.4 |

- 고르는 것은 **올린 사람**이다. PR 제목 앞에도 같은 버전을 `[vN.M]`으로 붙인다 — PR은 그 제목으로 찾는다.
- "건드린 곳"에는 폴더를 적는다. 남의 담당 폴더(TEAM.md)를 고쳤으면 그 칸이 담당에게 가는 알림이다.
- 두 사람이 같은 번호를 고르면 **나중에 병합하는 쪽이** 최신 `main`을 받아 다음 번호로 고친다. 번호가 겹치거나 건너뛰면 `04-tests/repo/test_changelog.py`가 실패한다.
- `main`에 올라오면 맨 위 버전이 Jira 프로젝트 Floe의 릴리스로 생기고, 커밋 · PR 제목에 적힌 Jira 키의 이슈에 붙는다 — [jira.md](01-docs/00-overview/jira.md) 3절.
- 세부 규칙: [git-workflow.md](.claude/rules/git-workflow.md) "버전과 알림".

| 버전 | 날짜 | 누가 | 무엇이 달라졌나 | 건드린 곳 |
|---|---|---|---|---|
| v6.1 | 2026-10-19 | 이재엽 | 앱에서 플로로의 눈이 창 밖 커서도 따라온다(F-22, 앱 6.0.1). 게이트 5→6 · 6→7 Go — **7단계(써 보고 고치고 올리기) 시작**, 고리는 fix-map.md 0-1절. **성공 수치 목표 1차 확정**(완주 4/5 · 이해 확인 정답률 ≥70% · 1분 설명 3/5 · AI 일치율 ≥95% · 판정 ≤8,000, F-01) | `02-frontend/electron/` · `02-frontend/navigator/` · `02-frontend/library/` · `04-tests/` · `01-docs/` |
| v6.0 | 2026-10-19 | 이재엽 | **우분투 Linux 앱(큰 묶음)** — `npm run dist:linux` → `.AppImage` · `.deb`(x64 · arm64), CI가 Mac · Windows와 함께 같은 Release에. Linux · Windows처럼 메뉴 줄이 없는 창에는 **창 우클릭 · 트레이 아이콘**으로 같은 메뉴, Linux에서도 로그인 셸의 PATH로 `claude`를 찾음, 투명 창 옵션. 발표용(이재엽 "우분투 리눅스에서도 돌아가는 버전"). 앱 6.0.0 → Release `app-v6.0.0` | `02-frontend/electron/` · `.github/` · `04-tests/navigator/` · `01-docs/` · 루트 README |
| v5.2 | 2026-10-19 | 이재엽 | 앱이 창이 좁아질 때(접힘 · 처음 설정) 휴대폰 화면으로 넘어가 버리던 것을 고침 — 앱 안에서는 늘 PC 화면. 휴대폰 화면은 아직 만들지 않는다(이재엽 결정). 앱 버전 5.2.0 → Release `app-v5.2.0` | `02-frontend/navigator/`(app.js · setup.js 한 줄씩, 담당 임유정 — 이 줄이 알림) · `02-frontend/electron/` |
| v5.1 | 2026-10-19 | 이재엽 | 휴대폰 폭에서 서재가 겹치지 않게(차례로 쌓기 · 세로로 밀기) + 겹침 시험(F-21). 휴대폰 기능은 추후 업데이트로 남김 | `02-frontend/library/` · `04-tests/e2e/` · `01-docs/` |
| v5.0 | 2026-10-19 | 이재엽 | **처음 설정(큰 묶음)** — 처음 켜면 플로로가 반기고 Claude Code로 연결 / API 키 넣기 중 하나를 같이 준비(찾기 · 로그인 · 폴더 연결 · 연결 확인). 서버 `GET /api/setup` · `POST /api/setup/check`, 앱은 키를 설정 폴더 `.env`(600)에. (옛 서버 알아보기는 병합 때 #115의 "늘 자기 서버"로 합쳐 뺐다) — dmg가 옛 화면을 보인 원인(F-19). 스크립트 · 스타일 `no-cache`, 앱 0.4.0 | `02-frontend/navigator/` · `02-frontend/electron/` · `03-backend/navigator/` · `04-tests/` · `01-docs/` |
| v4.0 | 2026-10-19 | 이재엽 | **레벨 오버레이 + 앱 고침(큰 묶음)** — 화면을 이재엽이 고른 목업 3번으로(플로로 · 가벼운 상자 · LV/EXP 줄 · 명령 네 칸 — 고르면 상자 안에 길, 규칙은 그대로). 앱: 늘 자기 서버를 켬(빈 포트), 창이 섬 크기를 따라감(빈 투명 영역이 뒤 창의 클릭을 가로채던 것), 굴절 · 흐림 끔(랙), 플로로 아이콘, Electron 44, 메뉴에 새 버전 확인. CI(`app-release.yml`): main의 앱 버전이 바뀌면 Mac · Windows 묶어 Release `app-v<버전>`에. 시연 GIF 5개 다시. 이재엽이 0.3.0 → 3.0.2를 써 보며 찾은 문제들을 고친 것 | `02-frontend/navigator/` (담당 임유정 — 이 줄이 알림) · `02-frontend/electron/` · `.github/` · `01-docs/` · `04-tests/` |
| v3.2 | 2026-10-19 | 이재엽 | 서재의 온보딩 영상 잔재를 지움 — 플로로 밑 정해 둔 질문 단추 · 아래 장면 설명 자막 띠. 책 이름이 낱말 중간에서 끊기지 않게(F-20) | `02-frontend/library/` |
| v3.1 | 2026-10-19 | 이재엽 | Atlassian MCP를 저장소 `.mcp.json`에 올림 — 각자 `/mcp`로 로그인하면 Claude가 팀 Jira를 읽고, 쓰기는 사람 확인 뒤에만. 판정 후보 → 채택 | 루트(`.mcp.json` · `CLAUDE.md`) · `.claude/rules/` · `01-docs/00-overview/` · `01-docs/catalog/` |
| v3.0 | 2026-10-19 | 이재엽 | **오버레이 앱(큰 묶음)** — Electron 껍데기 `02-frontend/electron/`: 화면 · 서버를 그대로 감싸 **항상 위에 뜨는 투명 창**으로, `npm run dist`로 `Floe-0.3.0-arm64.dmg`(서명 없음). 메뉴 · 설정에서 프로젝트 폴더 연결 / 빼기, `.env`는 앱 설정 폴더. 앱 안에서는 뒤의 예시 코딩 도구 창을 숨김(`app.css .in-app`). 이 Mac에서 묶어 켜 봄 — 사람이 써 본 기록은 아직 | `02-frontend/electron/` (새) · `02-frontend/navigator/`(app.js · app.css 몇 줄, 담당 임유정 — 이 줄이 알림) · `04-tests/navigator/` · `01-docs/00-overview/` · `.gitignore` |
| v2.1 | 2026-10-19 | 이재엽 | 시연 길잡이 띠(‹ › 장면 넘기기, `tour.js` · `tour.css`)를 지움 — 장면은 주소 끝(`#ex=1&gate` 등)으로 여는 것만 남김 (F-18) | `02-frontend/` · `03-backend/navigator/` · `01-docs/04-pattern-implementation/` · `01-docs/07-maintenance/` |
| v2.0 | 2026-10-19 | 이재엽 | **실제로 써 보기(큰 묶음)** — 한 줄로 켜기 `node 03-backend/navigator/floe.js <폴더>`(훅 연결 → 서버 → 브라우저, `--off`로 해제), 서재 · 도서관 탭에 **내 책**(이 화면의 단계 · 할 일 · 설계도 · 배운 말)과 **예시 책 지우기 / 다시 보기**, 설정에 **느낀 점 남기기**(화면 · 단계 · 때가 저절로, Jira용 복사). 책이 없어도 서고 · 전체 돌아보기가 멈추지 않음, 마감 없는 책은 충돌 계산에서 건너뜀 | `02-frontend/navigator/` · `02-frontend/library/` (담당 임유정 — 이 줄이 알림) · `03-backend/navigator/` · `04-tests/` · `01-docs/` |
| v1.3 | 2026-10-19 | 이재엽 | 게임처럼 일하는 오버레이 목업 세 개(RPG 전투 → 친구 대화 → 레벨 오버레이)와 안내 — 지금 방향은 레벨 오버레이, 제품 코드는 그대로 | `01-docs/04-pattern-implementation/` |
| v1.2 | 2026-10-18 | 이재엽 | Jira 잇기 — GitHub for Jira 앱(PR · 커밋, 설치 전), `main`에 올라오면 버전을 Jira 릴리스로 만드는 GitHub Action(비밀값 넣기 전에는 건너뜀), 이름에 Jira 키 넣는 규칙 | `.github/` · `.claude/rules/` · `01-docs/00-overview/` · `01-docs/catalog/` · `04-tests/repo/` |
| v1.1 | 2026-10-18 | 이재엽 | 버전 기록(이 파일) 시작 — 동의 없이 병합, 버전 한 줄과 PR이 알림. PR 양식 · 팀 가이드 · 규칙 문서를 같이 고침 | 루트 · `.github/` · `.claude/rules/` · `01-docs/00-overview/` · `01-docs/07-maintenance/` · `04-tests/repo/` |
| v1.0 | 2026-10-18 | 팀 전원 | **시작점** — 2026-10-18 저녁의 `main`(PR #104까지). 아래 "v1.0에 든 것" | 전체 |

## v1.0에 든 것

- **길잡이 오버레이** (`02-frontend/navigator`): 7단계를 등급(Full · Xpress · Lite)에 맞춰 판정, '예' 뒤 확인 질문, 모르는 말 풀이, 보류 · 꼭/나중에, 작업 알림, 토큰 표(서버로 열면 실제 사용량).
- **서재** (`02-frontend/library`): 물속으로 들어가는 이동과 플로로, 책 크게 보기 → 펼치기, 배운 말을 누르면 풀이, 1년 하늘.
- **로컬 서버** (`03-backend/navigator`): API 약속([API.md](03-backend/navigator/API.md)), 알림 · AI 주소의 확인 값, 녹화 재생(시연 17개).
- **시험** (`04-tests`): 수용 · 계약 · 브라우저(휴대폰 폭 390px, 접근성 axe) 시험.
- **문서**: PRD 상세형(11절), 일정(주요 기능 11/3 · 사용 테스트 11/4~7 · 제출 11/8), [고칠 곳 지도](01-docs/07-maintenance/fix-map.md)(F-01 · F-16만 열림).
