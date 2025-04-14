import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleApiError } from '../errorHandler';
import { notification } from 'antd';

// 模拟 antd 通知组件
vi.mock('antd', () => ({
  notification: {
    error: vi.fn()
  }
}));

// 保存原始的 location 对象
const originalLocation = window.location;

describe('errorHandler utils', () => {
  // 测试开始前设置模拟
  beforeEach(() => {
    // 模拟 window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' }
    });
    
    // 清除 notification 模拟的调用历史
    vi.clearAllMocks();
  });

  // 测试结束后恢复原始状态
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    });
  });

  describe('handleApiError', () => {
    it('displays error notification with status code', () => {
      const status = 500;
      const message = 'Server error';
      
      const result = handleApiError(status, message);
      
      // 验证通知被调用
      expect(notification.error).toHaveBeenCalledTimes(1);
      
      // 验证通知内容包含状态码
      expect(notification.error).toHaveBeenCalledWith(expect.objectContaining({
        message: '服务器错误 500',
        description: 'Server error'
      }));
      
      // 验证函数返回值
      expect(result).toBe('Server error');
    });

    it('displays error notification without status code', () => {
      const status = 0;
      const message = 'Network error';
      
      const result = handleApiError(status, message);
      
      expect(notification.error).toHaveBeenCalledTimes(1);
      expect(notification.error).toHaveBeenCalledWith(expect.objectContaining({
        message: '服务器错误',
        description: 'Network error'
      }));
      
      expect(result).toBe('Network error');
    });

    it('handles object message by converting to JSON string', () => {
      const status = 400;
      const message = { error: 'Bad request', field: 'username' };
      
      const result = handleApiError(status, message);
      
      expect(notification.error).toHaveBeenCalledTimes(1);
      expect(notification.error).toHaveBeenCalledWith(expect.objectContaining({
        message: '服务器错误 400',
        description: JSON.stringify(message)
      }));
      
      expect(result).toBe(JSON.stringify(message));
    });

    it('redirects to login page for 401 status code when notification is closed', () => {
      const status = 401;
      const message = 'Unauthorized';
      
      // 获取模拟调用时的回调函数
      handleApiError(status, message);
      
      const mockCall = vi.mocked(notification.error).mock.calls[0][0];
      if (mockCall && typeof mockCall === 'object' && 'onClose' in mockCall && typeof mockCall.onClose === 'function') {
        // 调用关闭回调
        mockCall.onClose();
        
        // 验证重定向
        expect(window.location.href).toBe('/login');
      } else {
        // 测试失败，通知回调不存在
        expect(false).toBe(true);
      }
    });

    it('does not redirect for non-401 status codes', () => {
      const status = 403;
      const message = 'Forbidden';
      
      handleApiError(status, message);
      
      const mockCall = vi.mocked(notification.error).mock.calls[0][0];
      if (mockCall && typeof mockCall === 'object' && 'onClose' in mockCall && typeof mockCall.onClose === 'function') {
        // 调用关闭回调
        mockCall.onClose();
        
        // 验证没有重定向
        expect(window.location.href).not.toBe('/login');
      } else {
        // 测试失败，通知回调不存在
        expect(false).toBe(true);
      }
    });
  });
}); 