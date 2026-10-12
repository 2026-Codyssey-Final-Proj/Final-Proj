<!-- claude-drafted: 2026-10-06 — "확인할 것 / 확인 방법 / 우리 쪽 연결" 칸은 Claude가 덧붙였다. 항목 이름·설명·태그·방법론은 원문. -->

# 4·5단계 — 작업 분해 (Tasks): 저장소·접속·방화벽·비밀값

원문: `~/proj/coding_marathon_result/코딩마라톤 가이드/4. 작업 분해/<폴더>/README.md` (폴더 4개). 서버를 처음 세우거나 프로젝트를 서버에 올리기 전에
**작업 목록과 점검표**로 쓴다. 보안 점검과 겹치므로 [security-records.md](../../../rules/security-records.md) 6-3과
[checklist.md](../../../../docs/catalog/checklist.md) "단계별 보안 점검 체크리스트"를 같이 본다.

## Git 워크플로우 (5)

| 항목 | 설명 (원문) | 우리 쪽에서는 |
|---|---|---|
| 브랜치 전략 `required` | Git Flow 브랜치 전략 강제 | 이 워크스페이스는 Git Flow가 아니라 **기능 브랜치 + 사용자가 병합** — [git-workflow.md](../../../rules/git-workflow.md). 새 프로젝트에서 어느 쪽을 쓸지 정한다 |
| 커밋 메시지 규칙 `required` | 타입(범위): 설명 | 이 워크스페이스 커밋도 `docs(second-brain): …` 형식 — 같은 규칙 |
| 저장소 생성 `required` | GitLab 저장소 생성 (Private 기본) | 우리는 GitHub 비공개. 기본값을 비공개로 두는 것은 같다 |
| 저장소 가시성 | 가시성 선택 | 공개로 바꾸기 전 이력에 비밀값·개인정보가 없는지 |
| 자동화 옵션 | CI/CD 및 pre-commit hooks | 우리는 `check-secrets.sh`를 pre-commit으로 연결 — 새로 클론하면 다시 연결(보안 기준 6-3) |

## SSH 인증 (5)

| 항목 | 방법론 (원문) | 확인 방법 |
|---|---|---|
| SSH 키 타입 `required` | ED25519 권장. 보안성과 성능 모두 우수 | `ssh-keygen -t ed25519 -C "<용도>"`, 개인키에 암호 문구 |
| 키 배포 `required` | 공개키 배포 및 authorized_keys 관리 | `ssh-copy-id`로 공개키만 보낸다. 개인키는 서버에 두지 않는다 |
| SSH Config `required` | 클라이언트 설정으로 연결 간소화 | `~/.ssh/config`의 Host 별명 — 저장소에 커밋하지 않는다 |
| 대상 서버 | 접속 대상 서버 및 접근 매트릭스 | 어떤 키가 어떤 서버에 들어가는지 표로(키 이름만, 키 내용 X) |
| 보안 수준 | 암호화, 인증 방식, 접근 제한 | `PasswordAuthentication no`, `PermitRootLogin no` 적용 후 새 창에서 접속 확인 |

## 방화벽 설정 (5)

| 항목 | 방법론 (원문) | 확인 방법 |
|---|---|---|
| UFW 기본 정책 `required` | 기본 거부(Default Deny), 필요한 포트만 허용 | `ufw default deny incoming` · `ufw default allow outgoing` — **SSH 허용을 먼저** 넣고 켠다 |
| 필수 포트 허용 `required` | 운영에 필수인 포트만 허용 (SSH, GitLab) | `ufw status numbered`로 열린 포트가 포트 지도와 같은지 |
| 내부 네트워크 허용 `required` | 세그먼트별 정책, DMZ·내부망·관리망 분리 | 원 환경의 대역(`192.168.0.0/24`)이다 — 지금 네트워크 대역 확인 |
| 추가 포트 허용 | 속도 제한, GeoIP 차단, 악성 IP 차단 | 프로젝트 포트를 열 때 이유와 날짜를 같이 기록 |
| 보안 강화 | 불필요한 서비스 끄기, 커널 파라미터 | fail2ban 설치 후 SSH 실패 차단이 실제로 걸리는지 |

## 환경변수/시크릿 (4)

| 항목 | 설명 (원문) | 우리 쪽에서는 |
|---|---|---|
| .env 파일 `required` | .env 파일 생성 필수 | 키 이름만 적은 `.env.example`을 같이 둔다([Twelve-Factor Config](../../../../docs/06-service/01-twelve-factor-app.md)) |
| .gitignore 추가 `required` | 시크릿 파일을 .gitignore에 | `check-secrets.sh`가 `.env`·`*.pem` 커밋을 막는다 — 훅에만 기대지 않고 무시 목록에도 |
| 비밀번호 정책 `required` | 16자 이상, 복잡도 | 사람이 외우는 값이 아니면 생성기로 만든다 |
| 시크릿 저장 방식 | 저장 방식 선택 | 개인 프로젝트: `.env` + 비밀번호 관리자. 서버가 생기면 보안 기준 5절 "서버 인증·접근 권한" 칸에서 정한다 |

## 작업 목록으로 바꿀 때

4단계 작업 쪼개기 표기(`[P]` 병렬, 테스트 먼저 — [checklist.md](../../../../docs/catalog/checklist.md) 4·5단계)에
맞춰, 위 `required` 항목을 하나씩 작업으로 옮기고 "확인 방법" 칸을 그 작업의 완료 조건으로 쓴다.
