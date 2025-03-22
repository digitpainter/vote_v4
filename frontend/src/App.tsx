import './App.css'
import { useContext } from 'react'
import { ActivityProvider, useActivity } from './contexts/ActivityContext'

function ActivityList() {
  const { activeActivities, candidates, loading, error } = useActivity();

  if (loading) return <div>Loading activities...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Active Activities</h2>
      <div className="activities-list">
        {activeActivities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <h3>{activity.title}</h3>
            <p>{activity.description}</p>
            {
            candidates.map((candidate) =>
              activity.candidate_ids.includes(candidate.candidate_id) && (
                <div key={candidate.candidate_id} className="candidate-item">
                  <h4>{candidate.name}</h4>
                  <p>description: {candidate.description}</p>
                  <p>department: {candidate.department}</p>
                  <p>photo_url: {candidate.photo_url}</p>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <ActivityProvider>
      <div className="container">
        <ActivityList />
      </div>
    </ActivityProvider>
  )
}

export default App
