from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class AdminActionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    VIEW = "view"
    EXPORT = "export"
    OTHER = "other"

class AdminLogCreate(BaseModel):
    admin_id: str
    admin_name: str
    admin_type: str
    action_type: AdminActionType
    resource_type: str
    resource_id: Optional[str] = None
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AdminLogResponse(BaseModel):
    id: int
    admin_id: str
    admin_name: str
    admin_type: str
    action_type: AdminActionType
    resource_type: str
    resource_id: Optional[str] = None
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True 