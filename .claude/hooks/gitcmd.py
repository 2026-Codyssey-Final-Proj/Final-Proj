# 훅 공용 도우미 — 셸 명령 한 줄을 git · gh 호출 목록으로 푼다(block-claude-main · block-dangerous-git · block-merged-branch-push ·
# check-secrets · require-tests-before-commit이 같이 쓴다). claude-drafted: 2026-10-30 (고칠 목록 F-105)
# 전에는 훅마다 글자로 봐서 `env git push origin main` · `bash -c "git push origin main"` · `gh -R o/r pr merge` ·
# `git -C . push --force` · `git -c k=v commit` · `git push origin x --force` 같은 꼴이 빠져나갔다.
#
# calls(cmd) → [{"tool": "git"|"gh", "sub": "push" | "pr merge" …, "args": [...], "cwd": -C 폴더 또는 None}]
#   - 따옴표를 지키며 낱말로 나눈 뒤(shlex) ; && || | & 줄바꿈에서 조각을 나눈다 — 따옴표 · heredoc 안의 글은 명령이 아니다
#     (`git commit -m "a; git reset --hard b"`를 reset으로 보던 것, 새 맥락 리뷰). 리다이렉션(> 2>&1 …)은 그 대상과 함께 뺀다
#   - 조각 앞의 ( { ! if then do else · 환경 대입(FOO=1) · env · sudo · command · exec · nohup · time · timeout · nice를 건너뛴다(그 옵션 값까지)
#   - bash · sh · zsh의 -c 글은 그 안을 다시 푼다(세 겹까지)
#   - git은 전역 옵션(-C 폴더 · -c k=v · --git-dir …)을 건너뛰고 -C 폴더를 cwd로 — $PWD · ~는 풀고, 풀 수 없거나($(…) · `…`) 없는 폴더면 None(훅이 도는 폴더)
#   - gh는 옵션(-R/--repo 값 포함)을 건너뛴 앞 두 낱말을 sub로("pr merge")
#   eval · $(…) 안 · xargs · git 별칭 · gh api처럼 일부러 숨기는 꼴은 글자로 막을 수 없어 다루지 않는다
import os
import re
import shlex

WRAP = {"env", "sudo", "command", "exec", "nohup", "time", "timeout", "nice"}
WRAP_VALUE = {"env": {"-u", "--unset", "-C", "--chdir", "-S"}, "sudo": {"-u", "-g", "-h", "-p", "-C", "-U"}, "nice": {"-n"},
              "timeout": {"-s", "--signal", "-k", "--kill-after"}}
LEAD = {"!", "if", "then", "do", "else", "elif", "while", "until", "{", "}"}
SHELLS = {"bash", "sh", "zsh", "dash"}
GIT_VALUE = {"-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"}
GH_VALUE = {"-R", "--repo", "--hostname"}
SEP = {";", ";;", "&&", "||", "|", "|&", "&", "\n"}


def _base(t):
    b = t.replace("\\", "/").rsplit("/", 1)[-1].lower()
    return b[:-4] if b.endswith(".exe") else b


