# 도서관 테마 레퍼런스 — 링크 모음

> **출처: 이재엽의 개인 프로젝트 "Alcovibe" 파일에서 가져온 것.** 팀 기준이 아니라 **제안·참고 자료**이며, 팀 결정은 각 담당 역할과 합의로 한다. 개인 프로젝트 소개: [alcovibe/README.md](README.md)


<!-- claude-drafted: 2026-10-15 — 이재엽의 개인 프로젝트(Alcovibe) 파일에서 가져온 초안. 팀 기준 확인 전. -->

도서관 테마로 워크스페이스와 프로젝트 화면을 디자인할 때 **어디서 무엇을 가져올지**를 모은 링크 목록이다. 디자인 원칙 자체는
이 문서가 아니라 이재엽이 작업공간에서 정한다(이재엽 결정 2026-10-15: 테마는 작업공간에서 계속 작업).

## 전제 (지금까지 정해진 것)

- **이름: Alcovibe**(이재엽 결정 2026-10-15). alcove(서가 사이의 아치형 움푹한 자리) + vibe. 아치형 입구 모티브를 이름에
  담았다. 후보였던 `onenvibe` 등 다른 이름과 비교해 정했고, 검색에서 같은 이름의 기존 서비스는 보이지 않았다(상표 조사는
  아님). 쓰는 자리: 문서 제목, 토큰·파일 이름의 접두어(제안: `--alv-`, 토큰 파일을 만들 때 확정), 이미지 프롬프트.
  **앱 화면의 기능 이름에는 쓰지 않는다**(도서관어는 보조 자리에만).
- **분위기: 차원의 도서관을 전체 테마로**(이재엽 결정 2026-10-15). 처음에는 "B 밝은 현대 도서관"으로 정했다가 바뀌었다.
  메이플스토리 차원의 도서관에서 보이는 특징 — 보라빛 조명의 아치형 입구, 몽환적이고 차분한 분위기, "다른 시공간으로
  들어간다"는 전환, 지나온 일을 전시처럼 되짚는 구성(검색 요약 기준, 4번 표). 원작을 그대로 따라 하지 않고 분위기와
  원리만 가져온다.
- **도서관어(은유 어휘)는 보조 자리에만**(이재엽 결정 2026-10-15). 시각 분위기는 전체에 입히되, 도서관어는
  빈 상태·로딩 문구·보조 라벨·아이콘에만 쓴다. **기능 이름·메뉴 이름·버튼 동사·오류 메시지는 기능 이름 그대로** 둔다.
  말·구조(폴더·문서 이름)는 깊게, 문서·보고서는 중간으로 이전 결정을 유지한다.
- **주의:** 어두운 배경은 글자 대비(본문 4.5:1 이상)를 먼저 확인한다. 보라색 위의 연한 글자가 가장 흔한 실패다.

이미지 생성 AI로 시안을 만들 때 쓰는 프롬프트는 [library-theme-prompts.md](library-theme-prompts.md)에 있다.

## 이 문서를 쓰는 규칙

- **링크만 둔다.** 게임 화면·아트북·사이트 캡처는 저작물이라 저장소에 복사하지 않는다
  ([reference-intake.md](../../../.claude/rules/reference-intake.md) 원칙).
- **"확인 수준"을 적는다.** `검색 요약`은 검색 결과의 요약만 본 것이고, `직접 열어 봄`은 페이지를 열어 읽은 것이다.
  지금 줄은 모두 `검색 요약`이다 — 쓰기 전에 열어서 확인한다.
- **디자인은 베끼지 않는다.** 다른 사이트·게임의 디자인은 영감과 원리만 가져온다.
- 새 링크는 아래 표에 한 줄 추가한다: 링크 / 무엇을 볼까 / 확인 수준 / 확인일.

## 1. 도서관·기록 기관의 스타일 가이드

