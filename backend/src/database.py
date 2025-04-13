from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database configuration
DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/vote_v3?charset=utf8mb4"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create all tables
def init_db():
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    # 导入InitService，在函数内部导入避免循环导入
    from .models import InitService
    
    # 初始化默认数据
    db = SessionLocal()
    try:
        InitService.init_all(db)
    finally:
        db.close()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()