def _strip_heredocs(text):
    """heredoc의 본문 줄(<<EOF … EOF)을 뺀다 — 그 안의 글은 명령이 아니다"""
    out, delim = [], None
    for line in text.split("\n"):
        if delim is not None:
            if line.strip() == delim:
                delim = None
            continue
        out.append(line)
        m = re.search(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1", line)
        if m:
            delim = m.group(2)
    return "\n".join(out)


def _segments(cmd):
    text = _strip_heredocs(str(cmd or ""))
    try:
        lex = shlex.shlex(text, posix=True, punctuation_chars=";<>|&\n")
        lex.whitespace = " \t\r"
        lex.whitespace_split = True
        toks = list(lex)
    except ValueError:   # 따옴표가 안 닫힘 — 전처럼 글자로 나눈다(막는 쪽)
        return [seg.split() for seg in re.split(r"&&|\|\||;|\||&|\n", text)]
    segs, cur, skip = [], [], False
    for t in toks:
        if skip:
            skip = False
            continue
        if t in SEP:
            segs.append(cur)
            cur = []
        elif t and set(t) <= set("<>&|") and ("<" in t or ">" in t):   # 리다이렉션 — 앞의 fd 숫자와 대상 낱말을 뺀다
            if cur and cur[-1].isdigit():
                cur.pop()
            skip = True
        else:
            cur.append(t)
    segs.append(cur)
    return segs


def _dir(p):
    """-C 폴더 — $PWD · ~를 풀고, 풀 수 없거나 없는 폴더면 None(훅이 도는 폴더를 본다 — 막는 쪽)"""
    if not p or "$(" in p or "`" in p:
        return None
    q = os.path.expanduser(os.path.expandvars(p))
    return q if os.path.isdir(q) else None


def calls(cmd, depth=0):
    out = []
    for toks in _segments(cmd):
        toks = [t if "$(" in t else (t.rstrip(")") or t) for t in toks]   # (git reset --hard) — 닫는 괄호가 끝 낱말에 붙는다
        while toks:
            toks[0] = toks[0].lstrip("(") or toks[0]
            if toks[0] in LEAD or toks[0] == "(":
                toks.pop(0)
                continue
            if re.match(r"^\w+=", toks[0]):
                toks.pop(0)
                continue
            w = _base(toks[0])
            if w in WRAP:
                toks.pop(0)
                while toks and toks[0].startswith("-"):
                    opt = toks.pop(0)
                    if opt in WRAP_VALUE.get(w, ()) and toks:
                        toks.pop(0)
                if w == "timeout" and toks and re.match(r"^\d", toks[0]):
                    toks.pop(0)   # 시간
                continue
            break
        if not toks:
            continue
        base = _base(toks[0])
        if base in SHELLS:
            for i, t in enumerate(toks[1:], 1):
                if re.match(r"^-[a-z]*c[a-z]*$", t) and i + 1 < len(toks):
                    if depth < 3:
                        out += calls(toks[i + 1], depth + 1)
                    break
            continue
        if base == "git":
            i, cwd = 1, None
            while i < len(toks) and toks[i].startswith("-"):
                if toks[i] in GIT_VALUE:
                    if toks[i] == "-C" and i + 1 < len(toks):
                        cwd = _dir(toks[i + 1])
                    i += 2
                else:
                    i += 1
            sub = toks[i] if i < len(toks) else ""
            out.append({"tool": "git", "sub": sub, "args": toks[i + 1:], "cwd": cwd})
        elif base == "gh":
            words, i = [], 1
            while i < len(toks):
                t = toks[i]
                if t in GH_VALUE:
                    i += 2
                    continue
                if not t.startswith("-"):
                    words.append(t)
                i += 1
            out.append({"tool": "gh", "sub": " ".join(words[:2]), "args": toks[1:], "cwd": None})
    return out


def push_force(args):
    """git push의 인자에 강제 푸시가 있나 — --force · --force-with-lease · --force-if-includes · -f · -uf 같은 묶은 짧은 옵션 · +refspec"""
    for a in args:
        if a in ("--force", "-f") or a.startswith(("--force-with-lease", "--force-if-includes")):
            return True
        if re.match(r"^-[A-Za-z]*f[A-Za-z]*$", a) and not a.startswith("--"):
            return True
        if a.startswith("+") and len(a) > 1:
            return True
    return False


def has_short(args, letter, long_name):
    """짧은 옵션 묶음(-fd)이나 긴 이름(--force)에 그 옵션이 있나"""
    return any(a == long_name or (re.match(r"^-[A-Za-z]+$", a) and letter in a[1:]) for a in args)


PUSH_VALUE = {"-o", "--push-option", "--repo", "--receive-pack", "--exec"}


def _positional(args):
    """git push의 위치 인자(원격 · refspec) — 값을 받는 옵션(-o x)의 값은 빼고(값을 원격으로 세던 것, 새 맥락 리뷰)"""
    out, skip = [], False
    for t in args:
        if skip:
            skip = False
        elif t in PUSH_VALUE:
            skip = True
        elif not t.startswith("-"):
            out.append(t)
    return out


def current_branch(cwd=None):
    import subprocess
    try:
        return subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=cwd or None,
                                       stderr=subprocess.DEVNULL, text=True).strip()
    except Exception:
        return ""


PROTECTED = {"main", "master"}


def main_guard(cmd):
    """Claude가 main에 올리는 명령이면 까닭, 아니면 "" (block-claude-main.sh)"""
    for c in calls(cmd):
        if c["tool"] == "gh":
            if c["sub"] == "pr merge":
                return "gh pr merge는 main으로 병합합니다."
            continue
        sub, rest, cwd = c["sub"], c["args"], c["cwd"]
        if sub == "push":
            args = _positional(rest)
            if any(t in ("--all", "--mirror") for t in rest):
                return "git push --all/--mirror는 main을 포함합니다."
            refspecs = args[1:]            # 첫 위치 인자는 원격 이름
            if not refspecs and current_branch(cwd) in PROTECTED:
                return "현재 브랜치가 main인 채로 git push 합니다."
            for r in refspecs:
                dst = r.lstrip("+").split(":")[-1]
                dst = dst[len("refs/heads/"):] if dst.startswith("refs/heads/") else dst
                if dst == "HEAD":
                    dst = current_branch(cwd)
                if dst in PROTECTED:
                    return f"git push의 대상이 {dst} 입니다."
        elif sub == "commit" and current_branch(cwd) in PROTECTED:
            return "main 브랜치 위에서 커밋합니다."
    return ""


def danger(cmd):
    """강제 푸시 · reset --hard · clean -f면 까닭, 아니면 "" (block-dangerous-git.sh)"""
    for c in calls(cmd):
        if c["tool"] != "git":
            continue
        if c["sub"] == "push" and push_force(c["args"]):
            return "git push --force(강제 푸시)"
        if c["sub"] == "reset" and "--hard" in c["args"]:
            return "git reset --hard"
        if c["sub"] == "clean" and has_short(c["args"], "f", "--force"):
            return "git clean -f"
    return ""


def commit_dir(cmd):
    """커밋 명령이 있으면 그 폴더(-C 없으면 "."), 없으면 "" (check-secrets.sh · require-tests-before-commit.sh)"""
    for c in calls(cmd):
        if c["tool"] == "git" and c["sub"] == "commit":
            return c["cwd"] or "."
    return ""


def push_target(cmd):
    """git push가 올리는 브랜치(없으면 HEAD), 지우는 푸시 · 없으면 "" (block-merged-branch-push.sh)"""
    for c in calls(cmd):
        if c["tool"] == "git" and c["sub"] == "push":
            a = _positional(c["args"])
            if any(t in ("--delete", "-d") for t in c["args"]) or any(t.startswith(":") for t in a[1:]):
                continue
            dst = a[1].lstrip("+").split(":")[-1] if len(a) > 1 else "HEAD"
            return dst[len("refs/heads/"):] if dst.startswith("refs/heads/") else dst
    return ""


if __name__ == "__main__":
    import sys
    MODES = {"main": main_guard, "danger": danger, "commit-dir": commit_dir, "push-target": push_target}
    out = MODES[sys.argv[1]](sys.argv[2] if len(sys.argv) > 2 else "")
    if out:
        print(out)
