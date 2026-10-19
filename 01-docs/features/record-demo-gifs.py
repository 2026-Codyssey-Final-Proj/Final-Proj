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
HUB = f"file://{FE}/hub/index.html"
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


def stage_guide(page, r):            # 01 FR-1·2: 글 넣기 → 지금 단계(LV) · 할 일 하나 → 살피기 → 이 단계 할 일 펼치기 (2026-10-19 레벨 오버레이)
    open_nav(page, "start"); r.still(900)
    r.click("[data-act=judge]", hold=1600)
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


def hub(page, r):                    # 11 C-11 · C-12: 모아 보기 창 — 바이브 코딩(카드 둘) → 알림 → AI 진행. 파일로 열어 예시(2026-10-20)
    page.goto(f"{HUB}#vibe"); page.wait_for_timeout(900); r.still(1400)
    r.click("[data-space=alerts]", hold=1400)
    r.click("[data-space=ai]", hold=1600)
    r.still(1200)


SCENES = {
    "01-stage-guide": (stage_guide, NAV_CROP), "02-blueprint": (blueprint, NAV_CROP), "03-gate": (gate, NAV_CROP),
    "04-overview": (overview, NAV_CROP), "05-library": (library, None),
    "07-plain-words": (plain_words, NAV_CROP), "08-floro": (floro, NAV_CROP), "greeting": (greeting, NAV_CROP), "entry": (entry, None),
    "11-hub": (hub, None), "base": (base, NAV_CROP),
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
                r.save(OUT / "demo-entry.gif" if n == "entry" else OUT / "08-floro" / "greeting.gif" if n == "greeting" else OUT / "11-hub" / "base.gif" if n == "base" else OUT / n / "demo.gif")
            except Exception as e:
                print("  ✗", n, type(e).__name__, str(e)[:300])
            ctx.close()
        b.close()
