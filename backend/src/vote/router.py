from fastapi import APIRouter, HTTPException, Depends, Query, Request, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional
import httpx
import json
import os
from fastapi.responses import JSONResponse, StreamingResponse
import shutil
from pathlib import Path
from datetime import datetime
import uuid

from .schemas import CandidateCreate, CandidateResponse, VoteRecord, ActivityCreate, ActivityResponse, ActiveVoteStatistics, VoteTrendResponse, TotalVoteStats
from .service import VoteService
from ..database import get_db
from ..auth.dependencies import check_roles
from ..auth.service import AuthService
from ..auth.constants import AdminType, UserRole
from ..models import Vote, VoteActivity
from ..config import IMAGES_DIR, IMAGE_CONFIG, BASE_URL

router = APIRouter()

@router.get("/active-statistics", response_model=List[ActiveVoteStatistics])
def get_active_activities_statistics(
    db: Session = Depends(get_db)
    # 无权限要求
):
    activities = VoteService.get_active_activities(db)
    if not activities:
        return []
    print(activities[0])
    return VoteService.get_activity_vote_statistics(db, activity_id=activities[0]["id"])

@router.post("/candidates/", response_model=CandidateResponse)
def create_user(
    user: CandidateCreate, 
    db: Session = Depends(get_db), 
    user_session = Depends(check_roles(allowed_admin_types=[AdminType.school, AdminType.college]))
):
    try:
        # 如果是院级管理员，需要检查学院信息
        if user_session.admin_type == AdminType.college:
            if user.college_id != user_session.admin_college_id:
                raise HTTPException(
                    status_code=403, 
                    detail="院级管理员只能创建本学院的候选人"
                )
        
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
    # 无权限要求
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
    user_session = Depends(check_roles(allowed_roles=[UserRole.graduate, UserRole.phd]))  # 所有登录的人
):
    try:
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
def create_activity(
    activity: ActivityCreate, 
    db: Session = Depends(get_db),
    _= Depends(check_roles(allowed_admin_types=[AdminType.school]))
):
    try:
        return VoteService.create_activity(db, activity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/activities/", response_model=List[ActivityResponse])
def get_activities(
    db: Session = Depends(get_db),
    _= Depends(check_roles())  # 所有登录的人
):
    return VoteService.get_activities(db)

@router.get("/activities/active/", response_model=List[ActivityResponse])
def get_active_activities(
    db: Session = Depends(get_db),
    _= Depends(check_roles())  # 所有登录的人
):
    return VoteService.get_active_activities(db)

@router.put("/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int, 
    activity: ActivityCreate, 
    db: Session = Depends(get_db),
    _= Depends(check_roles(allowed_admin_types=[AdminType.school]))
):
    try:
        return VoteService.update_activity(db, activity_id, activity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/activities/{activity_id}")
def delete_activity(
    activity_id: int, 
    db: Session = Depends(get_db),
    _= Depends(check_roles(allowed_admin_types=[AdminType.school]))
):
    try:
        VoteService.delete_activity(db, activity_id)
        return {"message": "Activity deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: int, 
    user: CandidateCreate, 
    db: Session = Depends(get_db),
    user_session = Depends(check_roles(allowed_admin_types=[AdminType.school, AdminType.college]))
):
    try:
        # 获取当前候选人信息
        current_candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not current_candidate:
            raise HTTPException(status_code=404, detail="候选人不存在")
            
        # 如果是院级管理员，需要检查学院信息
        if user_session.admin_type == AdminType.college:
            # 检查当前候选人是否属于管理员的学院
            if current_candidate.college_id != user_session.admin_college_id:
                raise HTTPException(
                    status_code=403, 
                    detail="院级管理员只能修改本学院的候选人"
                )
            
            # 确保不能修改为其他学院
            if user.college_id != user_session.admin_college_id:
                raise HTTPException(
                    status_code=403, 
                    detail="院级管理员不能将候选人分配到其他学院"
                )
        
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
def delete_candidate(
    candidate_id: int, 
    db: Session = Depends(get_db), 
    _= Depends(check_roles(allowed_admin_types=[AdminType.school]))
):
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
    user_session = Depends(check_roles())  # 所有登录的人
):
    try:
        voter_id = user_session.staff_id
        
        votes = VoteService.get_activity_votes(db, voter_id, activity_id)
        return [vote[0] for vote in votes]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/vote-trends", response_model=VoteTrendResponse)
def get_vote_trends(
    db: Session = Depends(get_db),
    _= Depends(check_roles())  # 所有登录的人
):
    """获取投票趋势数据，包括每日投票总数和各候选人投票数"""
    return VoteService.get_vote_trends(db)

@router.get("/statistics/total", response_model=TotalVoteStats)
def get_total_vote_statistics(
    db: Session = Depends(get_db),
    _= Depends(check_roles())  # 所有登录的人
):
    """获取所有活动的总投票统计数据，包括总投票数、总活动数和总候选人数"""
    return VoteService.get_total_votes_count(db)

@router.delete("/activities/{activity_id}/candidates/{candidate_id}")
def remove_candidate_from_activity(
    activity_id: int, 
    candidate_id: int, 
    db: Session = Depends(get_db),
    _= Depends(check_roles(allowed_admin_types=[AdminType.school]))
):
    """从活动中移除候选人，解除候选人与活动的关联"""
    try:
        VoteService.remove_candidate_from_activity(db, activity_id, candidate_id)
        return {"message": "候选人已从活动中移除"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/export")
async def export_vote_data(
    activity_id: int = Query(..., description="活动ID"),
    export_type: str = Query(..., description="导出数据类型"),
    college_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    user_session = Depends(check_roles(allowed_admin_types=[AdminType.school, AdminType.college]))
):
    try:
        # 如果是院级管理员，需要检查学院信息
        if user_session.admin_type == AdminType.college:
            # 如果传入了学院ID，确保只能导出本学院数据
            if college_id and college_id != user_session.admin_college_id:
                raise HTTPException(
                    status_code=403, 
                    detail="院级管理员只能导出本学院的数据"
                )
            
            # 如果没有传入学院ID，强制设置为管理员所属学院
            college_id = user_session.admin_college_id
            
        # 获取活动详情
        activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="活动不存在")
        
        # 根据导出类型获取数据
        if export_type == 'vote_records':
            data = await VoteService.get_vote_records(db, activity_id, college_id, start_date, end_date)
        elif export_type == 'candidate_stats':
            data = await VoteService.get_candidate_stats(db, activity_id, college_id, start_date, end_date)
        else:
            raise HTTPException(status_code=400, detail=f"不支持的导出类型: {export_type}")
        
        return {
            "activity": {
                "id": activity.id,
                "title": activity.title,
                "start_time": activity.start_time,
                "end_time": activity.end_time
            },
            "export_type": export_type,
            "data": data
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/preview")
async def preview_vote_data(
    activity_id: int = Query(..., description="活动ID"),
    export_type: str = Query("vote_records", description="预览数据类型"),
    college_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(10, description="预览记录数上限"),
    db: Session = Depends(get_db),
    user_session = Depends(check_roles(allowed_admin_types=[AdminType.school, AdminType.college]))
):
    try:
        # 如果是院级管理员，需要检查学院信息
        if user_session.admin_type == AdminType.college:
            # 如果传入了学院ID，确保只能预览本学院数据
            if college_id and college_id != user_session.admin_college_id:
                raise HTTPException(
                    status_code=403, 
                    detail="院级管理员只能预览本学院的数据"
                )
            
            # 如果没有传入学院ID，强制设置为管理员所属学院
            college_id = user_session.admin_college_id
            
        # 获取活动详情
        activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="活动不存在")
        
        # 根据预览类型获取数据
        if export_type == 'vote_records':
            data = await VoteService.get_vote_records(db, activity_id, college_id, start_date, end_date, limit=limit)
        elif export_type == 'candidate_stats':
            data = await VoteService.get_candidate_stats(db, activity_id, college_id, start_date, end_date)
            # 限制预览记录数
            if data and 'records' in data and len(data['records']) > limit:
                data['records'] = data['records'][:limit]
        else:
            raise HTTPException(status_code=400, detail=f"不支持的预览类型: {export_type}")
        
        return {
            "activity": {
                "id": activity.id,
                "title": activity.title,
                "start_time": activity.start_time,
                "end_time": activity.end_time
            },
            "export_type": export_type,
            "data": data
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/colleges/")
async def get_colleges(
    db: Session = Depends(get_db)
    # 无权限要求
):
    """学院信息代理接口，用于解决跨域问题"""
    # 备用学院信息数据
    fallback_data = [
        {"YXDM":"0519000","YXDM_TEXT":"国际教育学院"},
        {"YXDM":"0501000","YXDM_TEXT":"航空学院"},
        {"YXDM":"0502000","YXDM_TEXT":"能源与动力学院"},
        {"YXDM":"0503000","YXDM_TEXT":"自动化学院"},
        {"YXDM":"0504000","YXDM_TEXT":"电子信息工程学院"},
        {"YXDM":"0505000","YXDM_TEXT":"机电学院"},
        {"YXDM":"0506000","YXDM_TEXT":"材料科学与技术学院"},
        {"YXDM":"0509000","YXDM_TEXT":"经济与管理学院"},
        {"YXDM":"0515000","YXDM_TEXT":"航天学院"},
        {"YXDM":"0516000","YXDM_TEXT":"计算机科学与技术学院/软件学院"},
        {"YXDM":"0507000","YXDM_TEXT":"民航学院"},
        {"YXDM":"0525000","YXDM_TEXT":"集成电路学院"},
        {"YXDM":"0517000","YXDM_TEXT":"马克思主义学院"},
        {"YXDM":"0522000","YXDM_TEXT":"数学学院"},
        {"YXDM":"0523000","YXDM_TEXT":"物理学院"},
        {"YXDM":"0510000","YXDM_TEXT":"人文与社会科学学院"},
        {"YXDM":"0511000","YXDM_TEXT":"艺术学院"},
        {"YXDM":"0520000","YXDM_TEXT":"通用航空与飞行学院"},
        {"YXDM":"0512000","YXDM_TEXT":"外国语学院"},
        {"YXDM":"0218000","YXDM_TEXT":"教师发展与教学评估中心/高等教育研究所"},
        {"YXDM":"0526000","YXDM_TEXT":"人工智能学院"}
    ]
    
    # 保存学院数据的本地文件路径
    cache_file = os.path.join(os.path.dirname(__file__), 'college_cache.json')
    
    try:
        # 优先使用缓存
        if os.path.exists(cache_file):
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
                
        # 如果没有缓存，尝试从原站获取
        async with httpx.AsyncClient() as client:
            response = await client.get('https://class101.nuaa.edu.cn/yx_info/', timeout=5.0)
            if response.status_code == 200:
                college_data = response.json()
                # 缓存获取的数据
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(college_data, f, ensure_ascii=False)
                return college_data
            else:
                # 原站获取失败，使用备用数据
                return fallback_data
    except Exception as e:
        print(f"获取学院信息错误: {e}")
        # 请求失败时使用备用数据
        return fallback_data

@router.post("/upload-image/", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_session = Depends(check_roles(allowed_admin_types=[AdminType.school, AdminType.college]))
):
    """
    上传图片，返回图片URL
    """
    # 检查文件类型
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持上传图片文件"
        )
    
    # 获取文件扩展名并检查是否为允许的扩展名
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in IMAGE_CONFIG["allowed_extensions"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件格式，允许的格式：{', '.join(IMAGE_CONFIG['allowed_extensions'])}"
        )
    
    # 检查文件大小
    file_size = 0
    chunk_size = 1024  # 1KB
    while chunk := await file.read(chunk_size):
        file_size += len(chunk)
        if file_size > IMAGE_CONFIG["max_size"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"文件大小超过限制，最大允许大小：{IMAGE_CONFIG['max_size'] // (1024 * 1024)}MB"
            )
    
    # 重置文件指针以便后续保存
    await file.seek(0)
    
    # 生成唯一文件名，避免文件名冲突
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    new_filename = f"{timestamp}_{unique_id}{file_extension}"
    
    # 保存文件
    file_path = IMAGES_DIR / new_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        await file.close()
    
    # 构建完整URL
    image_url = f"{BASE_URL}/uploads/images/{new_filename}"
    
    return {"image_url": image_url, "filename": new_filename}