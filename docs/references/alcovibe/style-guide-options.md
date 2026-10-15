# 디자인 스타일 가이드 후보 — 검색 결과와 물어볼 것

> **출처: 이재엽의 개인 프로젝트 "Alcovibe" 파일에서 가져온 것.** 팀 기준이 아니라 **제안·참고 자료**이며, 팀 결정은 각 담당 역할과 합의로 한다. 개인 프로젝트 소개: [alcovibe/README.md](README.md)


<!-- claude-drafted: 2026-10-15 — 이재엽의 개인 프로젝트(Alcovibe) 파일에서 가져온 초안. 팀 기준 확인 전. -->

이미 정해진 것: 이름 Alcovibe, 분위기는 **차원의 도서관**(보랏빛 조명·아치형 입구·차분함), 도서관어는 보조 자리에만,
기능 이름은 기능 이름 그대로([library-theme.md](library-theme.md)). 이 문서는 **그 위에 무엇을 얹을지**만 다룬다.

## 확인 수준

| 표기 | 뜻 |
|---|---|
| 검색 요약 | 검색 결과의 요약만 봤다. 값은 근사치이니 쓰기 전에 원문을 연다 |
| 규격 | 표준 문서 이름만 확인했다. 버전을 열어 확인해야 한다 |

## 후보 A — 토큰 구조를 표준 형식으로

| 항목 | 내용 |
|---|---|
| 무엇 | [Design Tokens Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) — 디자인 토큰을 JSON으로 교환하는 형식. W3C 권고는 아니고 커뮤니티 그룹 최종 보고서 |
| 쓸 때 | 색·글꼴·간격을 한 파일로 정하고 화면에서 읽을 때. 우리 접두어 제안: `--alv-` |
| 다크·라이트 | 같은 그룹의 [Resolver Module](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/)이 여러 테마(라이트·다크)를 다룬다 |
| 주의 | 이전 초안은 "구현하지 말 것" 경고가 있어 **2025.10판을 기준**으로 한다. 규격 수준 확인 |

## 후보 B — 보라 계열을 쓸 때의 대비 규칙

| 규칙 | 근거 (검색 요약) |
|---|---|
| 본문 글자는 배경 대비 **4.5:1 이상**, 큰 글자·컴포넌트는 3:1 이상 (WCAG AA) | [Stephanie Walter](https://stephaniewalter.design/blog/yellow-purple-and-the-myth-of-accessibility-limits-color-palettes/), [DubBot](https://dubbot.com/dubblog/2023/dark-mode-a11y.html) |
| **어두운 배경에서 채도 높은 보라를 글자색으로 쓰지 않는다.** 중간 보라(#7008D9)는 검정 위에서 2.73:1로 AA 실패. 연하게 탈색한 색조를 쓴다 | [design.arcxp.com](https://design.arcxp.com/patterns/color) |
| 색만으로 뜻을 전하지 않는다 — 아이콘·라벨·밑줄을 같이 쓴다 | WCAG 색 사용 규칙 |
| **글자·배경 쌍마다** 라이트·다크 두 테마에서 따로 잰다 | 같은 곳 |

이 규칙은 library-theme.md의 "보라색 위의 연한 글자가 가장 흔한 실패" 주의와 같은 방향이다.

## 후보 C — 어두운 제품 UI의 참고 문법 (제3자 해석, 근사치)

| 참고 | 가져올 원리 | 가져오지 않을 것 |
|---|---|---|
| [Linear 해석](https://cdn.jsdelivr.net/npm/oh-my-opencode@4.18.2/dist/skills/frontend/references/design/linear.app.md) | 거의 검은 바탕 위에 **흰색 투명도로 층을 나눈다**, 테두리는 0.05~0.08 투명 흰색, 강조색은 하나만 | 글꼴 설정값 그대로, 큰 제목의 음수 자간 |
| [Obsidian 해석](https://www.webdesignhot.com/design.md/obsidian/) | 어두운 면 + 가는 테두리 + 보라 한 가지, 그림자 대신 안쪽 1px 하이라이트, 시스템 글꼴 | 헥스값 — 출처마다 `#0f0f0f`/`#171717`로 다름 |
| Notion | (검색에서 자료를 못 찾았다. 공식 자료를 따로 열어야 한다) | — |

세 출처 모두 **공식 가이드가 아니라 역분석 요약**이다. 값을 베끼지 않고 구조(층·테두리·강조색 하나)만 본다.

## 후보 D — 정보 구조 (대시보드·지식 창고)

| 원리 | 근거 | 우리 쪽 연결 |
|---|---|---|
| 핵심 정보를 먼저, 자세한 것은 펼쳐서 (점진적 공개) | 검색 결과 요약 | 책 표지(요약) → 문서(원천) 구조와 맞음 |
| 영역을 머리·사이드·본문·바닥으로 나눈다 | 같은 곳 | 프로젝트 목록(사이드) → 세션·일정(본문) |
| 주·부·보조 위계를 둔다 | Material 지침 요약 | 도서관어는 보조 위계에만 |
| 팔레트는 3~5색 | 같은 곳 | 보라 1 + 중립 + 상태 색(완료·지연·막힘) |

Material Design 3·Radix Colors는 검색에서 **공식 문서를 못 열었다.** 쓰기로 하면 공식 사이트에서 토큰·단계별 대비를 직접 확인한다.

## 물어볼 것 (이재엽이 답)

한 번에 하나씩 답해도 된다. 1번이 2~5번을 좌우한다.

| # | 질문 | 선택지 |
|---|---|---|
| 1 | 화면은 어디에 쓰나 | 가) 읽기 화면(정적 HTML, 접수 1 갈래)만  나) 대시보드까지  다) 아직 모름 |
| 2 | 기본 밝기 | 가) 어두운 면 중심(차원의 도서관)  나) 밝은 면 중심에 보라는 강조만  다) 둘 다 지원 — 라이트·다크 두 테마 |
| 3 | 토큰을 표준 형식(후보 A)으로 쓸까 | 예 / 처음엔 CSS 변수만 / 모름 |
| 4 | 강조색을 몇 가지로 | 보라 하나 + 상태 색(권장, 후보 B·C) / 보라 두 단계 / 다른 색 추가 |
| 5 | 참고할 제품 스타일이 있나 | Linear 같은 어둡고 조용한 쪽 / Obsidian 같은 / 직접 보여 줄 것이 있다 |

답이 나오면 [library-theme.md](library-theme.md) "전제"에 결정을 한 줄 더하고,
토큰 파일은 화면을 만들 때(제출 이후) 확정한다. 화면을 만들기 전 점검은 `impeccable-review`·`break-ui`, 움직임은 Emil 스킬을 쓴다.

## Sources
- [Design Tokens Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
- [Design Tokens Resolver Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/)
- [Yellow, Purple, and the Myth of "Accessibility Limits Color Palettes"](https://stephaniewalter.design/blog/yellow-purple-and-the-myth-of-accessibility-limits-color-palettes/)
- [Dark mode a11y — DubBot](https://dubbot.com/dubblog/2023/dark-mode-a11y.html)
- [Color patterns — design.arcxp.com](https://design.arcxp.com/patterns/color)
