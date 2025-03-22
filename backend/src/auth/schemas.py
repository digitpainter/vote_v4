from pydantic import BaseModel

class UserSession(BaseModel):
    staff_id: str
    username: str
    access_token: str
    role: str
    admin_type: str | None = None
    admin_college_id: int | None = None

class CASResponse(BaseModel):
    staff_id: str
    username: str
    role: str