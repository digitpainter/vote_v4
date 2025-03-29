from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException, Query
from typing import Optional, List
import logging
from logging.handlers import RotatingFileHandler

from sqlalchemy.sql.operators import is_associative

from backend.src.auth.service import AuthService

from ..models import Candidate, Vote, VoteActivity, ActivityCandidateAssociation
from .schemas import CandidateCreate, ActivityCreate

class VoteService:
    # Configure logging
    logger = logging.getLogger('vote_service')
    logger.setLevel(logging.INFO)
    handler = RotatingFileHandler('logs/vote.log', maxBytes=10485760, backupCount=5)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    @staticmethod
    def create_candidate(db: Session, candidate: CandidateCreate):
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
    def get_candidates(db: Session, candidate_ids: Optional[List[int]] = None):
        query = db.query(Candidate)
        if candidate_ids:
            query = query.filter(Candidate.id.in_(candidate_ids))
        return query.all()

    @staticmethod
    def create_vote(db: Session, candidate_id: int, voter_id: str, activity_id: int):
        # 获取活动配置
        activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not activity:
            raise ValueError("投票活动不存在")
        
        # 检查总票数
        existing_votes_count = db.query(Vote).filter(
            Vote.voter_id == voter_id,
            Vote.activity_id == activity_id
        ).count()
        
        if existing_votes_count >= activity.max_votes:
            raise ValueError(f"每人最多投{activity.max_votes}票")
        if existing_votes_count < activity.min_votes - 1:
            raise ValueError(f"至少需要投{activity.min_votes}票")
        
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise ValueError("候选人不存在")

        vote_count = db.query(Vote).filter(Vote.candidate_id == candidate_id).count()


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
        except ValueError as e:
            db.rollback()
            raise ValueError(str(e))

    @staticmethod
    def get_activity_votes(db: Session, voter_id: str, activity_id: int):
        return db.query(Vote.candidate_id).filter(
            Vote.voter_id == voter_id,
            Vote.activity_id == activity_id
        ).all()

    @staticmethod
    def create_activity(db: Session, activity: ActivityCreate):
        try:
            db_activity = VoteActivity(
                title=activity.title,
                description=activity.description,
                start_time=activity.start_time,
                end_time=activity.end_time,
                is_active=activity.is_active,
                max_votes=activity.max_votes,
                min_votes=activity.min_votes
            )
            db.add(db_activity)
            db.flush()
            if activity.is_active:
                VoteActivity.deactivate_others(db, exclude_id=db_activity.id)
            for candidate_id in activity.candidate_ids:
                association = ActivityCandidateAssociation(
                    activity_id=db_activity.id,
                    candidate_id=candidate_id
                )
                db.add(association)
            db.commit()
            db.refresh(db_activity)
            return {
                "id": db_activity.id,
                "title": db_activity.title,
                "description": db_activity.description,
                "start_time": db_activity.start_time,
                "end_time": db_activity.end_time,
                "is_active": db_activity.is_active,
                "max_votes": db_activity.max_votes,
                "min_votes": db_activity.min_votes,
                "candidate_ids": activity.candidate_ids
            }
        except Exception as e:
            db.rollback()
            raise ValueError(str(e))

    @staticmethod
    def get_activities(db: Session):
        return [
            {
                "id": activity.id,
                "title": activity.title,
                "description": activity.description,
                "start_time": activity.start_time,
                "end_time": activity.end_time,
                "is_active": activity.is_active,
                "max_votes": activity.max_votes,
                "min_votes": activity.min_votes,
                "candidate_ids": [assoc.candidate_id for assoc in activity.associations]
            }
            for activity in db.query(VoteActivity).all()
        ]

    @staticmethod
    def get_active_activities(db: Session):
        return [
            {
                "id": activity.id,
                "title": activity.title,
                "description": activity.description,
                "start_time": activity.start_time,
                "end_time": activity.end_time,
                "is_active": activity.is_active,
                "max_votes": activity.max_votes,
                "min_votes": activity.min_votes,
                "candidate_ids": [assoc.candidate_id for assoc in activity.associations]
            }
            for activity in db.query(VoteActivity).filter(VoteActivity.is_active == True).all()
        ]

    @staticmethod
    def update_activity(db: Session, activity_id: int, activity: ActivityCreate):
        db_activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not db_activity:
            raise ValueError("Activity not found")

        try:
            # Clear existing associations
            db.query(ActivityCandidateAssociation).filter(
                ActivityCandidateAssociation.activity_id == activity_id
            ).delete()

            # Add new associations
            for candidate_id in activity.candidate_ids:
                association = ActivityCandidateAssociation(
                    activity_id=activity_id,
                    candidate_id=candidate_id
                )
                db.add(association)

            db_activity.title = activity.title
            db_activity.description = activity.description
            db_activity.start_time = activity.start_time
            db_activity.end_time = activity.end_time
            db_activity.is_active = activity.is_active
            db_activity.max_votes = activity.max_votes
            db_activity.min_votes = activity.min_votes
            if activity.is_active:
                VoteActivity.deactivate_others(db, exclude_id=activity_id)
            db.commit()
            db.refresh(db_activity)
            return {
                "id": db_activity.id,
                "title": db_activity.title,
                "description": db_activity.description,
                "start_time": db_activity.start_time,
                "end_time": db_activity.end_time,
                "is_active": db_activity.is_active,
                "max_votes": db_activity.max_votes,
                "min_votes": db_activity.min_votes,
                "candidate_ids": [assoc.candidate_id for assoc in db_activity.associations]
            }
        except ValueError as e:
            VoteService.logger.error(f"Validation error: {str(e)}")
            raise

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
        except ValueError as e:
            VoteService.logger.warning(f"Business rule violation: {e}")
            raise

    @staticmethod
    def update_candidate(db: Session, candidate_id: int, candidate: CandidateCreate):
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

    @staticmethod
    def create_bulk_votes(db: Session, candidate_ids: List[int], voter_id: str, activity_id: int):
        try:
            results = {'success_count': 0, 'errors': []}
            # db.begin()
            for cid in candidate_ids:
                try:
                    VoteService.create_vote(db, cid, voter_id, activity_id)
                    results['success_count'] += 1
                except Exception as e:
                    results['errors'].append({'candidate_id': cid, 'error': str(e)})
            if len(results['errors']) > 0:
                db.rollback()
                return results
            db.commit()
            return results
        except Exception as e:
            db.rollback()
            raise ValueError(f"Batch operation failed: {str(e)}")