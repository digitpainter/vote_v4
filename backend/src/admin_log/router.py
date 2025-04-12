from fastapi import APIRouter, HTTPException, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .schemas import AdminLogResponse, AdminActionType
from .service import AdminLogService
from ..auth.constants import AdminType, UserRole
from ..database import get_db
from ..auth.dependencies import check_roles

router = APIRouter()

@router.get("/", response_model=List[AdminLogResponse])
async def list_admin_logs(
    request: Request,
    skip: int = Query(0, description="Skip records"),
    limit: int = Query(100, description="Limit records"),
    admin_id: Optional[str] = Query(None, description="Filter by admin ID"),
    action_type: Optional[AdminActionType] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    db: Session = Depends(get_db),
    user_session = Depends(check_roles(
        allowed_admin_types=[AdminType.school]
    ))
):
    """
    获取管理员操作日志列表，仅限校级管理员访问
    """
    # 记录当前操作
    AdminLogService.log_admin_action(
        db=db,
        request=request,
        user_session=user_session,
        action_type=AdminActionType.VIEW,
        resource_type="admin_logs",
        description="查询管理员操作日志"
    )
    
    logs = AdminLogService.get_logs(
        db=db,
        skip=skip,
        limit=limit,
        admin_id=admin_id,
        action_type=action_type,
        resource_type=resource_type,
        start_date=start_date,
        end_date=end_date
    )
    return logs 