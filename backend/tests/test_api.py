import io
import json
import unittest
from unittest.mock import patch

from sqlalchemy import select
from werkzeug.security import check_password_hash

from backend.app import create_app
from backend.db_config import migrate_passwords
from backend.models.user_model import Score, User


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True, "SECRET_KEY": "test-only-secret",
                               "DATABASE_URL": "sqlite://", "SESSION_COOKIE_SECURE": False,
                               "GEMINI_API_KEY": None, "GEMINI_MODEL": None})
        self.client = self.app.test_client()

    def tearDown(self):
        self.app.extensions["database_engine"].dispose()

    def post(self, path, body, client=None):
        client = client or self.client
        token = client.get("/api/session").json["csrf_token"]
        return client.post("/api" + path, json=body, headers={"X-CSRF-Token": token})

    def register(self, name="alice", client=None):
        return self.post("/register", {"user_id": name, "password": "example-password", "nickname": name}, client)

    def login(self, name="alice", client=None):
        return self.post("/login", {"user_id": name, "password": "example-password"}, client)

    def test_password_hash_session_and_logout(self):
        self.assertEqual(self.register().status_code, 201)
        with self.app.extensions["database_sessions"]() as db:
            user = db.scalar(select(User))
            self.assertNotEqual(user.password, "example-password")
            self.assertTrue(check_password_hash(user.password, "example-password"))
        self.assertEqual(self.post("/login", {"user_id": "alice", "password": "wrong"}).status_code, 401)
        self.assertEqual(self.login().status_code, 200)
        self.assertTrue(self.client.get("/api/session").json["logged_in"])
        self.post("/logout", {})
        self.assertFalse(self.client.get("/api/session").json["logged_in"])
        self.assertEqual(self.post("/score", {"score": 100, "rules_version": 2}).status_code, 401)

    def test_csrf_and_input_validation(self):
        self.assertEqual(self.client.post("/api/register", json={}).status_code, 403)
        self.assertEqual(self.post("/register", []).status_code, 400)
        self.assertEqual(self.post("/register", {"user_id": "a", "password": "short"}).status_code, 400)
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.register().status_code, 409)
        self.assertEqual(self.post("/login", {"user_id": [], "password": []}).status_code, 400)
        self.assertEqual(self.client.get("/api/missing").status_code, 404)

    def test_score_uses_session_best_time_and_current_rules_only(self):
        self.register(); self.register("bob"); self.login()
        for seconds in [150.75, 170, 140.25]:
            self.assertEqual(self.post("/score", {"user_id": "bob", "score": seconds, "rules_version": 2}).status_code, 200)
        with self.app.extensions["database_sessions"]() as db:
            rows = db.execute(select(User.user_id, Score.seconds).join(Score)).all()
            self.assertEqual(rows, [("alice", 140.25)])
        self.assertEqual(self.client.get("/api/ranking").json, [{"nickname": "alice", "score": 140.25}])
        for invalid in [-1, 0, 301, True, "100", None, float("nan"), float("inf")]:
            self.assertEqual(self.post("/score", {"score": invalid, "rules_version": 2}).status_code, 400)
        self.assertEqual(self.post("/score", {"score": 100, "rules_version": 1}).status_code, 400)

    def test_legacy_password_migration_is_idempotent_and_preserves_score(self):
        with self.app.extensions["database_sessions"].begin() as db:
            db.add(User(user_id="alice", password="example-password", nickname="Alice", score=55))
        self.assertEqual(self.login().status_code, 401)
        self.assertEqual(migrate_passwords(self.app), 1)
        self.assertEqual(migrate_passwords(self.app), 0)
        self.assertEqual(self.login().status_code, 200)
        with self.app.extensions["database_sessions"]() as db:
            self.assertEqual(db.scalar(select(User.score)), 55)
        self.assertEqual(self.client.get("/api/ranking").json, [])

    def test_ranking_limits_to_ten_in_ascending_order(self):
        with self.app.extensions["database_sessions"].begin() as db:
            for i in range(12):
                user = User(user_id=f"user{i}", password="unused", nickname=f"Nick{i}")
                db.add(user); db.flush()
                db.add(Score(user_id=user.id, rules_version=2, seconds=150-i))
        rows = self.client.get("/api/ranking").json
        self.assertEqual(len(rows), 10)
        self.assertEqual([r["score"] for r in rows], list(range(139, 149)))

    def test_chat_auth_validation_and_missing_configuration(self):
        self.assertEqual(self.post("/chat", {"message": "안녕"}).status_code, 401)
        self.register(); self.login()
        for payload in [{"message": ""}, {"message": "x"*501}, {"message": "안녕", "history": {}},
                        {"message": "안녕", "history": [{"role": "model", "content": "x"}]}]:
            self.assertEqual(self.post("/chat", payload).status_code, 400)
        self.assertEqual(self.post("/chat", {"message": "안녕"}).status_code, 503)

    @patch("backend.routes.chat_routes.urllib.request.urlopen")
    def test_chat_validates_provider_output_and_hides_failures(self, urlopen):
        self.register(); self.login()
        self.app.config.update(GEMINI_API_KEY="test-key", GEMINI_MODEL="configured-test-model")
        def reply(value):
            return io.BytesIO(json.dumps({"candidates": [{"content": {"parts": [{"text": json.dumps(value)}]}}]}).encode())
        urlopen.return_value = reply({"response": "감사합니다", "moodChange": 999})
        self.assertEqual(self.post("/chat", {"message": "안녕"}).json["moodChange"], 10)
        urlopen.return_value = reply({"response": "감사합니다", "moodChange": "bad"})
        self.assertEqual(self.post("/chat", {"message": "안녕"}).status_code, 502)
        urlopen.side_effect = TimeoutError("private provider details")
        response = self.post("/chat", {"message": "안녕"})
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("private", response.get_data(as_text=True))


if __name__ == "__main__":
    unittest.main()
