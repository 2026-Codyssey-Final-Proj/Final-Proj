# `.claude/` 구조 자체를 고칠 때의 정합성 규칙

`CLAUDE.md`, `.claude/rules/*.md`, `.claude/hooks/*.sh`, `.claude/agents/*.md`,
`.claude/skills/dev-workflow/{SKILL,PROCEDURE}.md`, `05-projects/*/CLAUDE.md`, `01-docs/00-overview/growth-log.md`의 운영 규칙 중 **하나라도** 고칠 때만
읽으세요. 이 파일들은 서로를 참조하는 "기준 계층"이라, 하나를 고치면 그걸
참조하던 다른 파일도 같이 낡을 수 있습니다.

`.claude/rules/docs-editing.md`의 규칙 3번(상태 문구 훑기)이 `01-docs/**`
일반 문서에 대한 **수동 습관**이라면, 이 파일은 그중에서도 **`.claude/`
구조 자체**를 위한 **명시적 참조 지도**입니다 — 어디를 훑어야 하는지 매번
추측하지 않도록 목록으로 고정해둡니다.

## 기준 파일 → 참조하는 파일 지도

고치려는 파일이 아래 왼쪽 열에 있으면, 오른쪽 열의 파일들도 내용이 여전히
맞는지 확인한다.

| 기준 파일(고치는 대상) | 이걸 참조하는 파일(같이 확인) |
|---|---|
| `CLAUDE.md` | `.claude/skills/dev-workflow/SKILL.md` (라우터 링크), `05-projects/*/CLAUDE.md`(루트를 따른다고 적은 부분) |
| `05-projects/*/CLAUDE.md` | 루트 `CLAUDE.md`("프로젝트" 표), 같은 프로젝트의 `README.md`(문서 지도) |
| `.claude/rules/git-workflow.md` | `CLAUDE.md`(라우팅 표·"브랜치·원격"), `05-projects/*/CLAUDE.md`("병합은 사용자가 한다"), `.claude/skills/dev-workflow/PROCEDURE.md`(명령 3의 커밋 단계) |
| `.claude/rules/docs-editing.md` | `CLAUDE.md`(라우팅 표), `.claude/skills/dev-workflow/PROCEDURE.md`(명령 3의 링크 체크 언급) |
| `.claude/rules/implementations.md` | `CLAUDE.md`(라우팅 표) |
| `.claude/rules/problem-save-gate.md` | `CLAUDE.md`(라우팅 표), `.claude/skills/dev-workflow/PROCEDURE.md`(명령 1의 PRD 게이트 단계) |
| `.claude/agents/verify.md` | `CLAUDE.md`("검증은 직접 하지 말고 위임"), `.claude/rules/implementations.md`, `.claude/skills/dev-workflow/{SKILL,PROCEDURE}.md` |
| `.claude/hooks/*.sh` | `CLAUDE.md`(훅 표), `.claude/settings.json`(등록 여부). `block-merged-branch-push.sh`는 `git-workflow.md`의 병합 확인 규칙을 코드로 옮긴 것 — 규칙을 바꾸면 훅도. `unreviewed-commits.sh`는 `git-workflow.md`의 Co-Authored-By 규칙에도 의존. `check-secrets.sh`는 `security-records.md` 6-3을 코드로 옮긴 것 — 금지 경로·패턴을 바꾸면 6-3과 `04-tests/hooks/test_check_secrets.py`, 루트 `.gitignore`의 비밀값 패턴도. `pre-commit.sample`은 사용자의 `.git/hooks/pre-commit`의 원본(`04-tests/hooks/test_pre_commit_worktree.py`가 data 브랜치 작업 폴더에서 막는지 시험) |
| `.claude/skills/dev-workflow/SKILL.md` | `.claude/skills/dev-workflow/PROCEDURE.md`(서로 참조), `CLAUDE.md` |
| `.claude/skills/dev-workflow/PROCEDURE.md` | `.claude/skills/dev-workflow/SKILL.md`(서로 참조), `CLAUDE.md`(PROCEDURE 줄 수 언급), `01-docs/01-problem-save/sessions/README.md`(저장 경로 규칙) |
| `.claude/rules/review-mode.md` | `01-docs/00-overview/growth-log.md`("리뷰어 개선 기록"의 "어긴 규칙" 번호 — 질문하는 법 번호를 바꾸면 같이 고친다), `CLAUDE.md`("Claude의 역할"·라우팅 표), `.claude/skills/dev-workflow/{SKILL,PROCEDURE}.md`(명령 1·3·5), `01-docs/00-overview/gates.md`("게이트 판정은 누가 하는가"), `.claude/rules/git-workflow.md`(누가 커밋하는가), `01-docs/00-overview/growth-log.md`(판정 등급) |
| `projects/qa-prep-system/`의 질문 규칙(세션 파일 FR2·FR4·FR5·FR9·FR11·FR12·FR22·FR24, 정량화 2·4번, test-log) | `.claude/rules/review-mode.md`("질문하는 법"·"리뷰 렌즈"가 이걸 출처로 가져옴) |
| `01-docs/00-overview/growth-log.md` (운영 규칙·`last-reviewed:` 줄 형식) | `.claude/hooks/unreviewed-commits.sh`(이 줄을 읽음), `.claude/skills/dev-workflow/PROCEDURE.md`(명령 5), `01-docs/catalog/checklist.md`(승격 대상) |
| `.claude/rules/skill-authoring.md` | `CLAUDE.md`(라우팅 표), `.claude/hooks/check-skills.sh`(같은 규칙을 코드로 확인 — 규칙을 바꾸면 스크립트도), `01-docs/catalog/external-tools.md`(채택 판정) |
| `.claude/skills/VENDORED.md` (외부 스킬 목록·커밋) | `CLAUDE.md`("스킬" 절), `.claude/rules/skill-authoring.md`(외부 스킬 사용 규칙), `01-docs/catalog/external-tools.md`(판정 행) |
| `01-docs/04-pattern-implementation/03-diagramming-guide.md` "도구 환경" | `CLAUDE.md`(라우팅 표·훅 표), `.claude/hooks/check-mermaid.sh`(버전 고정·Chrome 경로), `.mcp.json`(drawio 버전), `01-docs/catalog/external-tools.md`(판정 행) |
| `01-docs/catalog/checklist.md` "단계별 보안 점검 체크리스트" | `01-docs/00-overview/gates.md`("보안 점검"), `.claude/skills/dev-workflow/PROCEDURE.md`(명령 5 2번), `.claude/rules/security-records.md`("언제 이 기준을 꺼내는가") |
| `.claude/rules/security-records.md` | 출처로 모은 규칙들 — `git-workflow.md`(비공개·noreply·템플릿 동기화), `external-integration.md`(MCP 점검표), `skill-authoring.md`(evaluation.py), `01-docs/catalog/external-tools.md`(draw.io 조건, 외부 전송 때문에 채택 안 한 도구), `01-docs/06-service/01-twelve-factor-app.md`(Config), 6절은 사용자 저장소들(세컨드 브레인 `01-docs/references/`, 6-3 요청 판정 순서·입력 민감정보 경고는 `projects/coding-marathon-result/`). 이 중 하나를 바꾸면 이 파일의 해당 행도 고친다. `CLAUDE.md`(라우팅 표), `01-docs/01-problem-save/prd-template.md`(Security & Compliance 칸) |
| `.claude/rules/external-integration.md` | `.claude/skills/mcp-builder/reference/mcp_best_practices.md`(MCP 안내의 기준 — 원본을 다시 복사하면 점검표가 여전히 맞는지 확인), `CLAUDE.md`(라우팅 표), `.claude/skills/dev-workflow/{SKILL,PROCEDURE}.md`(명령 4), `01-docs/catalog/external-tools.md`(판정 기록 대상) |

