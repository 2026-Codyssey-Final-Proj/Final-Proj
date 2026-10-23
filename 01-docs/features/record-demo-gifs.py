#!/usr/bin/env python3
# claude-drafted: 2026-10-18 — 기능별 시연 GIF 녹화. 02-frontend를 file:// 로 열어 연습 예시(fixture)만 쓴다 — 서버·AI 호출 없음(토큰 0).
#   python3 01-docs/features/record-demo-gifs.py            # 전부
#   python3 01-docs/features/record-demo-gifs.py 03-gate    # 하나만
# 필요한 것: Playwright(Chromium)와 Pillow.  pip install playwright pillow && python3 -m playwright install chromium
# 장면 주소는 3분 시연 스토리(01-docs/04-pattern-implementation/demo-story-3min.md)의 것을 그대로 쓴다.
import io, sys, time, pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
FE = ROOT / "02-frontend"
OUT = ROOT / "01-docs" / "features"
NAV = f"file://{FE}/navigator/index.html"
LIB = f"file://{FE}/library/index.html"
ENTRY = f"file://{FE}/index.html"
W, H = 1280, 800
GIF_W = 880                       # 저장 폭 — 파일 크기와 가독성 사이
FPS_MS = 220                      # 프레임 간격(ms), 약 4.5fps
NAV_CROP = (140, 0, 1140, 640)    # 내비게이터 패널이 있는 영역만 — 글자가 읽히게


