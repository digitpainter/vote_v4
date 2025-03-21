import { useState, useEffect } from 'react'
import './App.css'

interface User {
  id: number
  username: string
  vote_count: number
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/users/')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError('Failed to fetch users')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      })
      if (!response.ok) {
        throw new Error('Failed to create user')
      }
      setNewUsername('')
      fetchUsers()
    } catch (err) {
      setError('Failed to create user')
    }
  }

  const handleVote = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/vote/${userId}`, {
        method: 'POST'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to vote')
      }
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <h1>Voting System</h1>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleCreateUser} className="user-form">
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="Enter username"
          required
        />
        <button type="submit">Create User</button>
      </form>

      <div className="users-list">
        <h2>Users ({users.length}/10)</h2>
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-info">
              <span className="username">{user.username}</span>
              <span className="vote-count">Votes: {user.vote_count}/5</span>
            </div>
            <button
              onClick={() => handleVote(user.id)}
              disabled={user.vote_count >= 5}
            >
              Vote
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
