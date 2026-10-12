// 공유 규칙 — "내 작업이 팀원에게 어떻게 보이는가"를 정한다. 서버·DB 없이 순수 함수만.
// 원칙 (V2 team-sharing-security.md):
//   1. 기본값은 나만 보기(private). 올리는 사람이 공유 범위를 고른다.
//   2. 비밀값은 어떤 범위로도 공유되지 않는다. 이메일·전화·IP는 가려서 보인다.
//   3. 개인적인 말투·다른 팀원 언급은 막지 않고 경고한다 (사람이 판단).
//   4. 받은 자료는 다시 공유하지 못한다. 요약만 공유하면 원문은 새지 않는다.
(function (root) {
  const LEVELS = ["private", "summary", "team"];

  const PATTERNS = [
    { type: "secret", label: "키·토큰 모양", severity: "block",
      re: /(ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|xox[bap]-[A-Za-z0-9-]+|AIza[0-9A-Za-z_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/g },
    { type: "secret", label: "비밀번호·키 대입", severity: "block",
      re: /((비밀번호|패스워드|암호)\s*[:=]\s*\S{4,}|(password|passwd|secret|token|api[_-]?key)\s*[:=]\s*\S{4,})/gi },
    { type: "rrn", label: "주민등록번호 모양", severity: "block", re: /\b\d{6}-[1-4]\d{6}\b/g },
    { type: "email", label: "이메일", severity: "mask", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
    { type: "phone", label: "전화번호", severity: "mask", re: /\b01[016789]-?\d{3,4}-?\d{4}\b/g },
    { type: "ip", label: "IP 주소", severity: "mask", re: /\b\d{1,3}(?:\.\d{1,3}){3}\b/g },
  ];
  // 약한 휴리스틱 — 놓칠 수 있다. 막지 않고 사람에게 알린다.
  const PERSONAL = /(나는|내가|제가|저는|힘들|짜증|화가|싫|불안|우울|피곤|속상)/;

  function scan(text, team = [], author = null) {
    const findings = [];
    for (const p of PATTERNS) {
      for (const m of String(text).matchAll(p.re)) {
        findings.push({ type: p.type, label: p.label, severity: p.severity, match: m[0] });
      }
    }
    for (const name of team) {
      if (name !== author && String(text).includes(name)) {
        findings.push({ type: "other-person", label: `다른 팀원 언급: ${name}`, severity: "warn", match: name });
      }
    }
    if (PERSONAL.test(text)) {
      findings.push({ type: "personal", label: "개인적인 서술로 보임", severity: "warn", match: text.match(PERSONAL)[0] });
    }
    return { findings, blocked: findings.some((f) => f.severity === "block") };
  }

  // 가릴 것(비밀값·이메일·전화·IP)만 가린다. 팀원 이름은 경고 대상이지 가림 대상이 아니다.
  function redact(text) {
    let out = String(text);
    for (const p of PATTERNS) out = out.replace(p.re, p.severity === "block" ? "[비밀값]" : `[${p.label} 가림]`);
    return out;
  }

  const levelOf = (item) => (LEVELS.includes(item.level) ? item.level : "private");

  // viewer가 보게 되는 목록. 못 보는 글은 존재도 알리지 않는다.
  function viewFor(viewer, items, team = []) {
    const out = [];
    for (const item of items) {
      const level = levelOf(item);
      const own = item.author === viewer;
      const s = scan(item.text, team, item.author);
      if (own) {
        out.push({ id: item.id, author: item.author, level, own: true, shown: item.text,
                   warnings: s.findings, blocked: s.blocked, note: noteFor(level, s, item) });
        continue;
      }
      if (level === "private") continue;
      if (level === "summary") {
        const sum = (item.summary || "").trim();
        if (!sum || scan(sum, team, item.author).blocked) continue;
        out.push({ id: item.id, author: item.author, level, own: false, shown: redact(sum), warnings: [], blocked: false, note: "요약만 공유됨" });
        continue;
      }
      if (s.blocked) continue;
      out.push({ id: item.id, author: item.author, level, own: false, shown: redact(item.text), warnings: [], blocked: false, note: "팀 공유" });
    }
    return out;
  }

  function noteFor(level, s, item) {
    if (level === "private") return "나만 보임";
    if (s.blocked) return "비밀값이 있어 공유되지 않음 — 지우고 다시 공유하세요";
    if (level === "summary" && !(item.summary || "").trim()) return "요약이 비어 있어 공유되지 않음";
    return level === "summary" ? "요약만 공유됨" : "팀 공유 (일부 가려짐)";
  }

  // 팀에 보이는 글에 개인 서술·다른 팀원 언급이 있으면 올리는 사람이 한 번 더 확인한다 (막지는 않는다).
  function needsConfirm(item, team = []) {
    const level = levelOf(item);
    if (level === "private") return false;
    const shared = level === "summary" ? (item.summary || "") : item.text;
    return scan(shared, team, item.author).findings.some((f) => f.type === "personal" || f.type === "other-person");
  }

  const reshareAllowed = (item, by) => item.author === by;

  function runScenario(s, team = []) {
    const failures = [];
    const view = viewFor(s.viewer, s.items, team);
    const ids = view.map((v) => v.id);
    const text = view.map((v) => v.shown).join("\n");
    for (const id of s.expectVisible || []) if (!ids.includes(id)) failures.push(`${id}가 보여야 함`);
    for (const id of s.expectHidden || []) if (ids.includes(id)) failures.push(`${id}가 숨겨져야 함`);
    for (const t of s.expectContains || []) if (!text.includes(t)) failures.push(`"${t}"가 보여야 함`);
    for (const t of s.expectNotContains || []) if (text.includes(t)) failures.push(`"${t}"가 새면 안 됨`);
    for (const [id, types] of Object.entries(s.expectWarningTypes || {})) {
      const v = view.find((x) => x.id === id);
      const got = v ? v.warnings.map((w) => w.type) : [];
      for (const t of types) if (!got.includes(t)) failures.push(`${id}에 "${t}" 경고가 있어야 함`);
    }
    for (const [id, want] of Object.entries(s.expectBlocked || {})) {
      const v = view.find((x) => x.id === id);
      if (!v || v.blocked !== want) failures.push(`${id}의 blocked가 ${want}여야 함`);
    }
    if (s.reshare) {
      const item = s.items.find((i) => i.id === s.reshare.id);
      if (reshareAllowed(item, s.reshare.by) !== s.expectReshareAllowed) failures.push("다시 공유 허용 여부가 기대와 다름");
    }
    return { pass: failures.length === 0, failures, view };
  }

  const api = { LEVELS, scan, redact, viewFor, needsConfirm, reshareAllowed, runScenario };
  if (typeof module !== "undefined") module.exports = api; else root.ShareRules = api;
})(typeof window !== "undefined" ? window : globalThis);