class Rec:
    def __init__(self, page, crop=None):
        self.page, self.frames, self.durs, self.crop = page, [], [], crop

    def snap(self, dur=FPS_MS):
        im = Image.open(io.BytesIO(self.page.screenshot(type="png"))).convert("RGB")
        if self.crop: im = im.crop(self.crop)
        w, h = im.size
        self.frames.append(im.resize((GIF_W, round(h * GIF_W / w)), Image.LANCZOS)); self.durs.append(dur)

    def hold(self, ms):            # ms 동안 계속 찍는다 — 화면 안의 움직임이 GIF에 들어간다
        end = time.time() + ms / 1000
        while time.time() < end:
            t0 = time.time(); self.snap()
            rest = FPS_MS / 1000 - (time.time() - t0)
            if rest > 0: time.sleep(rest)

    def still(self, ms):           # 정지 화면 한 장을 ms 동안 — 파일 크기를 아낀다
        self.snap(ms)

    def click(self, sel, hold=900, timeout=4000):
        self.page.wait_for_selector(sel, timeout=timeout)
        self.page.hover(sel); self.snap(350)
        self.page.click(sel); self.hold(hold)

    def save(self, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        fr = [f.quantize(colors=160, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG) for f in self.frames]
        fr[0].save(path, save_all=True, append_images=fr[1:], duration=self.durs, loop=0, optimize=True, disposal=1)
        print(f"  → {path.relative_to(ROOT)}  {len(fr)}프레임 · {path.stat().st_size // 1024}KB")


def open_nav(page, hash_):
    page.goto(f"{NAV}#{hash_}"); page.wait_for_timeout(900)


def stage_guide(page, r):            # 01 FR-1·2: 먹이 주기(글이 들어 있음) → 나눠 정리 → 확인 → 지금 단계(LV) · 할 일 하나 → 살피기 → 이 단계 할 일 펼치기 (2026-10-20 C-15)
    open_nav(page, "start"); r.still(900)
    r.click("[data-act=feed-sort]", hold=1200)
    r.click("[data-act=feed-confirm]", hold=1600)
    r.click("[data-act=cmd][data-i='1']", hold=1000)
    r.click("[data-act=path][data-i='0']", hold=1400)
    r.still(1500)


def blueprint(page, r):              # 02 FR-3: 초안 받기 → 고쳐 쓰기 → 다시 봐 주세요 → 확정
    open_nav(page, "ex=1&tab=doc"); r.still(900)
    r.click("[data-act=draft]", hold=1800)
    cur = page.wait_for_selector("textarea[data-act=doc]", timeout=4000).input_value()
    page.fill("textarea[data-act=doc]", cur.replace("[채워 주세요: ", "[", 1) if "[채워 주세요: " in cur else cur + "\n성공 기준: 2주 안에 회원 30명이 신청한다.")
    page.wait_for_timeout(300); r.still(900)
    r.click("[data-act=review]", hold=1800)
    r.click("[data-act=confirm-doc]", hold=1000)
    if page.query_selector("[data-act=confirm-anyway]"):
        r.click("[data-act=confirm-anyway]", hold=1200)
    r.still(1600)


def gate(page, r):                   # 03 FR-4·5·12: 이해하셨나요? → 아니요 → 헷갈린 곳 → 질문 → 요약 → 예 → 다음 할 일 순서
    open_nav(page, "ex=1&done&gate"); r.still(1500)
    r.click("[data-act=no]", hold=1000)
    r.click("[data-act=hard-t][data-i='1']", hold=600)
    r.click("[data-act=to-question]", hold=800)
    page.fill("textarea[data-act=question]", "꼭 필요한지 표시하는 건 왜 해요?"); r.still(700)
    r.click("[data-act=answer]", hold=1600)
    r.click("[data-act=plan]", hold=1400)
    r.click("[data-act=yes]", hold=1200)
    if page.query_selector("[data-act=down][data-i='0']"):
        r.click("[data-act=down][data-i='0']", hold=800)
    r.still(1500)


def overview(page, r):               # 04 FR-6: '지금' → '한곳에서 보기' 탭
    open_nav(page, "ex=2"); r.still(900)
    r.click("[data-act=tab][data-tab=all]", hold=1400)   # 탭은 순서가 아니라 이름으로 — 2026-10-18 '내 배움' 탭을 빼며 순서가 바뀌었다(F-05)
    r.still(1800)


def library(page, r):                # 05 FR-8: 도서관 탭 → 한 권의 책으로 엮기 → 서고 → 전체 돌아보기
    open_nav(page, "tab=lib&book=s3"); r.still(1200)
    r.click("[data-act=lib-bind]", hold=2600)
    r.still(1200)
    page.goto("about:blank"); page.goto(f"{LIB}#lib-review"); page.wait_for_timeout(900); r.hold(600); r.still(2000)


def book_view(page, r):              # 05 C-9 · C-3(2026-10-20) 책 보기 설정: 펼친 책 → 보기 설정 → 할 일 칸 끄기 → 탭 구조 → 정한 것 탭 → 전체 화면(서고의 펼친 책)
    open_nav(page, "ex=1&tab=lib&book=s1"); page.evaluate("localStorage.removeItem('floe:book-view')"); page.reload(); page.wait_for_timeout(900); r.still(1200)   # 빈 페이지에서는 저장소를 못 읽는다 — 연 뒤에 지운다
    r.click("[data-act=bv-open]", hold=1200)
    r.click("input[data-bv=field][data-v=todos]", hold=1000)
    r.click(".bv-opt[data-bv=structure][data-v=tabs]", hold=1000)
    r.click(".bv-tab[data-v=decided]", hold=1200)
    r.click(".bv-opt[data-bv=size][data-v=full]", hold=3200)
    page.wait_for_timeout(600); r.still(1600)
    page.evaluate("localStorage.removeItem('floe:book-view')")   # 다음 장면이 기본값으로 시작하게


def plain_words(page, r):            # 07 FR-13: 용어는 작게 → 누르면 한 줄 풀이(서재의 '내 배움'은 2026-10-19에 지움)
    open_nav(page, "ex=2&crit"); r.still(1400)
    r.click("[data-act=term]", hold=1800)


def floro(page, r):                  # 08 마스코트: 고개 돌리기 · 쓰다듬기
    open_nav(page, "ex=0"); r.still(600)
    for x, y in [(200, 150), (900, 150), (900, 600), (300, 600), (640, 400)]:
        page.mouse.move(x, y, steps=8); r.hold(350)
    for _ in range(4):
        page.click("[data-act=pet]"); r.hold(380)
    r.hold(1200)


def greeting(page, r):               # 08 켤 때 인사(C-10, 2026-10-20): 주소 끝 없이 열면 띠 → 섬 → 플로로 솟음 → 지느러미 → 글. 저장이 없어 끝나면 처음 설정이 열린다
    page.goto("about:blank"); page.goto(NAV); r.hold(3900)
    r.still(1200)
    page.keyboard.press("Escape"); r.hold(500)


def entry(page, r):                  # 시연 입구 → 3분 시연 시작
    page.goto(ENTRY); page.wait_for_timeout(600); r.still(1200)
    r.click("text=3분 시연 시작", hold=1500)
    r.still(1200)


def base(page, r):                   # 11 C-13(2026-10-20): 섬의 기본 화면 — 단추 넷 → 알림 판 → 단추로 → AI 진행 판(예시) → 바이브 코딩(이번 단계)
    open_nav(page, "base"); r.still(1400)
    r.click("[data-act=base-alerts]", hold=1400)
    r.click("[data-act=base-back]", hold=600)
    r.click("[data-act=base-ai]", hold=1600)
    r.click("[data-act=base]", hold=600)
    r.click("[data-act=go-vibe]", hold=1200)
    r.still(800)


def feed(page, r):                   # 12 C-15 · C-16(2026-10-20): 예시 먹이 → 나눠 정리(구간 셋 · 둘은 뺌) → 일기 '먹어도 돼요' → 확인 → 어디쯤인지 → 책 안 단계 문서
    open_nav(page, "start"); r.still(900)
    r.click("[data-act=feed-example]", hold=1600)
    r.click("[data-act=feed-mark][data-i='1']", hold=1000)
    r.click("[data-act=feed-confirm]", hold=1600)
    r.click(".cmd4 [data-act=cmd-book]", hold=1600)             # 2026-10-21 C-22: 퀘스트 창의 서고 탭에서 책 안 단계 문서. 2026-10-23: 위 줄의 단추 대신 명령 칸의 책
    r.still(1200)


def approve(page, r):                # 13 FR-17(2026-10-20): 허락이 필요한 카드 둘 → 보통 일 거절 → 위험한 일 허용은 한 번 더 → 할 일 적기 → 정리(연습) → 허락하고 넘기기(연습)
    open_nav(page, "base&pane=ai&approve=1"); r.still(1600)
    r.click(".ap:not(.danger) [data-act=ap-deny]", hold=900)
    r.click(".ap.danger [data-act=ap-allow]", hold=1300)
    r.click(".ap.danger [data-act=ap-allow]", hold=900)
    page.click("#task-text"); page.keyboard.type("회원 신청 화면 만들어 줘. 마감 알림도 넣어 줘", delay=40); r.hold(600)
    r.click("[data-act=task-tidy]", hold=1400)
    r.click("[data-act=task-send]", hold=1800)
    r.still(1200)


def shelves(page, r):                # 05 C-21(2026-10-20): 책장 만들기 → 펼친 책에서 옮기기 → 이름 바꾸기 → 지우기
    page.goto(f"{LIB}#lib"); page.evaluate("localStorage.removeItem('floe:shelves')"); page.reload(); page.wait_for_timeout(900); r.still(1200)
    r.click("#shelf-add", hold=600); page.type("#shelf-name", "알림", delay=60); r.hold(400); page.keyboard.press("Enter"); r.hold(900)
    r.click("[data-read=f1]", hold=1200); r.click("#rd-cover", hold=1500)
    opt = page.evaluate("[...document.querySelectorAll('#rd-shelf option')].find(o => o.textContent === '알림').value"); page.select_option("#rd-shelf", opt); r.hold(800)
    r.click("#rd-close", hold=900)
    r.click("[data-act=shelf-rename]", hold=500); page.fill("form[data-rename] input", "알림 · 폼"); page.keyboard.press("Enter"); r.hold(900)
    r.click("[data-act=shelf-remove]", hold=1400); r.still(1000)
    page.evaluate("localStorage.removeItem('floe:shelves')")


def block(page, r):                  # 08 C-20 · C-19(2026-10-20): 접히기까지 5초 → 테두리 빛 → 먹이 검사 중 '어디쯤인지 보기' 막힘(화난 플로로 · X 표지판)
    open_nav(page, "ex=1"); page.evaluate("localStorage.removeItem('floe:fold-delay')"); r.still(800)
    r.click("[data-act=settings]", hold=700); r.click(".fold-opt[data-i='5']", hold=700); r.click("[data-act=settings]", hold=400)
    page.evaluate("document.querySelector('[data-act=pin][aria-pressed=\"true\"]')?.click()"); page.mouse.move(5, 790); r.hold(2600)
    open_nav(page, "feed"); r.still(900)
    r.click(".opts [data-act=judge]", hold=2600); r.still(800)   # 2026-10-21 C-22: 채팅의 칩 '어디쯤인지 보기'
    page.evaluate("localStorage.removeItem('floe:fold-delay')")


def quest(page, r):                  # 14 C-22(2026-10-21): 처음 실행 → '퀘스트를 시작하시겠습니까?' → 1단계 받기 화면(퀘스트 창) → 받기 → 공책 → 한 줄씩(예시) → 완료 보고 → 넘어가기 전 확인 → 2단계 · 조개 → 설정 창 자리
    open_nav(page, "start"); page.evaluate("localStorage.removeItem('navigator-prototype:v1')"); open_nav(page, "start"); r.still(1000)
    r.click("[data-act=idea-example]", hold=1500)
    r.click("[data-act=quest-start]", hold=2000)
    r.click("[data-act=quest-ok]", hold=1600)
    for _ in range(4): r.click("[data-act=quest-example]", hold=900)
    r.click("[data-act=quest-report]", hold=1600)
    r.click("[data-act=gate]", hold=900); r.click("[data-act=yes]", hold=1200)
    if page.query_selector("[data-act=check-pick]"): r.click("[data-act=check-pick]", hold=1000)
    if page.query_selector("[data-act=check-go]"): r.click("[data-act=check-go]", hold=1400)
    r.click("[data-act=qtab][data-tab=tree]", hold=1400)
    r.click("[data-act=settings]", hold=1200); r.click("[data-act=side][data-v=right]", hold=1600); r.click("[data-act=side][data-v=left]", hold=1000)
    r.still(1000)
    page.evaluate("localStorage.removeItem('navigator-prototype:v1'); localStorage.removeItem('floe:win-side')")


SCENES = {
    "01-stage-guide": (stage_guide, NAV_CROP), "02-blueprint": (blueprint, NAV_CROP), "03-gate": (gate, NAV_CROP),
    "04-overview": (overview, NAV_CROP), "05-library": (library, None),
    "07-plain-words": (plain_words, NAV_CROP), "08-floro": (floro, NAV_CROP), "greeting": (greeting, NAV_CROP), "entry": (entry, None),
    "base": (base, NAV_CROP), "12-feed": (feed, NAV_CROP), "book-view": (book_view, None), "13-task-approval": (approve, NAV_CROP), "shelves": (shelves, None), "block": (block, NAV_CROP),
    "14-quest": (quest, None),
}

if __name__ == "__main__":
    names = sys.argv[1:] or list(SCENES)
    with sync_playwright() as p:
        b = p.chromium.launch()
        for n in names:
            fn, crop = SCENES[n]
            ctx = b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1, locale="ko-KR")
            page = ctx.new_page(); page.on("dialog", lambda d: d.dismiss())
            r = Rec(page, crop); print(n)
            try:
                fn(page, r)
                r.save(OUT / "demo-entry.gif" if n == "entry" else OUT / "08-floro" / "greeting.gif" if n == "greeting" else OUT / "11-hub" / "base.gif" if n == "base" else OUT / "05-library" / "book-view.gif" if n == "book-view" else OUT / "05-library" / "shelves.gif" if n == "shelves" else OUT / "08-floro" / "block.gif" if n == "block" else OUT / n / "demo.gif")
            except Exception as e:
                print("  ✗", n, type(e).__name__, str(e)[:300])
            ctx.close()
        b.close()
