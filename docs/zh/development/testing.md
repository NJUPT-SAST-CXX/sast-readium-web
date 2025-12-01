# 测试指南

本指南涵盖 SAST Readium 的测试设置、模式和最佳实践。

## 测试技术栈

| 工具                      | 用途           |
| ------------------------- | -------------- |
| **Jest 30.x**             | 测试运行器     |
| **React Testing Library** | 组件测试       |
| **jsdom**                 | 浏览器环境模拟 |
| **V8**                    | 覆盖率提供者   |

## 运行测试

### 基本命令

```bash
# 运行所有测试
pnpm test

# 监视模式运行
pnpm test:watch

# 带覆盖率运行
pnpm test:coverage

# 运行特定文件
pnpm test path/to/file.test.tsx

# 运行匹配模式的测试
pnpm test --testNamePattern="Button"
```

### 监视模式选项

在监视模式下，按：

- `a` - 运行所有测试
- `f` - 仅运行失败的测试
- `p` - 按文件名筛选
- `t` - 按测试名称筛选
- `q` - 退出

## 测试文件结构

### 位置

测试与源文件放在一起：

```text
components/
├── ui/
│   ├── button.tsx
│   └── button.test.tsx      # 同位置测试
├── pdf-viewer/
│   ├── pdf-viewer.tsx
│   └── __tests__/           # 测试目录
│       └── pdf-viewer.test.tsx
```

### 命名约定

- `*.test.ts` - TypeScript 测试
- `*.test.tsx` - React 组件测试
- `*.spec.ts` - 替代命名（也支持）

## 编写测试

### 组件测试

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("渲染文本", () => {
    render(<Button>点击我</Button>);

    expect(screen.getByRole("button", { name: /点击我/i })).toBeInTheDocument();
  });

  it("点击时调用 onClick", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>点击我</Button>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("禁用时不可点击", () => {
    render(<Button disabled>点击我</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Hook 测试

```tsx
import { renderHook, act } from "@testing-library/react";
import { usePDFNavigation } from "./use-pdf-navigation";

describe("usePDFNavigation", () => {
  beforeEach(() => {
    // 重置存储状态
    usePDFStore.setState({ currentPage: 1, numPages: 10 });
  });

  it("导航到下一页", () => {
    const { result } = renderHook(() => usePDFNavigation());

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it("不会超过最后一页", () => {
    usePDFStore.setState({ currentPage: 10, numPages: 10 });
    const { result } = renderHook(() => usePDFNavigation());

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(10);
  });
});
```

### 工具函数测试

```typescript
import { cn } from "./utils";

describe("cn 工具函数", () => {
  it("合并类名", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("处理条件类", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("正确合并 Tailwind 类", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
```

## 模拟

### 模拟模块

```typescript
// 模拟整个模块
jest.mock("@/lib/pdf-utils", () => ({
  loadPDF: jest.fn().mockResolvedValue({ numPages: 10 }),
  extractText: jest.fn().mockResolvedValue("示例文本"),
}));

// 模拟特定函数
import { loadPDF } from "@/lib/pdf-utils";
jest.mocked(loadPDF).mockResolvedValue({ numPages: 5 });
```

### 模拟 Next.js

已在 `jest.setup.ts` 中配置：

```typescript
// next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ImageProps) => <img {...props} />,
}));

// next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
```

### 模拟 Zustand 存储

```typescript
import { usePDFStore } from "@/lib/pdf-store";

beforeEach(() => {
  usePDFStore.setState({
    currentPage: 1,
    numPages: 10,
    zoom: 1,
    annotations: [],
  });
});

afterEach(() => {
  usePDFStore.getState().reset?.();
});
```

## 覆盖率

### 阈值

在 `jest.config.ts` 中配置：

```typescript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 60,
    lines: 70,
    statements: 70,
  },
},
```

### 查看报告

```bash
# 生成覆盖率
pnpm test:coverage

# 打开 HTML 报告
# Windows
start coverage/index.html

# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

### 覆盖率目标

重点覆盖：

- `lib/` - 工具函数和服务
- `hooks/` - 自定义 React hooks
- 组件中的复杂 UI 逻辑

## 最佳实践

### 1. 测试行为，而非实现

```tsx
// ✅ 好：测试用户看到的内容
expect(screen.getByText("第 2 页")).toBeInTheDocument();

// ❌ 差：测试内部状态
expect(component.state.currentPage).toBe(2);
```

### 2. 使用无障碍查询

优先顺序：

1. `getByRole` - 大多数元素的最佳选择
2. `getByLabelText` - 表单字段
3. `getByPlaceholderText` - 没有标签的输入
4. `getByText` - 非交互元素
5. `getByTestId` - 最后手段

### 3. 使用 userEvent 而非 fireEvent

```tsx
// ✅ 好：模拟真实用户行为
const user = userEvent.setup();
await user.click(button);

// ❌ 差：合成事件
fireEvent.click(button);
```

### 4. 测试后清理

```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup(); // 通常自动执行
});
```

### 5. 避免测试相互依赖

每个测试应该独立，不依赖其他测试的状态。

## 调试测试

### 详细输出

```bash
pnpm test --verbose
```

### 调试模式

```tsx
import { screen } from "@testing-library/react";

// 打印当前 DOM
screen.debug();

// 打印特定元素
screen.debug(screen.getByRole("button"));
```

### 增加超时

```typescript
it("处理慢操作", async () => {
  // 增加此测试的超时时间
}, 10000);
```

## CI 集成

测试在 GitHub Actions 中自动运行：

1. 推送到 `main` 或 `develop` 时
2. 在 Pull Request 时
3. 覆盖率上传到 Codecov

### CI 配置

```yaml
- name: 运行测试
  run: pnpm test --ci --coverage

- name: 上传覆盖率
  uses: codecov/codecov-action@v3
```
