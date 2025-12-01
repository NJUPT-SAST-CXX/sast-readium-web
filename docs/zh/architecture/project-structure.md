# 项目结构

本文档提供 SAST Readium 代码库组织的详细概述。

## 根目录

```text
sast-readium-web/
├── app/                    # Next.js App Router
├── components/             # React 组件
├── hooks/                  # 自定义 React hooks
├── lib/                    # 工具和服务
├── locales/                # i18n 翻译文件
├── public/                 # 静态资源
├── src-tauri/              # Tauri Rust 后端
├── docs/                   # 文档 (MkDocs)
├── __mocks__/              # Jest 模拟
├── coverage/               # 测试覆盖率报告
└── out/                    # 生产构建输出
```

## App 目录

Next.js App Router 结构：

```text
app/
├── layout.tsx              # 根布局，包含提供者
├── page.tsx                # 主应用页面
├── globals.css             # 全局样式和 CSS 变量
└── about/
    └── page.tsx            # 关于页面，显示运行时信息
```

### 关键文件

- **`layout.tsx`**：使用主题提供者、i18n 提供者和全局样式包装应用
- **`page.tsx`**：包含 PDF 查看器和欢迎页面逻辑的主入口点
- **`globals.css`**：Tailwind CSS 导入和主题 CSS 自定义属性

## Components 目录

按功能组织的 React 组件：

```text
components/
├── pdf-viewer/             # PDF 查看组件
│   ├── pdf-viewer.tsx      # 主查看器容器
│   ├── pdf-toolbar.tsx     # 桌面工具栏
│   ├── pdf-mobile-toolbar.tsx
│   ├── pdf-menubar.tsx     # 桌面菜单栏
│   ├── pdf-page.tsx        # 单页渲染器
│   ├── pdf-text-layer.tsx  # 文本选择层
│   ├── pdf-annotation-layer.tsx
│   ├── pdf-drawing-layer.tsx
│   ├── pdf-outline.tsx     # 目录
│   ├── pdf-bookmarks.tsx   # 用户书签
│   ├── pdf-thumbnail.tsx   # 页面缩略图
│   ├── pdf-tts-reader.tsx  # 文本转语音
│   ├── pdf-settings-dialog.tsx
│   └── __tests__/          # 组件测试
├── ai-sidebar/             # AI 聊天界面
│   ├── ai-sidebar.tsx      # 侧边栏容器
│   ├── ai-chat-panel.tsx   # 聊天对话
│   ├── ai-settings-panel.tsx
│   ├── ai-tools-panel.tsx
│   └── __tests__/
├── ai-elements/            # AI 消息组件
│   ├── message.tsx         # 消息气泡
│   ├── prompt-input.tsx    # 用户输入
│   ├── code-block.tsx      # 代码渲染
│   ├── tool.tsx            # 工具调用显示
│   └── __tests__/
├── ui/                     # shadcn/ui 组件
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
├── welcome-page/           # 欢迎屏幕
├── providers/              # React 上下文提供者
├── theme-manager.tsx       # 主题切换逻辑
├── language-switcher.tsx   # i18n 语言切换
└── splash-screen.tsx       # 加载动画
```

## Lib 目录

工具、服务和状态管理：

```text
lib/
├── pdf-store.ts            # PDF 状态 (Zustand)
├── ai-chat-store.ts        # AI 聊天状态 (Zustand)
├── custom-theme-store.ts   # 自定义主题 (Zustand)
├── pdf-utils.ts            # PDF.js 工具
├── ai-service.ts           # AI 文本生成
├── ai-providers.ts         # AI 提供商配置
├── mcp-client.ts           # MCP 协议客户端
├── tauri-bridge.ts         # Tauri 命令包装器
├── archive-utils.ts        # ZIP/RAR 解压
├── notification-service.ts # Toast 通知
├── i18n.ts                 # i18next 配置
├── utils.ts                # 通用工具 (cn)
└── *.test.ts               # 单元测试
```

### 状态存储

| 存储                    | 用途                               |
| ----------------------- | ---------------------------------- |
| `pdf-store.ts`          | PDF 文档状态、注释、书签、视图设置 |
| `ai-chat-store.ts`      | AI 对话、提供商设置、MCP 配置      |
| `custom-theme-store.ts` | 自定义主题定义、预设               |

### 服务

| 服务              | 用途                       |
| ----------------- | -------------------------- |
| `ai-service.ts`   | 流式文本生成、工具调用     |
| `pdf-utils.ts`    | PDF 加载、文本提取、元数据 |
| `tauri-bridge.ts` | 文件操作、系统信息         |
| `mcp-client.ts`   | MCP 服务器连接             |

## Hooks 目录

自定义 React hooks：

```text
hooks/
├── use-ai-chat.ts          # AI 聊天逻辑
├── use-ai-media.ts         # 图像/语音生成
├── use-pdf-context.ts      # AI 的 PDF 上下文
├── use-deep-research.ts    # 多步研究
├── use-touch-gestures.ts   # 触摸交互
├── use-tts.ts              # 文本转语音
└── *.test.ts               # Hook 测试
```

## Locales 目录

国际化文件：

```text
locales/
├── en/
│   └── translation.json    # 英语翻译
└── zh/
    └── translation.json    # 中文翻译
```

## Tauri 目录

桌面 Rust 后端：

```text
src-tauri/
├── src/
│   ├── lib.rs              # Tauri 命令
│   └── main.rs             # 应用入口
├── capabilities/
│   └── default.json        # 权限定义
├── icons/                  # 应用图标
├── tauri.conf.json         # Tauri 配置
├── Cargo.toml              # Rust 依赖
└── Cargo.lock
```

### Tauri 命令

在 `src/lib.rs` 中定义：

- `get_system_info()` - OS 和架构信息
- `get_app_runtime_info()` - 应用版本、路径
- `reveal_in_file_manager()` - 打开文件位置
- `rename_file()` - 重命名文件
- `delete_file()` - 删除文件

## 配置文件

| 文件                | 用途            |
| ------------------- | --------------- |
| `next.config.ts`    | Next.js 配置    |
| `tsconfig.json`     | TypeScript 配置 |
| `eslint.config.mjs` | ESLint 规则     |
| `.prettierrc.json`  | Prettier 格式化 |
| `jest.config.ts`    | Jest 测试配置   |
| `components.json`   | shadcn/ui 配置  |
| `mkdocs.yml`        | 文档配置        |

## 构建输出

### Web 构建 (`out/`)

用于 Web 部署的静态导出：

```text
out/
├── index.html
├── _next/
│   ├── static/
│   └── chunks/
└── ...
```

### 桌面构建 (`src-tauri/target/`)

平台特定安装程序：

```text
src-tauri/target/release/bundle/
├── msi/                    # Windows MSI
├── nsis/                   # Windows NSIS
├── dmg/                    # macOS DMG
├── macos/                  # macOS 应用包
├── appimage/               # Linux AppImage
└── deb/                    # Debian 包
```
