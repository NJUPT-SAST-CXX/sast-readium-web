# Web Deployment

This guide covers deploying SAST Readium as a web application.

## Build for Production

```bash
pnpm build
```

This creates a static export in the `out/` directory, optimized for production:

- Minified JavaScript and CSS
- Optimized images
- Generated service worker (PWA)
- Static HTML pages

## Deployment Options

### Vercel (Recommended)

Vercel provides the best experience for Next.js applications.

**Automatic Deployment:**

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Vercel auto-detects Next.js configuration
4. Deploy automatically on every push

**Manual Deployment:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Netlify

**Via Dashboard:**

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: `pnpm build`
   - Publish directory: `out`
5. Deploy

**Via CLI:**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --dir=out

# Deploy to production
netlify deploy --dir=out --prod
```

### GitHub Pages

**Using GitHub Actions:**

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

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

**Configuration:**

1. Go to repository Settings → Pages
2. Set source to "GitHub Actions"
3. Push to main branch to trigger deployment

### Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Connect your GitHub repository
3. Configure build settings:
   - Framework preset: Next.js (Static HTML Export)
   - Build command: `pnpm build`
   - Build output directory: `out`
4. Deploy

### Static Hosting (Any Provider)

For any static hosting provider:

1. Build the project:

   ```bash
   pnpm build
   ```

2. Upload the `out/` directory to your hosting provider

3. Configure your server to:
   - Serve `index.html` for all routes (SPA fallback)
   - Enable gzip/brotli compression
   - Set appropriate cache headers

## Environment Variables

### Build-time Variables

Set in your deployment platform or `.env.production`:

```bash
NEXT_PUBLIC_APP_NAME=SAST Readium
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Runtime Variables

For client-side variables, use `NEXT_PUBLIC_` prefix.

!!! warning "Security"
Never expose sensitive API keys in `NEXT_PUBLIC_` variables. These are visible in the browser.

## PWA Configuration

SAST Readium is configured as a Progressive Web App.

### Features

- Offline support via service worker
- Installable on mobile and desktop
- App-like experience

### Manifest

The PWA manifest is in `public/manifest.json`:

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

### Service Worker

Generated automatically by `@ducanh2912/next-pwa`.

## Performance Optimization

### Caching Headers

Configure your server/CDN with appropriate cache headers:

```
# Static assets (long cache)
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# HTML pages (short cache)
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# Service worker (no cache)
/sw.js
  Cache-Control: public, max-age=0, must-revalidate
```

### CDN Configuration

For best performance:

1. Enable CDN caching
2. Configure edge caching rules
3. Enable Brotli/Gzip compression
4. Use HTTP/2 or HTTP/3

### Image Optimization

Next.js Image Optimization is configured for static export.

## Custom Domain

### DNS Configuration

Add these DNS records:

| Type  | Name | Value               |
| ----- | ---- | ------------------- |
| A     | @    | Your hosting IP     |
| CNAME | www  | Your hosting domain |

### SSL/TLS

Most hosting providers offer free SSL:

- Vercel: Automatic
- Netlify: Automatic
- Cloudflare: Automatic
- GitHub Pages: Automatic

## Monitoring

### Analytics

Add analytics by including the script in `app/layout.tsx`:

```tsx
// Google Analytics example
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
  strategy="afterInteractive"
/>
```

### Error Tracking

Consider adding error tracking:

- Sentry
- LogRocket
- Bugsnag

## Troubleshooting

### 404 on Refresh

For SPA routing, configure your server to serve `index.html` for all routes.

**Netlify** (`netlify.toml`):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel** (`vercel.json`):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Build Failures

1. Check Node.js version (20.x required)
2. Verify all dependencies are installed
3. Check for TypeScript errors
4. Review build logs

### Slow Loading

1. Enable compression
2. Configure CDN caching
3. Optimize images
4. Analyze bundle size
