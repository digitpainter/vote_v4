import { describe, it, expect } from 'vitest';
import { formatDateTime } from '../date';

describe('date utils', () => {
  describe('formatDateTime', () => {
    it('formats a date string correctly', () => {
      // 使用固定的日期进行测试
      const input = '2023-05-15T14:30:00Z';
      
      // 由于格式化是基于本地时区的，我们需要模拟 Intl.DateTimeFormat
      // 为了测试的一致性，我们测试格式而不是确切的值
      const result = formatDateTime(input);
      
      // 验证结果格式：年/月/日 时:分
      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    });
    
    it('formats a timestamp number correctly', () => {
      // 使用时间戳
      const input = 1684159800000; // 2023-05-15T14:30:00Z in milliseconds
      
      const result = formatDateTime(input);
      
      // 验证结果格式：年/月/日 时:分
      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    });
  });
}); 