// claude-drafted: 2026-10-18 — F-05(PRD 2-7, 이재엽 결정 "오버레이에서는 간단하고 필요한 내용만 확인, 자세한건 서재로 이동"): 서재의 '내 배움'이 읽는 기록.
// 내비게이터(../navigator/app.js)가 이 브라우저(localStorage)에 남긴 기록에서 지나온 단계 · 배운 말 · 확정한 설계도를 꺼낸다. 서버·AI 호출 없음.
// 순수 함수라 Node에서 시험한다(04-tests/library/learn.test.js). 기록이 없거나 고장 나면 빈 배움 — 서재 화면이 멈추지 않게, 던지지 않는다.
(function (root) {
  const KEY = "navigator-prototype:v1";   // 내비게이터 app.js의 KEY와 같아야 한다 — 시험이 맞대어 본다
  const str = (x) => typeof x === "string" && x.trim() !== "";
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);
  // raw: 저장된 글(JSON). 돌려주는 것: {history:[{text}], learned:[{term,text}], docs:[{stage,name,text,at}], since, project, finished, practice, empty}
  function fromSaved(raw) {
    let s = null;
    try { s = JSON.parse(raw); } catch { s = null; }
    if (!s || typeof s !== "object" || Array.isArray(s)) s = {};
    const history = list(s.history).filter((x) => str(x.text)).map((x) => ({ text: x.text }));
    const learned = list(s.learned).filter((x) => str(x.term)).map((x) => ({ term: x.term, text: str(x.text) ? x.text : "" }));
    const docs = list(s.docs).filter((x) => Number.isInteger(x.stage) && str(x.text))
      .map((x) => ({ stage: x.stage, name: str(x.name) ? x.name : "", text: x.text, at: str(x.at) ? x.at : "" }));
    return { history, learned, docs, since: str(s.since) ? s.since : "", project: str(s.project) ? s.project : "",
      finished: s.finished === true, practice: s.mode === "fixture", empty: !history.length && !learned.length && !docs.length };
  }
  // 저장소를 못 쓰는 브라우저(사생활 보호 창 등)면 빈 배움
  function read(storage) {
    let raw = null;
    try { raw = storage.getItem(KEY); } catch { raw = null; }
    return fromSaved(raw);
  }

  const api = { KEY, fromSaved, read };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LibLearn = api;
})(typeof window !== "undefined" ? window : globalThis);
