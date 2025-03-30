import { 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Empty } from 'antd';

// 区域图组件
const AreaChart = ({ 
  data, 
  xKey, 
  yKey, 
  name,
  height = 360,
  areaColor = '#1890ff'
}: { 
  data: any[]; 
  xKey: string; 
  yKey: string; 
  name: string;
  height?: number;
  areaColor?: string;
}) => {
  if (!data || data.length === 0) {
    return <Empty description="暂无数据" className="h-full flex flex-col justify-center" />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
      >
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={areaColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={areaColor} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
        <XAxis 
          dataKey={xKey}
          axisLine={{ stroke: '#ccc' }}
          tick={{ fill: '#666' }}
        />
        <YAxis 
          axisLine={{ stroke: '#ccc' }}
          tick={{ fill: '#666' }}
          domain={[0, 'auto']}
        />
        <Tooltip 
          formatter={(value: number) => [`${value} 票`, name]}
          contentStyle={{ 
            backgroundColor: 'white',
            borderRadius: '4px', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          cursor={{ stroke: '#ccc', strokeDasharray: '3 3' }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey={yKey}
          name={name}
          stroke={areaColor}
          fillOpacity={1}
          fill="url(#colorGradient)"
          strokeWidth={2}
          activeDot={{ r: 6, strokeWidth: 1, fill: '#fff', stroke: areaColor }}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChart; 