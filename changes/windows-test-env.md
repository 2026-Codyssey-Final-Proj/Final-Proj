종류: 작은 고침
누가: 임유정
무엇: Windows에서만 실패하던 시험 셋을 고침 — files-api · knowledge-restore는 파일 링크를 권한 없이 못 만들어 EPERM(폴더는 junction, 파일 링크는 못 만들면 그 확인만 건너뜀 — readme-api · chat-store와 같은 방식), knowledge-store는 파이썬 출력이 cp949라 한글이 깨짐(-X utf8). 이 셋 때문에 Windows에서 Claude의 커밋을 커밋 전 시험 훅이 막았다
건드린 곳: `04-tests/navigator/`
