<!-- claude-drafted: 2026-10-18 — 이재엽의 요청("이걸 지라에서 활용하도로 해줘")과 고른 답으로 Claude가 썼다:
     쓰임 "버전을 Jira 릴리스로 · PR·커밋을 Jira 이슈에 연결 · 할 일 관리를 Jira로 옮기기", 연결 "Jira 앱"(PR · 커밋),
     릴리스 "GitHub Action + API 토큰"(처음 고른 "자동화 규칙"은 무료 한도 때문에 바꿈 — 3절).
     Atlassian 문서로 확인한 것과 확인하지 못한 것을 나눠 적었다. 진짜 Jira에서는 아직 한 번도 돌려 보지 않았다 — 5절 "처음 한 번". -->

# Jira — 할 일 · PR · 버전을 한곳에서

**원천은 셋이다.** 어긋나면 원천이 맞다.

| 무엇 | 원천 | Jira에서 보이는 모양 | 상태 (2026-10-18) |
|---|---|---|---|
| 할 일 (누가 · 무엇 · 언제) | **Jira 프로젝트 Floe** | 에픽 5개 · 작업 · 선행 관계 | **옮김** — 두승현(#102). GitHub 이슈 21개는 닫혔고 논의 · 원본으로 남는다 |
| PR · 커밋 | GitHub | 이슈 화면의 "개발" 칸에 브랜치 · PR · 병합 여부 | 앱 설치 전 — 1절 |
| 버전 vN.M | [CHANGELOG.md](../../CHANGELOG.md) | 릴리스 페이지에 vN.M과 그 버전에 들어간 이슈 | 비밀값 넣기 전 — 3절 |

사이트 주소는 레포에 적지 않는다(security-records.md 2절, 서버 주소). 들어가는 길은 GitHub 이슈 #102에 있다.

## 1. 한 번만 — GitHub for Jira 앱 (PR · 커밋 잇기)

| 순서 | 누가 | 무엇 |
|---|---|---|
| 1 | Jira 관리자 | Jira → 앱 → **GitHub for Jira**(Atlassian 공식, 무료)를 들인다 |
| 2 | GitHub 조직 소유자 — 이재엽(2026-10-18 `admin` 확인) | 앱이 조직 `2026-Codyssey-Final-Proj`를 잇자고 하면 승인한다. 저장소는 **Final-Proj 하나만** 고른다 |
| 3 | 누구든 | 2절 규칙대로 PR 하나를 올려, Jira 이슈의 "개발" 칸에 보이는지 본다 |

들이기 전 점검([external-integration.md](../../.claude/rules/external-integration.md) 점검표):

| 점검 | 내용 |
|---|---|
| 밖으로 나가는 것 | 브랜치 이름 · 커밋 메시지 · PR 제목 · 작성자 GitHub 계정이 Atlassian으로 간다. 그래서 커밋 메시지 · PR 제목에 비밀값 · 응답자 이름을 쓰지 않는 규칙이 Jira에도 그대로다 |
| 앱이 받는 권한 | 코드 읽기 · 쓰기(쓰기는 Jira에서 브랜치를 만들 때), 이슈 · PR 읽기 · 쓰기(Jira 키를 링크로 바꿀 때), 배포 읽기 · 쓰기, 메타데이터 · Actions · 보안 경보 읽기. **골라 받을 수 없다** — 다 받거나 안 깔거나 ([Atlassian 문서](https://support.atlassian.com/jira-cloud-administration/docs/permissions-required-for-github-for-jira/)) |
| 키 · 토큰 | 없다 — 앱 승인으로만 잇는다 |
| 비용 | 무료. Jira 자동화 걸음을 쓰지 않는다 |
| 되돌리기 | GitHub 조직 설정의 GitHub Apps에서 제거, Jira에서 앱 제거 |

## 2. 모두 — 이름에 Jira 키를 넣는다

앱과 3절의 Action은 브랜치 이름 · 커밋 메시지 · PR 제목에서 Jira 키(`<키>-12` 꼴 — Floe 이슈 화면 맨 위)를 찾는다.

| 어디 | 모양 | 예 |
|---|---|---|
| 브랜치 | `v2/<키>-12-주제` | `v2/<키>-12-gate-copy` |
| PR 제목 | `[vN.M] <키>-12 타입(범위): 설명` — 버전이 맨 앞 | `[v1.3] <키>-12 fix(navigator): 게이트 문구` |
| 커밋 제목 | `타입(범위): 설명 <키>-12` — 커밋 제목 규칙([git-workflow.md](../../.claude/rules/git-workflow.md))은 그대로, 키만 끝에 | `fix(navigator): 게이트 문구 <키>-12` |

- 키는 **대문자**로 쓴다. 한 PR에 키가 여럿이어도 된다 — 3절은 찾은 키마다 버전을 붙인다.
- Jira 이슈가 없는 작은 고침(오타 등)은 키 없이 올린다. 그 버전은 Jira 릴리스에는 생기지만 붙는 이슈가 없다.

## 3. 버전 → Jira 릴리스 — GitHub Action

`main`에 올라올 때마다 [jira-release.yml](../../.github/workflows/jira-release.yml)이 [jira-release.js](../../.github/scripts/jira-release.js)를 돌린다.

1. [CHANGELOG.md](../../CHANGELOG.md) 맨 위 줄을 읽는다(버전 · 날짜 · 무엇).
2. Floe에 그 버전이 없으면 **만들면서 릴리스**한다(설명 = "무엇" 칸). 있고 릴리스 전이면 릴리스만, 이미 릴리스됐으면 그대로 둔다.
3. 이번 push의 커밋 메시지에서 `<키>-숫자`를 모두 찾아 그 이슈의 **수정 버전(Fix versions)**에 붙인다. 병합 커밋에는 브랜치 이름과 PR 제목이 들어 있어 2절 규칙이면 잡힌다.
4. 비밀값이 없으면 **건너뛰고 성공**으로 끝난다(설정 전에도 `main`이 빨개지지 않는다). Jira가 답하지 않으면 1 · 2 · 4초 뒤 3번까지 다시 해 보고, 이슈 하나가 실패해도 나머지를 붙인 뒤 **빠진 이슈를 적고 실패**로 끝낸다. 실패하면 GitHub가 올린 사람에게 메일을 보낸다.

**왜 Jira 자동화가 아닌가 (2026-10-18 확인):** Jira 무료 요금제의 자동화는 **한 달 150걸음**이고 트리거 · 조건 · 동작이 각각 한 걸음이다
([Atlassian 문서](https://support.atlassian.com/jira-core-cloud/docs/how-is-my-usage-calculated)). 팀은 10/14~18에 **하루 13~17개**를 병합했다 —
병합마다 도는 규칙은 이틀이면 한도를 다 쓰고, 그러면 **사이트의 모든 자동화가 멈춘다.** Action은 이 한도를 쓰지 않는다. GitHub 무료 조직의 비공개 저장소 Actions는
한 달 2,000분이고 이 일은 한 번에 1분 안쪽이다.

### 넣을 것 — 저장소 설정 → Secrets and variables → Actions

| 이름 | 종류 | 값 | 누가 |
|---|---|---|---|
| `JIRA_BASE_URL` | Secret | `https://<사이트>.atlassian.net` — 다른 주소면 스크립트가 토큰을 보내지 않고 멈춘다 | 저장소 관리자 |
| `JIRA_EMAIL` | Secret | 토큰 주인의 Atlassian 로그인 이메일 | 토큰 주인 |
| `JIRA_API_TOKEN` | Secret | id.atlassian.com → 보안 → API 토큰 → **Create API token**(만료일을 고른다) | 토큰 주인 |
| `JIRA_PROJECT_KEY` | Variable | Floe의 프로젝트 키(대문자) | 누구든 |

- **토큰 주인은 Floe의 프로젝트 관리 권한이 있어야 한다** — 버전을 만들고 릴리스하는 권한. 이슈 편집 권한도 필요하다.
- **토큰을 채팅 · 이슈 · PR · Claude 대화에 붙이지 않는다.** GitHub 웹 화면이나 자기 터미널의 `gh secret set JIRA_API_TOKEN`(입력이 보이지 않는다)으로만 넣는다.
- 범위를 고르는 토큰(with scopes)은 요청 주소가 달라 이 스크립트가 받지 않는다 [확인 못 함 — 처음 시험에서 401이 나면 이것부터 본다].
- 토큰은 그 사람의 이름으로 Jira를 고친다 — Jira 기록에 그 사람이 버전을 만든 것으로 남는다.

## 4. 할 일은 Jira에서

- 새 할 일은 Jira에 만든다. 논의가 길어지면 GitHub 이슈를 열고 Jira 이슈에 링크한다(#102 "논의와 원본 자료는 계속 GitHub 이슈에").
- 시작하면 Jira 상태를 **"진행 중"**으로(#102). 끝난 일에는 3절이 버전을 붙인다. 상태를 "완료"로 바꾸는 것은 사람이 한다.
- **Claude는 Jira를 읽지 못한다** — Atlassian MCP를 들이지 않았다(2026-10-18 "Jira 앱"을 고름). Claude 세션은 [team-priorities.md](team-priorities.md) "내 몫"으로 말하고, Jira와 다르면 Jira가 맞다.
- 협업 증빙: 설명회가 말한 증빙은 "Issue 트래커"다([schedule.md](schedule.md) 3-3). GitHub 이슈 21개와 그 댓글은 그대로 남고, Jira 화면을 캡처로 남길지는 협업 증빙 담당(두승현)이 정한다.

## 5. 처음 한 번 · 정할 것

| 할 일 | 누가 | 결과 |
|---|---|---|
| Floe 프로젝트 키를 `JIRA_PROJECT_KEY`에 넣고 이 문서의 `<키>`를 바꾼다 | Jira 관리자 | 미정 |
| 토큰 주인 정하기(프로젝트 관리 권한) · 만료일 | 이재엽 · 두승현 | 미정 |
| 1절 앱 설치 | Jira 관리자 + 이재엽 | 미정 |
| **처음 한 번 시험** — 키가 있는 PR을 병합하고 Actions 로그 · Jira 릴리스 페이지 · 이슈의 수정 버전을 본다 | 병합한 사람 | 미정 — 결과를 이 칸에 한 줄 |

확인한 것: 위 두 Atlassian 문서(앱 권한, 자동화 걸음 · 한도), GitHub Actions가 이 저장소에서 켜져 있음(2026-10-18 `gh api`), 조직 요금제 free.
확인 못 한 것: 진짜 Jira REST 응답(시험은 가짜 Jira로 돈다 — [jira-release.test.js](../../04-tests/repo/jira-release.test.js)), 범위 토큰의 동작.
