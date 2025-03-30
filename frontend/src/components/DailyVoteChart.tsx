import { Empty } from 'antd';
import AreaChart from './AreaChart';
import { VoteTrendData } from '../types/activity';

// 每日投票趋势图组件
const DailyVoteChart = ({ trendData }: { trendData: VoteTrendData | null }) => {
  if (!trendData || !trendData.daily_totals || trendData.daily_totals.length === 0) {
    return <Empty description="暂无投票趋势数据" className="h-full flex flex-col justify-center" />;
  }

  // 处理日期格式
  const formattedData = trendData.daily_totals.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric'
    })
  }));

  // 确保数据中有count字段
  if (formattedData.length > 0 && formattedData[0].count === undefined) {
    console.warn('投票数据中缺少count字段，尝试修复');
    // 尝试修复数据，假设票数字段可能使用其他名称
    const possibleCountFields = ['vote_count', 'voteCount', 'total', 'value'];
    
    // 使用类型断言避免TypeScript错误
    for (const field of possibleCountFields) {
      if (formattedData[0] && (formattedData[0] as any)[field] !== undefined) {
        formattedData.forEach(item => {
          (item as any).count = (item as any)[field];
        });
        break;
      }
    }
  }

  return (
    <AreaChart 
      data={formattedData} 
      xKey="formattedDate" 
      yKey="count" 
      name="投票数" 
      areaColor="#40a9ff"
    />
  );
};

export default DailyVoteChart; 