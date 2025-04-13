import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// API基础路径常量
const BASE_URL = 'http://localhost:8000';

// 类型定义
// 学院信息类型定义
export interface CollegeInfo {
  YXDM: string;      // 学院代码
  YXDM_TEXT: string; // 学院名称
}

// 备用学院信息
export const FALLBACK_COLLEGE_INFO: CollegeInfo[] = [
  {"YXDM":"0519000","YXDM_TEXT":"国际教育学院"},
  {"YXDM":"0501000","YXDM_TEXT":"航空学院"},
  {"YXDM":"0502000","YXDM_TEXT":"能源与动力学院"},
  {"YXDM":"0503000","YXDM_TEXT":"自动化学院"},
  {"YXDM":"0504000","YXDM_TEXT":"电子信息工程学院"},
  {"YXDM":"0505000","YXDM_TEXT":"机电学院"},
  {"YXDM":"0506000","YXDM_TEXT":"材料科学与技术学院"},
  {"YXDM":"0509000","YXDM_TEXT":"经济与管理学院"},
  {"YXDM":"0515000","YXDM_TEXT":"航天学院"},
  {"YXDM":"0516000","YXDM_TEXT":"计算机科学与技术学院/软件学院"},
  {"YXDM":"0507000","YXDM_TEXT":"民航学院"},
  {"YXDM":"0525000","YXDM_TEXT":"集成电路学院"},
  {"YXDM":"0517000","YXDM_TEXT":"马克思主义学院"},
  {"YXDM":"0522000","YXDM_TEXT":"数学学院"},
  {"YXDM":"0523000","YXDM_TEXT":"物理学院"},
  {"YXDM":"0510000","YXDM_TEXT":"人文与社会科学学院"},
  {"YXDM":"0511000","YXDM_TEXT":"艺术学院"},
  {"YXDM":"0520000","YXDM_TEXT":"通用航空与飞行学院"},
  {"YXDM":"0512000","YXDM_TEXT":"外国语学院"},
  {"YXDM":"0218000","YXDM_TEXT":"教师发展与教学评估中心/高等教育研究所"},
  {"YXDM":"0526000","YXDM_TEXT":"人工智能学院"}
];

/**
 * 获取所有学院信息
 * @returns 学院信息列表
 */
export const getAllCollegeInfo = async (): Promise<CollegeInfo[]> => {
  try {
    // 尝试从本地后端代理获取数据
    const response = await axios.get(`${BASE_URL}/vote/colleges/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      // withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取学院信息失败:', error);
    console.warn('使用备用学院信息数据');
    return FALLBACK_COLLEGE_INFO;
  }
};

/**
 * 根据学院代码获取学院名称
 * @param collegeInfoList 学院信息列表
 * @param collegeId 学院代码
 * @returns 学院名称
 */
export const getCollegeNameById = (collegeInfoList: CollegeInfo[], collegeId: string): string => {
  const college = collegeInfoList.find(item => item.YXDM === collegeId);
  return college ? college.YXDM_TEXT : '未知学院';
};

/**
 * 获取学院映射数据
 * @returns 学院映射数据
 */
export const fetchCollegeMapping = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/college-mapping`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      // withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取学院映射数据失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取学院映射数据失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取所有学院
 * @returns 学院列表（格式化后）
 */
export const getColleges = async (): Promise<{ id: string; name: string }[]> => {
  try {
    // 使用已有的getAllCollegeInfo函数
    const collegesData = await getAllCollegeInfo();
    
    // 将数据转换为AdminsPage组件需要的格式
    return collegesData.map(college => ({
      id: college.YXDM,
      name: college.YXDM_TEXT
    }));
  } catch (error) {
    console.error('[API Error] 获取学院列表失败:', error);
    return []; // 暂时返回空数组
  }
};