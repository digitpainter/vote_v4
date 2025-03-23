import { useActivity } from '../contexts/ActivityContext';
import { Spin, Alert, Card, Button ,Grid, Row, Col} from 'antd';
import { formatDateTime } from '../utils/date';

export function IconRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Col span={24} className="mb-4">
      <>
        {/* 移动端布局 */}
        <Row align="middle" gutter={8} className="md:hidden">
          <Col span={4} className="flex items-center justify-center">
            <img src={icon} className="w-10 h-10 object-contain" alt={label} />
          </Col>
          <Col span={6}  className="flex items-center">
            <h4 className="mb-1">{label}</h4>
          </Col>
          <Col span={12} className="flex items-center">
            <div className="mb-1 text-gray-600">{value}</div>
          </Col>
        </Row>

        {/* 桌面端布局
        <Row gutter={16} className="hidden md:flex items-center" style={{ width: '100%' }}>
          <Col span={8} className="flex justify-center items-center">
            <img src={icon} className="w-16 h-16 object-contain" alt={label} />
          </Col>
          <Col span={16} className="flex flex-col space-y-2">
            <h4 className="text-lg font-semibold">{label}</h4>
            <div className="text-gray-600 text-base">{value}</div>
          </Col>
        </Row> */}
      </>
    </Col>
  );
}

export function ActivityList() {
  const { activeActivities, candidates, loading, error } = useActivity();
  if (loading) return (
    <Spin tip="Loading..." size="large" fullscreen />
  );
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div style={{ padding: '24px' }}>
        {activeActivities.map((activity) => (
            <div key={activity.id}>
              <Card className="mt-[-40px] relative z-[1001]">
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <IconRow
                      icon="/image/start_icon.svg"
                      label="开始时间"
                      value={formatDateTime(activity.start_time)}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <IconRow
                      icon="/image/end_icon.svg"
                      label="结束时间"
                      value={formatDateTime(activity.end_time)}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <IconRow
                      icon="/image/rule_icon.svg"
                      label="投票规则"
                      value={activity.description}
                    />
                  </Col>
                </Row>
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
          </div>
        ))}
    </div>
  );
}