from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime as datetime_type
from typing import List, Optional
import os
from models import Candidate, Vote, VoteActivity
from database import SessionLocal, Base
import logging
from logging.handlers import RotatingFileHandler
from fastapi import Request

app = FastAPI()

# Initialize database tables
from database import init_db
init_db()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Vote API is running"}

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for request/response
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

# API endpoints
# 配置日志系统
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=1024*1024*10, backupCount=3),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 添加请求日志中间件
@app.middleware('http')
async def log_requests(request: Request, call_next):
    start_time = datetime_type.utcnow()
    response = await call_next(request)
    process_time = (datetime_type.utcnow() - start_time).total_seconds() * 1000
    logger.info(
        f"Method={request.method} Path={request.url.path} "
        f"Status={response.status_code} Duration={process_time:.2f}ms"
    )
    return response

@app.post("/candidates/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Creating new candidate: {user.name} ({user.college_name})")
        db_user = Candidate(
            name=user.name,
            college_id=user.college_id,
            photo=user.photo,
            bio=user.bio,
            college_name=user.college_name,
            quote=user.quote,
            review=user.review,
            video_url=user.video_url
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"Candidate created successfully: ID {db_user.id}")
        return UserResponse(
            id=db_user.id,
            name=db_user.name,
            college_id=db_user.college_id,
            photo=db_user.photo,
            bio=db_user.bio,
            college_name=db_user.college_name,
            vote_count=0
        )
    except Exception as e:
        logger.error(f"Error creating candidate: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=400, detail="name already exists")

@app.get("/candidates/", response_model=List[UserResponse])
def get_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    candidate_responses = []
    for candidate in candidates:
        vote_count = db.query(Vote).filter(Vote.candidate_id == candidate.id).count()
        candidate_responses.append(UserResponse(
            id=candidate.id,
            name=candidate.name,
            college_id=candidate.college_id,
            photo=candidate.photo,
            bio=candidate.bio,
            college_name=candidate.college_name,
            vote_count=vote_count
        ))
    return candidate_responses


@app.post("/vote/{candidate_id}")
def create_vote(candidate_id: int, activity_id: int, voter_id: int, db: Session = Depends(get_db)):
    logger.info(f"Processing vote for candidate ID: {candidate_id}")
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        logger.warning(f"Candidate not found: ID {candidate_id}")
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    vote_count = db.query(Vote).filter(Vote.candidate_id == candidate_id).count()
    logger.debug(f"Current votes for candidate {candidate_id}: {vote_count}")
    
    existing_vote = db.query(Vote).filter(Vote.candidate_id == candidate_id, Vote.voter_id == voter_id, Vote.activity_id == activity_id).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="用户已投票")

    if vote_count >= 5:
        logger.warning(f"Maximum votes reached for candidate ID {candidate_id}")
        raise HTTPException(status_code=400, detail="Maximum votes (5) reached")
    
    total_candidates = db.query(Candidate).count()
    logger.debug(f"Total candidates: {total_candidates}")
    
    if total_candidates > 10:
        logger.warning("Maximum candidate limit exceeded (10 candidates)")
        raise HTTPException(status_code=400, detail="Maximum candidates (10) reached")
    
    try:
        vote = Vote(candidate_id=candidate_id, voter_id=voter_id)
        db.add(vote)
        db.commit()
        logger.info(f"Vote recorded successfully for candidate ID {candidate_id}")
        return {"message": "Vote recorded successfully"}
    except Exception as e:
        logger.error(f"Error recording vote: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

class ActivityCreate(BaseModel):
    title: str
    description: str
    start_time: datetime_type
    end_time: datetime_type

class VoteRecord(BaseModel):
    id: int
    candidate_id: int
    created_at: datetime_type

    class Config:
        orm_mode = True

class ActivityResponse(BaseModel):
    id: int
    title: str
    description: str
    start_time: datetime_type
    end_time: datetime_type
    created_at: datetime_type

    class Config:
        orm_mode = True

@app.get("/votes/{voter_id}", response_model=List[VoteRecord])
def get_vote_records(voter_id: int, db: Session = Depends(get_db)):
    votes = db.query(Vote).filter(Vote.voter_id == voter_id).all()
    return votes

@app.post("/activities/", response_model=ActivityResponse)
def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    try:
        db_activity = VoteActivity(
            title=activity.title,
            description=activity.description,
            start_time=activity.start_time,
            end_time=activity.end_time
        )
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)
        return db_activity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/activities/", response_model=List[ActivityResponse])
def get_activities(db: Session = Depends(get_db)):
    return db.query(VoteActivity).all()

@app.put("/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(activity_id: int, activity: ActivityCreate, db: Session = Depends(get_db)):
    try:
        db_activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not db_activity:
            raise HTTPException(status_code=404, detail="Activity not found")

        db_activity.title = activity.title
        db_activity.description = activity.description
        db_activity.start_time = activity.start_time
        db_activity.end_time = activity.end_time

        db.commit()
        db.refresh(db_activity)
        return db_activity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    try:
        db_activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not db_activity:
            raise HTTPException(status_code=404, detail="Activity not found")

        # Delete associated votes first
        db.query(Vote).filter(Vote.activity_id == activity_id).delete()
        db.delete(db_activity)
        db.commit()
        return {"message": "Activity deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/candidates/{candidate_id}", response_model=UserResponse)
def update_candidate(candidate_id: int, user: UserCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Updating candidate: ID {candidate_id}")
        db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not db_candidate:
            logger.warning(f"Candidate not found: ID {candidate_id}")
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Check if the new name already exists for another candidate
        if user.name != db_candidate.name:
            existing_candidate = db.query(Candidate).filter(Candidate.name == user.name).first()
            if existing_candidate:
                raise HTTPException(status_code=400, detail="Name already exists")

        # Update candidate attributes
        db_candidate.name = user.name
        db_candidate.college_id = user.college_id
        db_candidate.photo = user.photo
        db_candidate.bio = user.bio
        db_candidate.college_name = user.college_name
        db_candidate.quote = user.quote
        db_candidate.review = user.review
        db_candidate.video_url = user.video_url

        db.commit()
        db.refresh(db_candidate)
        
        vote_count = db.query(Vote).filter(Vote.candidate_id == candidate_id).count()
        logger.info(f"Candidate updated successfully: ID {candidate_id}")
        
        return UserResponse(
            id=db_candidate.id,
            name=db_candidate.name,
            college_id=db_candidate.college_id,
            photo=db_candidate.photo,
            bio=db_candidate.bio,
            college_name=db_candidate.college_name,
            vote_count=vote_count
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating candidate: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    try:
        logger.info(f"Deleting candidate: ID {candidate_id}")
        db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not db_candidate:
            logger.warning(f"Candidate not found: ID {candidate_id}")
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Delete associated votes first
        db.query(Vote).filter(Vote.candidate_id == candidate_id).delete()
        db.delete(db_candidate)
        db.commit()
        
        logger.info(f"Candidate deleted successfully: ID {candidate_id}")
        return {"message": "Candidate deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting candidate: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")