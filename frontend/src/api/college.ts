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