import { Activity } from '../types/activity';
import { Candidate } from '../types/candidate';
import { Card, Row, Col, Image, Typography } from 'antd';
import { BASE64_PLACEHOLDER } from '../constants/images'
import { useState, useEffect } from 'react';
import { getAllCollegeInfo, CollegeInfo, getCollegeNameById } from '../api/college';
import { useActivity } from '../contexts/ActivityContext';

type CandidateGridProps = {
  activity: Activity;
  candidates: Candidate[];
  refreshTrigger?: number; // Optional prop to trigger refresh
};

export function CandidateGrid({ activity, candidates: initialCandidates, refreshTrigger = 0 }: CandidateGridProps) {
  const [collegeInfoList, setCollegeInfoList] = useState<CollegeInfo[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const { refreshCandidates } = useActivity();

  // Fetch college info on mount
  useEffect(() => {
    const fetchCollegeInfo = async () => {
      try {
        const data = await getAllCollegeInfo();
        setCollegeInfoList(data);
      } catch (error) {
        console.error('获取学院信息失败:', error);
      }
    };
    fetchCollegeInfo();
  }, []);

  // Update candidates when initialCandidates or refreshTrigger changes
  useEffect(() => {
    setCandidates(initialCandidates);
  }, [initialCandidates]);

  // Refresh candidates data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      const refreshCandidateData = async () => {
        try {
          if (activity.candidate_ids.length > 0) {
            const updatedCandidates = await refreshCandidates(activity.candidate_ids.map(id => id.toString()));
            setCandidates(updatedCandidates);
          }
        } catch (error) {
          console.error('刷新候选人数据失败:', error);
        }
      };
      refreshCandidateData();
    }
  }, [refreshTrigger, activity.candidate_ids, refreshCandidates]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 gap-y-4">
      {candidates
        .filter(c => activity.candidate_ids.includes(c.id))
        .map(candidate => (
          <Card key={candidate.id}
                className="relative hover:shadow-lg transition-shadow duration-300 shadow-md">
            <Row gutter={[16, 16]} className="w-full">
              <Col xs={24} md={6} className="flex justify-center">
                <Image
                  src={candidate.photo}
                  alt={candidate.name}
                  className="rounded-lg object-cover flex items-center object-center"
                  preview={true}
                  fallback={BASE64_PLACEHOLDER}
                  width={130}
                  height={130}
                />
              </Col>
              <Col xs={24} md={18}>
                <div className="h-full flex flex-col justify-between">
                  <Typography.Title level={4} className="!mt-0 !mb-2 !text-gray-800">
                    {candidate.name}
                  </Typography.Title>
                  <Typography.Text type="secondary" className="text-base mb-2">
                    学院：{getCollegeNameById(collegeInfoList, candidate.college_id)}
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