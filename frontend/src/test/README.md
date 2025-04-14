# 前端自动化测试

本项目使用 Vitest 和 React Testing Library 进行前端自动化测试。

## 测试结构

测试文件组织结构如下：

- `src/components/__tests__/`: 组件测试
- `src/utils/__tests__/`: 工具函数测试
- `src/test/setup.ts`: 全局测试配置

## 运行测试

### 开发模式下运行测试（监视文件变化）

```bash
npm test
```

### 使用 UI 界面运行测试

```bash
npm run test:ui
```

### 运行所有测试（一次性）

```bash
npm run test:run
```

### 测试覆盖率报告

```bash
npm run coverage
```

## 编写测试

### 组件测试示例

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('标题')).toBeInTheDocument();
  });
});
```

### 工具函数测试示例

```ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myUtils';

describe('myFunction', () => {
  it('returns expected result', () => {
    expect(myFunction(1, 2)).toBe(3);
  });
});
```

## 模拟依赖

使用 Vitest 的 `vi.mock()` 函数模拟依赖：

```tsx
import { vi } from 'vitest';

// 模拟模块
vi.mock('../../api/myApi', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked data' })
}));
``` 