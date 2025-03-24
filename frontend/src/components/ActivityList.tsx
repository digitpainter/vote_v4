import { useActivity } from '../contexts/ActivityContext';
import { Spin, Alert, Card, Button ,Grid, Row, Col, Flex} from 'antd';
import { formatDateTime } from '../utils/date';

export function IconRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    
      <Flex className="w-full h-[66px] items-center md:w-[30vw] md:justify-around">
            <div 
              className="w-[30px] h-[36px] md:w-[50px] md:h-[56px] bg-contain bg-no-repeat bg-center"
              style={{ backgroundImage: `url(${icon})` }}
              aria-label={label}
            />
            <Flex className="md:flex-col text-center items-center w-full">
              <h4 className="text-base md:text-lg w-full">{label}</h4>
              <div className="text-base md:text-lg text-gray-600 max-w-[30vw]">{value}</div>
            </Flex>
      </Flex>
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
            <Card className="mt-[-40px] mb-[50px] w-[86vw] h-[25vh] relative z-[1001]">
                <div className='flex-auto flex max-md:flex-col md:flex-row'>
                  <Col>
                    <IconRow
                      icon="/image/start_icon.svg"
                      label="开始时间"
                      value={formatDateTime(activity.start_time)}
                    />
                  </Col>
                  <Col>
                    <IconRow
                      icon="/image/end_icon.svg"
                      label="结束时间"
                      value={formatDateTime(activity.end_time)}
                    />
                  </Col>
                  <Col>
                    <IconRow
                      icon="/image/rule_icon.svg"
                      label="投票规则"
                      value={activity.description}
                    />
                  </Col>
                </div >
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