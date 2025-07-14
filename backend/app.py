# 📍 백엔드 Flask 서버의 메인 파일

from flask import Flask
from flask_cors import CORS  # ✅ CORS 임포트

# 우리가 만든 DB 테이블 모델과 라우트 등록 코드
from models.user_model import Base
from db_config import engine
from routes.user_routes import user_bp

app = Flask(__name__)

# 🔐 보안 고려한 최소 허용 CORS
CORS(app,
     resources={r"/*": {"origins": ["http://127.0.0.1:5173"]}},
     supports_credentials=True)


# ✅ 서버 실행할 때 DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

# ✅ 유저 관련 API들 등록
app.register_blueprint(user_bp, url_prefix='/api')

@app.route('/')
def home():
    return '✅ 서버 + DB 연결 성공!'


# @app.after_request
# def after_request(response):
#     response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5173')
#     response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
#     response.headers.add('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
#     response.headers.add('Access-Control-Allow-Credentials', 'true')
#     return response


# ✅ 서버 실행: 반드시 host는 'localhost'!
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
