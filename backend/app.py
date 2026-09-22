import os
import secrets
from datetime import timedelta
from pathlib import Path

import click
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request, session
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

from backend.db_config import init_database
from backend.routes.user_routes import user_bp
from backend.routes.chat_routes import chat_bp

load_dotenv(Path(__file__).with_name(".env"))


def create_app(config=None):
    dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    app = Flask(__name__, static_folder=str(dist), static_url_path="")
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("FLASK_SECRET_KEY"),
        DATABASE_URL=os.environ.get("DATABASE_URL", "sqlite:///" + str(Path(__file__).with_name("escapeoffice.db"))),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "true").lower() == "true",
        PERMANENT_SESSION_LIFETIME=timedelta(hours=12),
        MAX_CONTENT_LENGTH=32768,
        GEMINI_API_KEY=os.environ.get("GEMINI_API_KEY"),
        GEMINI_MODEL=os.environ.get("GEMINI_MODEL"),
    )
    if config:
        app.config.update(config)
    if not app.config["SECRET_KEY"]:
        raise RuntimeError("Set FLASK_SECRET_KEY to a random secret before starting the server.")
    init_database(app)
    app.register_blueprint(user_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.before_request
    def protect_writes():
        if request.path.startswith("/api/") and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            expected = session.get("csrf_token", "")
            actual = request.headers.get("X-CSRF-Token", "")
            if not expected or not secrets.compare_digest(expected, actual):
                return jsonify(error="세션이 만료되었습니다. 다시 시도해주세요."), 403
            if not request.is_json:
                return jsonify(error="JSON 요청이 필요합니다."), 415

    @app.teardown_appcontext
    def close_database(_error):
        db = g.pop("db", None)
        if db is not None:
            db.close()

    @app.errorhandler(SQLAlchemyError)
    def database_error(_error):
        if "db" in g:
            g.db.rollback()
        app.logger.error("Database operation failed")
        return jsonify(error="저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."), 500

    @app.errorhandler(HTTPException)
    def http_error(error):
        if request.path.startswith("/api/"):
            return jsonify(error=error.description), error.code
        return error

    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    @app.cli.command("migrate-passwords")
    def migrate_passwords():
        """Widen the legacy password column and hash all plaintext passwords."""
        from backend.db_config import migrate_passwords as migrate
        click.echo(f"Migrated {migrate(app)} legacy password(s).")

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
