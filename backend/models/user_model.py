from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    nickname = Column(String(50))
    score = Column(Integer, default=0)
