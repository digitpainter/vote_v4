from pydantic import BaseModel, field_validator ,Field
from datetime import datetime,timedelta
from typing import List, Optional
import faker  # 新增faker库
fake = faker.Faker(locale='zh_CN')  # 创建faker实例

class CandidateCreate(BaseModel):
    name: str= "王伟"
    college_id: int = 3
    photo: str = fake.image_url()
    bio: str = fake.text(500)
    college_name: str = fake.company()
    quote: str = fake.sentence()
    review: str = fake.text(500)
    video_url: str = fake.url()

class CandidateResponse(BaseModel):
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
    title: str = """ 第十五届"良师益友--我最喜爱的导师"评选活动" """
    description: str = "仅限在籍研究生同学参与，每人需投12票，一次投完，不可撤回。【请翻到页面底部进行投票】"
    start_time: datetime = datetime.now()
    end_time: datetime = datetime.now() + timedelta(days=1)
    is_active: bool = True
    candidate_ids: List[int] = [1,2,3]


class ActivityResponse(BaseModel):
    id: int
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    is_active: bool = True
    candidate_ids: List[int] = []
    class Config:
        orm_mode = True