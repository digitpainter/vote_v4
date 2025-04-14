import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ContentArea } from '../ContentArea';
import { ActivityList } from '../ActivityList';

// 模拟 ActivityList 组件
vi.mock('../ActivityList', () => ({
  ActivityList: vi.fn().mockReturnValue(<div data-testid="activity-list-mock" />)
}));

describe('ContentArea', () => {
  it('renders with ActivityList component', () => {
    const { getByTestId } = render(<ContentArea />);
    
    // 验证 ActivityList 组件被渲染
    expect(getByTestId('activity-list-mock')).toBeInTheDocument();
    
    // 验证 ActivityList 被调用
    expect(ActivityList).toHaveBeenCalled();
  });
}); 