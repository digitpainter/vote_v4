import { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Button, 
  Select, 
  Space, 
  Table, 
  DatePicker, 
  message, 
  Tabs,
  Alert,
  Divider,
  Tooltip
} from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PieChartOutlined,
  InfoCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// 活动数据类型
interface Activity {
  id: string;
  name: string;
}

// 投票记录类型
interface VoteRecord {
  id: string;
  voterId: string;
  voterName: string;
  candidateId: string;
  candidateName: string;
  activityId: string;
  activityName: string;
  collegeId: string;
  collegeName: string;
  voteTime: string;
}

// 导出格式类型
type ExportFormat = 'excel' | 'pdf' | 'csv';

// 导出类型
type ExportType = 'vote_records' | 'statistics' | 'candidates';

export default function DataPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [exportType, setExportType] = useState<ExportType>('vote_records');
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 模拟获取数据
  useEffect(() => {
    setTimeout(() => {
      const dummyActivities = [
        { id: '1', name: '2024学生会选举' },
        { id: '2', name: '优秀教师评选' },
        { id: '3', name: '最佳班级评选' }
      ];
      setActivities(dummyActivities);
      setLoading(false);
    }, 1000);
  }, []);

  // 表格列定义 - 投票记录
  const voteRecordColumns: TableColumnsType<VoteRecord> = [
    {
      title: '投票人ID',
      dataIndex: 'voterId',
      key: 'voterId',
    },
    {
      title: '投票人',
      dataIndex: 'voterName',
      key: 'voterName',
    },
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
    },
    {
      title: '所属学院',
      dataIndex: 'collegeName',
      key: 'collegeName',
    },
    {
      title: '活动名称',
      dataIndex: 'activityName',
      key: 'activityName',
    },
    {
      title: '投票时间',
      dataIndex: 'voteTime',
      key: 'voteTime',
      sorter: (a, b) => new Date(a.voteTime).getTime() - new Date(b.voteTime).getTime(),
    },
  ];

  // 预览数据
  const handlePreview = () => {
    setPreviewLoading(true);
    // 模拟API调用获取预览数据
    setTimeout(() => {
      // 生成模拟数据
      const dummyVoteRecords: VoteRecord[] = [];
      
      for (let i = 1; i <= 20; i++) {
        dummyVoteRecords.push({
          id: `${i}`,
          voterId: `student_${1000 + i}`,
          voterName: `投票人${i}`,
          candidateId: `candidate_${i % 5 + 1}`,
          candidateName: `候选人${i % 5 + 1}`,
          activityId: selectedActivity,
          activityName: activities.find(a => a.id === selectedActivity)?.name || '',
          collegeId: `college_${i % 4 + 1}`,
          collegeName: i % 4 === 0 ? '计算机学院' : i % 4 === 1 ? '商学院' : i % 4 === 2 ? '文学院' : '理学院',
          voteTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19)
        });
      }
      
      setVoteRecords(dummyVoteRecords);
      setPreviewLoading(false);
    }, 1000);
  };

  // 下载数据
  const handleDownload = () => {
    if (!selectedActivity) {
      message.warning('请先选择活动');
      return;
    }

    // 获取文件格式文本
    const formatText = exportFormat === 'excel' ? 'Excel' : exportFormat === 'pdf' ? 'PDF' : 'CSV';
    
    // 获取导出类型文本
    const typeText = 
      exportType === 'vote_records' ? '投票记录' : 
      exportType === 'statistics' ? '统计数据' : '候选人信息';
    
    // 模拟下载
    message.success(`正在下载${formatText}格式的${typeText}，请稍候...`);
    
    // 实际中这里应该调用API进行下载
    setTimeout(() => {
      message.success(`${formatText}格式的${typeText}下载完成`);
    }, 1500);
  };

  // 获取导出格式图标
  const getFormatIcon = (format: ExportFormat) => {
    switch(format) {
      case 'excel':
        return <FileExcelOutlined className="text-green-600" />;
      case 'pdf':
        return <FilePdfOutlined className="text-red-600" />;
      case 'csv':
        return <FileTextOutlined className="text-blue-600" />;
      default:
        return <FileTextOutlined />;
    }
  };

  return (
    <div>
      <Title level={2}>数据下载</Title>
      <Paragraph className="mb-6">
        您可以在此页面下载投票系统的各类数据报表，包括投票记录、统计数据和候选人信息。
      </Paragraph>
      
      <Tabs defaultActiveKey="export" className="mb-6">
        <TabPane 
          tab={<span><DownloadOutlined /> 数据导出</span>} 
          key="export"
        >
          <Card className="mb-6 shadow-sm">
            <Alert
              message="数据导出说明"
              description="导出的数据将包含所选活动的相关信息。如果选择了日期范围，则只会导出该时间范围内的数据。请注意保护导出数据的安全，不要随意传播。"
              type="info"
              showIcon
              className="mb-6"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Title level={4}>导出选项</Title>
                <Divider />
                
                <div className="mb-4">
                  <Text strong>选择活动</Text>
                  <Tooltip title="必须选择一个活动才能导出数据">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                  <div className="mt-2">
                    <Select
                      placeholder="请选择要导出数据的活动"
                      style={{ width: '100%' }}
                      value={selectedActivity}
                      onChange={value => setSelectedActivity(value)}
                      loading={loading}
                    >
                      {activities.map(activity => (
                        <Option key={activity.id} value={activity.id}>{activity.name}</Option>
                      ))}
                    </Select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Text strong>选择日期范围</Text>
                  <Tooltip title="可选，如不选择则导出全部时间段的数据">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                  <div className="mt-2">
                    <RangePicker 
                      style={{ width: '100%' }} 
                      onChange={(dates) => {
                        if (dates) {
                          setDateRange([dates[0]?.toDate() as Date, dates[1]?.toDate() as Date]);
                        } else {
                          setDateRange(null);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <Text strong>导出数据类型</Text>
                  <div className="mt-2">
                    <Select
                      value={exportType}
                      onChange={value => setExportType(value)}
                      style={{ width: '100%' }}
                    >
                      <Option value="vote_records">
                        <BarChartOutlined /> 投票记录
                      </Option>
                      <Option value="statistics">
                        <PieChartOutlined /> 统计数据
                      </Option>
                      <Option value="candidates">
                        <TeamOutlined /> 候选人信息
                      </Option>
                    </Select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Text strong>导出格式</Text>
                  <div className="mt-2">
                    <Select
                      value={exportFormat}
                      onChange={value => setExportFormat(value)}
                      style={{ width: '100%' }}
                    >
                      <Option value="excel">
                        <FileExcelOutlined className="text-green-600" /> Excel 文件 (.xlsx)
                      </Option>
                      <Option value="pdf">
                        <FilePdfOutlined className="text-red-600" /> PDF 文件 (.pdf)
                      </Option>
                      <Option value="csv">
                        <FileTextOutlined className="text-blue-600" /> CSV 文件 (.csv)
                      </Option>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  size="large"
                  onClick={handleDownload}
                  disabled={!selectedActivity}
                  className="mt-4"
                  block
                >
                  下载 {getFormatIcon(exportFormat)} {exportFormat.toUpperCase()} 文件
                </Button>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Title level={4}>数据预览</Title>
                  <Button 
                    type="primary" 
                    ghost 
                    onClick={handlePreview}
                    disabled={!selectedActivity}
                  >
                    刷新预览
                  </Button>
                </div>
                <Divider />
                
                <Table 
                  columns={voteRecordColumns} 
                  dataSource={voteRecords}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  loading={previewLoading}
                  scroll={{ x: 'max-content' }}
                />
                
                <div className="mt-4 text-gray-500 text-center">
                  <Text type="secondary">
                    预览仅显示部分数据，完整数据请下载文件查看
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={<span><BarChartOutlined /> 数据分析</span>} 
          key="analysis"
        >
          <Card className="mb-6 shadow-sm p-6">
            <div className="text-center py-12">
              <Title level={3} type="secondary">数据分析功能即将上线</Title>
              <Paragraph>
                敬请期待更多高级数据分析功能，包括投票趋势分析、票数分布统计、学院参与度分析等。
              </Paragraph>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
} 