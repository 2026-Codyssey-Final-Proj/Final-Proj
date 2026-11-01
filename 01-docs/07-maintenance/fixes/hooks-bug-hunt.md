<!-- claude-drafted: 2026-10-30 — 임유정 요청("내 담당 아닌 것들도 고쳐줘"). 서버 쪽 F-104와 같은 점검에서 나온 훅 · CI 쪽. -->

# F-105 묶음 — 훅(`.claude/hooks/`) · CI(`.github/`) 코드 점검에서 나온 오류

[고칠 목록](../fix-map.md) 2절 **F-105** 줄이 가리키는 묶음이다. 줄마다의 상태는 여기에만 적는다.

- 어디서 나왔나: 2026-10-29 레포 전체 코드 점검(읽기만). 화면 쪽은 [F-103](screen-bug-hunt.md), 서버 쪽은 [F-104](backend-bug-hunt.md).
- 훅을 고치면 [consistency.md](../../../.claude/rules/consistency.md)의 지도대로 `CLAUDE.md` 훅 표 · `security-records.md` 6-3 · 훅 시험(`04-tests/hooks/`)을 같이 본다.
- 확신: **확실** = 코드로 원인이 분명함(리뷰어가 실행해 재현) / **그럴듯함** = 조건이 맞아야 일어남.

