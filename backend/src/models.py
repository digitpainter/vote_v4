from sqlalchemy import ForeignKey, DateTime, Integer, String, Column, UniqueConstraint, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from .database import Base
from enum import Enum
from sqlalchemy.orm import Session

class VoteActivity(Base):
    __tablename__ = "vote_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, server_default='0')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    max_votes: Mapped[int] = mapped_column(Integer, default=12)
    min_votes: Mapped[int] = mapped_column(Integer, default=1)
    associations: Mapped[list["ActivityCandidateAssociation"]] = relationship(
        back_populates="activity",
        cascade='all, delete-orphan',
        passive_deletes=True
    )

    @classmethod
    def deactivate_others(cls, db, exclude_id=None):
        """Deactivates all other active activities except current one"""
        query = db.query(cls).filter(cls.is_active == True)
        if exclude_id is not None:
            query = query.filter(cls.id != exclude_id)
        query.update({'is_active': False})
        db.flush()

class ActivityCandidateAssociation(Base):
    __tablename__ = "activity_candidate_association"

    activity_id: Mapped[int] = mapped_column(ForeignKey("vote_activities.id", ondelete='CASCADE'), primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id", ondelete='CASCADE'), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    activity: Mapped["VoteActivity"] = relationship(back_populates="associations")
    candidate: Mapped["Candidate"] = relationship(back_populates="associations")



class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50))
    college_id: Mapped[str] = mapped_column(String(50))
    photo: Mapped[str] = mapped_column(String(200), server_default='https://via.placeholder.com/150')
    bio: Mapped[str] = mapped_column(Text)
    quote: Mapped[str] = mapped_column(Text, nullable=True)
    review: Mapped[str] = mapped_column(Text, nullable=True)
    college_name: Mapped[str] = mapped_column(String(100))
    video_url: Mapped[str] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    votes: Mapped["Vote"] = relationship("Vote", back_populates="candidate")
    associations: Mapped[list["ActivityCandidateAssociation"]] = relationship(
        back_populates="candidate"
    )

class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    activity_id: Mapped[int] = mapped_column(ForeignKey("vote_activities.id"), nullable=False)
    voter_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="votes")
    __table_args__ = (
        UniqueConstraint('activity_id', 'candidate_id', 'voter_id', name='uq_vote_record'),
    )


class AdminType(str, Enum):
    SCHOOL = "school"
    COLLEGE = "college"

class Administrator(Base):
    __tablename__ = "administrators"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    stuff_id: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(50))
    admin_type: Mapped[AdminType] = mapped_column(String(10))
    college_id: Mapped[str] = mapped_column(String(50), nullable=True)
    college_name: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('stuff_id', 'admin_type', 'college_id', name='uq_admin'),
    )

class AdminActionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    VIEW = "view"
    EXPORT = "export"
    OTHER = "other"

class AdminLog(Base):
    __tablename__ = "admin_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    admin_id: Mapped[str] = mapped_column(String(50), index=True)  # 管理员工号
    admin_name: Mapped[str] = mapped_column(String(50))  # 管理员姓名
    admin_type: Mapped[str] = mapped_column(String(10))  # 管理员类型
    action_type: Mapped[AdminActionType] = mapped_column(String(20))  # 操作类型
    resource_type: Mapped[str] = mapped_column(String(50))  # 资源类型，如activity，candidate等
    resource_id: Mapped[str] = mapped_column(String(50), nullable=True)  # 资源ID
    description: Mapped[str] = mapped_column(Text)  # 操作描述
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)  # IP地址
    user_agent: Mapped[str] = mapped_column(String(200), nullable=True)  # 用户代理
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class AdminApplication(Base):
    __tablename__ = "admin_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    staff_id: Mapped[str] = mapped_column(String(50), index=True)  # 申请人工号
    username: Mapped[str] = mapped_column(String(100))  # 申请人用户名
    admin_type: Mapped[AdminType] = mapped_column(String(10))  # 申请的管理员类型
    college_id: Mapped[str] = mapped_column(String(50), nullable=True)  # 学院ID（院级管理员必填）
    college_name: Mapped[str] = mapped_column(String(100), nullable=True)  # 学院名称
    reason: Mapped[str] = mapped_column(String(500))  # 申请理由
    status: Mapped[ApplicationStatus] = mapped_column(String(10), default=ApplicationStatus.PENDING)  # 申请状态
    reviewer_id: Mapped[str] = mapped_column(String(50), nullable=True)  # 审核人工号
    review_comment: Mapped[str] = mapped_column(String(500), nullable=True)  # 审核意见
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())

class InitService:
    @staticmethod
    def init_default_admin(db: Session):
        """初始化默认管理员"""
        from sqlalchemy.orm import Session
        from .models import Administrator, AdminType
        
        admin = db.query(Administrator).filter(Administrator.stuff_id == "70206867").first()
        if not admin:
            default_admin = Administrator(
                stuff_id="70206867",
                name="钟佳",
                admin_type=AdminType.SCHOOL
            )
            db.add(default_admin)
            db.commit()
    
    @staticmethod
    def init_redis():
        """初始化Redis连接"""
        import redis
        from .auth.config import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB
        
        try:
            # 使用配置文件中的设置创建Redis连接
            redis_client = redis.Redis(
                host=REDIS_HOST, 
                port=REDIS_PORT, 
                password=REDIS_PASSWORD if REDIS_PASSWORD else None,
                db=REDIS_DB
            )
            
            # 测试连接
            redis_client.ping()
            print(f"Redis连接成功: {REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}")
            
            # 更新AuthService中的redis_client实例
            from .auth.service import AuthService
            AuthService.redis_client = redis_client
            
            return redis_client
        except Exception as e:
            print(f"Redis连接失败: {str(e)}")
            return None
    
    @staticmethod
    def init_all(db: Session):
        """执行所有初始化操作"""
        # 初始化默认管理员
        InitService.init_default_admin(db)
        
        # 初始化Redis
        InitService.init_redis()