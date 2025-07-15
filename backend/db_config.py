# backend/db_config.py

# SQLAlchemy에서 DB 연결 도구를 불러옴
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 아래는 MySQL에 연결하기 위한 주소 (URL)
# 'root' → MySQL 기본 계정
# 'localhost' → 내 컴퓨터
# 'escape_db' → 방금 네가 만든 DB 이름
# DB_URL = "mysql+pymysql://root@localhost/escape_db"
DB_URL = "mysql+pymysql://root:1234@localhost/escape_db"


# SQLAlchemy의 'engine'은 MySQL과의 연결을 실제로 만들어주는 역할을 함
engine = create_engine(DB_URL)

# 이 세션을 이용하면 DB에 데이터를 추가하거나 가져올 수 있음!
SessionLocal = sessionmaker(bind=engine)