| ID | 무엇이 문제인가 | 고칠 곳 | 깨지는 상황 | 확신 | 상태 |
|---|---|---|---|---|---|
| F-105-1 | git의 `core.quotepath` 기본값이 한글 경로를 `"b/\352…"`로 바꿔 `+++ b/`에 안 맞아 그 파일을 통째로 건너뛴다 | `check-secrets.sh` | 한글 이름 파일(레포에 45개)에 키를 넣고 커밋해도 통과 | 확실 | 고침 (#288) |
| F-105-2 | `push` 바로 뒤의 `--force`/`-f`, `reset` 바로 뒤의 `--hard`만 잡는다 | `block-dangerous-git.sh` | `git push origin x --force`, `-uf`, `+x`, `--force-with-lease`, `git -C . push --force`, `git reset -q --hard` 통과 | 확실 | 고침 (#288) |
| F-105-3 | 앞 토큰 비교가 좁다 | `block-claude-main.sh` | `gh -R o/r pr merge 5`, `env git push origin main`, `bash -c "git push origin main"`, `git -C <폴더> commit` 통과 | 확실 | 고침 (#288) |
| F-105-4 | 브랜치가 `HEAD`로 뽑히면 바로 통과 | `block-merged-branch-push.sh` | `git push -u origin HEAD`(가장 흔한 꼴)는 병합 여부를 보지 않는다 | 확실 | 고침 (#288) |
| F-105-5 | 틀린 조각이 하나라도 있으면 exit 1 → 커밋 · Jira 단계가 건너뛰어진다 | `.github/scripts/changelog-fold.js` · `jira-release.yml` | 정상 조각도 main에 안 합쳐지고, 틀린 조각이 남아 이후 병합마다 같은 실패 | 확실 | 고침 (#288) |
| F-105-6 | 같은 브랜치 끝 이름이면 가장 오래된 PR 번호가 붙고, 한 번에 합친 버전 중 맨 위 하나만 Jira 릴리스가 된다 | `changelog-fold.js` · `jira-release.js` | 버전 기록의 `(#PR)`이 틀리거나 Jira 릴리스가 빠진다 | 그럴듯함 | 고침 (#288) |
| F-105-7 | `git commit` 글자만 본다 | `require-tests-before-commit.sh` · `check-secrets.sh` | 다른 저장소의 커밋에도 이 레포 시험이 돌고, `git -c k=v commit`은 검사를 건너뛴다 | 그럴듯함 | 고침 (#288) |
| F-105-8 | Chrome 경로가 Mac뿐 · jq와 node가 둘 다 없으면 main 막기가 열린다 | `check-mermaid.sh` · `lib.sh` | Windows에선 Mermaid 검사가 늘 건너뛰고, 도구가 없는 PC에서는 `block-claude-main`이 막지 못한다 | 확실 | 고침 (#288) |

## 어떻게 고쳤나 — 2026-10-30, 브랜치 `v2/hooks-bug-hunt`

- **공용 도우미 [gitcmd.py](../../../.claude/hooks/gitcmd.py)** — 셸 명령 한 줄을 git · gh 호출로 푼다(앞의 환경 대입 · `env` · `sudo`, `bash -c`의 안, git 전역 옵션과 `-C` 폴더, gh의 `-R`). 판정도 여기서(`main` · `danger` · `commit-dir` · `push-target`), 훅은 `lib.sh`의 `gitcmd`로 부른다.
- **1** 비밀값 검사는 `core.quotepath=off` · UTF-8로 읽는다. **2 · 3 · 4** 세 훅이 gitcmd로 — 강제 푸시는 위치 · 묶은 짧은 옵션 · `+refspec` · `--force-with-lease`까지, `HEAD`는 지금 브랜치로.
- **5** 합치기 단계를 `continue-on-error`로 두고 정상 조각은 커밋 · Jira까지, 끝에 '틀린 조각' 단계가 빨갛게. **6** 같은 끝 이름이면 큰 PR 번호, 합친 버전마다 Jira 릴리스(`FOLDED_VERSIONS`).
- **7** 커밋인지 · 이 저장소인지를 gitcmd로(`git -c k=v commit`도 검사하고, 다른 저장소의 커밋 · 글 속 낱말에는 시험을 돌리지 않는다). **8** `json_field`가 jq → node → 파이썬 → 원문 순서(빈 값으로 열리지 않게), Mermaid는 Windows · Linux Chrome 자리도 찾고 node가 읽는 경로(`C:/…`)로 넘긴다 — 이 PC에서 처음으로 실제로 그려 봤다(틀린 그림 막음 · 맞는 그림 통과 · 저장소 전체 통과).
- 시험: [test_git_guards.py](../../../04-tests/hooks/test_git_guards.py)(실제 훅을 임시 저장소에서) · [ci-bug-hunt.test.js](../../../04-tests/repo/ci-bug-hunt.test.js) — 고치기 전 빨강 확인.


## 새 맥락 리뷰 — 2026-10-30

리뷰어가 임시 저장소에서 훅에 명령을 넣어 직접 돌려 봤다.

- **막힘 → 고침:** `git -C "$PWD" commit` · `git -C $(pwd) commit` · `git -C ~/r …`이면 도우미가 폴더를 못 찾아 main 막기 · 비밀값 검사 · 커밋 전 시험을 모두 건너뛰었다(이번 고침이 만든 구멍 — 옛 훅은 `-C`를 무시하고 지금 폴더를 봤다). `$PWD` · `~`는 풀고, 풀 수 없거나 없는 폴더면 훅이 도는 폴더를 본다(막는 쪽). 시험에 넣음.
- **보완 → 고침:** 따옴표 · heredoc 안의 글을 명령으로 보지 않게 낱말을 먼저 나누고(shlex) 조각을 나눈다 · `&` · `( … )` · `if … then` · `timeout` · `nice` · `env -u X` · `sudo -u x` 꼴도 · 도우미가 죽으면(끝 코드 0 · 3이 아님) 막는 쪽 · 같은 저장소의 다른 worktree 커밋도 시험(`--git-common-dir`) · `git push -o x origin feat`의 값을 원격으로 세지 않음 · 워크플로 이름이 주석 끝에 붙어 비어 있던 것(전부터).
- **범위 밖(남김):** `eval` · `$(…)` 안 · 백틱 · `xargs` · git 별칭(`alias.p=push`) · `gh api …/merge`처럼 일부러 숨기는 꼴은 글자로 보는 훅으로 막을 수 없다 — 규칙(사람의 판단)과 GitHub 쪽 보호가 맡는다. `cd 다른저장소 && git commit`은 여전히 이 레포 시험을 돌린다(막는 쪽이라 해가 적음).
