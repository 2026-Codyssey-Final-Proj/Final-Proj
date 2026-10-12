---
name: reference-library
description: 코딩마라톤 가이드 폴더에 정리한 "전문 라이브러리" 목록(비즈니스 모델 템플릿 30개, 기술 스택·인프라 프리셋, Docker·MariaDB·Nginx·포트·방화벽·SSH·시크릿 설정 항목, UML 다이어그램 14종, UI 디자인 시스템·패턴·팔레트, 문서 템플릿, Claude 스킬·플러그인·MCP·서브에이전트)을 7단계 워크플로우의 단계별 후보표로 꺼내 주는 스킬. "어떤 비즈니스 모델로 정리할까", "기술 스택 골라줘", "무슨 다이어그램 그려야 해", "서버 설정 뭐 확인해야 해", "UI 라이브러리 뭐 쓸까", "문서 뭐 써야 해", "쓸 만한 에이전트 있어?", "코딩마라톤 가이드에서 꺼내줘", "레프런스에서 꺼내줘" 같은 요청에 반응한다. 후보와 확인 질문을 보여 줄 뿐 고르지 않는다.
metadata:
  source: ~/proj/coding_marathon_result/코딩마라톤 가이드/ 묶음 1·3~7 README (스크린샷에서 옮긴 원문, 2026-10-02 촬영, 2026-10-06 옮김)
  drafted: claude-drafted 2026-10-06
---

<!-- claude-drafted: 2026-10-06 — 사용자 요청("각각의 표들에 추가적인 내용들을 작성해서 스킬로 사용할 수 있게 해줘", 작성 주체: Claude 초안, 모양: 스킬 하나)으로 Claude가 썼다. 표의 항목 이름·설명은 레프런스 README 원문이고, "언제 쓰나 / 확인할 것 / 우리 쪽 연결" 칸은 Claude가 덧붙인 것이다. -->

# 코딩마라톤 가이드 라이브러리

코딩마라톤 가이드 폴더(저장소 밖)의 목록을 **지금 밟고 있는 단계에 맞춰** 꺼내 보여 준다. 원문은
`~/proj/coding_marathon_result/코딩마라톤 가이드/<묶음>/<폴더>/README.md`이고, 이 스킬의 표는 그 원문에 **쓰임새 칸을 덧붙인 것**이다.

## 언제 어느 파일을 여나

요청에 맞는 파일 하나만 연다. 여러 단계에 걸치면 둘까지.

| 지금 하는 일 | 워크플로우 단계 | 열 파일 |
|---|---|---|
| 아이디어를 사업·서비스 모양으로 정리 | 1 문제 저장 (PRD) | [references/01-specify.md](references/01-specify.md) |
| 기술 스택·서버·DB·도메인·포트를 정함, 다이어그램을 고름 | 3 패턴 분석 · 4 패턴 구현 | [references/03-plan.md](references/03-plan.md) |
| 저장소·SSH·방화벽·비밀값을 준비 | 4·5 작업 분해, 보안 점검 | [references/04-tasks.md](references/04-tasks.md) |
| 화면 라이브러리·패턴·글꼴·색, 로그·모니터링 | 5 구현 | [references/05-implement.md](references/05-implement.md) |
| 배포·운영 문서, API 문서, 릴리스 노트 | 6 서비스 · 7 유지보수 | [references/06-report.md](references/06-report.md) |
| Claude 스킬·플러그인·MCP·서브에이전트 고르기 | 외부 도구 통합 (명령 4) | [references/07-setup.md](references/07-setup.md) |

## 보여 주는 방법

1. 사용자가 무엇을 만들고 있는지 한 줄로 확인한다(이미 대화에 있으면 생략).
2. 해당 표에서 **후보를 최대 3개** 골라 표 하나로 보인다 — 항목, 왜 맞을 수 있는지, 확인할 것.
   전체 목록이 필요하면 그때 파일 전체를 보인다.
3. **고르는 것은 사용자다.** 추천 순위를 매기지 않고, 사용자가 이미 고른 것이 있으면 그것을
   기본값으로 둔다([review-mode.md](../../rules/review-mode.md) 질문하는 법 7).
4. 고른 것은 사용자가 세션 파일의 "준비 재료"나 해당 단계 문서에 적는다
   ([reference-intake.md](../../rules/reference-intake.md) ⑤ 꺼내 쓰기).

## 지킬 것

- **환경 값은 원 라이브러리 작성자의 인프라 값이다.** MariaDB 포트 3309 이상, `192.168.0.0/24`,
  IPTIME 포트포워딩, GitLab, LLM Host/NAS 같은 값은 그 환경에서 정한 것이다. 새 프로젝트에 그대로
  옮기기 전에 "이 값이 지금 환경에도 맞나요?"를 묻는다.
- **비밀값·도메인은 쓰지 않는다.** 원문에서 `<도메인>`, `<DDNS 주소>`로 가린 자리는 그대로 둔다
  ([security-records.md](../../rules/security-records.md) 2절).
- **외부 도구를 들이는 일은 이 스킬이 하지 않는다.** 07의 스킬·플러그인·MCP를 쓰려면
  `dev-workflow` 명령 4와 [external-integration.md](../../rules/external-integration.md)를 거친다.
- **원문과 다르면 원문이 맞다.** 표의 항목 이름·설명이 원문 README와 어긋나면 README를 따르고 이 표를 고친다.
- 원 라이브러리의 이용 조건은 아직 확인 전이다(`~/proj/coding_marathon_result/코딩마라톤 가이드/README.md` "정해야 할 것" 5번). 이 스킬은
  비공개 저장소 안에서만 쓰고 공개 템플릿으로 보내지 않는다.
