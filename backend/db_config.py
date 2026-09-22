from flask import current_app, g
from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from werkzeug.security import generate_password_hash

from backend.models.user_model import Base, User


def init_database(app):
    url = app.config["DATABASE_URL"]
    options = {"pool_pre_ping": True}
    if url in {"sqlite://", "sqlite:///:memory:"}:
        options.update(poolclass=StaticPool, connect_args={"check_same_thread": False})
    engine = create_engine(url, **options)
    app.extensions["database_engine"] = engine
    app.extensions["database_sessions"] = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)


def get_db():
    if "db" not in g:
        g.db = current_app.extensions["database_sessions"]()
    return g.db


def is_password_hash(value):
    return isinstance(value, str) and value.startswith(("scrypt:", "pbkdf2:")) and value.count("$") == 2


def migrate_passwords(app):
    engine = app.extensions["database_engine"]
    # MySQL does not widen existing columns through create_all.
    if engine.dialect.name == "mysql":
        password_column = next(c for c in inspect(engine).get_columns("users") if c["name"] == "password")
        if (password_column["type"].length or 0) < 255:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users MODIFY password VARCHAR(255) NOT NULL"))
    count = 0
    with app.extensions["database_sessions"].begin() as db:
        for user in db.scalars(select(User)):
            if not is_password_hash(user.password):
                user.password = generate_password_hash(user.password)
                count += 1
    return count
