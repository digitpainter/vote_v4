import { Key, useState } from 'react';
import {useActivity} from '../contexts/ActivityContext';
import {Spin, Alert, Card, Row, Col, Avatar, Typography, Table} from 'antd';
import {formatDateTime} from '../utils/date';
import { CandidateTable } from './CandidateTable';
import { CandidateGrid } from './CandidateGrid';
export function IconRow({icon, label, value}: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 md:gap-6 p-2 md:p-4 flex-1">
      <div
        className="w-12 h-12 bg-contain bg-no-repeat bg-center"
        style={{backgroundImage: `url(${icon})`}}
      />
      <div className="flex md:flex-col md-max:flex-row items-start md:items-center gap-2 flex-1">
        <span className="w-24 text-sm font-medium text-gray-600 shrink-0">{label}</span>
        <span className="text-base text-gray-800 text-center md:text-left break-all">{value}</span>
      </div>
    </div>
  );
}

export function ActivityList() {
  const {activeActivities, candidates, loading, error} = useActivity();

  if (loading) return (
    <Spin tip="Loading..." size="large" fullscreen/>
  );
  if (error) return <Alert message="Error" description={error} type="error" showIcon/>;

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
            style={{marginBottom: '24px'}}
          >
            <CandidateGrid activity={activity} candidates={candidates} />
          </div>
          <div className="mt-8">
            <CandidateTable
              candidates={candidates}
              activity={activity}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
