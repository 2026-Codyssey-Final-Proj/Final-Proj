// claude-drafted: 2026-10-19 — Mac 노치(다이내믹 아일랜드) 자리를 읽는 작은 도우미. 이재엽 결정 2026-10-19 "Swift 도우미로 정확히".
// Electron(screen 모듈)은 메뉴 줄 높이만 알려 주고 노치의 폭 · 자리는 알려 주지 않는다 — macOS 12+의 NSScreen(safeAreaInsets · auxiliaryTop*Area)만 안다.
// 하는 일: 주 화면의 노치 x · 폭 · 높이(pt)와 화면 크기 · 메뉴 줄 높이를 JSON 한 줄로 찍고 끝난다. 노치가 없으면 "notch": null.
// 네트워크 · 파일 쓰기 없음. 묶기: prebuild.js가 `swiftc -O`로 build/notch-probe를 만든다(swiftc가 없으면 건너뛰고 앱은 노치 없이 켜진다).
import AppKit
import Foundation

var out: [String: Any] = ["notch": NSNull()]
if let s = NSScreen.main {
  let f = s.frame, v = s.visibleFrame
  out["screen"] = ["width": f.width, "height": f.height]
  out["menuBar"] = f.maxY - v.maxY   // visibleFrame은 메뉴 줄을 뺀 영역 — 그 차이가 메뉴 줄 높이(노치 Mac은 더 높다)
  if #available(macOS 12.0, *) {
    let top = s.safeAreaInsets.top
    if top > 0, let l = s.auxiliaryTopLeftArea, let r = s.auxiliaryTopRightArea {
      // 노치 = 메뉴 줄의 왼쪽 조각과 오른쪽 조각 사이. x는 화면 왼쪽 기준(pt) — Electron의 DIP와 같은 단위
      out["notch"] = ["x": l.maxX - f.minX, "width": r.minX - l.maxX, "height": top]
    }
  }
}
let data = try! JSONSerialization.data(withJSONObject: out, options: [.sortedKeys])
print(String(data: data, encoding: .utf8)!)
