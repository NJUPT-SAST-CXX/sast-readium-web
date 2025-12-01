# 脚本与命令

本指南涵盖 SAST Readium 的所有可用 npm 脚本和开发命令。

## 前端脚本

### 开发

```bash
pnpm dev
```

在 [http://localhost:3000](http://localhost:3000) 启动 Next.js 开发服务器。

**功能：**

- 热模块替换 (HMR)
- React 组件快速刷新
- 错误覆盖层
- TypeScript 类型检查

### 生产构建

```bash
pnpm build
```

在 `out/` 目录创建优化的生产构建。

**输出：**

- 静态 HTML 导出
- 优化的 JavaScript 包
- 压缩的资源
- 生成的 Service Worker (PWA)

### 启动生产服务器

```bash
pnpm start
```

本地提供生产构建以供测试。

!!! note
在使用 `pnpm start` 之前先运行 `pnpm build`。

## 代码质量

### 代码检查

```bash
# 检查代码问题
pnpm lint

# 自动修复代码问题
pnpm lint:fix
```

使用 ESLint 和 Next.js 推荐配置。

**检查的规则：**

- React 最佳实践
- TypeScript 规则
- 导入排序
- 无障碍 (a11y)

### 类型检查

```bash
pnpm typecheck
```

运行 TypeScript 编译器但不输出文件。

**检查：**

- 类型错误
- 缺失类型
- 不正确的类型使用
- 未使用的变量（严格模式）

### 格式化

```bash
# 格式化所有文件
pnpm format

# 检查格式但不修改
pnpm format:check
```

使用 Prettier 保持一致的代码格式。

**格式化的文件：**

- TypeScript/JavaScript
- JSON
- Markdown
- CSS/SCSS
- YAML

## 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监视模式运行测试
pnpm test:watch

# 运行并生成覆盖率报告
pnpm test:coverage
```

使用 Jest 和 React Testing Library。

### 测试选项

```bash
# 运行特定测试文件
pnpm test path/to/file.test.tsx

# 运行匹配模式的测试
pnpm test --testNamePattern="Button"

# 更新快照
pnpm test --updateSnapshot

# CI 模式运行
pnpm test --ci
```

### 覆盖率报告

运行 `pnpm test:coverage` 后：

- **HTML 报告**: `coverage/index.html`
- **LCOV**: `coverage/lcov.info`
- **控制台**: 终端打印摘要

## Tauri（桌面）脚本

### 开发模式

```bash
pnpm tauri dev
```

同时启动 Next.js 和 Tauri 开发模式。

**流程：**

1. 启动 Next.js 开发服务器
2. 编译 Rust 后端
3. 启动桌面窗口
4. 启用热重载

### 生产构建

```bash
pnpm tauri build
```

创建平台特定的安装程序。

**输出位置：**

| 平台    | 格式     | 路径                                        |
| ------- | -------- | ------------------------------------------- |
| Windows | MSI      | `src-tauri/target/release/bundle/msi/`      |
| Windows | NSIS     | `src-tauri/target/release/bundle/nsis/`     |
| macOS   | DMG      | `src-tauri/target/release/bundle/dmg/`      |
| macOS   | App      | `src-tauri/target/release/bundle/macos/`    |
| Linux   | AppImage | `src-tauri/target/release/bundle/appimage/` |
| Linux   | Deb      | `src-tauri/target/release/bundle/deb/`      |

### 构建选项

```bash
# 为特定目标构建
pnpm tauri build --target x86_64-pc-windows-msvc

# 带调试符号构建
pnpm tauri build --debug

# 构建特定包类型
pnpm tauri build --bundles msi
```

### 环境信息

```bash
pnpm tauri info
```

显示 Tauri 环境信息：

- 操作系统
- Rust 版本
- Node.js 版本
- Tauri CLI 版本
- WebView 版本

## UI 组件

### 添加 shadcn/ui 组件

```bash
# 添加单个组件
pnpm dlx shadcn@latest add button

# 添加多个组件
pnpm dlx shadcn@latest add card dialog tooltip

# 添加所有组件
pnpm dlx shadcn@latest add --all
```

## 文档

### 提供文档服务

```bash
# 安装 MkDocs（如未安装）
pip install mkdocs-material mkdocs-static-i18n

# 本地服务
mkdocs serve

# 构建静态站点
mkdocs build
```

## Git 钩子

### Pre-commit 钩子

在 `git commit` 时自动运行：

1. **ESLint**: 自动修复暂存文件的代码问题
2. **Prettier**: 格式化暂存文件

### 跳过钩子

```bash
# 不推荐，但可行
git commit --no-verify
```

## 常用命令

### 清理构建

```bash
# 删除构建产物
rm -rf out .next

# 清理 Tauri 构建
cd src-tauri && cargo clean && cd ..

# 删除 node_modules
rm -rf node_modules

# 重新安装
pnpm install
```

### 更新依赖

```bash
# 检查更新
pnpm outdated

# 更新所有依赖
pnpm update

# 更新特定包
pnpm update package-name
```

## CI/CD 命令

GitHub Actions 中使用的命令：

```bash
# 安装依赖
pnpm install --frozen-lockfile

# 运行检查
pnpm lint
pnpm typecheck
pnpm test --ci --coverage

# 构建
pnpm build
pnpm tauri build
```

## 故障排除

### 端口已被占用

```bash
# 查找使用端口 3000 的进程
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# 终止进程
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

### 清除缓存

```bash
# Next.js 缓存
rm -rf .next

# pnpm 缓存
pnpm store prune

# Rust 缓存
cd src-tauri && cargo clean
```
