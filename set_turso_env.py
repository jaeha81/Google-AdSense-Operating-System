"""Turso DB 환경변수를 Vercel backend에 설정하는 스크립트.
Usage:
  python set_turso_env.py --url libsql://... --token eyJ...
  또는 python set_turso_env.py (대화형 입력)
"""
import subprocess, sys, shutil, argparse

BACKEND_CWD = r"D:\ai프로젝트\Google-AdSense-Operating-System\backend"


def set_one(vercel: str, name: str, value: str) -> bool:
    # 기존 삭제 (없으면 무시)
    subprocess.run(
        [vercel, "env", "rm", name, "production", "--yes", "--cwd", BACKEND_CWD],
        capture_output=True, timeout=30,
    )
    proc = subprocess.run(
        [vercel, "env", "add", name, "production", "--cwd", BACKEND_CWD],
        input=value.encode("ascii"),
        capture_output=True, timeout=30,
    )
    out = proc.stdout.decode("utf-8", errors="replace") + proc.stderr.decode("utf-8", errors="replace")
    if "Added Environment Variable" in out:
        print(f"SUCCESS: {name} set in Vercel production")
        return True
    else:
        print(f"FAILED ({name}):", out)
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="")
    parser.add_argument("--token", default="")
    args = parser.parse_args()

    turso_url = args.url.strip() or input("TURSO_URL (libsql://...): ").strip()
    turso_token = args.token.strip() or input("TURSO_AUTH_TOKEN: ").strip()

    if not turso_url.startswith("libsql://"):
        print(f"ERROR: TURSO_URL must start with libsql://, got: {turso_url[:30]}")
        sys.exit(1)
    if not turso_token:
        print("ERROR: TURSO_AUTH_TOKEN is empty")
        sys.exit(1)

    vercel = shutil.which("vercel")
    if not vercel:
        print("ERROR: vercel CLI not found")
        sys.exit(1)

    ok1 = set_one(vercel, "TURSO_URL", turso_url)
    ok2 = set_one(vercel, "TURSO_AUTH_TOKEN", turso_token)

    if ok1 and ok2:
        print("\nAll env vars set. Now run:")
        print("  cd backend && vercel --prod --yes")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
