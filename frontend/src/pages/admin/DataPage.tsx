import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Radio,
  Spin
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
  BankOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  fetchActivities, 
  fetchColleges, 
  fetchPreviewData, 
  exportData,
  VoteRecord,
  CandidateStats,
  College,
  ExportFormat,
  ExportType,
  ExportResponse
} from '../../api/data';

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

export default function DataPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [exportType, setExportType] = useState<ExportType>('vote_records');
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([]);
  const [candidateStats, setCandidateStats] = useState<CandidateStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // 新增状态
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    fetchActivitiesData();
    fetchCollegesData();
  }, []);

  // 获取活动列表
  const fetchActivitiesData = async () => {
    setLoading(true);
    try {
      const data = await fetchActivities();
      setActivities(data);
    } catch (error) {
      console.error('获取活动失败:', error);
      message.error('获取活动列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取学院列表
  const fetchCollegesData = async () => {
    try {
      const data = await fetchColleges();
      // 添加"全部学院"选项
      const allColleges = [
        { YXDM: 'all', YXDM_TEXT: '全部学院' },
        ...data
      ];
      setColleges(allColleges);
    } catch (error) {
      console.error('获取学院列表失败:', error);
      message.error('获取学院列表失败，请稍后重试');
      // 设置默认值，确保界面不会崩溃
      setColleges([{ YXDM: 'all', YXDM_TEXT: '全部学院' }]);
    }
  };

  // 表格列定义 - 投票记录
  const voteRecordColumns: TableColumnsType<VoteRecord> = [
    {
      title: '投票人ID',
      dataIndex: 'voter_id',
      key: 'voter_id',
    },
    {
      title: '所属学院',
      dataIndex: 'voter_college_name',
      key: 'voter_college_name',
      filters: colleges.filter(college => college.YXDM !== 'all').map(college => ({
        text: college.YXDM_TEXT,
        value: college.YXDM,
      })),
      onFilter: (value, record) => record.voter_college_name === value,
    },
  ];

  // 表格列定义 - 候选人得票统计
  const candidateStatsColumns: TableColumnsType<CandidateStats> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      sorter: (a, b) => a.rank - b.rank,
    },
    {
      title: '学院',
      dataIndex: 'college_name',
      key: 'college_name',
      filters: colleges.filter(college => college.YXDM !== 'all').map(college => ({
        text: college.YXDM_TEXT,
        value: college.YXDM_TEXT,
      })),
      onFilter: (value, record) => record.college_name === value,
    },
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name',
    },
    {
      title: '得票数',
      dataIndex: 'vote_count',
      key: 'vote_count',
      sorter: (a, b) => a.vote_count - b.vote_count,
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
      // 准备请求参数
      const params = {
        activity_id: selectedActivity,
        export_type: exportType,
        college_id: selectedCollege !== 'all' ? selectedCollege : undefined,
        start_date: dateRange ? dateRange[0].toISOString().split('T')[0] : undefined,
        end_date: dateRange ? dateRange[1].toISOString().split('T')[0] : undefined,
      };
      
      // 获取预览数据
      const data = await fetchPreviewData(params);
      
      // 根据导出类型设置预览数据
      if (exportType === 'vote_records') {
        setVoteRecords(data.data.records as VoteRecord[]);
      } else {
        // 将候选人学院ID转换为学院名称
        const candidateRecords = (data.data.records as Array<any>).map(record => {
          // 查找对应的学院名称
          const college = colleges.find(c => c.YXDM === record.college_id);
          return {
            ...record,
            college_name: college ? college.YXDM_TEXT : record.college_id
          };
        });
        setCandidateStats(candidateRecords as CandidateStats[]);
      }
      setPreviewLoading(false);
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
      // 准备请求参数
      const params = {
        activity_id: selectedActivity,
        export_type: exportType,
        format: exportFormat,
        college_id: selectedCollege !== 'all' ? selectedCollege : undefined,
        start_date: dateRange ? dateRange[0].toISOString().split('T')[0] : undefined,
        end_date: dateRange ? dateRange[1].toISOString().split('T')[0] : undefined,
      };
      
      // 获取数据
      const data = await exportData(params);
      
      // 根据导出格式处理数据
      if (exportFormat === 'excel') {
        // 使用ExcelJS创建漂亮的Excel文件
        const workbook = new ExcelJS.Workbook();
        workbook.creator = '投票系统';
        workbook.lastModifiedBy = '投票系统';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        // 创建工作表
        const worksheet = workbook.addWorksheet(exportType === 'vote_records' ? '投票记录' : '候选人得票统计');
        
        // 找到当前选中的活动
        const activity = activities.find(act => act.id === selectedActivity);
        
        // 添加标题行
        if (activity) {
          // 标题行
          const titleRow = worksheet.addRow([`${activity.title} - ${exportType === 'vote_records' ? '投票记录' : '候选人得票统计'}`]);
          titleRow.height = 30;
          titleRow.font = { size: 16, bold: true };
          titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
          
          // 合并标题单元格
          let headers = [];
          if (exportType === 'vote_records') {
            headers = ['学号', '学院'];
            worksheet.mergeCells('A1:B1');
          } else {
            headers = ['排名', '学院', '候选人', '得票数'];
            worksheet.mergeCells('A1:D1');
          }
          
          // 导出时间行
          const dateRow = worksheet.addRow([`导出时间: ${new Date().toLocaleString()}`]);
          dateRow.font = { size: 10, italic: true, color: { argb: '666666' } };
          dateRow.alignment = { horizontal: 'center' };
          
          if (exportType === 'vote_records') {
            worksheet.mergeCells('A2:B2');
          } else {
            worksheet.mergeCells('A2:D2');
          }
          
          // 空行
          worksheet.addRow([]);
        }
        
        // 添加表头
        let headers = [];
        if (exportType === 'vote_records') {
          headers = ['学号', '学院'];
        } else {
          headers = ['排名', '学院', '候选人', '得票数'];
        }
        
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell: ExcelJS.Cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4472C4' }
          };
          cell.font = {
            bold: true,
            color: { argb: 'FFFFFF' },
            size: 12
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        headerRow.height = 25;
        
        // 设置列宽
        if (exportType === 'vote_records') {
          worksheet.getColumn(1).width = 20; // 学号列宽
          worksheet.getColumn(2).width = 30; // 学院列宽
        } else {
          worksheet.getColumn(1).width = 10; // 排名列宽
          worksheet.getColumn(2).width = 30; // 学院列宽
          worksheet.getColumn(3).width = 20; // 候选人列宽
          worksheet.getColumn(4).width = 15; // 得票数列宽
        }
        
        // 添加数据行
        let rowData = [];
        if (exportType === 'vote_records') {
          rowData = (data.data.records as VoteRecord[]).map(record => [
            record.voter_id,
            record.voter_college_name
          ]);
        } else {
          rowData = (data.data.records as Array<any>).map(record => {
            // 查找对应的学院名称
            const college = colleges.find(c => c.YXDM === record.college_id);
            const collegeName = college ? college.YXDM_TEXT : record.college_id;
            
            return [
              record.rank,
              collegeName,
              record.candidate_name,
              record.vote_count
            ];
          });
        }
        
        // 添加数据并设置样式
        rowData.forEach((row, index) => {
          const excelRow = worksheet.addRow(row);
          
          // 设置交替行背景色
          const bgColor = index % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
          
          excelRow.eachCell((cell: ExcelJS.Cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor }
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // 如果是数字列，设置为右对齐
            if (exportType === 'candidate_stats') {
              const colNumber = (cell as any).col;
              if (colNumber === 1 || colNumber === 4) { // 排名和得票数列
                cell.alignment = { horizontal: 'right' };
              } else {
                cell.alignment = { horizontal: 'left' };
              }
            } else {
              cell.alignment = { horizontal: 'left' };
            }
          });
        });
        
        // 生成并保存文件
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `${exportType === 'vote_records' ? '投票记录' : '候选人得票统计'}_${activity?.title || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(new Blob([buffer]), fileName);
      } else if (exportFormat === 'csv') {
        // CSV导出使用原有逻辑
        let headers: string[];
        let rows: any[];
        
        if (exportType === 'vote_records') {
          headers = ['学号', '学院'];
          rows = (data.data.records as VoteRecord[]).map(record => [
            record.voter_id,
            record.voter_college_name
          ]);
        } else {
          headers = ['排名', '学院', '候选人', '得票数'];
          rows = (data.data.records as Array<any>).map(record => {
            // 查找对应的学院名称
            const college = colleges.find(c => c.YXDM === record.college_id);
            const collegeName = college ? college.YXDM_TEXT : record.college_id;
            
            return [
              record.rank,
              collegeName,
              record.candidate_name,
              record.vote_count
            ];
          });
        }
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, exportType === 'vote_records' ? '投票记录' : '候选人得票统计');
        
        // 生成文件名
        const fileName = `${exportType === 'vote_records' ? '投票记录' : '候选人得票统计'}_${data.activity.title}_${new Date().toISOString().split('T')[0]}.csv`;
        
        // 导出文件
        XLSX.writeFile(wb, fileName);
      }
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请稍后重试');
    } finally {
      setDownloadLoading(false);
    }
  };

  // 获取导出格式图标
  const getFormatIcon = (format: ExportFormat) => {
    switch(format) {
      case 'excel':
        return <FileExcelOutlined className="text-green-600" />;
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
            description="您可以选择导出投票记录或候选人得票统计。如果选择了日期范围，则只会导出该时间范围内的数据。您可以按学院筛选数据，或选择导出全部学院的数据。"
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
                <Text strong>导出类型</Text>
                <Tooltip title="选择要导出的数据类型">
                  <InfoCircleOutlined className="ml-1 text-gray-400" />
                </Tooltip>
                <div className="mt-2">
                  <Select
                    value={exportType}
                    onChange={value => setExportType(value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="vote_records">投票记录</Option>
                    <Option value="candidate_stats">候选人得票统计</Option>
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
                    value={selectedCollege}
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
              
              {exportType === 'vote_records' ? (
                <Table 
                  columns={voteRecordColumns} 
                  dataSource={voteRecords}
                  rowKey="voter_id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  loading={previewLoading}
                  scroll={{ x: 'max-content' }}
                />
              ) : (
                <Table 
                  columns={candidateStatsColumns} 
                  dataSource={candidateStats}
                  rowKey="rank"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  loading={previewLoading}
                  scroll={{ x: 'max-content' }}
                />
              )}
              
              <div className="mt-4 text-gray-500 text-center">
                <Text type="secondary">
                  预览仅显示部分数据，完整数据请下载文件查看
                </Text>
              </div>
            </div>
          </div>
        </Card>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>数据下载</Title>
      <Paragraph className="mb-6">
        您可以在此页面下载投票系统的投票记录数据。
      </Paragraph>
      
      <Tabs defaultActiveKey="export" className="mb-6" items={tabItems} />
    </div>
  );
} 