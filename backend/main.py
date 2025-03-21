from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os
from models import User, Vote
from database import SessionLocal, Base

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
    username: str

class UserResponse(BaseModel):
    id: int
    username: str
    vote_count: int

    class Config:
        orm_mode = True

# API endpoints
@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(username=user.username)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return UserResponse(id=db_user.id, username=db_user.username, vote_count=0)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already exists")

@app.post("/vote/{user_id}")
def create_vote(user_id: int, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check vote count
    vote_count = db.query(Vote).filter(Vote.user_id == user_id).count()
    if vote_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum votes (5) reached")
    
    # Check total users
    total_users = db.query(User).count()
    if total_users > 10:
        raise HTTPException(status_code=400, detail="Maximum users (10) reached")
    
    # Create vote
    vote = Vote(user_id=user_id)
    db.add(vote)
    db.commit()
    
    return {"message": "Vote recorded successfully"}

@app.get("/users/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    user_responses = []
    for user in users:
        vote_count = db.query(Vote).filter(Vote.user_id == user.id).count()
        user_responses.append(UserResponse(
            id=user.id,
            username=user.username,
            vote_count=vote_count
        ))
    return user_responses