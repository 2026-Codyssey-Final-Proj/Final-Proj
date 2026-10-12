# 참고 자료 — K-Travel-Assistant

<!-- claude-drafted: 2026-10-01 — 사용자 요청(GitHub 링크, "둘다 가로")으로 Claude가 저장소를 읽고 썼다. "가져올 것"은 후보이고, 확정은 사용자가 한다. -->

## 무엇

- [gamercross/K-Travel-Assistant](https://github.com/gamercross/K-Travel-Assistant) — 날짜를 넣으면 Gemini가 여행지를
  추천하고, Kakao Local API로 맛집을 찾고, Gemini가 최종 리포트를 쓰는 Python 스크립트(`travel_planner.py`).
  결과는 `results/YYYY-MM-DD_data.json`(원본)과 `YYYY-MM-DD_travel_plan.md`(리포트)로 남는다.
- 2026-08-11~08-18, 작성자 사용자 한 명. README 첫 줄이 "…조합하여..."에서 끝나고 `src/report_generator.py`는 빈 파일.

## 목적 연결

- **P1 저장 방식 (약함)** — 원본과 요약을 **날짜별로 함께** 남긴다. 사용자가 "넣는다"(가)로 정했다(2026-10-01).

## 가져올 것 (후보)

| 단계 | 재료 | 쓰는 곳 |
|---|---|---|
| 3단계 저장 구조 | 원본(json)과 파생(md)을 같은 날짜 이름으로 함께 저장 | 지식 창고의 "원천 + 요약" 파일 이름 규칙 후보 |
| 3·5단계 | 실패하면 1번 재시도, 일부가 실패해도(맛집 검색) 경고를 남기고 리포트는 만든다 | 자동화가 조용히 멈춰 놓친 일이 생기지 않게 |
| 2단계 | 키가 없으면 설정 방법을 안내하고 바로 끝낸다(`config.py`) | 실패를 사람이 알 수 있게 |

## 교훈

- 빈 파일과 끝나지 않은 README가 남았다 — "나중을 위해 미리 만들지 않는다"(ponytail·karpathy)의 반대 사례.

## 보안 메모

- 공개 저장소. 키는 환경변수, `.env`는 `.gitignore`. 저장소에 실제 키 패턴은 보이지 않았다.
