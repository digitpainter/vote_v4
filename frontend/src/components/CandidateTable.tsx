import { Key, useState } from 'react';
import { Table, Avatar, Typography } from 'antd';
import { Candidate } from '../types/candidate';
import { Activity } from '../types/activity';

type CandidateTableProps = {
  candidates: Candidate[];
  activity: Activity;
};

export function CandidateTable({
  candidates,
  activity,
}: CandidateTableProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [expandedRowKey, setExpandedRowKey] = useState<Key | null>(null);
  return (
    <Table
      dataSource={candidates.filter(c => activity.candidate_ids.includes(c.id))}
      columns={[
        Table.EXPAND_COLUMN,
        {
          title: '学院',
          dataIndex: 'college_name',
          key: 'college',
          className: 'px-2 md:px-4'
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
      rowSelection={{
        type: 'checkbox',
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
      }}
      onRow={(record) => ({
        onClick: () => {
          const key = record.id;
          setSelectedRowKeys(prev =>
            prev.includes(key)
              ? prev.filter(k => k !== key)
              : [...prev, key]
          );
        },
        onTouchStart: () => {
          const key = record.id;
          const timer = setTimeout(() => {
            setExpandedRowKey(prev => prev === key ? null : key);
          }, 500);
          // @ts-ignore
          event.currentTarget.timer = timer;
        },
        onTouchEnd: () => {
          // @ts-ignore
          clearTimeout(event.currentTarget?.timer);
        },
      })}
      expandable={{
        expandedRowRender: (record) => (
          <div className="flex gap-4 p-4">
            <img 
              src={record.photo}
              alt={record.name}
              className="w-26 h-26 object-cover rounded-lg"
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
    />
  );
}