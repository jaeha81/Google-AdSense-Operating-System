"""Neon DB URL을 Vercel backend에 설정하는 스크립트.
Usage: python set_database_url.py <DATABASE_URL>
또는: stdin으로 URL 입력
"""
import subprocess, sys, shutil

BACKEND_CWD = r"D:\ai프로젝트\Google-AdSense-Operating-System\backend"


def set_env(db_url: str) -> None:
    db_url = db_url.strip()
    # postgres:// → postgresql:// 자동 변환
    if db_url.startswith("postgres://"):
        db_url = "postgresql://" + db_url[len("postgres://"):]

    if not db_url.startswith("postgresql://"):
        print(f"ERROR: Invalid URL format. Expected postgresql:// got: {db_url[:20]}...")
        sys.exit(1)

    print(f"DB URL: postgresql://...{db_url[-20:]}")

    vercel = shutil.which("vercel")
    if not vercel:
        print("ERROR: vercel CLI not found")
        sys.exit(1)

    # 기존 삭제 (없으면 무시)
    subprocess.run(
        [vercel, "env", "rm", "DATABASE_URL", "production", "--yes", "--cwd", BACKEND_CWD],
        capture_output=True, timeout=30,
    )

    # 설정 (BOM/newline 없이 ASCII bytes)
    proc = subprocess.run(
        [vercel, "env", "add", "DATABASE_URL", "production", "--cwd", BACKEND_CWD],
        input=db_url.encode("utf-8"),
        capture_output=True, timeout=30,
    )
    out = proc.stdout.decode("utf-8", errors="replace") + proc.stderr.decode("utf-8", errors="replace")
    if "Added Environment Variable" in out:
        print("SUCCESS: DATABASE_URL set in Vercel production")
    else:
        print("FAILED:", out)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        db_url = " ".join(sys.argv[1:])
    else:
        db_url = sys.stdin.read().strip()
    set_env(db_url)
