from sqlalchemy import ForeignKey, DateTime,Integer, String, Column ,UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from database import Base

class VoteActivity(Base):
    __tablename__ = "vote_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500))
    start_time: Mapped[datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    candidates: Mapped[list["Candidate"]] = relationship("Candidate", back_populates="activity")

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    college_id: Mapped[int] = mapped_column(Integer)
    photo: Mapped[str] = mapped_column(String(200), server_default='https://via.placeholder.com/150')
    bio: Mapped[str] = mapped_column(String(500))
    college_name: Mapped[str] = mapped_column(String(100))
    quote: Mapped[str] = mapped_column(String(200), nullable=True)
    review: Mapped[str] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    votes: Mapped["Vote"] = relationship("Vote", back_populates="candidate")

class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    activity_id: Mapped[int] = mapped_column(ForeignKey("vote_activities.id"), nullable=False)
    voter_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="votes")
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    __table_args__ = (
        UniqueConstraint('activity_id', 'candidate_id', 'voter_id', name='uq_vote_record'),
    )