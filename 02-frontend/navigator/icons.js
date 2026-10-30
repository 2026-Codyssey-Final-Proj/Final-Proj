// claude-drafted: 2026-10-30 — app.js 나누기 3차(이재엽 "그 순서대로 진행"): 섬 화면의 아이콘을 app.js(00-base 조각)에서 떼어 낸 모듈.
// 선 아이콘(I — 위쪽 줄 · 탭 · 단추)과 무지개 조개(우리 재화의 그림, 2026-10-23). 그림만 있고 상태 · 화면을 모른다 — 시험: 04-tests/navigator/icons.test.js
// 화면(index.html)이 app.js보다 먼저 부른다. app.js는 `const { icon, I, SHELL_ICO, coin } = window.FloeIcons;`로 받아 쓴다.
(function (root) {
  "use strict";
  const icon = (d, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    up: icon('<path d="M6 15l6-6 6 6"></path>', 14), down: icon('<path d="M6 9l6 6 6-6"></path>', 14),
    pin: icon('<path d="M9 4h6l-1 6 3 3H7l3-3z"></path><path d="M12 13v7"></path>', 15),
    back: icon('<path d="M15 5l-7 7 7 7"></path>', 20),
    undo: icon('<path d="M15 5l-7 7 7 7"></path>', 14),
    today: icon('<circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5z"></path>', 24),
    map: icon('<path d="M4 19h4V5H4zM10 19h4V9h-4zM16 19h4v-6h-4z"></path>', 24),
    doc: icon('<path d="M6 3h8l5 5v13H6z"></path><path d="M14 3v5h5"></path><path d="M9 13h7M9 17h7"></path>', 24),
    gear: icon('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>', 16),
    check: icon('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', 14),
    arrow: icon('<path d="M5 12h14M13 6l6 6-6 6"></path>', 13),
    bubble: icon('<circle cx="12" cy="13" r="7"></circle><circle cx="9.5" cy="10.5" r="1.2"></circle><circle cx="19" cy="5" r="2"></circle>', 15),
    all: icon('<rect x="4" y="4" width="7" height="7" rx="1.5"></rect><rect x="13" y="4" width="7" height="7" rx="1.5"></rect><rect x="4" y="13" width="7" height="7" rx="1.5"></rect><rect x="13" y="13" width="7" height="7" rx="1.5"></rect>', 24),
    lib: icon('<path d="M3.5 6.5C6 5.5 9 5.5 12 7c3-1.5 6-1.5 8.5-.5V18c-2.5-1-5.5-1-8.5.5-3-1.5-6-1.5-8.5-.5z"></path><path d="M12 7v11.5"></path>', 24),
    // 레벨 오버레이의 명령 네 칸(2026-10-19, 목업 level-overlay.html 그대로) — 맡기기 · 살피기 · 꺼내기 · 쉬어 가기
    hand: icon('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"></path><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"></path>', 22),
    look: icon('<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path>', 22),
    bag: icon('<path d="M5 8h14l-1 12H6z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path>', 22),
    moon: icon('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path>', 22),
    // 기본 화면(2026-10-20, C-13) — 위쪽 줄 맨 왼쪽의 집 단추
    home: icon('<path d="M4 11l8-7 8 7"></path><path d="M6 10v10h12V10"></path><path d="M10 20v-6h4v6"></path>', 20),
    // 퀘스트 창(C-22, 2026-10-21) — 두루마리. 설정 창의 '창 · 퀘스트' 머리에 쓴다(위쪽 줄의 단추는 2026-10-23에 뺐다)
    scroll: icon('<path d="M6 3h11a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2z"></path><path d="M8 8h8M8 12h6"></path>', 18),
  };
  // 무지개 조개 — 우리 재화의 그림(2026-10-23, 이재엽 "무지개 조개를 이미지를 만들어서 우리만의 재화를 보여줘"). 무지개 여섯 빛의 부채꼴 조개.
  //   class는 'coin' — 'shell'은 섬의 바탕 껍데기(.nav .shell, 단추 뒤로 숨는다)라 겹치면 위 줄에 수만 보였다
  const SHELL_ICO = '<svg viewBox="0 0 24 24" stroke="#33406E" stroke-width=".85" stroke-linejoin="round"><path fill="#FF9AA2" d="M12 19.9L23.6 14.7Q24.2 11.4 20.8 10.8Z"/><path fill="#FFC48A" d="M12 19.9L20.8 10.8Q20.1 7.4 16.8 8.1Z"/><path fill="#FFE38A" d="M12 19.9L16.8 8.1Q14.8 5.3 12.0 7.2Z"/><path fill="#B8EFA0" d="M12 19.9L12.0 7.2Q9.2 5.3 7.2 8.1Z"/><path fill="#9ADFFF" d="M12 19.9L7.2 8.1Q3.9 7.4 3.2 10.8Z"/><path fill="#C9B2FF" d="M12 19.9L3.2 10.8Q-0.2 11.4 0.4 14.7Z"/><path fill="#C9B2FF" d="M8.6 18.3h6.8l1.5 3.4a.8.8 0 0 1-.7 1.1H7.8a.8.8 0 0 1-.7-1.1z"/></svg>';
  const coin = () => `<i class="coin" aria-hidden="true">${SHELL_ICO}</i>`;
  const api = { icon, I, SHELL_ICO, coin };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeIcons = api;
})(typeof window !== "undefined" ? window : globalThis);
