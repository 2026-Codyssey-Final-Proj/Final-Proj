# Final-Proj — Project Navigator

AI로 **바이브 코딩**을 하는 사람이 프로그램을 끝까지 만들고, 이해하고, 배움을 쌓도록 안내하는 서비스를 만드는 팀 레포다.
(코디세이 AI 네이티브 응용 학습 Final-Project)

> 개인 프로젝트(V1)가 팀 프로젝트(V2)로 승격됐다. 이 레포는 V1의 워크 프로세스(7단계, 게이트, 규칙·훅)에 코딩마라톤 루틴을 합쳐 쓴다.

| 알고 싶은 것 | 어디 |
|---|---|
| 무엇을 만드나, 요구사항 | [docs/00-overview/requirements.md](docs/00-overview/requirements.md) |
| 기획안 | [docs/00-overview/final-project-plan.md](docs/00-overview/final-project-plan.md) |
| 팀과 역할 | [TEAM.md](TEAM.md) |
| 이 시스템을 처음 쓰는 법 | [GETTING_STARTED.md](GETTING_STARTED.md) |
| Claude에게 일을 시킬 때 | [CLAUDE.md](CLAUDE.md) — 처음 세션이면 이름·역할부터 묻는다 |
| V1에서 무엇을 옮겼나 | [docs/00-overview/migration.md](docs/00-overview/migration.md) |
| 공유·보안 규칙 | [docs/00-overview/team-sharing-security.md](docs/00-overview/team-sharing-security.md) |
| 도와준 사람들 | [docs/ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md) |

## 공유 시험 화면

서버 없이 브라우저로 연다. 가상 데이터만 쓴다.

```bash
open implementations/share-prototype/index.html
node --test implementations/share-prototype
```

## 규칙 한 줄

사람은 `main`에 직접 커밋할 수 있고, **Claude는 `main`에 올리지 않는다.** 비밀값·서버 주소·응답자 이름은 올리지 않는다.
