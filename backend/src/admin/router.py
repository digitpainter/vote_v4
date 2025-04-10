from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from .schemas import AdminCreate, AdminUpdate, AdminResponse
from .service import AdminService
from ..auth.constants import AdminType, UserRole 
from ..database import get_db
from ..auth.dependencies import check_roles

router = APIRouter()

@router.post("/", response_model=AdminResponse)
async def create_administrator(
    admin: AdminCreate, 
    request: Request, 
    db: Session = Depends(get_db), 
    user_session = Depends(check_roles(
        allowed_roles=[UserRole.teacher], 
        allowed_admin_types=[AdminType.school, AdminType.college]
    ))
):
    try:
        # 如果是院级管理员，需要检查学院信息
        if user_session.admin_type == AdminType.college:
            if admin.college_id != user_session.admin_college_id:
                raise HTTPException(
                    status_code=403, 
                    detail="院级管理员只能创建本学院的管理员"
                )
        
        return AdminService.create_admin(db, admin)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{stuff_id}", response_model=AdminResponse)
async def get_administrator(
    stuff_id: str, 
    request: Request, 
    db: Session = Depends(get_db), 
    user_session = Depends(check_roles(
        allowed_admin_types=[AdminType.school, AdminType.college]
    ))
):
    admin = AdminService.get_admin(db, stuff_id)
    if not admin:
        raise HTTPException(status_code=404, detail="管理员不存在")
    
    # 如果是院级管理员，只能查看本学院的管理员
    if user_session.admin_type == AdminType.college and admin.college_id != user_session.admin_college_id:
        raise HTTPException(status_code=403, detail="院级管理员只能查看本学院的管理员")
    
    return admin

@router.get("/", response_model=List[AdminResponse])
async def list_administrators(
    request: Request, 
    db: Session = Depends(get_db), 
    user_session = Depends(check_roles(
        allowed_admin_types=[AdminType.school, AdminType.college]
    ))
):
    admins = AdminService.get_admins(db)
    
    # 如果是院级管理员，只返回本学院的管理员
    if user_session.admin_type == AdminType.college:
        admins = [a for a in admins if a.college_id == user_session.admin_college_id]
    
    return admins

@router.put("/{stuff_id}", response_model=AdminResponse)
async def update_administrator(
    stuff_id: str, 
    admin: AdminUpdate, 
    request: Request, 
    db: Session = Depends(get_db), 
    user_session = Depends(check_roles(
        allowed_roles=[UserRole.teacher], 
        allowed_admin_types=[AdminType.school, AdminType.college]
    ))
):
    try:
        # 获取当前管理员信息
        current_admin = AdminService.get_admin(db, stuff_id)
        if not current_admin:
            raise HTTPException(status_code=404, detail="管理员不存在")
        
        # 如果是院级管理员，需要检查学院信息
        if user_session.admin_type == AdminType.college:
            if current_admin.college_id != user_session.admin_college_id:
                raise HTTPException(status_code=403, detail="院级管理员只能修改本学院的管理员")
            
            # 确保不能修改为其他学院
            if admin.college_id and admin.college_id != user_session.admin_college_id:
                raise HTTPException(status_code=403, detail="院级管理员不能将管理员分配到其他学院")
        
        updated_admin = AdminService.update_admin(db, stuff_id, admin)
        return updated_admin
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{stuff_id}")
async def delete_administrator(
    stuff_id: str, 
    request: Request, 
    db: Session = Depends(get_db), 
    user_session = Depends(check_roles(
        allowed_roles=[UserRole.teacher], 
        allowed_admin_types=[AdminType.school, AdminType.college]
    ))
):
    try:
        # 获取当前管理员信息
        admin = AdminService.get_admin(db, stuff_id)
        if not admin:
            raise HTTPException(status_code=404, detail="管理员不存在")
        
        # 如果是院级管理员，只能删除本学院的管理员
        if user_session.admin_type == AdminType.college and admin.college_id != user_session.admin_college_id:
            raise HTTPException(status_code=403, detail="院级管理员只能删除本学院的管理员")
        
        AdminService.delete_admin(db, stuff_id)
        return {"message": "管理员删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))