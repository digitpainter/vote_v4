from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from fastapi import Request

from ..models import AdminLog, AdminActionType
from .schemas import AdminLogCreate

class AdminLogService:
    @staticmethod
    def create_log(db: Session, log_data: AdminLogCreate) -> AdminLog:
        """
        创建管理员操作日志
        """
        db_log = AdminLog(
            admin_id=log_data.admin_id,
            admin_name=log_data.admin_name,
            admin_type=log_data.admin_type,
            action_type=log_data.action_type,
            resource_type=log_data.resource_type,
            resource_id=log_data.resource_id,
            description=log_data.description,
            ip_address=log_data.ip_address,
            user_agent=log_data.user_agent
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    def get_logs(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        admin_id: Optional[str] = None,
        action_type: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[AdminLog]:
        """
        获取管理员操作日志列表，支持多种过滤条件
        """
        query = db.query(AdminLog)
        
        # 应用过滤条件
        if admin_id:
            query = query.filter(AdminLog.admin_id == admin_id)
        if action_type:
            query = query.filter(AdminLog.action_type == action_type)
        if resource_type:
            query = query.filter(AdminLog.resource_type == resource_type)
        if start_date:
            query = query.filter(AdminLog.created_at >= start_date)
        if end_date:
            query = query.filter(AdminLog.created_at <= end_date)
            
        return query.order_by(AdminLog.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def log_admin_action(
        db: Session,
        request: Request,
        user_session,
        action_type: AdminActionType,
        resource_type: str,
        resource_id: Optional[str] = None,
        description: str = ""
    ) -> AdminLog:
        """
        便捷方法，用于记录管理员操作
        从请求和用户会话中自动提取相关信息
        """
        # 从请求中获取IP地址和用户代理
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # 创建日志数据
        log_data = AdminLogCreate(
            admin_id=user_session.staff_id,
            admin_name=user_session.username,
            admin_type=user_session.admin_type if user_session.admin_type else "none",
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return AdminLogService.create_log(db, log_data) 