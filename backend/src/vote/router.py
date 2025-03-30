from fastapi import APIRouter, HTTPException, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import List

from .schemas import CandidateCreate, CandidateResponse, VoteRecord, ActivityCreate, ActivityResponse, ActiveVoteStatistics, VoteTrendResponse
from .service import VoteService
from ..database import get_db
from ..auth.dependencies import check_roles
from ..auth.service import AuthService
from ..models import  Vote

router = APIRouter()

@router.get("/active-statistics", response_model=List[ActiveVoteStatistics])
def get_active_activities_statistics(
    db: Session = Depends(get_db),
    # _= check_roles(allowed_admin_types=["school"])
):
    activities = VoteService.get_active_activities(db)
    if not activities:
        return []
    print(activities[0])
    return VoteService.get_activity_vote_statistics(db, activity_id=activities[0]["id"])

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
    request: Request,
    candidate_ids: List[int] = Query(..., title="候选ID列表", example=[1,2,3]),
    activity_id: int = Query(..., title="活动ID"),
    db: Session = Depends(get_db),
    _= check_roles(allowed_roles=["student"])
):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(status_code=401, detail="授权头信息缺失")
        
        token = auth_header.split(" ")[1] if " " in auth_header else auth_header
        try:
            user_session = AuthService.get_user_session(token)
        except ValueError as e:
            raise HTTPException(status_code=401, detail="会话过期或者无效,需要重新登录")
        voter_id = user_session.staff_id

        # Check existing votes
        existing_votes = db.query(Vote).filter(
            Vote.voter_id == voter_id,
            Vote.activity_id == activity_id
        ).count()
        if existing_votes > 0:
            raise HTTPException(status_code=400, detail="用户已在该活动中投过票")

        results = VoteService.create_bulk_votes(db, candidate_ids, voter_id, activity_id)
        return {"success_count": results['success_count'], "errors": results['errors']}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
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


@router.get("/activities/{activity_id}/my-votes", response_model=List[int])
def get_my_activity_votes(
    activity_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _= check_roles(allowed_roles=["student"])
):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(status_code=401, detail="授权头信息缺失")
        
        token = auth_header.split(" ")[1] if " " in auth_header else auth_header
        try:
            user_session = AuthService.get_user_session(token)
        except ValueError as e:
            raise HTTPException(status_code=401, detail="会话过期或者无效,需要重新登录")

        voter_id = user_session.staff_id
        
        votes = VoteService.get_activity_votes(db, voter_id, activity_id)
        return [vote[0] for vote in votes]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/vote-trends", response_model=VoteTrendResponse)
def get_vote_trends(db: Session = Depends(get_db)):
    """获取投票趋势数据，包括每日投票总数和各候选人投票数"""
    return VoteService.get_vote_trends(db)

@router.delete("/activities/{activity_id}/candidates/{candidate_id}")
def remove_candidate_from_activity(
    activity_id: int, 
    candidate_id: int, 
    db: Session = Depends(get_db),
    _= check_roles(allowed_admin_types=["school"])
):
    """从活动中移除候选人，解除候选人与活动的关联"""
    try:
        VoteService.remove_candidate_from_activity(db, activity_id, candidate_id)
        return {"message": "候选人已从活动中移除"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/candidates/{candidate_id}/upload-image", response_model=dict)
def upload_candidate_image(
    candidate_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    _= check_roles(allowed_admin_types=["school"])
):
    """上传候选人图片"""
    try:
        # 检查文件类型
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(400, "只支持JPG和PNG格式图片")
        
        # 生成唯一文件名
        ext = file.filename.split(".")[-1]
        filename = f"{uuid4()}.{ext}"
        
        # 确保上传目录存在
        upload_dir = "static/uploads/candidates"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = f"{upload_dir}/{filename}"
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 更新数据库中候选人的图片路径
        image_url = f"/static/uploads/candidates/{filename}"
        VoteService.update_candidate_image(db, candidate_id, image_url)
        
        return {"image_url": image_url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
