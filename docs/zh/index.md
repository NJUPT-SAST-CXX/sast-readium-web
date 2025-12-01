# SAST Readium

<div align="center">
  <img src="../assets/logo.png" alt="SAST Readium Logo" width="128" height="128" />
  <p><strong>现代化、功能丰富的 PDF 阅读器和注释应用</strong></p>
</div>

---

SAST Readium 将强大的 PDF 查看功能与全面的注释工具相结合，支持从单一代码库同时部署 **Web** 和**桌面**应用。

## 核心特性

<div class="grid cards" markdown>

- :material-file-document:{ .lg .middle } **PDF 查看**

  ***

  多种查看模式、灵活缩放（50%-500%）、页面旋转、全文搜索高亮显示。

  [:octicons-arrow-right-24: 了解更多](features/pdf-viewer.md)

- :material-pencil:{ .lg .middle } **注释工具**

  ***

  高亮、评论、手绘、形状、印章和数字签名，支持撤销/重做。

  [:octicons-arrow-right-24: 了解更多](features/annotations.md)

- :material-robot:{ .lg .middle } **AI 助手**

  ***

  集成 AI 聊天，支持 PDF 上下文感知、工具调用和 MCP 协议。

  [:octicons-arrow-right-24: 了解更多](features/ai-assistant.md)

- :material-palette:{ .lg .middle } **自定义主题**

  ***

  明亮、暗黑、棕褐色模式，支持自动检测。创建和分享自定义颜色主题。

  [:octicons-arrow-right-24: 了解更多](features/custom-themes.md)

</div>

## 技术栈

| 类别         | 技术                              |
| ------------ | --------------------------------- |
| **前端**     | Next.js 16, React 19, TypeScript  |
| **桌面**     | Tauri 2.9 (Windows, macOS, Linux) |
| **PDF 引擎** | PDF.js                            |
| **样式**     | Tailwind CSS v4, shadcn/ui        |
| **状态管理** | Zustand 持久化                    |
| **国际化**   | react-i18next                     |
| **测试**     | Jest, React Testing Library       |
| **AI**       | Vercel AI SDK, MCP 协议           |

## 快速开始

=== "Web 开发"

    ```bash
    # 克隆并安装
    git clone https://github.com/NJUPT-SAST-CXX/sast-readium-web.git
    cd sast-readium-web
    pnpm install

    # 启动开发服务器
    pnpm dev
    ```

=== "桌面开发"

    ```bash
    # 确保已安装 Rust
    rustc --version

    # 启动 Tauri 开发模式
    pnpm tauri dev
    ```

[:octicons-arrow-right-24: 完整安装指南](getting-started/installation.md)

## 双重部署

SAST Readium 支持从单一代码库进行两种部署模式：

- **Web 模式**：渐进式 Web 应用，支持 Service Worker
- **桌面模式**：原生桌面应用，完全访问文件系统

两种模式提供无缝、一致的用户体验。

## 社区

- **组织**：[SAST-CXX](https://github.com/NJUPT-SAST-CXX)
- **网站**：[SAST](https://sast.fun/)
- **问题反馈**：[GitHub Issues](https://github.com/NJUPT-SAST-CXX/sast-readium-web/issues)

## 许可证

本项目是开源的，采用 [MIT 许可证](https://github.com/NJUPT-SAST-CXX/sast-readium-web/blob/main/LICENSE)。
