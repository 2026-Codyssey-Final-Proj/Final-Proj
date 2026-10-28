# 앱 글꼴 (C-57, 2026-10-28)

| 글꼴 | 쓰는 곳 | 출처 | 라이선스 |
|---|---|---|---|
| Bagel Fat One | 제목 · 단계 숫자 | google/fonts `ofl/bagelfatone` | SIL Open Font License 1.1 — [OFL-BagelFatOne.txt](OFL-BagelFatOne.txt) |
| Gowun Dodum | 글 | google/fonts `ofl/gowundodum` | SIL Open Font License 1.1 — [OFL-GowunDodum.txt](OFL-GowunDodum.txt) |
| Nanum Gothic Coding (Regular · Bold) | 코드 · 파일 이름 · 줄 번호 | google/fonts `ofl/nanumgothiccoding` | SIL Open Font License 1.1 — [OFL-NanumGothicCoding.txt](OFL-NanumGothicCoding.txt) |

원본 TTF를 `pyftsubset`으로 줄여 WOFF로 두었다(이재엽 버튼 "자주 쓰는 한글만 남겨 작게"): 영문 · 숫자 · 기호(U+0020 ~ 007E 등), 자주 쓰는 한글 2,350자(KS X 1001 — 파이썬 `iso2022_kr`로 셈), 한글 자모 · CJK 문장 부호. 드문 글자는 다음 글꼴(시스템)로 떨어진다.
불러오는 곳은 [navigator/fonts.css](../../navigator/fonts.css). 바깥 주소(Google Fonts)에서는 불러오지 않는다. <!-- claude-drafted: 2026-10-28 -->
