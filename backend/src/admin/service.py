from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime

from ..models import Administrator, AdminApplication, ApplicationStatus
from .schemas import AdminCreate, AdminUpdate, AdminType, AdminApplicationCreate, AdminApplicationUpdate

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
    def get_admins(db: Session) -> List[Administrator]:
        # 返回所有管理员，不使用分页
        return db.query(Administrator).all()

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

class AdminApplicationService:
    @staticmethod
    def create_application(
        db: Session, 
        application: AdminApplicationCreate, 
        staff_id: str, 
        username: str
    ) -> AdminApplication:
        # 检查用户是否已经是管理员
        existing_admin = AdminService.get_admin(db, staff_id)
        if existing_admin:
            raise ValueError("您已经是管理员，无需申请")
            
        # 检查是否有待处理的申请
        pending_application = db.query(AdminApplication).filter(
            AdminApplication.staff_id == staff_id,
            AdminApplication.status == ApplicationStatus.PENDING
        ).first()
        
        if pending_application:
            raise ValueError("您已有待处理的申请，请等待审核结果")
            
        # 对于院级管理员，必须提供学院信息
        if application.admin_type == AdminType.COLLEGE and not (application.college_id and application.college_name):
            raise ValueError("申请院级管理员必须提供学院信息")
            
        # 创建申请
        db_application = AdminApplication(
            staff_id=staff_id,
            username=username,
            admin_type=application.admin_type,
            college_id=application.college_id,
            college_name=application.college_name,
            reason=application.reason,
            status=ApplicationStatus.PENDING
        )
        
        db.add(db_application)
        db.commit()
        db.refresh(db_application)
        return db_application
    
    @staticmethod
    def get_application(db: Session, application_id: int) -> Optional[AdminApplication]:
        return db.query(AdminApplication).filter(AdminApplication.id == application_id).first()
    
    @staticmethod
    def get_user_applications(db: Session, staff_id: str) -> List[AdminApplication]:
        return db.query(AdminApplication).filter(
            AdminApplication.staff_id == staff_id
        ).order_by(AdminApplication.created_at.desc()).all()
    
    @staticmethod
    def get_all_applications(
        db: Session, 
        status: Optional[ApplicationStatus] = None
    ) -> List[AdminApplication]:
        query = db.query(AdminApplication)
        if status:
            query = query.filter(AdminApplication.status == status)
        return query.order_by(AdminApplication.created_at.desc()).all()
    
    @staticmethod
    def update_application(
        db: Session, 
        application_id: int, 
        update_data: AdminApplicationUpdate, 
        reviewer_id: str
    ) -> AdminApplication:
        application = AdminApplicationService.get_application(db, application_id)
        if not application:
            raise ValueError("申请不存在")
            
        if application.status != ApplicationStatus.PENDING:
            raise ValueError("只能审核待处理的申请")
            
        # 更新申请状态
        application.status = update_data.status
        application.reviewer_id = reviewer_id
        application.review_comment = update_data.review_comment
        application.updated_at = datetime.now()
        
        # 如果申请被批准，创建管理员
        if update_data.status == ApplicationStatus.APPROVED:
            # 检查用户是否已经是管理员（可能在申请审核过程中被添加）
            existing_admin = AdminService.get_admin(db, application.staff_id)
            if existing_admin:
                application.status = ApplicationStatus.REJECTED
                application.review_comment = "用户已经是管理员，无法重复添加"
            else:
                try:
                    admin_data = AdminCreate(
                        stuff_id=application.staff_id,
                        admin_type=application.admin_type,
                        college_id=application.college_id,
                        college_name=application.college_name
                    )
                    AdminService.create_admin(db, admin_data)
                except ValueError as e:
                    # 如果创建管理员失败，回滚并拒绝申请
                    db.rollback()
                    application.status = ApplicationStatus.REJECTED
                    application.review_comment = f"管理员创建失败: {str(e)}"
                    
        db.commit()
        db.refresh(application)
        return application