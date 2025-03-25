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
import os

class AuthService:
    redis_client = redis.Redis(host='localhost', port=6379, db=0)
    
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
        access_token = f"session_{user_info['uid']}"
        
        # Check administrator status
        admin_type = None
        admin_college_id = None
        
        with SessionLocal() as db:
            admin = db.query(Administrator).filter(Administrator.stuff_id == user_info['username']).first()
            if admin:
                admin_type = admin.admin_type
                admin_college_id = admin.admin_college_id
        
        session = UserSession(
            staff_id=str(user_info['uid']),
            username=user_info['userName'],
            access_token=access_token,
            role=role,
            admin_type=admin_type,
            admin_college_id=admin_college_id
        )
        cls.redis_client.set(f'session:{access_token}', json.dumps(session.dict()), ex=3600)
        
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
        elif re.match(r'^\d{7}$', username):
            return 'teacher'
        return 'unknown'