| `.claude/rules/reference-intake.md` | `CLAUDE.md`(라우팅 표), `.claude/skills/dev-workflow/PROCEDURE.md`(명령 1의 1-1), `01-docs/catalog/reference-candidates.md`(장부 형식·상태 이름), `~/proj/coding_marathon_result/코딩마라톤 가이드/README.md`(받은 기록표 열·상태 이름, 저장소 밖), `~/proj/references/짧은자료/README.md`(짧은 자료 받은 기록표, 저장소 밖), `.claude/skills/reference-library/`(원문 위치를 적어 둠), `05-projects/second-brain/CLAUDE.md`("자료가 많을 때"가 이 파일을 가리킴) |

**새 기준 파일을 추가하면(새 rules 파일, 새 hook, 새 agent 등) 이 표에도 행을
하나 추가한다.** 표 자체가 낡으면 이 규칙 전체가 무력화된다.

## 반드시 지킬 것

1. 위 표에서 자신의 행을 찾아, 오른쪽 열의 파일들을 실제로 열어서 여전히
   맞는 설명인지 확인한다 — 파일명이 바뀌었거나, 절차 번호가 바뀌었거나,
   더 이상 존재하지 않는 개념을 가리키면 그 자리에서 같이 고친다.
2. 확실하지 않으면 아래처럼 실제로 grep해서 놓친 참조가 있는지 확인한다
   (표는 알려진 참조만 담고 있고, 표에 없는 참조가 생겼을 수 있다):

   ```bash
   # <파일명>을 언급하는 모든 .md 파일을 찾는다 (표에 없는 참조가 있는지 확인)
   grep -rl "<파일명>" --include="*.md" .
   ```

3. `.claude/rules/docs-editing.md`의 링크 체크(깨진 상대 링크 0건)도 그대로
   적용된다 — 정합성 확인과 링크 체크는 별개다. 내용이 맞아도 링크가 깨질
   수 있고, 링크가 살아있어도 내용이 낡을 수 있다.

## 이 규칙이 하지 않는 것

- 자동 강제하지 않는다 — `check-links.sh`처럼 훅으로 기계적으로 막는 단계가
  아니라, 아직은 "표를 보고 사람이 확인하는" 단계다. 이 표 기반 확인이
  반복적으로 빠지는 게 실제로 드러나면, 표의 왼쪽 열을 grep 패턴으로 바꿔
  `.claude/hooks/`에 새 훅으로 승격하는 걸 다음 단계로 고려한다.
