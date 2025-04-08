from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from datetime import datetime, timedelta
from fastapi import HTTPException, Query
from typing import Optional, List, Dict, Any, Tuple, Union
import logging
from logging.handlers import RotatingFileHandler
import json
import re
import os
import httpx

from sqlalchemy.sql.operators import is_associative

from backend.src.auth.service import AuthService

from ..models import Candidate, Vote, VoteActivity, ActivityCandidateAssociation
from .schemas import CandidateCreate, ActivityCreate, VoteTrendItem, VoteTrendResponse

class VoteService:
    # Configure logging
    logger = logging.getLogger('vote_service')
    logger.setLevel(logging.INFO)
    handler = RotatingFileHandler('logs/vote.log', maxBytes=10485760, backupCount=5)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    @staticmethod
    def get_activity_vote_statistics(db: Session, activity_id: int):
        # 获取活动中的所有候选人
        activity_candidates = db.query(Candidate).join(
            ActivityCandidateAssociation, ActivityCandidateAssociation.candidate_id == Candidate.id
        ).filter(
            ActivityCandidateAssociation.activity_id == activity_id
        ).all()

        # 获取有投票记录的候选人统计
        vote_stats = db.query(
            Vote.candidate_id,
            func.count(Vote.id).label('vote_count')
        ).filter(
            Vote.activity_id == activity_id
        ).group_by(
            Vote.candidate_id
        ).all()

        # 将投票统计转换为字典，方便查找
        vote_dict = {candidate_id: count for candidate_id, count in vote_stats}

        # 构建结果列表，确保包含所有候选人
        results = []
        for candidate in activity_candidates:
            results.append({
                'candidate_id': candidate.id,
                'name': candidate.name,
                'college_id': candidate.college_id,
                'vote_count': vote_dict.get(candidate.id, 0)  # 如果没有投票记录，返回0
            })

        return results

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
            
            # Add candidate associations with position information
            for position, candidate_id in enumerate(activity.candidate_ids):
                association = ActivityCandidateAssociation(
                    activity_id=db_activity.id,
                    candidate_id=candidate_id,
                    position=position  # Store the position
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
        activities = []
        for activity in db.query(VoteActivity).all():
            # Get associations sorted by position
            associations = db.query(ActivityCandidateAssociation).filter(
                ActivityCandidateAssociation.activity_id == activity.id
            ).order_by(ActivityCandidateAssociation.position).all()
            
            activities.append({
                "id": activity.id,
                "title": activity.title,
                "description": activity.description,
                "start_time": activity.start_time,
                "end_time": activity.end_time,
                "is_active": activity.is_active,
                "max_votes": activity.max_votes,
                "min_votes": activity.min_votes,
                "candidate_ids": [assoc.candidate_id for assoc in associations]
            })
        return activities

    @staticmethod
    def get_active_activities(db: Session):
        activities = []
        for activity in db.query(VoteActivity).filter(VoteActivity.is_active == True).all():
            # Get associations sorted by position
            associations = db.query(ActivityCandidateAssociation).filter(
                ActivityCandidateAssociation.activity_id == activity.id
            ).order_by(ActivityCandidateAssociation.position).all()
            
            activities.append({
                "id": activity.id,
                "title": activity.title,
                "description": activity.description,
                "start_time": activity.start_time,
                "end_time": activity.end_time,
                "is_active": activity.is_active,
                "max_votes": activity.max_votes,
                "min_votes": activity.min_votes,
                "candidate_ids": [assoc.candidate_id for assoc in associations]
            })
        return activities

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

            # Add new associations with position information
            for position, candidate_id in enumerate(activity.candidate_ids):
                association = ActivityCandidateAssociation(
                    activity_id=activity_id,
                    candidate_id=candidate_id,
                    position=position  # Store the position
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
            
            # Get associations sorted by position for response
            associations = db.query(ActivityCandidateAssociation).filter(
                ActivityCandidateAssociation.activity_id == activity_id
            ).order_by(ActivityCandidateAssociation.position).all()
            
            return {
                "id": db_activity.id,
                "title": db_activity.title,
                "description": db_activity.description,
                "start_time": db_activity.start_time,
                "end_time": db_activity.end_time,
                "is_active": db_activity.is_active,
                "max_votes": db_activity.max_votes,
                "min_votes": db_activity.min_votes,
                "candidate_ids": [assoc.candidate_id for assoc in associations]
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
            db.delete(db_candidate)
            db.commit()
        except Exception as e:
            db.rollback()
            VoteService.logger.error(f"Error deleting candidate: {str(e)}")
            raise ValueError(f"无法删除候选人: {str(e)}")

    @staticmethod
    def remove_candidate_from_activity(db: Session, activity_id: int, candidate_id: int):
        """从活动中移除候选人"""
        # 检查活动是否存在
        activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not activity:
            raise ValueError("活动不存在")
        
        # 检查候选人是否存在
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise ValueError("候选人不存在")
        
        # 检查关联是否存在
        association = db.query(ActivityCandidateAssociation).filter(
            ActivityCandidateAssociation.activity_id == activity_id,
            ActivityCandidateAssociation.candidate_id == candidate_id
        ).first()
        
        if not association:
            raise ValueError("该候选人未与此活动关联")
        
        try:
            # 删除关联
            db.delete(association)
            db.commit()
            VoteService.logger.info(f"已从活动 {activity_id} 中移除候选人 {candidate_id}")
            return True
        except Exception as e:
            db.rollback()
            VoteService.logger.error(f"移除候选人错误: {str(e)}")
            raise ValueError(f"移除候选人失败: {str(e)}")

    @staticmethod
    def create_bulk_votes(db: Session, candidate_ids: List[int], voter_id: str, activity_id: int):
        try:
            # 获取活动配置
            activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
            if not activity:
                raise ValueError("投票活动不存在")
            
            # 检查活动是否激活
            if not activity.is_active:
                raise ValueError("该投票活动未激活，无法进行投票")
            
            # 检查活动是否过期
            current_time = datetime.now()
            if current_time < activity.start_time:
                raise ValueError("投票活动尚未开始")
            if current_time > activity.end_time:
                raise ValueError("投票活动已结束")
            
            # 检查投票数量是否符合要求
            if len(candidate_ids) < activity.min_votes:
                raise ValueError(f"至少需要投票给{activity.min_votes}名候选人")
            if len(candidate_ids) > activity.max_votes:
                raise ValueError(f"最多只能投票给{activity.max_votes}名候选人")
            
            # 检查候选人是否都在当前活动中
            activity_candidate_ids = [assoc.candidate_id for assoc in activity.associations]
            invalid_candidates = [cid for cid in candidate_ids if cid not in activity_candidate_ids]
            if invalid_candidates:
                raise ValueError(f"选择的候选人中有{len(invalid_candidates)}名不在该活动中")
            
            # 检查是否有重复的候选人ID
            if len(candidate_ids) != len(set(candidate_ids)):
                raise ValueError("不能对同一个候选人投多次票")
            
            # 检查用户是否已经在此活动中投过票
            existing_votes = db.query(Vote).filter(
                Vote.voter_id == voter_id,
                Vote.activity_id == activity_id
            ).count()
            
            if existing_votes > 0:
                raise ValueError("您已经在此活动中投过票了")
        
            results = {'success_count': 0, 'errors': []}
            # db.begin()下  
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
            VoteService.logger.error(f"投票失败: {str(e)}")
            raise ValueError(f"投票失败: {str(e)}")

    @staticmethod
    def get_vote_trends(db: Session) -> VoteTrendResponse:
        """获取投票趋势数据，按日期统计总投票数和每个候选人的投票数"""
        # 获取当前活动
        active_activities = VoteService.get_active_activities(db)
        if not active_activities:
            return VoteTrendResponse(trends=[], daily_totals=[])
        
        activity_id = active_activities[0]["id"]

        # 计算最早投票日期和当前日期
        earliest_vote = db.query(func.min(Vote.created_at)).filter(Vote.activity_id == activity_id).scalar()
        if not earliest_vote:
            return VoteTrendResponse(trends=[], daily_totals=[])
        
        today = datetime.now().date()
        start_date = earliest_vote.date()
        
        # 生成日期范围
        date_range = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d') 
                      for i in range((today - start_date).days + 1)]
        
        # 查询每天的投票总数
        daily_totals_query = (
            db.query(
                func.date(Vote.created_at).label('date'),
                func.count().label('count')
            )
            .filter(Vote.activity_id == activity_id)
            .group_by(func.date(Vote.created_at))
            .all()
        )
        
        daily_totals = []
        for date_str in date_range:
            count = 0
            for record in daily_totals_query:
                if record.date.strftime('%Y-%m-%d') == date_str:
                    count = record.count
                    break
            daily_totals.append(VoteTrendItem(date=date_str, count=count))
        
        # 查询每个候选人每天的投票数
        candidate_trends_query = (
            db.query(
                Candidate.id.label('candidate_id'),
                Candidate.name.label('candidate_name'),
                func.date(Vote.created_at).label('date'),
                func.count().label('count')
            )
            .join(Vote, Vote.candidate_id == Candidate.id)
            .filter(Vote.activity_id == activity_id)
            .group_by(Candidate.id, Candidate.name, func.date(Vote.created_at))
            .all()
        )
        
        # 处理每个候选人的趋势数据
        trends = []
        for record in candidate_trends_query:
            trends.append(VoteTrendItem(
                date=record.date.strftime('%Y-%m-%d'),
                count=record.count,
                candidate_id=record.candidate_id,
                candidate_name=record.candidate_name
            ))
        
        return VoteTrendResponse(trends=trends, daily_totals=daily_totals)


    @staticmethod
    async def get_student_info(stuff_id: str) -> Optional[Dict[str, str]]:
        """
        Get student information from internal API
        
        Args:
            stuff_id: Student ID
            
        Returns:
            Dictionary containing student information or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://class101.nuaa.edu.cn/stu_info/xgh/{stuff_id}")
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        return {
                            "name": data[0].get("XM", ""),
                            "college_id": data[0].get("YXDM", ""),
                            "college_name": data[0].get("YXDM_TEXT", ""),
                            "major": data[0].get("ZYMD_TEXT", ""),
                            "grade": data[0].get("NJ", ""),
                            "student_type": data[0].get("RYBQDM_TEXT", "")
                        }
        except Exception as e:
            VoteService.logger.error(f"Error fetching student info: {str(e)}")
        return {
            "name": "保底数据",
            "college_id": "0503000",
            "college_name": "自动化学院",
            "major": "控制科学与工程",
            "grade": "2023",
            "student_type": "研究生"
        }

    @staticmethod
    async def get_vote_records(db: Session, activity_id: int, college_id: Optional[str] = None, 
                         start_date: Optional[str] = None, end_date: Optional[str] = None, limit: Optional[int] = None):
        """
        Get unique voter records for export with filtering options
        
        Args:
            db: Database session
            activity_id: ID of the activity to filter votes
            college_id: Optional ID of the college to filter
            start_date: Optional start date for date range filter (YYYY-MM-DD)
            end_date: Optional end date for date range filter (YYYY-MM-DD)
            limit: Optional maximum number of records to return
            
        Returns:
            List of unique voter records formatted for export
        """
        # Get unique voters for this activity
        query = db.query(Vote.voter_id).filter(Vote.activity_id == activity_id).distinct()
        
        # Apply date range filter if provided
        if start_date:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
            query = query.filter(Vote.created_at >= start_datetime)
        
        if end_date:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(Vote.created_at <= end_datetime)
        
        # Execute query to get unique voter IDs
        voter_ids = [v[0] for v in query.all()]
        
        # Apply limit if provided (before processing records)
        if limit and limit > 0:
            voter_ids = voter_ids[:limit]
        
        # Format voter records
        formatted_records = []
        for voter_id in voter_ids:
            # Get student information
            student_info = await VoteService.get_student_info(voter_id)
            
            # Format the record
            record = {
                "voter_id": voter_id,
                "voter_college_name": student_info["college_name"] if student_info else ""
            }
            
            formatted_records.append(record)
        
        return {
            "total_voters": len(voter_ids),
            "records": formatted_records
        }
    
    @staticmethod
    def get_candidates_for_export(db: Session, activity_id: int, college_id: Optional[str] = None):
        """
        Get candidate information for export
        
        Args:
            db: Database session
            activity_id: ID of the activity to filter candidates
            college_id: Optional ID of the college to filter
            
        Returns:
            List of candidates with vote counts formatted for export
        """
        # Get candidates based on activity id
        activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not activity:
            raise ValueError(f"Activity with ID {activity_id} not found")
        
        # Get candidate IDs for this activity
        candidate_associations = db.query(ActivityCandidateAssociation).filter(
            ActivityCandidateAssociation.activity_id == activity_id
        ).order_by(ActivityCandidateAssociation.position).all()
        
        candidate_ids = [assoc.candidate_id for assoc in candidate_associations]
        
        # Query candidates
        query = db.query(Candidate).filter(Candidate.id.in_(candidate_ids))
        
        # Apply college filter if provided
        if college_id and college_id != 'all':
            query = query.filter(Candidate.college_id == college_id)
        
        candidates = query.all()
        
        # Format candidate information with vote counts
        formatted_candidates = []
        for candidate in candidates:
            # Get vote count for this candidate in this activity
            vote_count = db.query(Vote).filter(
                Vote.candidate_id == candidate.id,
                Vote.activity_id == activity_id
            ).count()
            
            formatted_candidate = {
                "id": candidate.id,
                "name": candidate.name,
                "college_id": candidate.college_id,
                "college_name": candidate.college_name,
                "photo": candidate.photo,
                "bio": candidate.bio,
                "vote_count": vote_count
            }
            
            formatted_candidates.append(formatted_candidate)
        
        return formatted_candidates
    
    @staticmethod
    def get_vote_statistics(db: Session, activity_id: int, college_id: Optional[str] = None):
        """
        Get voting statistics for export
        
        Args:
            db: Database session
            activity_id: ID of the activity
            college_id: Optional ID of the college to filter
            
        Returns:
            Dictionary with voting statistics
        """
        # Get activity information
        activity = db.query(VoteActivity).filter(VoteActivity.id == activity_id).first()
        if not activity:
            raise ValueError(f"Activity with ID {activity_id} not found")
        
        # Get candidate IDs for this activity
        candidate_associations = db.query(ActivityCandidateAssociation).filter(
            ActivityCandidateAssociation.activity_id == activity_id
        ).order_by(ActivityCandidateAssociation.position).all()
        
        candidate_ids = [assoc.candidate_id for assoc in candidate_associations]
        
        # Get candidates
        query = db.query(Candidate).filter(Candidate.id.in_(candidate_ids))
        
        # Apply college filter if provided
        if college_id and college_id != 'all':
            query = query.filter(Candidate.college_id == college_id)
        
        candidates = query.all()
        
        # Calculate statistics
        statistics = {
            "activity_info": {
                "id": activity.id,
                "title": activity.title,
                "start_time": activity.start_time,
                "end_time": activity.end_time,
                "total_candidates": len(candidates)
            },
            "vote_counts": [],
            "college_participation": {}
        }
        
        # Get vote counts for each candidate
        for candidate in candidates:
            vote_count = db.query(Vote).filter(
                Vote.candidate_id == candidate.id,
                Vote.activity_id == activity_id
            ).count()
            
            statistics["vote_counts"].append({
                "candidate_id": candidate.id,
                "candidate_name": candidate.name,
                "college_id": candidate.college_id,
                "college_name": candidate.college_name,
                "vote_count": vote_count
            })
        
        # Calculate college participation statistics
        college_votes = {}
        
        for candidate in candidates:
            college_id = candidate.college_id
            college_name = candidate.college_name
            
            if college_id not in college_votes:
                college_votes[college_id] = {
                    "college_id": college_id,
                    "college_name": college_name,
                    "total_votes": 0
                }
            
            vote_count = db.query(Vote).filter(
                Vote.candidate_id == candidate.id,
                Vote.activity_id == activity_id
            ).count()
            
            college_votes[college_id]["total_votes"] += vote_count
        
        statistics["college_participation"] = list(college_votes.values())
        
        return statistics

    @staticmethod
    async def get_candidate_stats(db: Session, activity_id: int, college_id: Optional[str] = None, 
                         start_date: Optional[str] = None, end_date: Optional[str] = None):
        """
        获取候选人得票统计数据
        
        Args:
            db: 数据库会话
            activity_id: 活动ID
            college_id: 可选的学院ID，用于筛选
            start_date: 可选的开始日期，格式YYYY-MM-DD
            end_date: 可选的结束日期，格式YYYY-MM-DD
            
        Returns:
            包含总人数和候选人得票记录的字典
        """
        # 基础查询：获取每个候选人的得票数
        query = db.query(
            Candidate.id,
            Candidate.name,
            Candidate.college_id,
            func.count(Vote.id).label('vote_count')
        ).join(
            Vote, Vote.candidate_id == Candidate.id
        ).filter(
            Vote.activity_id == activity_id
        )
        
        # 应用学院筛选（如果提供了学院ID）
        if college_id and college_id != 'all':
            query = query.filter(Candidate.college_id == college_id)
        
        # 应用日期范围筛选
        if start_date:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
            query = query.filter(Vote.created_at >= start_datetime)
        
        if end_date:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(Vote.created_at <= end_datetime)
        
        # 按候选人分组并按得票数降序排序
        query = query.group_by(
            Candidate.id,
            Candidate.name,
            Candidate.college_id
        ).order_by(desc('vote_count'))
        
        # 执行查询
        results = query.all()
        
        # 格式化结果并添加排名
        formatted_records = []
        for rank, (candidate_id, candidate_name, college_id, vote_count) in enumerate(results, 1):
            record = {
                "rank": rank,
                "college_id": college_id,
                "candidate_name": candidate_name,
                "vote_count": vote_count
            }
            formatted_records.append(record)
        
        # 获取该活动的总投票人数（去重）
        total_voters = db.query(func.count(func.distinct(Vote.voter_id))).filter(
            Vote.activity_id == activity_id
        ).scalar() or 0
        
        # 应用日期筛选到投票人数统计
        voter_query = db.query(func.distinct(Vote.voter_id)).filter(Vote.activity_id == activity_id)
        if start_date:
            voter_query = voter_query.filter(Vote.created_at >= start_datetime)
        if end_date:
            voter_query = voter_query.filter(Vote.created_at <= end_datetime)
        total_voters = voter_query.count()
        
        return {
            "total_voters": total_voters,
            "records": formatted_records
        }

    @staticmethod
    def get_total_votes_count(db: Session):
        """
        获取所有活动的总投票数
        
        Args:
            db: 数据库会话
            
        Returns:
            包含总投票数、总活动数和总候选人数的字典
        """
        # 获取总投票数
        total_votes = db.query(func.count(Vote.id)).scalar() or 0
        
        # 获取总活动数
        total_activities = db.query(func.count(VoteActivity.id)).scalar() or 0
        
        # 获取总候选人数
        total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
        
        # 获取各活动的投票数
        activity_votes = db.query(
            VoteActivity.id,
            VoteActivity.title,
            VoteActivity.is_active,
            func.count(Vote.id).label('vote_count')
        ).outerjoin(
            Vote, Vote.activity_id == VoteActivity.id
        ).group_by(
            VoteActivity.id,
            VoteActivity.title
        ).all()
        
        # 格式化活动投票数据
        activities_data = []
        for activity_id, activity_title, is_active, vote_count in activity_votes:
            activities_data.append({
                "activity_id": activity_id,
                "activity_title": activity_title,
                "vote_count": vote_count,
                "is_active": is_active
            }) 
        
        return {
            "total_votes": total_votes,
            "total_activities": total_activities,
            "total_candidates": total_candidates,
            "activities": activities_data
        }