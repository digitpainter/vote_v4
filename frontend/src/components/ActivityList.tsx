import { useActivity } from '../contexts/ActivityContext';
import { Spin, Alert, Card, Button ,Grid, Row, Col, Flex} from 'antd';
import { formatDateTime } from '../utils/date';

export function IconRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 md:gap-6 p-2 md:p-4 flex-1">
      <div 
        className="w-12 h-12 bg-contain bg-no-repeat bg-center"
        style={{ backgroundImage: `url(${icon})` }}
      />
      <div className="flex md:flex-col md-max:flex-row items-start md:items-center gap-2 flex-1">
        <span className="w-24 text-sm font-medium text-gray-600 shrink-0">{label}</span>
        <span className="text-base text-gray-800 text-center md:text-left break-all">{value}</span>
      </div>
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
            <Card className='mt-[-40px] z-[1001]'>
              <div className="flex max-md:flex-col md:flex-row gap-4 mb-6">
              <IconRow 
                icon="/image/start_icon.svg"
                label="活动时间"
                value={formatDateTime(activity.start_time)}
              />
              <IconRow 
                icon="/image/end_icon.svg"
                label="活动时间"
                value={formatDateTime(activity.end_time)}
              />
              <IconRow 
                icon="/image/rule_icon.svg"
                label="活动描述"
                value={activity.description}
              />
            </div>
          </Card>
            
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