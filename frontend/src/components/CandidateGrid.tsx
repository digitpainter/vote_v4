import { Activity } from '../types/activity';
import { Candidate } from '../types/candidate';
import { Card, Row, Col, Avatar, Typography } from 'antd';

type CandidateGridProps = {
  activity: Activity;
  candidates: Candidate[];
};

export function CandidateGrid({ activity, candidates }: CandidateGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 gap-y-4">
      {candidates
        .filter(c => activity.candidate_ids.includes(c.id))
        .map(candidate => (
          <Card key={candidate.id}
                className="relative hover:shadow-lg transition-shadow duration-300 shadow-md">
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
                    ellipsis={{rows: 3, expandable: true}}
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
  );
}