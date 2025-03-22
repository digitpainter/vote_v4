from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException
import logging
from logging.handlers import RotatingFileHandler

from ..models import Candidate, Vote, VoteActivity
from .schemas import UserCreate, ActivityCreate

class VoteService:
    # Configure logging
    logger = logging.getLogger('vote_service')
    logger.setLevel(logging.INFO)
    handler = RotatingFileHandler('logs/vote.log', maxBytes=10485760, backupCount=5)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    @staticmethod
    def create_candidate(db: Session, candidate: UserCreate):
        try:
            db_candidate = Candidate(
                name=candidate.name,
                college_id=candidate.college_id,
                photo=candidate.photo,
                bio=candidate.bio,
                college_name=candidate.college_name,
                quote=candidate.quote,
                review=candidate.review,
                video_url=candidate.video_url
            )
            db.add(db_candidate)
            db.commit()
            db.refresh(db_candidate)
            return db_candidate
        except Exception as e:
            db.rollback()
            raise ValueError(str(e))

    @staticmethod
    def get_candidates(db: Session):
        return db.query(Candidate).all()

    @staticmethod
    def create_vote(db: Session, candidate_id: int, voter_id: int, activity_id: int):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise ValueError("Candidate not found")

        vote_count = db.query(Vote).filter(Vote.candidate_id == candidate_id).count()
        if vote_count >= 5:
            raise ValueError("Maximum votes (5) reached")

        existing_vote = db.query(Vote).filter(
            Vote.candidate_id == candidate_id,
            Vote.voter_id == voter_id,
            Vote.activity_id == activity_id
        ).first()
        if existing_vote:
            raise ValueError("User has already voted")

        try:
            vote = Vote(candidate_id=candidate_id, voter_id=voter_id, activity_id=activity_id)
            db.add(vote)
            db.commit()
            return vote
        except Exception as e:
            db.rollback()
            raise ValueError(str(e))

    @staticmethod
    def get_vote_records(db: Session, voter_id: int):
        return db.query(Vote).filter(Vote.voter_id == voter_id).all()

    @staticmethod
    def create_activity(db: Session, activity: ActivityCreate):
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
            raise ValueError(str(e))

    @staticmethod
    def get_activities(db: Session):
        return db.query(VoteActivity).all()

    @staticmethod
    def update_activity(db: Session, activity_id: int, activity: ActivityCreate):
        db_activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not db_activity:
            raise ValueError("Activity not found")

        try:
            db_activity.title = activity.title
            db_activity.description = activity.description
            db_activity.start_time = activity.start_time
            db_activity.end_time = activity.end_time
            db.commit()
            db.refresh(db_activity)
            return db_activity
        except Exception as e:
            db.rollback()
            raise ValueError(str(e))

    @staticmethod
    def delete_activity(db: Session, activity_id: int):
        db_activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not db_activity:
            raise ValueError("Activity not found")

        try:
            db.query(Vote).filter(Vote.activity_id == activity_id).delete()
            db.delete(db_activity)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise ValueError(str(e))

    @staticmethod
    def update_candidate(db: Session, candidate_id: int, candidate: UserCreate):
        db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not db_candidate:
            raise ValueError("Candidate not found")

        try:
            if candidate.name != db_candidate.name:
                existing_candidate = db.query(Candidate).filter(Candidate.name == candidate.name).first()
                if existing_candidate:
                    raise ValueError("Name already exists")

            db_candidate.name = candidate.name
            db_candidate.college_id = candidate.college_id
            db_candidate.photo = candidate.photo
            db_candidate.bio = candidate.bio
            db_candidate.college_name = candidate.college_name
            db_candidate.quote = candidate.quote
            db_candidate.review = candidate.review
            db_candidate.video_url = candidate.video_url

            db.commit()
            db.refresh(db_candidate)
            return db_candidate
        except Exception as e:
            db.rollback()
            raise ValueError(str(e))

    @staticmethod
    def delete_candidate(db: Session, candidate_id: int):
        db_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not db_candidate:
            raise ValueError("Candidate not found")

        try:
            db.query(Vote).filter(Vote.candidate_id == candidate_id).delete()
            db.delete(db_candidate)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise ValueError(str(e))