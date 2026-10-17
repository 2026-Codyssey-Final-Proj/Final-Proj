#!/usr/bin/env bash
# *.md 안의 ```mermaid 블록을 실제로 그려 보고, 그려지지 않으면(문법 오류) 막는다.
# - PostToolUse 훅: stdin JSON의 tool_input.file_path 한 파일만 검사
# - 직접 실행 / verify 에이전트: `bash .claude/hooks/check-mermaid.sh --all` 로 저장소 전체 검사
# 렌더러는 @mermaid-js/mermaid-cli(npx 캐시, 버전 고정)이고, Chrome은 이미 설치된 것을 쓴다
# (PUPPETEER_SKIP_DOWNLOAD). 문법만 확인한다 — 순서가 뒤집히는 등 배치 문제는 사람이 그림을
# 보고 확인해야 한다(01-docs/04-pattern-implementation/03-diagramming-guide.md "도구 환경").
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0

CHROME="${MERMAID_CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
if [ ! -x "$CHROME" ]; then
  echo "⚠️ check-mermaid: Chrome을 찾지 못해 Mermaid 검사를 건너뜁니다 (MERMAID_CHROME로 경로 지정 가능)" >&2
  exit 0
fi

if [ "$1" = "--all" ]; then
  files=$(grep -rl --include='*.md' '```mermaid' . | grep -v '/node_modules/' | sort)
else
  f=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)
  [ -n "$f" ] && [ -f "$f" ] && grep -q '```mermaid' "$f" || exit 0
  files="$f"
fi
[ -n "$files" ] || exit 0

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
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
