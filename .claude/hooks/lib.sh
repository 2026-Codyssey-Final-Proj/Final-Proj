# 훅 공용 도우미 — 각 훅이 `. "$(dirname "$0")/lib.sh"`로 불러 쓴다.
# jq·python3가 없는 컴퓨터(Windows: jq 없음, python3는 스토어 설치 안내 껍데기)에서도 훅이 돌게 한다 (2026-10-17).
# 그 전에는 두 도구가 없으면 훅이 명령을 못 읽고 조용히 통과했다 — main 푸시·비밀값 커밋을 막지 못했다.

# json_field <a.b.c>: stdin JSON에서 값 하나를 꺼낸다(문자열이 아니면 JSON으로). jq → node → 파이썬 순서.
#   셋 다 없으면 원문(JSON 그대로)을 낸다 — 빈 값을 내면 막는 훅이 명령을 못 읽고 조용히 통과했다(main 막기가 열림, 고칠 목록 F-105-8). 원문이면 글자로라도 본다
json_field() {
  if command -v jq >/dev/null 2>&1; then
    jq -r ".$1 // empty" 2>/dev/null
  elif command -v node >/dev/null 2>&1; then
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{let v=JSON.parse(s);for(const k of process.argv[1].split("."))v=v==null?v:v[k];if(v!=null)process.stdout.write(typeof v==="string"?v:JSON.stringify(v))}catch{}})' "$1" 2>/dev/null
  elif [ -n "$PY" ]; then
    "$PY" -X utf8 -c 'import json, sys
try:
    v = json.load(sys.stdin)
    for k in sys.argv[1].split("."):
        v = v.get(k) if isinstance(v, dict) else None
    if v is not None:
        sys.stdout.write(v if isinstance(v, str) else json.dumps(v, ensure_ascii=False))
except Exception:
    pass' "$1" 2>/dev/null
  else
    cat
  fi
}

# gitcmd <main|danger|commit-dir|push-target> "<명령>": 명령을 git · gh 호출로 풀어 판정한다(gitcmd.py, 고칠 목록 F-105). 파이썬이 없으면 3
gitcmd() {
  [ -n "$PY" ] || return 3
  "$PY" -X utf8 -I "$(dirname "${BASH_SOURCE[0]}")/gitcmd.py" "$@" 2>/dev/null
}

# PY: 실제로 도는 파이썬 명령. 없으면 빈 값 — 쓰는 훅이 막을지 지나갈지 정한다.
PY=""
for _c in python3 python; do
  if "$_c" -c "" >/dev/null 2>&1; then PY="$_c"; break; fi
done

# Windows 파이썬은 출력을 cp949로 내보내 한글 안내·이모지가 깨진다 — 훅이 부르는 파이썬은 UTF-8로
export PYTHONIOENCODING=utf-8
