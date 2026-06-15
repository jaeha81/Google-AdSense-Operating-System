import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

TURSO_URL = os.environ.get("TURSO_URL", "")
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:////tmp/adsense_os.db")

# Railway/Heroku postgres:// → postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if TURSO_URL and TURSO_AUTH_TOKEN:
    import libsql_experimental as libsql

    def _turso_connect():
        return libsql.connect(database=TURSO_URL, auth_token=TURSO_AUTH_TOKEN)

    engine = create_engine(
        "sqlite+pysqlite:///",
        creator=_turso_connect,
        connect_args={"check_same_thread": False},
    )
else:
    connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
