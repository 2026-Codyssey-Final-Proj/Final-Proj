<!-- claude-drafted: 2026-10-06 — "언제 쓰나 / 최소 목차" 칸은 Claude가 덧붙였다. 문서 이름·설명·난이도·태그는 원문. -->

# 6·7단계 — 품질 분석 (Report): 문서 템플릿 11개

원문: `~/proj/coding_marathon_result/코딩마라톤 가이드/6. 품질 분석/<폴더>/README.md` (폴더 5개). 원문에는 카드만 있고 템플릿 본문은 없다 —
아래 "최소 목차"는 처음 쓸 때의 뼈대 후보다. 6단계 검증 기록 형식은 [06-service/README.md](../../../../docs/06-service/README.md)를 먼저 따른다.

| 문서 | 폴더 | 난이도 | 태그 | 언제 쓰나 | 최소 목차 |
|---|---|---|---|---|---|
| 시스템 아키텍처 | 아키텍처 | 고급 | required, architecture | 3단계 결정을 남이 읽을 수 있게 정리할 때 | 구성도 · 기술 스택과 고른 이유(ADR 링크) · 데이터 흐름 · 외부로 나가는 것 |
| 데이터베이스 설계서 | 아키텍처 | 고급 | required, architecture | 테이블이 생기면 | ERD · 테이블별 칸·제약 · 인덱스 · 백업 방법 |
| API 문서 | api 문서 | 중급 | required, api | 화면과 서버가 나뉘거나 남이 API를 쓸 때 | 엔드포인트 목록 · 요청/응답 예시 · 인증 · 오류 코드(401/403/404/409) |
| OpenAPI 스펙 | api 문서 | 고급 | optional, api | API를 기계가 읽게(자동 문서·클라이언트 생성) | OpenAPI 3.0 YAML — 손으로 쓰기보다 프레임워크에서 생성 |
| 배포 가이드 | 배포 | 중급 | required, deployment | 다른 사람(또는 몇 달 뒤의 나)이 다시 올릴 수 있게 | 필요한 것 · 환경변수 목록(값 X) · 설치 순서 · 확인 방법 · 되돌리기 |
| Docker Compose 설정 | 배포 | 중급 | optional, deployment | 컨테이너로 배포할 때 | `compose.yaml` + 서비스별 포트·볼륨 설명 — [03-plan.md](03-plan.md) Docker |
| 관리자 메뉴얼 | 메뉴얼 | 중급 | required, manual | 운영자가 따로 있거나 운영 작업이 반복될 때 | 일상 점검 · 백업/복구 · 장애 때 할 일 · 계정 관리 |
| 사용자 메뉴얼 | 메뉴얼 | 초급 | required, manual | 사용자가 나 말고도 있을 때 | 시작하기 · 주요 기능 3개 · 자주 묻는 질문 |
| 테스트 계획서 | 기타 | 중급 | optional, test | 6단계 전에 무엇을 확인할지 미리 정할 때 | 범위 · EARS 요구 ↔ 테스트 ID 표 · 일부러 실패시킬 경우 · 하지 않을 것 |
| 프로젝트 README | 기타 | 초급 | optional, documentation | 모든 프로젝트 | 무엇 · 왜 · 실행 방법 · 문서 지도. **상태 문장은 쓰지 않고 원천(게이트 로그)을 링크한다** — 프로젝트 `CLAUDE.md`의 규칙 |
| 릴리스 노트 | 기타 | 초급 | optional, documentation | 버전을 나눠 내놓을 때 | 버전·날짜 · 추가 · 변경 · 고친 결함 · 알려진 문제 |

## 우리 쪽 연결

- 테스트 계획서의 "EARS 요구 ↔ 테스트 ID" 표는 [02-specification-ears.md](../../../../docs/02-problem-analysis/02-specification-ears.md) "EARS → 수용 테스트" 규칙과 같다(장부 W-01).
- 배포 가이드·릴리스 노트의 "고친 결함·하지 못한 것"은 6단계 검증 기록 형식의 칸과 같다(장부 W-04).
- 원문 태그의 `required`는 원 라이브러리 기준이다. 개인 프로젝트에서 무엇을 필수로 쓸지는 등급([scope-tiers.md](../../../../docs/00-overview/scope-tiers.md))에 맞춰 사용자가 정한다.
