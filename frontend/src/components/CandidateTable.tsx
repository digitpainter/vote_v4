import { Key, useState , useEffect} from 'react';
import { Table, Image, Typography, Button, message,Alert } from 'antd';
import { submitVotes } from '../api/vote';
import { Candidate } from '../types/candidate';
import { Activity } from '../types/activity';
import { BASE64_PLACEHOLDER } from '../constants/images'
import { useActivity } from '../contexts/ActivityContext';
import { getActivityVotes } from "../api/vote"
import { getAllCollegeInfo, CollegeInfo, getCollegeNameById } from '../api/college';

type CandidateTableProps = {
  candidates: Candidate[];
  activity: Activity;
  onVoteSubmitted?: () => void;
};

export function CandidateTable({
  candidates,
  activity,
  onVoteSubmitted,
}: CandidateTableProps) {
  const { maxVotes, minVotes, refreshCandidates } = useActivity();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedCandidates, setVotedCandidates] = useState<number[]>([]);
  const [collegeInfoList, setCollegeInfoList] = useState<CollegeInfo[]>([]);

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

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const votesData = await getActivityVotes(activity.id);
        console.info(votesData)
        const hasVoted = votesData.length > 0;
        setHasVoted(hasVoted);
        setVotedCandidates(votesData);
        if (hasVoted) {
          setSelectedRowKeys(votesData);
        }
      } catch (error) {
        console.error('Error checking voting status:', error);
      }
    };
    checkStatus();
  }, [activity.id]);
  
  const [expandedRowKey, setExpandedRowKey] = useState<Key | null>(null);
  return (
    <Table
      dataSource={candidates.filter(c => activity.candidate_ids.includes(c.id))}
      columns={[
        Table.EXPAND_COLUMN,
        {
          title: '学院',
          dataIndex: 'college_id',
          key: 'college',
          className: 'px-2 md:px-4',
          render: (collegeId, record) => getCollegeNameById(collegeInfoList, collegeId)
        },
        {
          title: '姓名',
          dataIndex: 'name',
          key: 'name',
          className: 'px-2 md:px-4 whitespace-nowrap'
        },
      ]}
      rowKey="id"
      className="dir-rtl shadow-md rounded-lg overflow-hidden"
      rowClassName={(_, index) => index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
      rowSelection={{
        getCheckboxProps: (record) => ({
          disabled: hasVoted
        }),
        type: 'checkbox',
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
      }}
      onRow={(record) => ({
        onClick: () => {
          if (hasVoted) return;
          const key = record.id;
          setSelectedRowKeys(prev =>
            prev.includes(key)
              ? prev.filter(k => k !== key)
              : [...prev, key]
          );
        },
        // onTouchStart: () => {
        //   const key = record.id;
        //   const timer = setTimeout(() => {
        //     setExpandedRowKey(prev => prev === key ? null : key);
        //   }, 500);
        //   // @ts-ignore
        //   event.currentTarget.timer = timer;
        // },
        // onTouchEnd: () => {
        //   // @ts-ignore
        //   clearTimeout(event.currentTarget?.timer);
        // },
      })}
      expandable={{
        expandedRowRender: (record) => (
          <div className="flex gap-4 p-4">
            <Image
              src={record.photo}
              alt={record.name}
              className="object-cover rounded-lg flex items-center justify-center"
              preview={true} 
              width={110}
              height={110}
              fallback={BASE64_PLACEHOLDER}
              />
            <div className="flex-1">
              <Typography.Paragraph 
                className="text-sm whitespace-pre-wrap"
                ellipsis={{ rows: 5 }}
              >
                {record.bio}
              </Typography.Paragraph>
            </div>
          </div>
        ),
        expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
        onExpand: (expanded, record) => {
          setExpandedRowKey(expanded ? record.id : null);
        }
      }}
      pagination={false}
      scroll={{ x: true }}
      footer={() => (
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200">
          {!hasVoted ? (
            <Button
              type="primary"
              size="large"
              disabled={selectedRowKeys.length < minVotes || selectedRowKeys.length > maxVotes}
              className="w-full"
              onClick={async () => {
                try {
                  await submitVotes(activity.id, selectedRowKeys as string[]);
                  message.success('投票成功');
                  setHasVoted(true);
                  
                  // Refresh candidate data
                  if (activity.candidate_ids.length > 0) {
                    await refreshCandidates(activity.candidate_ids.map(id => id.toString()));
                  }
                  
                  // Call the callback to notify parent component
                  if (onVoteSubmitted) {
                    onVoteSubmitted();
                  }
                } catch (error) {
                  message.error('投票失败，请稍后重试');
                  console.error(error);
                }
              }}
            >
              投票（{selectedRowKeys.length}）{minVotes !== maxVotes ? `需投满${minVotes}-${maxVotes}票` : `最多${maxVotes}票`}
            </Button>
          ) : (
            <Alert
              message="您已完成本次投票,感谢支持"
              type="success"
              showIcon
              className="w-full"
            />
          )}
        </div>
      )}
    />
  );
}