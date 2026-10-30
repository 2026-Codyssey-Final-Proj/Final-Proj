// 민감한 값 찾기 · 가리기 — 비밀값(키 · 토큰 · 비밀번호), 주민등록번호, 이메일 · 전화 · IP. 서버 · DB 없이 순수 함수만.
// 2026-10-19(이재엽): '나만 보기 · 공유 규칙'(FR-9, 03-backend/share/)을 지우면서 안전장치로 쓰던 이 부분만 옮겨 왔다. 쓰는 곳:
//   화면(app.js) — 진짜 AI로 보내기 전에 멈추고 묻기 · 느낀 점을 Jira용으로 복사할 때 가리기, 서버(server.js) — 받은 알림 글을 저장하기 전에 가리기.
(function (root) {
  const PATTERNS = [
    { type: "secret", label: "키·토큰 모양", severity: "block",
      // 2026-10-30(F-104-1 · 2): GitHub 토큰은 ghp_만이 아니라 gho_ · ghu_ · ghs_ · ghr_ · github_pat_, Authorization의 Bearer 값도.
      //   개인키는 머리 줄만 가리면 본문(base64)이 그대로 나갔다 — 머리 줄 뒤의 머리말 · 빈 줄 · base64 줄(짧은 마지막 줄 · 들여쓴 YAML도)과 끝 줄까지 한 덩이로.
      //   줄 나눔은 진짜 줄바꿈과 JSON 글 속의 \\n 둘 다(서비스 계정 "private_key"). 줄마다 나눔으로 시작해 겹치지 않는다 — 긴 줄에서도 느려지지 않게
      re: /(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|xox[bap]-[A-Za-z0-9-]+|AIza[0-9A-Za-z_-]{20,}|[Bb]earer\s+[A-Za-z0-9._~+/=-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----(?:(?:\r?\n|\\n)[ \t]*(?:[A-Za-z-]+:[^\r\n\\]*|[A-Za-z0-9+/=]+|(?=(?:\r?\n|\\n))))*(?:(?:\r?\n|\\n)[ \t]*-----END [A-Z ]*PRIVATE KEY-----)?)/g },
    { type: "secret", label: "비밀번호·키 대입", severity: "block",   // ["']? — JSON · YAML 꼴("password": "…")도(F-104-2)
      re: /((비밀번호|패스워드|암호)["']?\s*[:=]\s*["']?\S{4,}|(password|passwd|secret|token|api[_-]?key)["']?\s*[:=]\s*["']?\S{4,})/gi },
    { type: "rrn", label: "주민등록번호 모양", severity: "block", re: /\b\d{6}-[1-4]\d{6}\b/g },
    { type: "email", label: "이메일", severity: "mask", re: /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,}/g },   // 묶음의 첫 글자에서만 · 길이 상한 — '@' 없는 긴 한 줄(512KB 코드)에서 제곱으로 느려지지 않게(2026-10-27 C-43)
    { type: "phone", label: "전화번호", severity: "mask", re: /\b01[016789]-?\d{3,4}-?\d{4}\b/g },
    { type: "ip", label: "IP 주소", severity: "mask", re: /\b\d{1,3}(?:\.\d{1,3}){3}\b/g },
  ];

  // 찾은 것: [{type, label, severity(block|mask), match}]. blocked — 비밀값처럼 보내면 안 되는 것이 있다
  function scan(text) {
    const findings = [];
    for (const p of PATTERNS) {
      for (const m of String(text).matchAll(p.re)) findings.push({ type: p.type, label: p.label, severity: p.severity, match: m[0] });
    }
    return { findings, blocked: findings.some((f) => f.severity === "block") };
  }

  // 비밀값은 [비밀값], 이메일 · 전화 · IP는 [… 가림]으로 바꾼다
  function redact(text) {
    let out = String(text);
    for (const p of PATTERNS) out = out.replace(p.re, p.severity === "block" ? "[비밀값]" : `[${p.label} 가림]`);
    return out;
  }

  const api = { scan, redact };
  if (typeof module !== "undefined") module.exports = api; else root.NavSensitive = api;
})(typeof window !== "undefined" ? window : globalThis);
