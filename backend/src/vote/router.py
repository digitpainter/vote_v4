from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from .schemas import CandidateCreate, CandidateResponse, VoteRecord, ActivityCreate, ActivityResponse
from .service import VoteService
from ..database import get_db
from ..auth.dependencies import check_roles
from ..models import  Vote

router = APIRouter()

@router.post("/candidates/", response_model=CandidateResponse)
def create_user(user: CandidateCreate, db: Session = Depends(get_db), _= check_roles(allowed_admin_types=["school"])):
    try:
        db_user = VoteService.create_candidate(db, user)
        vote_count = db.query(Vote).filter(Vote.candidate_id == db_user.id).count()
        return CandidateResponse(
            id=db_user.id,
            name=db_user.name,
            college_id=db_user.college_id,
            photo=db_user.photo,
            bio=db_user.bio,
            college_name=db_user.college_name,
            vote_count=vote_count
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/candidates/batch", response_model=List[CandidateResponse])
def get_candidates_batch(
    candidate_ids: List[int] = Query(None, title="Candidate IDs to filter"),
    db: Session = Depends(get_db)
):
    """Batch retrieve candidate details by IDs"""
    candidates = VoteService.get_candidates(db, candidate_ids=candidate_ids)
    candidate_responses = []
    for candidate in candidates:
        vote_count = db.query(Vote).filter(Vote.candidate_id == candidate.id).count()
        candidate_responses.append(CandidateResponse(
            id=candidate.id,
            name=candidate.name,
            college_id=candidate.college_id,
            photo=candidate.photo,
            bio=candidate.bio,
            college_name=candidate.college_name,
            vote_count=vote_count
        ))
    return candidate_responses

@router.post("/vote/batch")
def create_bulk_votes(
    candidate_ids: List[int] = Query(..., title="候选ID列表", example=[1,2,3]),
    activity_id: int = Query(..., title="活动ID"),
    voter_id: str = Query(..., title="投票人ID"),
    db: Session = Depends(get_db),
    _= check_roles(allowed_roles=["student"])
):
    try:
        results = VoteService.create_bulk_votes(db, candidate_ids, voter_id, activity_id)
        return {"success_count": results['success_count'], "errors": results['errors']}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/votes/{voter_id}", response_model=List[VoteRecord])
def get_vote_records(voter_id: int, db: Session = Depends(get_db)):
    return VoteService.get_vote_records(db, voter_id)

@router.post("/activities/", response_model=ActivityResponse)
def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    try:
        return VoteService.create_activity(db, activity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/activities/", response_model=List[ActivityResponse])
def get_activities(db: Session = Depends(get_db)):
    return VoteService.get_activities(db)

@router.get("/activities/active/", response_model=List[ActivityResponse])
def get_active_activities(db: Session = Depends(get_db)):
    return VoteService.get_active_activities(db)

@router.put("/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(activity_id: int, activity: ActivityCreate, db: Session = Depends(get_db)):
    try:
        return VoteService.update_activity(db, activity_id, activity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db), _= check_roles(allowed_admin_types=["school"],allowed_roles=["teacher"])):
    try:
        VoteService.delete_activity(db, activity_id)
        return {"message": "Activity deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: int, user: CandidateCreate, db: Session = Depends(get_db)):
    try:
        db_candidate = VoteService.update_candidate(db, candidate_id, user)
        vote_count = db.query(Vote).filter(Vote.candidate_id == candidate_id).count()
        return CandidateResponse(
            id=db_candidate.id,
            name=db_candidate.name,
            college_id=db_candidate.college_id,
            photo=db_candidate.photo,
            bio=db_candidate.bio,
            college_name=db_candidate.college_name,
            vote_count=vote_count
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db), _= check_roles(allowed_admin_types=["school"])):
    try:
        VoteService.delete_candidate(db, candidate_id)
        return {"message": "Candidate deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
