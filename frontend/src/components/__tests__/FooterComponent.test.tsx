import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FooterComponent } from '../FooterComponent';

describe('FooterComponent', () => {
  it('renders footer with logo and copyright text', () => {
    render(<FooterComponent />);
    
    // 检查 logo 图片是否存在
    const logoElement = screen.getByAltText('Logo');
    expect(logoElement).toBeInTheDocument();
    expect(logoElement).toHaveAttribute('src', '/image/logo.svg');
    
    // 检查版权文本是否包含当前年份
    const currentYear = new Date().getFullYear().toString();
    const copyrightText = screen.getByText((content) => {
      return content.includes(currentYear) && content.includes('南京航空航天大学');
    });
    expect(copyrightText).toBeInTheDocument();
  });
}); 