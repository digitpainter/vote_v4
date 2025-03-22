from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class UserCreate(BaseModel):
    name: str
    college_id: int
    photo: str
    bio: str
    college_name: str
    quote: str
    review: str
    video_url: str

class UserResponse(BaseModel):
    id: int
    name: str
    college_id: int
    photo: str
    bio: str
    college_name: str
    vote_count: int

    class Config:
        orm_mode = True

class VoteRecord(BaseModel):
    id: int
    candidate_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ActivityCreate(BaseModel):
    title: str
    description: str
    start_time: datetime
    end_time: datetime

class ActivityResponse(BaseModel):
    id: int
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    created_at: datetime

    class Config:
        orm_mode = True