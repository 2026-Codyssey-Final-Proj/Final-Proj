// 개인용으로 만든 세컨드 브레인이 다른 사람·다른 환경에서 어떻게 되는지 — 가정 목록.
// 근거는 V1 워크스페이스에서 직접 확인한 위치다(2026-10-12). status: break=그대로는 안 됨, adapt=고치면 됨, ok=그대로 가능.
(function (root) {
  const checks = [
    { id: "E1", area: "승인", personal: "사용자 한 명이 \"예\" 한 번으로 쓰기를 승인한다",
      source: "ADR-0007 \"쓰기 전에는 항상 사용자의 '예'\"", breaks: "여러 명이면 누가 승인하는가. 남의 글을 대신 승인할 수 있다",
      need: "글의 작성자만 자기 글의 쓰기·공유를 승인한다", status: "adapt" },
    { id: "E2", area: "저장", personal: "데이터는 `data` 고아 브랜치, 작업 폴더 하나에 한 세션만",
      source: "second-brain CLAUDE.md \"한 폴더, 한 번에 한 세션\"", breaks: "4명이 한 브랜치에 쓰면 충돌하고 서로의 개인 글이 같은 이력에 남는다",
      need: "사람마다 따로 저장(개인 저장소·로컬). 팀과는 공유본만 주고받는다", status: "break" },
    { id: "E3", area: "알림", personal: "구글 캘린더 한 계정(주로 쓰는 계정)에 일정을 만든다",
      source: "ADR-0003 폰 알람 행", breaks: "팀원마다 계정·캘린더 이름이 다르다. 공유 캘린더를 쓰면 제목이 팀 전체에 보인다",
      need: "알림은 각자 계정에서. 제목에는 개인 서술을 넣지 않는다(현재도 한 줄만)", status: "adapt" },
    { id: "E4", area: "입력", personal: "폰에서 GitHub 비공개 저장소 이슈로 넣는다",
      source: "ADR-0003 폰 입력 행", breaks: "팀 레포의 이슈는 협업자 전원이 읽는다. 개인 서술이 그대로 보인다",
      need: "개인 입력은 팀 레포 이슈를 쓰지 않는다. 각자 개인 저장소나 이 UI의 나만 보기", status: "break" },
    { id: "E5", area: "분류", personal: "목적 5개(생활·학교·작업·대회·기타)와 번호 범위가 코드에 고정",
      source: "intake.py:16 RANGES", breaks: "다른 사람의 분류와 맞지 않는다. 학교가 기본값인 것은 학생 경험이다",
      need: "분류와 범위를 설정값으로. 기본 분류는 인터뷰로 정한다", status: "adapt" },
    { id: "E6", area: "경로", personal: "창고 경로가 `<vault>/<목적>/<번호> <이름>.md`",
      source: "intake.py:118·169 Path(vault)", breaks: "경로는 인자로 받아 이식은 쉽다. 폴더 이름 규칙은 한국어 분류에 묶여 있다",
      need: "vault 경로를 설정으로, 폴더 이름은 분류 설정에서 만든다", status: "ok" },
    { id: "E7", area: "안전장치", personal: "비밀값 검사(pre-commit)를 사람이 한 번 손으로 설치한다",
      source: "second-brain CLAUDE.md \"처음 한 번\"", breaks: "새로 클론한 팀원은 설치를 모르면 검사 없이 커밋한다",
      need: "온보딩 절차에 설치를 넣고, 설치 여부를 확인하는 한 줄을 둔다", status: "adapt" },
    { id: "E8", area: "외부 전송", personal: "작업 내용이 AI 서비스(Claude)로 전송되는 것을 본인이 알고 쓴다",
      source: "security-records 1절", breaks: "팀원 각자가 동의했는지 모른다. 남의 글을 내 세션에 붙이면 그 글도 전송된다",
      need: "공유본만 AI에 붙인다. 각자 전송 사실을 확인했다고 TEAM에 표시", status: "adapt" },
    { id: "E9", area: "입력 틀", personal: "제목 한 줄 `목적 / 이름 / 내용 / 마감`을 사용자가 외워서 쓴다",
      source: "ADR-0005, intake.py 머리말", breaks: "처음 쓰는 사람은 틀을 모른다. 틀에 맞지 않으면 처리 거부(이슈 #55·#56 사례)",
      need: "입력 화면이 틀을 만들어 준다(이 UI의 폼). 틀 오류는 이유와 고치는 법을 보여 준다", status: "adapt" },
    { id: "E10", area: "처리자", personal: "서버가 없고 Claude 세션이 이슈를 읽어 처리한다",
      source: "ADR-0003 선택 2 \"세션 중심\"", breaks: "처리하는 세션마다 읽는 데이터가 달라진다. 팀원 세션이 남의 글을 읽을 수 있다",
      need: "세션은 자기 저장소만 읽는다. 공유본은 이 UI의 규칙을 거쳐서만 읽는다", status: "break" },
  ];
  const api = { checks };
  if (typeof module !== "undefined") module.exports = api; else root.EnvChecks = api;
})(typeof window !== "undefined" ? window : globalThis);
