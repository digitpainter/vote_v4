import { handleApiError } from '../utils/errorHandler';
import axios from 'axios';

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

// 获取所有学院信息
export async function getAllCollegeInfo(): Promise<CollegeInfo[]> {
  try {
    // 尝试从本地后端代理获取数据
    const response = await fetch('http://localhost:8000/vote/colleges/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      console.warn('通过后端代理获取学院信息失败，使用备用数据');
      return FALLBACK_COLLEGE_INFO;
    }
    
    return await response.json();
  } catch (error) {
    console.error('[API Error] 获取学院信息错误:', error);
    console.warn('使用备用学院信息数据');
    return FALLBACK_COLLEGE_INFO;
  }
}

// 根据学院代码获取学院名称
export function getCollegeNameById(collegeInfoList: CollegeInfo[], collegeId: string): string {
  const college = collegeInfoList.find(item => item.YXDM === collegeId);
  return college ? college.YXDM_TEXT : '未知学院';
}

export const fetchCollegeMapping = async () => {
  try {
    const response = await fetch('http://localhost:8000/college-mapping');
    if (!response.ok) {
      throw new Error('获取学院数据失败');
    }
    return await response.json();
  } catch (error) {
    console.error('[College API] 学院数据获取错误:', error);
    throw error;
  }
};

// Get all colleges
export const getColleges = async (): Promise<{ id: string; name: string }[]> => {
  try {
    // Use the existing getAllCollegeInfo function
    const collegesData = await getAllCollegeInfo();
    
    // Transform the data to the format expected by the AdminsPage component
    return collegesData.map(college => ({
      id: college.YXDM,
      name: college.YXDM_TEXT
    }));
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return []; // Return empty array for now
  }
};