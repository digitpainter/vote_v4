import { useActivity } from '../contexts/ActivityContext';
import { Spin, Alert, Card, Button ,Grid, Row, Col, Flex,Avatar,Typography} from 'antd';
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


            <div
              key={activity.id}
              style={{ marginBottom: '24px' }}
            >

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 gap-y-4">
                {candidates
                  .filter(c => activity.candidate_ids.includes(c.id))
                  .map(candidate => (
                    <Card key={candidate.id} className="relative hover:shadow-lg transition-shadow duration-300 shadow-md">
                      <Row gutter={[16, 16]} className="w-full">
                        <Col xs={24} md={6} className="flex justify-center">
                          <Avatar
                            src={candidate.photo}
                            alt={candidate.name}
                            shape="square"
                            size={128}
                            className="rounded-lg object-cover w-32 h-32 md:w-36 md:h-36"
                          />
                        </Col>
                        <Col xs={24} md={18}>
                          <div className="h-full flex flex-col justify-between">
                            <Typography.Title level={4} className="!mt-0 !mb-2 !text-gray-800">
                              {candidate.name}
                            </Typography.Title>
                            <Typography.Text type="secondary" className="text-base mb-2">
                              学院：{candidate.college_name}
                            </Typography.Text>
                            <Typography.Paragraph
                              ellipsis={{ rows: 3, expandable: true }}
                              className="!text-gray-600 !mb-4"
                            >
                              {candidate.bio}
                            </Typography.Paragraph>
                          </div>
                        </Col>
                      </Row>
                        <div className="absolute top-2 right-2 bg-white bg-opacity-80 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                          票数：{candidate.vote_count}
                        </div>
                    </Card>
                    
                  ))}
              </div>
            </div>
          </div>
        ))}
      <div></div>
    </div>
  );
}
