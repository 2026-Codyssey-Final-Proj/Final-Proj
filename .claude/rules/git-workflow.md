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

- 커밋 전에 `python3 implementations/run_all_tests.py`와 링크 체크([docs-editing.md](docs-editing.md))가 통과하는지 확인한다.
  `implementations/share-prototype`은 `node --test`로 따로 돌린다.
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
