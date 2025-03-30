import { Empty } from 'antd';
import { VoteTrendData } from '../types/activity';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

// 工具函数：准备候选人总投票数统计
const prepareCandidateTotals = (trendData: VoteTrendData) => {
  const candidateTotals = {} as Record<number, { id: number, name: string, total: number }>;
  
  trendData.trends.forEach(item => {
    if (item.candidate_id && item.candidate_name) {
      if (!candidateTotals[item.candidate_id]) {
        candidateTotals[item.candidate_id] = {
          id: item.candidate_id,
          name: item.candidate_name,
          total: 0
        };
      }
      candidateTotals[item.candidate_id].total += item.count;
    }
  });

  return candidateTotals;
};

// 工具函数：准备候选人图表数据
const prepareChartData = (
  allDates: string[],
  topCandidates: number[],
  trendData: VoteTrendData,
  candidateTotals: Record<number, { id: number, name: string, total: number }>
) => {
  return allDates.map(date => {
    const dataPoint = {
      date: new Date(date).toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric'
      })
    } as any;
    
    // 为每个候选人添加当天的投票数
    topCandidates.forEach(candidateId => {
      const candidateData = trendData.trends.find(
        item => item.date === date && item.candidate_id === candidateId
      );
      
      const candidateName = candidateTotals[candidateId]?.name || '';
      dataPoint[candidateName] = candidateData ? candidateData.count : 0;
    });
    
    return dataPoint;
  });
};

// 候选人投票对比图组件
const CandidateComparisonChart = ({ trendData }: { trendData: VoteTrendData | null }) => {
  if (!trendData || !trendData.trends || trendData.trends.length === 0) {
    return <Empty description="暂无候选人对比数据" className="h-full flex flex-col justify-center" />;
  }

  // 准备候选人数据统计
  const candidateTotals = prepareCandidateTotals(trendData);
  
  // 获取前5名候选人
  const topCandidates = Object.values(candidateTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(c => c.id);
  
  // 获取所有日期，并按时间排序
  const allDates = [...new Set(trendData.trends.map(item => item.date))].sort();
  
  // 为每个候选人准备图表数据
  const chartData = prepareChartData(allDates, topCandidates, trendData, candidateTotals);

  // 生成颜色数组
  const colors = ['#1890ff', '#f5222d', '#52c41a', '#faad14', '#722ed1'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date"
          tick={{ fontSize: 12 }}
          label={{ 
            value: '日期', 
            position: 'insideBottomRight', 
            offset: -5,
            fontSize: 12 
          }}
        />
        <YAxis 
          label={{ 
            value: '投票数', 
            angle: -90, 
            position: 'insideLeft',
            offset: 0,
            fontSize: 12
          }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [`${value} 票`, name]}
          contentStyle={{ 
            borderRadius: '4px', 
            border: 'none', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' 
          }}
        />
        <Legend />
        {topCandidates.map((candidateId, index) => {
          const candidateName = candidateTotals[candidateId]?.name || '';
          return (
            <Line
              key={candidateId}
              type="monotone"
              dataKey={candidateName}
              name={candidateName}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6, strokeWidth: 1 }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CandidateComparisonChart; 