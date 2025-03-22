from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class AdminType(str, Enum):
    SCHOOL = "school"
    COLLEGE = "college"

class AdminBase(BaseModel):
    stuff_id: str
    admin_type: AdminType
    college_id: Optional[int] = None
    college_name: Optional[str] = None

class AdminCreate(AdminBase):
    pass

class AdminUpdate(AdminBase):
    pass

class AdminResponse(AdminBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True