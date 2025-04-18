from .schemas import UserSession
import redis
import json
import re
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Administrator
from .config import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_SESSION_EXPIRE
import os


class AuthService:
    # 使用配置文件创建Redis连接
    # 这个初始实例将在应用启动时被InitService替换为使用config中配置的实例
    redis_client = redis.Redis(
        host=REDIS_HOST, 
        port=REDIS_PORT, 
        password=REDIS_PASSWORD if REDIS_PASSWORD else None,
        db=REDIS_DB
    )
    
    # Configure logging
    logger = logging.getLogger('auth_service')
    logger.setLevel(logging.INFO)
    os.makedirs('logs', exist_ok=True)
    handler = RotatingFileHandler('logs/auth.log', maxBytes=10485760, backupCount=5)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    @classmethod
    def create_user_session(cls, user_info: dict) -> UserSession:
        role = cls.determine_user_role(user_info['uid'])
        access_token = f"session_{user_info['id']}"
        
        # Check administrator status
        admin_type = None
        admin_college_id = None
        admin_college_name = None
        with SessionLocal() as db:
            admin = db.query(Administrator).filter(Administrator.stuff_id == user_info['username']).first()
            if admin:
                admin_type = admin.admin_type
                admin_college_id = admin.college_id
                admin_college_name = admin.college_name
        session = UserSession(
            staff_id=str(user_info['uid']),
            username=user_info['userName'],
            access_token=access_token,
            role=role,
            admin_type=admin_type,
            admin_college_id=admin_college_id,
            admin_college_name=admin_college_name,
        )
        # 使用配置文件中的过期时间
        cls.redis_client.set(f'session:{access_token}', json.dumps(session.dict()), ex=REDIS_SESSION_EXPIRE)
        
        # Log successful login
        cls.logger.info(
            f"User logged in - ID: {user_info['uid']}, Username: {user_info['userName']}, "
            f"Role: {role}, Admin Type: {admin_type}, College ID: {admin_college_id}, "
            f"Time: {datetime.now()}"
        )
        return session

    @classmethod
    def get_user_session(cls, token: str) -> UserSession:
        session_data = cls.redis_client.get(f'session:{token}')
        if not session_data:
            cls.logger.warning(f"Failed to retrieve session - Token: {token}, Time: {datetime.now()}")
            raise ValueError("User session not found")
        session = UserSession(**json.loads(session_data))
        cls.logger.info(f"Session retrieved - User: {session.username}, Time: {datetime.now()}")
        return session

    @classmethod
    def is_valid_token(cls, token: str) -> bool:
        # 将Redis exists命令的返回值显式转换为布尔值
        return bool(cls.redis_client.exists(f'session:{token}'))

    @classmethod
    def delete_user_session(cls, token: str):
        session_data = cls.redis_client.get(f'session:{token}')
        if session_data:
            session = UserSession(**json.loads(session_data))
            cls.logger.info(f"User logged out - Username: {session.username}, Time: {datetime.now()}")
        cls.redis_client.delete(f'session:{token}')

    @staticmethod
    def determine_user_role(username: str) -> str:
        if re.match(r'^\d{9}$', username):
            return 'undergraduate'
        elif re.match(r'^S.{8}$', username):
            return 'graduate'
        elif re.match(r'^B.{8}$', username):
            return 'phd'
        elif re.match(r'^\d{8}$', username):
            return 'teacher'
        return 'unknown'
