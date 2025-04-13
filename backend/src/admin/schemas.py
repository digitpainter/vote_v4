from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class AdminType(str, Enum):
    SCHOOL = "school"
    COLLEGE = "college"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class AdminBase(BaseModel):
    stuff_id: str
    name: str
    admin_type: AdminType
    college_id: Optional[str] = None
    college_name: Optional[str] = None

class AdminCreate(AdminBase):
    pass

class AdminUpdate(BaseModel):
    name: Optional[str] = None
    admin_type: AdminType
    college_id: Optional[str] = None
    college_name: Optional[str] = None

class AdminResponse(AdminBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# 管理员申请相关Schema
class AdminApplicationCreate(BaseModel):
    admin_type: AdminType
    college_id: Optional[str] = None
    college_name: Optional[str] = None
    reason: str

class AdminApplicationUpdate(BaseModel):
    status: ApplicationStatus
    review_comment: Optional[str] = None

class AdminApplicationResponse(BaseModel):
    id: int
    staff_id: str
    username: str
    admin_type: AdminType
    college_id: Optional[str] = None
    college_name: Optional[str] = None
    reason: str
    status: ApplicationStatus
    reviewer_id: Optional[str] = None
    review_comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True