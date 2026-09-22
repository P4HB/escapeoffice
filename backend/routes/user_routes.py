import math
import re
import secrets

from flask import Blueprint, jsonify, request, session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from backend.db_config import get_db, is_password_hash
from backend.models.user_model import Score, User

user_bp = Blueprint("user", __name__)
RULES_VERSION = 2


def json_body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def current_user():
    uid = session.get("uid")
    return get_db().get(User, uid) if isinstance(uid, int) else None


def rotate_session(user=None):
    session.clear()
    session["csrf_token"] = secrets.token_urlsafe(32)
    session.permanent = True
    if user:
        session["uid"] = user.id
    return session["csrf_token"]


@user_bp.get("/session")
def get_session():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)
    user = current_user()
    return jsonify(csrf_token=session["csrf_token"], logged_in=user is not None,
                   nickname=user.nickname if user else None)


@user_bp.post("/register")
def register_user():
    data = json_body()
    user_id, password, nickname = (data.get(key) for key in ("user_id", "password", "nickname"))
    if not isinstance(user_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{3,50}", user_id):
        return jsonify(error="아이디는 영문·숫자·밑줄·하이픈 3~50자로 입력해주세요."), 400
    if not isinstance(password, str) or not 8 <= len(password) <= 128:
        return jsonify(error="비밀번호는 8~128자로 입력해주세요."), 400
    if not isinstance(nickname, str) or not 1 <= len(nickname.strip()) <= 50:
        return jsonify(error="닉네임은 1~50자로 입력해주세요."), 400
    db = get_db()
    if db.scalar(select(User).where(User.user_id == user_id)):
        return jsonify(error="이미 존재하는 아이디입니다."), 409
    db.add(User(user_id=user_id, password=generate_password_hash(password), nickname=nickname.strip()))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return jsonify(error="이미 존재하는 아이디입니다."), 409
    return jsonify(message="회원가입 성공!"), 201


@user_bp.post("/login")
def login_user():
    data = json_body()
    user_id, password = data.get("user_id"), data.get("password")
    if not isinstance(user_id, str) or not isinstance(password, str) or len(password) > 128:
        return jsonify(success=False, error="아이디와 비밀번호를 확인해주세요."), 400
    user = get_db().scalar(select(User).where(User.user_id == user_id))
    if not user or not is_password_hash(user.password) or not check_password_hash(user.password, password):
        return jsonify(success=False, error="아이디 또는 비밀번호가 일치하지 않습니다."), 401
    token = rotate_session(user)
    return jsonify(success=True, csrf_token=token)


@user_bp.post("/logout")
def logout_user():
    return jsonify(success=True, csrf_token=rotate_session())


@user_bp.post("/score")
def submit_score():
    user = current_user()
    if user is None:
        return jsonify(error="로그인이 필요합니다."), 401
    data = json_body()
    seconds = data.get("score")
    if (type(seconds) not in (int, float) or not math.isfinite(seconds)
            or not 0 < seconds <= 300 or data.get("rules_version") != RULES_VERSION):
        return jsonify(error="올바른 현재 버전의 클리어 기록이 필요합니다."), 400
    # Identity comes exclusively from the signed session, never the request body.
    db = get_db()
    db.scalar(select(User).where(User.id == user.id).with_for_update())
    score = db.scalar(select(Score).where(Score.user_id == user.id, Score.rules_version == RULES_VERSION))
    if score is None:
        score = Score(user_id=user.id, rules_version=RULES_VERSION, seconds=seconds)
        db.add(score)
    else:
        score.seconds = min(score.seconds, seconds)
    db.commit()
    return jsonify(message="기록을 저장했습니다.", best_score=score.seconds)


@user_bp.get("/ranking")
def get_ranking():
    rows = get_db().execute(select(User.nickname, Score.seconds).join(Score, User.id == Score.user_id)
                           .where(Score.rules_version == RULES_VERSION)
                           .order_by(Score.seconds, Score.id).limit(10))
    return jsonify([{"nickname": nickname or "익명", "score": seconds} for nickname, seconds in rows])
