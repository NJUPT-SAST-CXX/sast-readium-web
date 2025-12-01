# 安装

本指南将引导您完成 SAST Readium 的开发环境设置。

## 克隆仓库

```bash
git clone https://github.com/NJUPT-SAST-CXX/sast-readium-web.git
cd sast-readium-web
```

## 安装依赖

```bash
pnpm install
```

此命令将：

1. 安装所有 Node.js 依赖
2. 自动设置 Husky pre-commit 钩子
3. 准备开发环境

!!! note "首次安装"
首次安装可能需要几分钟，因为需要下载所有依赖并为 Tauri 设置 Rust 工具链。

## 验证安装

### Web 开发

启动 Next.js 开发服务器：

```bash
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。您应该能看到 SAST Readium 欢迎页面。

### 桌面开发

检查 Tauri 环境：

```bash
pnpm tauri info
```

这将显示您的 Tauri 设置信息，包括：

- 操作系统
- Rust 版本
- Node.js 版本
- Tauri CLI 版本

如果一切配置正确，启动桌面应用：

```bash
pnpm tauri dev
```

## 项目结构概览

安装后，您的项目结构如下：

```text
sast-readium-web/
├── app/                    # Next.js App Router
├── components/             # React 组件
│   ├── pdf-viewer/         # PDF 查看器组件
│   ├── ai-sidebar/         # AI 聊天界面
│   ├── ui/                 # shadcn/ui 组件
│   └── ...
├── lib/                    # 工具和服务
├── hooks/                  # 自定义 React hooks
├── locales/                # i18n 翻译文件
├── src-tauri/              # Tauri Rust 后端
├── public/                 # 静态资源
└── docs/                   # 文档（本站点）
```

## 环境配置

### 环境变量

创建 `.env.local` 文件用于环境特定配置：

```bash
# 示例环境变量
NEXT_PUBLIC_APP_NAME=SAST Readium
```

!!! warning "安全" - 只有以 `NEXT_PUBLIC_` 为前缀的变量会暴露给浏览器 - 切勿将 `.env.local` 提交到版本控制 - 安全存储敏感 API 密钥

### 路径别名

项目使用 TypeScript 路径别名以获得更清晰的导入：

```typescript
// 不使用相对路径
import { Button } from "../../../components/ui/button";

// 使用路径别名
import { Button } from "@/components/ui/button";
```

可用别名：

| 别名           | 路径             |
| -------------- | ---------------- |
| `@/components` | `components/`    |
| `@/lib`        | `lib/`           |
| `@/ui`         | `components/ui/` |
| `@/hooks`      | `hooks/`         |

## 添加 UI 组件

SAST Readium 使用 [shadcn/ui](https://ui.shadcn.com/) 作为 UI 组件。添加新组件：

```bash
# 添加单个组件
pnpm dlx shadcn@latest add button

# 添加多个组件
pnpm dlx shadcn@latest add card dialog tooltip
```

组件将添加到 `components/ui/`，可根据需要自定义。

## 下一步

- [快速入门](quick-start.md) - 学习使用 SAST Readium 的基础知识
- [项目结构](../architecture/project-structure.md) - 了解代码库组织
- [开发脚本](../development/scripts.md) - 可用的 npm 脚本
