import { useState, useEffect } from 'react'
import './App.css'

interface Candidate {
  id: number
  name: string
  college_id: number
  photo: string
  bio: string
  college_name: string
  created_at: string
  vote_count: number
}

function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [newName, setNewName] = useState('')
  const [collegeId, setCollegeId] = useState(0)
  const [photoUrl, setPhotoUrl] = useState('')
  const [bio, setBio] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [error, setError] = useState('')
  const [quote, setQuote] = useState('')
  const [review, setReview] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const response = await fetch('http://localhost:8000/candidates/')
      const data = await response.json()
      setCandidates(data)
    } catch (err) {
      setError('Failed to fetch candidates')
    }
  }

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/candidates/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName || '匿名候选人',
          college_id: collegeId,
          photo: photoUrl || 'https://picsum.photos/200/300',
          bio: bio || '暂无简介',
          college_name: collegeName || '未知学院',
          quote: quote || '暂无',
          review: review || '暂无',
          video_url: videoUrl || '暂无'
        })
      })
      if (!response.ok) {
        throw new Error('Failed to create user')
      }
      setNewName('')
      fetchCandidates()
    } catch (err) {
      setError('Failed to create user')
    }
  }

  const handleVote = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/vote/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: 1, // 暂时硬编码测试用
          voter_id: 123  // 暂时硬编码测试用
        })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to vote')
      }
      fetchCandidates()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <h1>Voting System</h1>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleCreateCandidate} className="user-form">
        <div className="form-grid">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="姓名"
          />
          <input
            type="number"
            value={collegeId}
            onChange={(e) => setCollegeId(Number(e.target.value))}
            placeholder="学院ID"
          />
          <input
            type="text"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="照片URL"
          />
          <input
            type="text"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            placeholder="学院名称"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="个人简介（选填，默认显示暂无简介）"
          />
          <input
            type="text"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="名人名言"
          />
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="评价"
          />
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="宣传视频URL"
          />
        </div>
        <button type="submit">创建候选人</button>
      </form>

      <div className="candidates-list">
        <h2>Candidates ({candidates.length}/10)</h2>
        {candidates.map(candidate => (
          <div key={candidate.id} className="user-card">
            <div className="user-info">
              <div className="candidate-header">
                <img src={candidate.photo} alt={candidate.name} className="candidate-photo" />
                <div className="candidate-info">
                  <h3>{candidate.name}</h3>
                  <p>{candidate.college_name} · ID: {candidate.college_id}</p>
                  <p className="bio">{candidate.bio}</p>
                  <p className="created-at">创建时间: {new Date(candidate.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="vote-section">
                <span className="vote-count">票数: {candidate.vote_count}/5</span>
              </div>
            <button
              onClick={() => handleVote(candidate.id)}
              disabled={candidate.vote_count >= 5}
            >
              Vote
            </button>
            </div>
            </div>
        ))}
      </div>
    </div>
  )
}

export default App
