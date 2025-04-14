import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderComponent } from '../HeaderComponent';
import * as ActivityContext from '../../contexts/ActivityContext';
import { Activity } from '../../types/activity';

// 模拟 ActivityContext
vi.mock('../../contexts/ActivityContext', () => ({
  useActivity: vi.fn()
}));

describe('HeaderComponent', () => {
  it('renders header with title from active activity', () => {
    // 设置模拟返回值
    const mockActivity: Activity = {
      candidate_ids: [],
      id: 1,
      title: '测试活动标题',
      description: '测试描述',
      start_time: '2023-01-01T00:00:00Z',
      end_time: '2023-12-31T23:59:59Z',
      is_active: true
    };

    vi.spyOn(ActivityContext, 'useActivity').mockReturnValue({
      activeActivities: [mockActivity],
      candidates: [],
      loading: false,
      error: null,
      maxVotes: 3,
      minVotes: 1,
      refreshActivities: vi.fn(),
      refreshCandidates: vi.fn()
    });

    render(<HeaderComponent />);
    
    // 检查 logo 图片是否存在
    const logoElement = screen.getByAltText('NUAA_LOGO');
    expect(logoElement).toBeInTheDocument();
    expect(logoElement).toHaveAttribute('src', '/image/logo.svg');
    
    // 检查活动标题是否渲染
    const titleElement = screen.getByText('测试活动标题');
    expect(titleElement).toBeInTheDocument();
  });

  it('renders header with default title when no activities', () => {
    // 设置模拟返回值
    vi.spyOn(ActivityContext, 'useActivity').mockReturnValue({
      activeActivities: [],
      candidates: [],
      loading: false,
      error: null,
      maxVotes: 0,
      minVotes: 0,
      refreshActivities: vi.fn(),
      refreshCandidates: vi.fn()
    });

    render(<HeaderComponent />);
    
    // 检查默认标题是否渲染
    const titleElement = screen.getByText('活动标题');
    expect(titleElement).toBeInTheDocument();
  });
}); 