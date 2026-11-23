
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

database_url = settings.DATABASE_URL
connect_args = {}

if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if database_url.startswith("sqlite:///./"):
        backend_dir = Path(__file__).resolve().parent.parent.parent
        db_path = backend_dir / database_url[len("sqlite:///./"):]
        database_url = f"sqlite:///{db_path}"

engine = create_engine(
    database_url,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    """Provide a database session for one API request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
