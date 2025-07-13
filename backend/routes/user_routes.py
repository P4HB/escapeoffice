# backend/routes/user_routes.py

# Flask에서 API를 만들기 위한 도구들 불러오기
from flask import Blueprint, request, jsonify

# 우리가 만든 User 테이블 구조와 DB 연결 세션 불러오기
from models.user_model import User
from db_config import SessionLocal

from flask_cors import cross_origin  # 🔥 이거 파일 맨 위에 추가해줘!


# Blueprint: 여러 API들을 하나로 묶는 Flask 기능
user_bp = Blueprint('user', __name__)

# 🔸 [POST] 점수 저장 API
@user_bp.route('/score', methods=['POST'])
def submit_score():
    data = request.get_json()  # 프론트에서 보낸 JSON 데이터 받기
    user_id = data.get('user_id')  # 로그인한 사용자 ID
    score = data.get('score')      # 게임 끝나고 얻은 점수

    db = SessionLocal()  # DB 연결 세션 만들기

    # 이미 user_id가 존재하는지 확인
    user = db.query(User).filter_by(user_id=user_id).first()

    if user:
        user.score = score  # 기존 사용자면 점수 업데이트
    else:
        user = User(user_id=user_id, score=score)  # 없으면 새로 생성
        db.add(user)  # DB에 추가

    db.commit()  # 저장
    return jsonify({'message': 'Score recorded'})  # 응답 메시지

# 🔸 [GET] 전체 사용자 랭킹 조회 API
@user_bp.route('/ranking', methods=['GET'])
def get_ranking():
    db = SessionLocal()  # DB 연결
    users = db.query(User).order_by(User.score.desc()).all()  # 점수 높은 순 정렬

    # JSON 형태로 랭킹 리스트 만들기
    ranking = [{'user_id': u.user_id, 'score': u.score} for u in users]
    return jsonify(ranking)  # 프론트로 랭킹 전송


# 기존 코드들과 함께...

# 🔹 로그인 API 추가
@user_bp.route('/login', methods=['POST'])  # ✅ OPTIONS 추가!
# @cross_origin(origin='http://127.0.0.1:5173', supports_credentials=True)  # ✅ CORS 허용!
def login_user():


    data = request.get_json()
    user_id = data.get('user_id')
    password = data.get('password')

    db = SessionLocal()
    user = db.query(User).filter_by(user_id=user_id).first()

    if user and user.password == password:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'ID 또는 비밀번호가 일치하지 않습니다'}), 401



# 🔹 회원가입 API 추가
@user_bp.route('/register', methods=['POST'])  # ← 여기 핵심!
def register_user():
    data = request.get_json()
    user_id = data.get('user_id')
    password = data.get('password')
    nickname = data.get('nickname')

    db = SessionLocal()

    # user_id 중복 검사
    existing_user = db.query(User).filter_by(user_id=user_id).first()
    if existing_user:
        return jsonify({'error': '이미 존재하는 아이디입니다'}), 400

    # 새 유저 생성
    new_user = User(user_id=user_id, password=password, nickname=nickname, score=0)
    db.add(new_user)
    db.commit()

    return jsonify({'message': '회원가입 성공!'})