| 링크 | 무엇을 볼까 | 확인 수준 | 확인일 |
|---|---|---|---|
| [NC State 도서관 웹 스타일 가이드](https://www.lib.ncsu.edu/web-style-guide) | 대학도서관이 실제로 쓰는 스타일 가이드의 구성 | 검색 요약 | 2026-10-15 |
| [USF 도서관 디자인 시스템](https://library.usfca.edu/website-management) | 도서관 사이트의 디자인 시스템 운영 방식 | 검색 요약 | 2026-10-15 |
| [영국 국립기록원 디자인 시스템](https://design-system.nationalarchives.gov.uk/) | "기록 보관소" 톤의 공공 디자인 시스템 | 검색 요약 | 2026-10-15 |
| [NYPL 디자인 툴킷 사례(Code4Lib, 2018)](https://journal.code4lib.org/?p=13657) | 컴포넌트 시스템을 세 번 고쳐 간 과정 | 검색 요약 | 2026-10-15 |
| [NYPL 스타일 가이드 사례(Zeldman)](https://studio.zeldman.com/work/nypl/) | 오래된 사례. 표준 기반 스타일 가이드의 원형 | 검색 요약 | 2026-10-15 |

## 2. 공공·한국어 디자인 시스템 (구조·토큰 참고)

| 링크 | 무엇을 볼까 | 확인 수준 | 확인일 |
|---|---|---|---|
| [KRDS 공식 사이트](https://www.krds.go.kr) · [구성 소개](https://krds.go.kr/html/eng/outline/outline_02.html) | 한국어 서비스의 토큰·컴포넌트·가이드라인 구조. 기본 서체 Pretendard | 검색 요약 | 2026-10-15 |
| [KRDS 한국어 소개](https://designcompass.org/2025/01/22/krds-start/) · [행정안전부 안내](https://mois.go.kr/frt/sub/a06/b04/uixInnovation/screen.do) | 원칙·스타일·컴포넌트 구성, 자가 진단 체크리스트 | 검색 요약 | 2026-10-15 |
| [뉴욕주 디자인 시스템](https://designsystem.ny.gov/) | 색·타이포·간격 토큰을 문서화하는 방식 | 검색 요약 | 2026-10-15 |
| [USWDS v1 설계자 문서](https://v1.designsystem.digital.gov/documentation/designers) | 접근성(WCAG 2.0 AA)을 전제한 색·타이포 기준 | 검색 요약 | 2026-10-15 |

KRDS의 **이용 조건은 확인하지 못했다** — 가져다 쓰기 전에 공식 사이트에서 확인한다. 커뮤니티가 만든 "KRDS MCP 서버"는
우리 외부 도구 규칙상 쓰지 않는다([external-integration.md](../../../.claude/rules/external-integration.md)).

## 3. 글꼴·토큰 형식

| 링크 | 비고 | 확인 수준 | 확인일 |
|---|---|---|---|
| [Pretendard](https://github.com/orioncactus/pretendard) | 고딕 본문용, OFL. 재배포 때는 저장소의 LICENSE를 직접 확인 | 검색 요약 | 2026-10-15 |
| [Noto Serif KR (Fontsource)](https://fontsource.org/fonts/noto-serif-kr/about) | 명조 제목용, OFL-1.1 | 검색 요약 | 2026-10-15 |
| [Design Tokens 형식 2025.10 최종본](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) | 토큰 파일을 도구 사이에 주고받는 표준 형식(커뮤니티 그룹 보고서). 우리 "토큰 단일 원천"과 맞음 | 검색 요약 | 2026-10-15 |

## 4. 게임 속 도서관

| 게임 | 링크 | 눈여겨볼 점 | 확인 수준 | 확인일 |
|---|---|---|---|---|
| 메이플스토리 차원의 도서관 | [2017 업데이트 공지](https://maplestory.nexon.com/News/Update/492) · [20주년 팬 페스트 전시 기사](https://view.nate.com/tech/view/47520/) | 과거를 되짚는 "기록 보관소" 구성. 전시는 보라빛 조명의 아치형 입구로 "다른 시공간에 들어간다"는 전환을 만듦 | 검색 요약(공지·기사라 시각 자료는 아님) | 2026-10-15 |
| Library of Ruina | [아트북 개발자 노트](https://libraryofruina.wiki.gg/wiki/Library_Of_Ruina_Art_Book_Developer%27s_Notes) · [아트북](https://libraryofruina.wiki.gg/wiki/Library_Of_Ruina_Art_Book) | 도서관이 곧 세계관. 단 여러 리뷰가 메뉴·UI 탐색이 불편하다고 지적 | 검색 요약(팬 위키) | 2026-10-15 |
| 엘든 링 라야 루카리아 대도서관 | [위키](https://eldenring.wiki.gg/wiki/Raya_Lucaria_Grand_Library) | 둥근 방과 보름달 빛 하나로 정체성을 만드는 방식 | 검색 요약(팬 위키) | 2026-10-15 |
| 다크 소울 공작의 서고 | [Giant Bomb](https://giantbomb.com/wiki/Locations/The_Dukes_Archives) | 엘리베이터·회전 계단 같은 수직 이동, 숨은 통로 | 검색 요약 | 2026-10-15 |
| 호그와트 레거시 | [80.lv 제작 기사](https://80.lv/articles/making-harry-potter-inspired-hogwarts-library-in-unreal-engine/) · [아트북 소개](https://www.harrypotter.com/news/exploring-the-art-and-making-of-hogwarts-legacy) | 블록아웃(구조) 먼저, 페인트오버(분위기) 나중이라는 제작 순서 | 검색 요약 | 2026-10-15 |
| (게임 UI 일반) | [80.lv 게임 UI 데이터베이스](https://80.lv/articles/game-ui-database-collecting-references-to-inspire-designers/) · [게임 UI 원칙 글](https://virtuall.pro/blog/game-design-ui) | 도서관 UI를 찾는 출발점. "좋은 UI는 눈에 잘 띄지 않는다" | 검색 요약 | 2026-10-15 |

## 5. 게임에서 가져올 원리 (분위기가 아니라)

게임 도서관은 대부분 어두운 판타지라 **차원의 도서관을 전체 테마로 정한 지금은 분위기가 가깝다.** 그래도 장식을 따라 하지 않고 원리만 뽑아, 화면마다 장식이 늘어나지 않게 한다.

| 원리 | 출처 | 우리 적용(안) |
|---|---|---|
| 입구에서의 전환 | 메이플 차원의 도서관 | 첫 화면·빈 상태에서만 "서가에 들어왔다"는 한 번의 전환 |
| 한 가지 기준 모양/빛 | 라야 루카리아 | 화면마다 장식을 늘리지 않고 포인트 색 하나만 정함 |
| 층·수직 구조 | 공작의 서고 | 정보 구조를 서가 → 칸 → 책(분류 → 항목 → 내용)으로 일관되게 |
| 구조 먼저, 분위기 나중 | 호그와트 레거시 | 토큰·레이아웃을 먼저 확정하고 장식은 마지막 |
| 반면교사 | Library of Ruina | 도서관 은유가 메뉴 탐색을 해치지 않게 — 분위기를 전체에 입히더라도 기능 이름은 기능 이름 그대로 둔다 |

## 6. 찾지 못한 것

- 국립중앙도서관·서울도서관의 공식 UI 가이드
- 미국 의회도서관·영국 도서관의 디자인 시스템

각 기관 누리집의 하단 안내나 개발 문서를 직접 봐야 한다. 찾으면 1~2번 표에 추가한다.
