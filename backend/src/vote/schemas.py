from pydantic import BaseModel
from datetime import datetime,timedelta
from typing import List, Optional
import faker  # 新增faker库
fake = faker.Faker(locale='zh_CN')  # 创建faker实例

class CandidateCreate(BaseModel):
    name: str= fake.name()
    college_id: str = "0503000"
    photo: str = fake.image_url()
    bio: str = fake.text(500)
    college_name: str = fake.company()
    quote: str = fake.sentence()
    review: str = fake.text(500)
    video_url: str = fake.url()

class CandidateResponse(BaseModel):
    id: int
    name: str
    college_id: str
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
    max_votes: int = 12
    min_votes: int = 1


class ActivityResponse(BaseModel):
    id: int
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    is_active: bool = True
    candidate_ids: List[int] = []
    max_votes: int
    min_votes: int
    class Config:
        orm_mode = True

class ActiveVoteStatistics(BaseModel):
    candidate_id: int
    name: str
    college_id: str
    vote_count: int

    class Config:
        orm_mode = True

class VoteTrendItem(BaseModel):
    date: str
    count: int
    candidate_id: Optional[int] = None
    candidate_name: Optional[str] = None

class VoteTrendResponse(BaseModel):
    trends: List[VoteTrendItem]
    daily_totals: List[VoteTrendItem]