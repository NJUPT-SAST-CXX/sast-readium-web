# Web 部署

本指南涵盖将 SAST Readium 部署为 Web 应用程序。

## 生产构建

```bash
pnpm build
```

这将在 `out/` 目录创建静态导出，针对生产进行优化：

- 压缩的 JavaScript 和 CSS
- 优化的图像
- 生成的 Service Worker (PWA)
- 静态 HTML 页面

## 部署选项

### Vercel（推荐）

Vercel 为 Next.js 应用提供最佳体验。

**自动部署：**

1. 将代码推送到 GitHub
2. 在 [Vercel Dashboard](https://vercel.com/new) 导入项目
3. Vercel 自动检测 Next.js 配置
4. 每次推送自动部署

**手动部署：**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 部署到生产
vercel --prod
```

### Netlify

**通过 Dashboard：**

1. 访问 [Netlify](https://app.netlify.com/)
2. 点击"Add new site" → "Import an existing project"
3. 连接您的 GitHub 仓库
4. 配置构建设置：
   - 构建命令：`pnpm build`
   - 发布目录：`out`
5. 部署

**通过 CLI：**

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --dir=out

# 部署到生产
netlify deploy --dir=out --prod
```

### GitHub Pages

**使用 GitHub Actions：**

创建 `.github/workflows/deploy-pages.yml`：

```yaml
name: 部署到 GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install
      - run: pnpm build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

**配置：**

1. 进入仓库 Settings → Pages
2. 将来源设置为"GitHub Actions"
3. 推送到 main 分支触发部署

### Cloudflare Pages

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 连接您的 GitHub 仓库
3. 配置构建设置：
   - 框架预设：Next.js (Static HTML Export)
   - 构建命令：`pnpm build`
   - 构建输出目录：`out`
4. 部署

## 环境变量

### 构建时变量

在部署平台或 `.env.production` 中设置：

```bash
NEXT_PUBLIC_APP_NAME=SAST Readium
NEXT_PUBLIC_API_URL=https://api.example.com
```

### 运行时变量

对于客户端变量，使用 `NEXT_PUBLIC_` 前缀。

!!! warning "安全"
永远不要在 `NEXT_PUBLIC_` 变量中暴露敏感 API 密钥。这些在浏览器中可见。

## PWA 配置

SAST Readium 配置为渐进式 Web 应用。

### 功能

- 通过 Service Worker 支持离线
- 可安装在移动和桌面设备
- 类应用体验

### Manifest

PWA manifest 在 `public/manifest.json`：

```json
{
  "name": "SAST Readium",
  "short_name": "Readium",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [...]
}
```

## 性能优化

### 缓存头

配置服务器/CDN 的适当缓存头：

```text
# 静态资源（长缓存）
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# HTML 页面（短缓存）
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# Service Worker（无缓存）
/sw.js
  Cache-Control: public, max-age=0, must-revalidate
```

### CDN 配置

为获得最佳性能：

1. 启用 CDN 缓存
2. 配置边缘缓存规则
3. 启用 Brotli/Gzip 压缩
4. 使用 HTTP/2 或 HTTP/3

## 自定义域名

### DNS 配置

添加以下 DNS 记录：

| 类型  | 名称 | 值           |
| ----- | ---- | ------------ |
| A     | @    | 您的托管 IP  |
| CNAME | www  | 您的托管域名 |

### SSL/TLS

大多数托管提供商提供免费 SSL：

- Vercel：自动
- Netlify：自动
- Cloudflare：自动
- GitHub Pages：自动

## 故障排除

### 刷新时 404

对于 SPA 路由，配置服务器为所有路由提供 `index.html`。

**Netlify** (`netlify.toml`)：

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel** (`vercel.json`)：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 构建失败

1. 检查 Node.js 版本（需要 20.x）
2. 验证所有依赖已安装
3. 检查 TypeScript 错误
4. 查看构建日志

### 加载缓慢

1. 启用压缩
2. 配置 CDN 缓存
3. 优化图像
4. 分析包大小
