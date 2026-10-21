# git 작업 규칙 (팀 레포 v1)

<!-- claude-drafted: 2026-10-12 — V1의 git 규칙("병합은 사용자가 한다", data 브랜치 예외, template 원격, 개인 이메일)을 팀 결정으로 바꿨다. -->

git 명령을 실행하기 전에 읽는다. 위험한 명령 일부는 훅(`.claude/hooks/`)이 기계적으로도 막지만, 훅에 기대지 말고 아래를 먼저 따른다.

## 누가 무엇을 하는가 (팀 결정 2026-10-12 — 이재엽)

| 누가 | `main`에 직접 푸시 | 브랜치·PR |
|---|---|---|
| 팀원(사람) | **가능** — 자기 터미널에서 `git pull --rebase` 후 `git push` | 큰 변경·리뷰가 필요할 때 |
| Claude | **불가** — [block-claude-main.sh](../hooks/block-claude-main.sh)가 `main`으로의 푸시·커밋·`gh pr merge`를 막는다 | 브랜치에 커밋·푸시하고 PR을 연다. **병합은 사람이 한다** |

- 훅은 Claude Code의 Bash 명령만 본다. 사람의 터미널은 막지 않는다. GitHub 쪽에서 "Claude 계정만" 막는 설정은 없다(Claude는 사람의 인증으로 푸시한다).
- Claude는 **사용자가 요청할 때만** 커밋·푸시한다. 사용자의 요청 없이 올리지 않는다.

## 버전과 알림 — vN.M (팀 결정 2026-10-18 — 이재엽)

역할별로 서로 동의를 받고 올리니 시간이 오래 걸렸다. 이재엽 결정: "N=큰 묶음, M=작은 고침", "동의 없이 병합 + 버전 기록으로 알림".

| 무엇이 바뀌었나 | 버전 |
|---|---|
| **큰 묶음** — 기능을 더하거나 바꿨다 | N+1, M=0 (v1.3 → v2.0) |
| **작은 고침** — 버그 · 문서 · 시험 | M+1 (v1.3 → v1.4) |

- **PR은 CHANGELOG를 고치지 않는다(2026-10-19 — 이재엽, 인수인계 4절 제안 1번 "Go").** 대신 [`changes/<브랜치 끝 이름>.md`](../../changes/README.md) 조각 한 장을 같은 PR에 넣는다 —
  네 줄 `종류: 큰 묶음|작은 고침` · `누가` · `무엇` · `건드린 곳`. `main`에 올라오면 Action([jira-release.yml](../../.github/workflows/jira-release.yml) → [changelog-fold.js](../../.github/scripts/changelog-fold.js))이
  [CHANGELOG.md](../../CHANGELOG.md) 맨 위 버전의 **다음 번호**를 붙여 넣고 조각을 지우고 "무엇" 끝에 `(#PR번호)`를 붙인다. **번호는 병합될 때 정해지고 사람은 종류만 고른다.** PR 제목에 `[vN.M]`은 붙이지 않는다.
  왜: 동시에 열린 PR이 CHANGELOG 맨 위 한 줄에서 반드시 부딪쳤다(10/19 PR 넷이 v4.0). <!-- claude-drafted: 2026-10-19 -->
