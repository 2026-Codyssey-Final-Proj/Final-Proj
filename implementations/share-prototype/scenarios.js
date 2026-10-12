// 공유 규칙 시나리오 — 가상 데이터만 쓴다 (실제 사람·계정·값 없음).
// node 테스트와 index.html의 "시험 실행"이 같은 목록을 쓴다.
(function (root) {
  const TEAM = ["팀원 A", "팀원 B", "팀원 C", "팀원 D"];
  const T = (extra) => Object.assign({ team: TEAM }, extra);

  const scenarios = [
    {
      name: "기본값은 나만 보기 — 다른 팀원에게 존재도 보이지 않는다",
      items: [{ id: "n1", author: "팀원 A", kind: "my", text: "오늘 인터뷰 질문 초안을 썼다.", level: "private" }],
      viewer: "팀원 B",
      expectHidden: ["n1"],
    },
    {
      name: "level이 없으면 private으로 취급한다",
      items: [{ id: "n2", author: "팀원 A", kind: "my", text: "메모" }],
      viewer: "팀원 B",
      expectHidden: ["n2"],
    },
    {
      name: "작성자 본인은 항상 원문을 본다",
      items: [{ id: "n3", author: "팀원 A", kind: "my", text: "내가 오늘 너무 힘들었다.", level: "private" }],
      viewer: "팀원 A",
      expectVisible: ["n3"],
      expectContains: ["너무 힘들었다"],
    },
    {
      name: "요약만 공유하면 원문 문장은 다른 팀원에게 새지 않는다",
      items: [{
        id: "n4", author: "팀원 A", kind: "my", level: "summary",
        text: "나는 이 결정 때문에 밤새 불안했고 팀원 C가 짜증났다. 결국 선택지 B로 했다.",
        summary: "결정: 선택지 B. 이유: 구현 범위가 작다.",
      }],
      viewer: "팀원 B",
      expectVisible: ["n4"],
      expectContains: ["선택지 B"],
      expectNotContains: ["불안", "짜증"],
    },
    {
      name: "요약 공유인데 요약이 비어 있으면 공유되지 않는다",
      items: [{ id: "n5", author: "팀원 A", kind: "my", level: "summary", text: "원문", summary: "" }],
      viewer: "팀원 B",
      expectHidden: ["n5"],
    },
    {
      name: "비밀값이 든 글은 팀 공유가 막힌다",
      items: [{ id: "n6", author: "팀원 A", kind: "my", level: "team", text: "서버 비밀번호: hunter2abc 로 접속" }],
      viewer: "팀원 B",
      expectHidden: ["n6"],
    },
    {
      name: "팀 공유 시 이메일·전화·IP는 가려서 보인다",
      items: [{
        id: "n7", author: "팀원 A", kind: "my", level: "team",
        text: "연락은 someone@example.com 또는 010-1234-5678, 서버는 192.168.0.10 이다.",
      }],
      viewer: "팀원 C",
      expectVisible: ["n7"],
      expectNotContains: ["someone@example.com", "010-1234-5678", "192.168.0.10"],
    },
    {
      name: "남이 준 자료는 받은 사람이 다시 공유할 수 없다",
      items: [{ id: "n8", author: "팀원 B", kind: "reference", level: "team", text: "참고 자료 요약" }],
      viewer: "팀원 C",
      reshare: { id: "n8", by: "팀원 C", level: "team" },
      expectVisible: ["n8"],
      expectReshareAllowed: false,
    },
    {
      name: "공유 전 점검에서 다른 팀원 이름 언급을 알려 준다",
      items: [{ id: "n9", author: "팀원 A", kind: "my", level: "team", text: "팀원 D가 일정을 또 놓쳤다." }],
      viewer: "팀원 A",
      expectWarningTypes: { n9: ["other-person"] },
    },
    {
      name: "개인적인 말투는 경고만 하고 막지는 않는다",
      items: [{ id: "n10", author: "팀원 A", kind: "my", level: "team", text: "나는 이 방식이 싫다. 근거는 비용이다." }],
      viewer: "팀원 A",
      expectWarningTypes: { n10: ["personal"] },
      expectBlocked: { n10: false },
    },
  ];

  const api = { TEAM, scenarios, T };
  if (typeof module !== "undefined") module.exports = api; else root.Scenarios = api;
})(typeof window !== "undefined" ? window : globalThis);
