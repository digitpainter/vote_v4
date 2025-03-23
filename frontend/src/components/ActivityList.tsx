import { useActivity } from '../contexts/ActivityContext';
import { Spin, Alert, Card, Button } from 'antd';

export function ActivityList() {
  const { activeActivities, candidates, loading, error } = useActivity();
  if (loading) return (
    <Spin tip="Loading..." size="large" fullscreen />
  );
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>进行中的投票活动</h2>
        {activeActivities.map((activity) => (
            <Card
              key={activity.id}
              title={activity.title}
              extra={<Button type="primary">查看详情</Button>}
              style={{ marginBottom: '24px' }}
            >
              <p>{activity.description}</p>
              <p>开始时间: {new Date(activity.start_time).toLocaleString()}</p>
              <p>结束时间: {new Date(activity.end_time).toLocaleString()}</p>
              <div className="candidates-container">
                {candidates
                  .filter(c => activity.candidate_ids.includes(c.id))
                  .map(candidate => (
                    <Card.Grid key={candidate.id} style={{ width: '100%' }}>
                      <img 
                        src={candidate.photo} 
                        alt={candidate.name}
                        style={{ width: 100, height: 100, objectFit: 'cover' }}
                      />
                      <h4>{candidate.name}</h4>
                      <p>学院：{candidate.college_name}</p>
                      <p>简介：{candidate.bio}</p>
                      <Button type="primary" style={{ marginTop: '12px' }}>
                        投票（当前票数：{candidate.vote_count}）
                      </Button>
                    </Card.Grid>
                  ))}
              </div>
            </Card>
        ))}
    </div>
  );
}