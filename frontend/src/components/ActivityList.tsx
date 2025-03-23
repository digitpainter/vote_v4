import { useActivity } from '../contexts/ActivityContext';
import { Spin, Alert, Card, Button ,Grid, Row, Col, Flex} from 'antd';
import { formatDateTime } from '../utils/date';

export function IconRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
      <div classname = "flex"
>
            <img src={icon} className="w-10 h-10 object-contain" alt={label} />
            <h4 className="mb-1 text-base md:text-lg text-center">{label}</h4>
            <div className="mb-1 text-gray-600 text-sm md:text-base text-center">{value}</div>
      </div>
  );
}

export function ActivityList() {
  const { activeActivities, candidates, loading, error } = useActivity();
  if (loading) return (
    <Spin tip="Loading..." size="large" fullscreen />
  );
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div className="px-4 md:px-24">
        {activeActivities.map((activity) => (
            <div key={activity.id}>

                  <ul className='flex flex-col md:flex-row'>
                    <li className='flex'>
                      测试1
                    </li>
                    <li className='flex'>
                      测试1
                    </li>
                    <li className='flex'>
                      测试1
                    </li>
                  </ul>
            <Card
              key={activity.id}
              style={{ marginBottom: '24px' }}
            >

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
                      <h4 className="md:text-lg">{candidate.name}</h4>
                      <p className="text-sm md:text-base">学院：{candidate.college_name}</p>
                      <p className="text-sm md:text-base">简介：{candidate.bio}</p>
                      <Button type="primary" style={{ marginTop: '12px' }}>
                            投票（当前票数：{candidate.vote_count}）
                          </Button>
                      </Card.Grid>
                  ))}
              </div>
            </Card>
          </div>
        ))}
    </div>
  );
}