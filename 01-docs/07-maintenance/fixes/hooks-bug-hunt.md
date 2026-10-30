<!-- claude-drafted: 2026-10-30 — 임유정 요청("내 담당 아닌 것들도 고쳐줘"). 서버 쪽 F-104와 같은 점검에서 나온 훅 · CI 쪽. -->

# F-105 묶음 — 훅(`.claude/hooks/`) · CI(`.github/`) 코드 점검에서 나온 오류

[고칠 목록](../fix-map.md) 2절 **F-105** 줄이 가리키는 묶음이다. 줄마다의 상태는 여기에만 적는다.

- 어디서 나왔나: 2026-10-29 레포 전체 코드 점검(읽기만). 화면 쪽은 [F-103](screen-bug-hunt.md), 서버 쪽은 [F-104](backend-bug-hunt.md).
- 훅을 고치면 [consistency.md](../../../.claude/rules/consistency.md)의 지도대로 `CLAUDE.md` 훅 표 · `security-records.md` 6-3 · 훅 시험(`04-tests/hooks/`)을 같이 본다.
- 확신: **확실** = 코드로 원인이 분명함(리뷰어가 실행해 재현) / **그럴듯함** = 조건이 맞아야 일어남.

| ID | 무엇이 문제인가 | 고칠 곳 | 깨지는 상황 | 확신 | 상태 |
|---|---|---|---|---|---|
| F-105-1 | git의 `core.quotepath` 기본값이 한글 경로를 `"b/\352…"`로 바꿔 `+++ b/`에 안 맞아 그 파일을 통째로 건너뛴다 | `check-secrets.sh` | 한글 이름 파일(레포에 45개)에 키를 넣고 커밋해도 통과 | 확실 | 열림 |
| F-105-2 | `push` 바로 뒤의 `--force`/`-f`, `reset` 바로 뒤의 `--hard`만 잡는다 | `block-dangerous-git.sh` | `git push origin x --force`, `-uf`, `+x`, `--force-with-lease`, `git -C . push --force`, `git reset -q --hard` 통과 | 확실 | 열림 |
| F-105-3 | 앞 토큰 비교가 좁다 | `block-claude-main.sh` | `gh -R o/r pr merge 5`, `env git push origin main`, `bash -c "git push origin main"`, `git -C <폴더> commit` 통과 | 확실 | 열림 |
| F-105-4 | 브랜치가 `HEAD`로 뽑히면 바로 통과 | `block-merged-branch-push.sh` | `git push -u origin HEAD`(가장 흔한 꼴)는 병합 여부를 보지 않는다 | 확실 | 열림 |
| F-105-5 | 틀린 조각이 하나라도 있으면 exit 1 → 커밋 · Jira 단계가 건너뛰어진다 | `.github/scripts/changelog-fold.js` · `jira-release.yml` | 정상 조각도 main에 안 합쳐지고, 틀린 조각이 남아 이후 병합마다 같은 실패 | 확실 | 열림 |
| F-105-6 | 같은 브랜치 끝 이름이면 가장 오래된 PR 번호가 붙고, 한 번에 합친 버전 중 맨 위 하나만 Jira 릴리스가 된다 | `changelog-fold.js` · `jira-release.js` | 버전 기록의 `(#PR)`이 틀리거나 Jira 릴리스가 빠진다 | 그럴듯함 | 열림 |
| F-105-7 | `git commit` 글자만 본다 | `require-tests-before-commit.sh` · `check-secrets.sh` | 다른 저장소의 커밋에도 이 레포 시험이 돌고, `git -c k=v commit`은 검사를 건너뛴다 | 그럴듯함 | 열림 |
| F-105-8 | Chrome 경로가 Mac뿐 · jq와 node가 둘 다 없으면 main 막기가 열린다 | `check-mermaid.sh` · `lib.sh` | Windows에선 Mermaid 검사가 늘 건너뛰고, 도구가 없는 PC에서는 `block-claude-main`이 막지 못한다 | 확실 | 열림 |