- **동의를 기다리지 않고 병합한다.** 그 한 줄과 PR이 알림이다 — 남의 담당 폴더를 고쳤어도 같다("건드린 곳"에 그 폴더를 적는다).
- `main`에 직접 올릴 때는 조각 대신 CHANGELOG 맨 위에 한 줄을 직접 써도 된다(다음 조각은 그 줄의 다음 번호를 받는다).
- **앱 버전 · 릴리스는 따로 (이재엽 2026-10-19 "지금 작업들에서 릴리즈는 나중에 우리가 버전업을 할때 해줘"):** CHANGELOG vN.M은 병합마다 올라가지만, 앱 버전(`02-frontend/electron/package.json`의 `version`)은 **팀이 버전업을 정할 때만** 올린다 — 올리면 CI가 Release `app-v<버전>`을 만든다. 작업 PR(Claude가 연 것도)은 앱 버전을 건드리지 않는다. 그사이 앱으로 써 보려면 각자 `npm run dist`로 묶는다([electron/README.md](../../02-frontend/electron/README.md)).
- **앱 버전 잠금(이재엽 2026-10-21 낮, 같은 날 밤 풀림):** `02-frontend/electron/version-lock.json`이 있는 동안 앱 버전은 그 파일의 값에 묶인다 — 버전을 바꾸면 [version-lock.test.js](../../04-tests/navigator/version-lock.test.js)가 실패해 커밋 전 시험에서 막히고, `app-release.yml`은 Release를 만들지 않고 멈춘다. 풀 때는 그 파일을 지우는 PR 하나면 된다. **2026-10-21 밤 이재엽 "앱까지 해서 저 모습으로 버전업"으로 그 파일을 지우고 10.0.0으로 올렸다** — 다시 잠그려면 같은 모양의 파일을 두는 PR. <!-- claude-drafted: 2026-10-21 -->
- [test_changelog.py](../../04-tests/repo/test_changelog.py)가 겹침·건너뜀과 조각의 네 줄을 잡는다. 직접 쓴 줄끼리 겹치면 **나중에 올리는 쪽이** 다음 번호로 고친다.
- **Claude가 연 PR도 같다** — Claude가 조각 파일을 적고, 병합은 사람이 한다(위 표, 훅).
- **Jira:** 할 일은 Jira 프로젝트 Floe에 있다. Jira 이슈가 있으면 브랜치 · PR 제목 · 커밋 제목에 키(`<키>-12`)를 넣는다 — PR 제목은 `<키>-12 타입(범위): 설명`. `main`에 올라오면 GitHub Action이 조각을 합친 뒤 맨 위 버전을 Jira 릴리스로 만들고 그 이슈들에 붙인다([jira.md](../../01-docs/00-overview/jira.md)).
- 협업 증빙: 읽은 사람이 병합 뒤에 PR 코멘트 한 줄을 남기면 증빙이 된다 — 선택이고 병합을 막지 않는다.

## 세션 시작 체크리스트

- 세션을 시작했을 때 `git status`가 정상 응답하는지 먼저 본다. 실패하거나(`.git` 손상) 있어야 할 파일이 없으면 **로컬을 고치려
  하지 말고 원격에서 다시 클론**한다. 손상된 로컬은 지우지 말고 이름만 바꿔 보존한다.
- 새 브랜치를 만들기 전 `git status`로 작업 트리가 깨끗한지, 기존 브랜치가 병합됐는지 확인한다.

## 브랜치 규칙

- 사람이 `main`에 올릴 때는 푸시 직전에 `git pull --rebase`로 최신 `main`을 받는다.
- **이미 있는 브랜치에 커밋을 더 올리기 전에, 그 브랜치의 PR이 병합됐는지 먼저 확인한다**(`gh pr list --head <브랜치> --state all`).
  병합된 PR에는 나중에 올린 커밋이 따라가지 않는다 — 병합됐으면 최신 `main`에서 새 브랜치를 딴다. `block-merged-branch-push.sh`가
  병합된 PR의 브랜치에 `main`에 없는 커밋을 푸시하려 하면 막는다.
- 병합이 끝난 브랜치는 요청이 있으면 지운다. 지우기 전에 `git log origin/main..<브랜치>`가 비어 있는지 본다.

## 커밋 규칙

- 커밋 전에 `python3 04-tests/run_all_tests.py`와 링크 체크([docs-editing.md](docs-editing.md))가 통과하는지 확인한다.
  이 명령이 노드 시험(`04-tests/**/*.test.js`)까지 함께 돌린다.
- 커밋 제목은 `타입(범위): 설명` — 타입은 docs · feat · fix · chore · refactor · project 중 하나, 범위는 영역(`second-brain`, `hooks` …).
- 커밋 메시지에는 무엇이 어디서 나온 변경인지 적고, Claude가 공동 작성했으면 세션이 지정한 `Co-Authored-By:` 줄로 끝낸다.
  세션 시작 훅(`unreviewed-commits.sh`)이 이 줄로 "리뷰할 사람 커밋"과 구분한다.
- 커밋 작성자 이메일은 각자의 GitHub noreply 주소를 쓴다 — 실제 메일 주소를 커밋에 남기지 않는다.
- PRD나 세션 파일의 "확정" 섹션을 고칠 때는 무엇을 왜 바꿨는지 변경 기록에도 남긴다.

## 절대 하지 않는 것

- `git push --force`(사용자가 명시적으로 요청하지 않는 한). 다른 사람의 커밋이 사라진다.
- `git reset --hard`, `git clean -f`(먼저 `git status`로 확인하지 않고)
- Claude가 `main`에 올리거나 병합하는 것
- ADR이 `Status: Accepted`인데 본문을 고치는 것 — 새 ADR로 대체한다
- 비밀값·서버 주소·인터뷰 응답자 이름이 든 채로 커밋하는 것 ([security-records.md](security-records.md))
