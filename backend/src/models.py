from sqlalchemy import ForeignKey, DateTime, Integer, String, Column, UniqueConstraint, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from .database import Base
from enum import Enum

class VoteActivity(Base):
    __tablename__ = "vote_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, server_default='0')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    associations: Mapped[list["ActivityCandidateAssociation"]] = relationship(
        back_populates="activity"
    )

    @classmethod
    def deactivate_others(cls, db, exclude_id=None):
        """Deactivates all other active activities except current one"""
        query = db.query(cls).filter(cls.is_active == True)
        if exclude_id is not None:
            query = query.filter(cls.id != exclude_id)
        query.update({'is_active': False})
        db.flush()

class ActivityCandidateAssociation(Base):
    __tablename__ = "activity_candidate_association"

    activity_id: Mapped[int] = mapped_column(ForeignKey("vote_activities.id"), primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    activity: Mapped["VoteActivity"] = relationship(back_populates="associations")
    candidate: Mapped["Candidate"] = relationship(back_populates="associations")



class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50))
    college_id: Mapped[str] = mapped_column(String(50))
    photo: Mapped[str] = mapped_column(String(200), server_default='https://via.placeholder.com/150')
    bio: Mapped[str] = mapped_column(String(500))
    college_name: Mapped[str] = mapped_column(String(100))
    quote: Mapped[str] = mapped_column(String(200), nullable=True)
    review: Mapped[str] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    votes: Mapped["Vote"] = relationship("Vote", back_populates="candidate")
    associations: Mapped[list["ActivityCandidateAssociation"]] = relationship(
        back_populates="candidate"
    )

class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    activity_id: Mapped[int] = mapped_column(ForeignKey("vote_activities.id"), nullable=False)
    voter_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="votes")
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    __table_args__ = (
        UniqueConstraint('activity_id', 'candidate_id', 'voter_id', name='uq_vote_record'),
    )


class AdminType(str, Enum):
    SCHOOL = "school"
    COLLEGE = "college"

class Administrator(Base):
    __tablename__ = "administrators"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    stuff_id: Mapped[str] = mapped_column(String(50))
    admin_type: Mapped[AdminType] = mapped_column(String(10))
    college_id: Mapped[str] = mapped_column(String(50), nullable=True)
    college_name: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('stuff_id', 'admin_type', 'college_id', name='uq_admin'),
    )