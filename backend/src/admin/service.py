from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime

from ..models import Administrator
from .schemas import AdminCreate, AdminUpdate, AdminType

class AdminService:
    @staticmethod
    def create_admin(db: Session, admin: AdminCreate) -> Administrator:
        # 检查 stuff_id 是否已存在
        existing_admin = AdminService.get_admin(db, admin.stuff_id)
        if existing_admin:
            raise ValueError(f"工号 {admin.stuff_id} 已被使用，请使用其他工号")
            
        if admin.admin_type == AdminType.COLLEGE and not (admin.college_id and admin.college_name):
            raise ValueError("College ID and name are required for college administrators")
        
        db_admin = Administrator(
            stuff_id=admin.stuff_id,
            admin_type=admin.admin_type,
            college_id=admin.college_id,
            college_name=admin.college_name
        )
        try:
            db.add(db_admin)
            db.commit()
            db.refresh(db_admin)
            return db_admin
        except IntegrityError:
            db.rollback()
            raise ValueError("Administrator with these details already exists")

    @staticmethod
    def get_admin_by_id(db: Session, admin_id: int) -> Optional[Administrator]:
        return db.query(Administrator).filter(Administrator.id == admin_id).first()
        
    @staticmethod
    def get_admin(db: Session, stuff_id: str) -> Optional[Administrator]:
        return db.query(Administrator).filter(Administrator.stuff_id == stuff_id).first()

    @staticmethod
    def get_admins(db: Session, skip: int = 0, limit: int = 100) -> List[Administrator]:
        return db.query(Administrator).offset(skip).limit(limit).all()

    @staticmethod
    def update_admin(db: Session, stuff_id: str, admin_update: AdminUpdate) -> Optional[Administrator]:
        db_admin = AdminService.get_admin(db, stuff_id)
        if not db_admin:
            return None

        if admin_update.admin_type == AdminType.COLLEGE and not (admin_update.college_id and admin_update.college_name):
            raise ValueError("College ID and name are required for college administrators")

        for field, value in admin_update.dict(exclude_unset=True).items():
            setattr(db_admin, field, value)

        try:
            db.commit()
            db.refresh(db_admin)
            return db_admin
        except IntegrityError:
            db.rollback()
            raise ValueError("Administrator with these details already exists")

    @staticmethod
    def delete_admin(db: Session, stuff_id: str) -> bool:
        db_admin = AdminService.get_admin(db, stuff_id)
        if not db_admin:
            return False
        
        db.delete(db_admin)
        db.commit()
        return True