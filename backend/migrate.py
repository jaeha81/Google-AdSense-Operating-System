"""
기존 DB에 새 컬럼 추가. 신규 설치라면 main.py 실행 시 자동 생성됩니다.
실행: python migrate.py
"""
import sqlite3

conn = sqlite3.connect("adsense_os.db")
cur = conn.cursor()

migrations = [
    "ALTER TABLE keywords ADD COLUMN intent_type TEXT DEFAULT 'info'",
    "ALTER TABLE keywords ADD COLUMN age_group TEXT DEFAULT 'all'",
    "ALTER TABLE keywords ADD COLUMN quadrant_x REAL DEFAULT 0.5",
    "ALTER TABLE keywords ADD COLUMN quadrant_y REAL DEFAULT 0.5",
    "ALTER TABLE sites ADD COLUMN daily_visitors INTEGER DEFAULT 0",
    "ALTER TABLE sites ADD COLUMN ctr REAL DEFAULT 0.0",
    "ALTER TABLE sites ADD COLUMN rpm REAL DEFAULT 0.0",
    "ALTER TABLE sites ADD COLUMN avg_cpc REAL DEFAULT 0.0",
    "ALTER TABLE sites ADD COLUMN risk_score INTEGER DEFAULT 100",
    "ALTER TABLE sites ADD COLUMN account_type TEXT DEFAULT 'mixed'",
    "ALTER TABLE revenue ADD COLUMN adsense_usd REAL DEFAULT 0.0",
    "ALTER TABLE revenue ADD COLUMN adpost_krw REAL DEFAULT 0.0",
    "ALTER TABLE revenue ADD COLUMN shopping_krw REAL DEFAULT 0.0",
    "ALTER TABLE revenue ADD COLUMN coupang_krw REAL DEFAULT 0.0",
]

for sql in migrations:
    try:
        cur.execute(sql)
        print(f"OK  : {sql[:70]}")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print(f"SKIP: {sql[:70]}")
        else:
            print(f"ERR : {e}")

conn.commit()
conn.close()
print("\nMigration complete.")
