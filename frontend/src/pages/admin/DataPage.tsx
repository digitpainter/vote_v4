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
  TeamOutlined,
  BankOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 活动数据类型 - 更新为匹配API响应格式
interface Activity {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  candidate_ids: number[];
  max_votes: number;
  min_votes: number;
}

// 学院类型
interface College {
  YXDM: string;
  YXDM_TEXT: string;
}

// 投票记录类型
interface VoteRecord {
  id: string;
  voterId: string;
  voterName: string;
  candidateId: string;
  candidateName: string;
  activityId: number;
  activityName: string;
  collegeId: string;
  collegeName: string;
  voteTime: string;
}

// 学生信息类型
interface StudentInfo {
  XGH: string;       // 学号
  XM: string;        // 姓名
  YXDM_TEXT: string; // 学院名称
  YXDM: string;      // 学院代码
  ZYMD_TEXT: string; // 专业
  NJ: string;        // 年级
  XBDM_TEXT: string; // 性别
}

// 导出格式类型
type ExportFormat = 'excel' | 'pdf' | 'csv';

// 导出类型
type ExportType = 'vote_records' | 'statistics' | 'candidates';

export default function DataPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [exportType, setExportType] = useState<ExportType>('vote_records');
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // 新增状态
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // 获取所有活动
  useEffect(() => {
    fetchActivities();
    fetchColleges();
  }, []);

  // 获取活动列表
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/vote/activities/');
      setActivities(response.data);
    } catch (error) {
      console.error('获取活动失败:', error);
      message.error('获取活动列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取学院列表
  const fetchColleges = async () => {
    try {
      const response = await axios.get('http://localhost:8000/vote/colleges/');
      // 添加"全部学院"选项
      const allColleges = [
        { YXDM: 'all', YXDM_TEXT: '全部学院' },
        ...response.data
      ];
      setColleges(allColleges);
    } catch (error) {
      console.error('获取学院列表失败:', error);
      message.error('获取学院列表失败，请稍后重试');
      // 设置默认值，确保界面不会崩溃
      setColleges([{ YXDM: 'all', YXDM_TEXT: '全部学院' }]);
    }
  };

  // 获取学生信息
  const getStudentInfo = async (studentId: string): Promise<StudentInfo | null> => {
    // 这个应该是后端调用，前端只需要发送请求到后端
    // 示例实现，实际情况中应该通过后端API获取
    try {
      const response = await axios.get(`/api/student/${studentId}`);
      return response.data[0] || null;
    } catch (error) {
      console.error('获取学生信息失败:', error);
      return null;
    }
  };

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
      title: '所属学院',
      dataIndex: 'collegeName',
      key: 'collegeName',
      filters: colleges.filter(college => college.YXDM !== 'all').map(college => ({
        text: college.YXDM_TEXT,
        value: college.YXDM,
      })),
      onFilter: (value, record) => record.collegeId === value,
    },
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
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
  const handlePreview = async () => {
    if (!selectedActivity) {
      message.warning('请先选择活动');
      return;
    }
    
    setPreviewLoading(true);
    try {
      // 在实际应用中，这里应调用后端API获取数据
      // const params = {
      //   activity_id: selectedActivity,
      //   college_id: selectedCollege !== 'all' ? selectedCollege : undefined,
      //   start_date: dateRange ? dateRange[0].toISOString().split('T')[0] : undefined,
      //   end_date: dateRange ? dateRange[1].toISOString().split('T')[0] : undefined,
      // };
      // const response = await axios.get('/api/vote-records/preview', { params });
      // setVoteRecords(response.data);
      
      // 模拟API调用获取预览数据
      setTimeout(() => {
        // 生成模拟数据
        const dummyVoteRecords: VoteRecord[] = [];
        const activityName = activities.find(a => a.id === selectedActivity)?.title || '';
        
        for (let i = 1; i <= 20; i++) {
          const collegeIndex = i % colleges.length;
          const college = colleges[collegeIndex === 0 ? 1 : collegeIndex]; // 跳过"全部学院"选项
          
          // 如果选择了特定学院且不是"全部学院"，则只显示该学院的记录
          if (selectedCollege && selectedCollege !== 'all' && college.YXDM !== selectedCollege) {
            continue;
          }
          
          dummyVoteRecords.push({
            id: `${i}`,
            voterId: `BC${2300 + i}`,
            voterName: `学生${i}`,
            candidateId: `candidate_${i % 5 + 1}`,
            candidateName: `候选人${i % 5 + 1}`,
            activityId: selectedActivity,
            activityName,
            collegeId: college.YXDM,
            collegeName: college.YXDM_TEXT,
            voteTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19)
          });
        }
        
        setVoteRecords(dummyVoteRecords);
        setPreviewLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取预览数据失败:', error);
      message.error('获取预览数据失败，请稍后重试');
      setPreviewLoading(false);
    }
  };

  // 下载数据
  const handleDownload = async () => {
    if (!selectedActivity) {
      message.warning('请先选择活动');
      return;
    }

    setDownloadLoading(true);
    
    try {
      // 获取文件格式文本
      const formatText = exportFormat === 'excel' ? 'Excel' : exportFormat === 'pdf' ? 'PDF' : 'CSV';
      
      // 获取导出类型文本
      const typeText = 
        exportType === 'vote_records' ? '投票记录' : 
        exportType === 'statistics' ? '统计数据' : '候选人信息';
      
      // 准备请求参数
      const params = {
        activity_id: selectedActivity,
        export_type: exportType,
        format: exportFormat,
        college_id: selectedCollege !== 'all' ? selectedCollege : undefined,
        start_date: dateRange ? dateRange[0].toISOString().split('T')[0] : undefined,
        end_date: dateRange ? dateRange[1].toISOString().split('T')[0] : undefined,
      };
      
      message.success(`正在下载${formatText}格式的${typeText}，请稍候...`);
      
      // 实际项目中应调用后端API下载文件
      // const response = await axios.get('/api/export', { 
      //   params,
      //   responseType: 'blob'
      // });
      
      // 创建一个下载链接
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `${typeText}_${new Date().toISOString().split('T')[0]}.${exportFormat}`);
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      
      // 模拟下载延迟
      setTimeout(() => {
        message.success(`${formatText}格式的${typeText}下载完成`);
        setDownloadLoading(false);
      }, 1500);
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败，请稍后重试');
      setDownloadLoading(false);
    }
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

  // Define tab items
  const tabItems = [
    {
      key: 'export',
      label: <span><DownloadOutlined /> 数据导出</span>,
      children: (
        <Card className="mb-6 shadow-sm">
          <Alert
            message="数据导出说明"
            description="导出的数据将包含所选活动的相关信息。如果选择了日期范围，则只会导出该时间范围内的数据。您可以按学院筛选数据，或选择导出全部学院的数据。"
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
                      <Option key={activity.id} value={activity.id}>{activity.title}</Option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="mb-4">
                <Text strong>选择学院</Text>
                <Tooltip title="选择要导出数据的学院，默认为全部学院">
                  <InfoCircleOutlined className="ml-1 text-gray-400" />
                </Tooltip>
                <div className="mt-2">
                  <Select
                    placeholder="请选择所属学院"
                    showSearch
                    optionFilterProp="children"
                    style={{ width: '100%' }}
                    value={selectedCollege || 'all'}
                    onChange={value => setSelectedCollege(value)}
                    allowClear
                    defaultActiveFirstOption
                  >
                    {colleges.map(college => (
                      <Option key={college.YXDM} value={college.YXDM}>
                        {college.YXDM_TEXT}
                      </Option>
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
                loading={downloadLoading}
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
                  loading={previewLoading}
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
      )
    },
    {
      key: 'analysis',
      label: <span><BarChartOutlined /> 数据分析</span>,
      children: (
        <Card className="mb-6 shadow-sm p-6">
          <div className="text-center py-12">
            <Title level={3} type="secondary">数据分析功能即将上线</Title>
            <Paragraph>
              敬请期待更多高级数据分析功能，包括投票趋势分析、票数分布统计、学院参与度分析等。
            </Paragraph>
          </div>
        </Card>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>数据下载</Title>
      <Paragraph className="mb-6">
        您可以在此页面下载投票系统的各类数据报表，包括投票记录、统计数据和候选人信息。
      </Paragraph>
      
      <Tabs defaultActiveKey="export" className="mb-6" items={tabItems} />
    </div>
  );
} 