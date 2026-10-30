#!/usr/bin/env bash
# *.md 안의 ```mermaid 블록을 실제로 그려 보고, 그려지지 않으면(문법 오류) 막는다.
# - PostToolUse 훅: stdin JSON의 tool_input.file_path 한 파일만 검사
# - 직접 실행 / verify 에이전트: `bash .claude/hooks/check-mermaid.sh --all` 로 저장소 전체 검사
# 렌더러는 @mermaid-js/mermaid-cli(npx 캐시, 버전 고정)이고, Chrome은 이미 설치된 것을 쓴다
# (PUPPETEER_SKIP_DOWNLOAD). 문법만 확인한다 — 순서가 뒤집히는 등 배치 문제는 사람이 그림을
# 보고 확인해야 한다(01-docs/04-pattern-implementation/03-diagramming-guide.md "도구 환경").
# json_field는 공용 도우미에 있다 — 빠져 있던 동안(2026-10-17~18) 훅 모드가 검사 없이 통과했다(고칠 목록 F-09)
. "$(dirname "$0")/lib.sh"
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0

# Chrome — 지정한 것, 없으면 Mac · Windows(Git Bash 경로) · Linux 자리를 차례로(전에는 Mac 경로뿐이라 Windows에서 늘 건너뛰었다, 고칠 목록 F-105-8)
CHROME="${MERMAID_CHROME:-}"
if [ -z "$CHROME" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/c/Program Files/Google/Chrome/Application/chrome.exe" "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
           "${LOCALAPPDATA:+$(cygpath -u "$LOCALAPPDATA" 2>/dev/null)/Google/Chrome/Application/chrome.exe}" \
           /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser; do
    [ -n "$c" ] && [ -x "$c" ] && { CHROME="$c"; break; }
  done
fi
if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then
  echo "⚠️ check-mermaid: Chrome을 찾지 못해 Mermaid 검사를 건너뜁니다 (MERMAID_CHROME로 경로 지정 가능)" >&2
  exit 0
fi

if [ "$1" = "--all" ]; then
  files=$(grep -rl --include='*.md' '```mermaid' . | grep -v '/node_modules/' | sort)
else
  f=$(json_field tool_input.file_path)
  [ -n "$f" ] && [ -f "$f" ] && grep -q '```mermaid' "$f" || exit 0
  files="$f"
fi
[ -n "$files" ] || exit 0

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
# Windows(Git Bash)면 node가 읽는 경로(C:/…)로 — /c/… 그대로는 '브라우저를 못 찾음'이었다
command -v cygpath >/dev/null 2>&1 && CHROME=$(cygpath -m "$CHROME")
printf '{"executablePath":"%s","args":["--no-sandbox"]}' "$CHROME" > "$tmp/pptr.json"
failed=0
while IFS= read -r f; do
  out=$(PUPPETEER_SKIP_DOWNLOAD=1 npx -y -p @mermaid-js/mermaid-cli@12.0.0 -p puppeteer@25 \
        mmdc -q -p "$tmp/pptr.json" -i "$f" -o "$tmp/out.md" -a "$tmp" 2>&1)
  if [ $? -ne 0 ]; then
    failed=1
    echo "🚫 Mermaid 그리기 실패: $f" >&2
    echo "$out" | grep -vE '^\s*at ' | head -8 >&2
  fi
done <<< "$files"
[ $failed -eq 0 ] || exit 2
exit 0
