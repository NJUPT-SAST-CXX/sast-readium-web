# CI/CD Pipeline

SAST Readium uses GitHub Actions for continuous integration and deployment. This guide covers the pipeline configuration and usage.

## Overview

The CI/CD pipeline includes:

1. **Code Quality** - Linting, type checking, security audits
2. **Testing** - Unit tests with coverage
3. **Build** - Web and desktop builds
4. **Deploy** - Preview and production deployments
5. **Release** - Automated GitHub releases

## Workflow Triggers

| Trigger      | Branches          | Jobs                 |
| ------------ | ----------------- | -------------------- |
| Push         | `main`, `develop` | All jobs             |
| Pull Request | `main`, `develop` | Quality, Test, Build |
| Tag (`v*`)   | Any               | All jobs + Release   |

## Jobs

### Code Quality & Security

**Duration**: ~2-3 minutes

Runs on every push and PR:

```yaml
- ESLint linting
- TypeScript type checking
- Security audit (pnpm audit)
- Dependency check
```

### Test Suite

**Duration**: ~3-5 minutes

Runs tests and generates coverage:

```yaml
- Jest tests with coverage
- Coverage report upload to Codecov
- Test results as PR comment
- Build verification
```

**Coverage Thresholds**:

- Lines: 70%
- Statements: 70%
- Branches: 60%
- Functions: 60%

### Build Tauri

**Duration**: ~10-20 minutes per platform

Builds desktop applications for:

| Platform    | Targets                 |
| ----------- | ----------------------- |
| **Linux**   | AppImage, .deb          |
| **Windows** | MSI, NSIS               |
| **macOS**   | DMG, .app (x64 + ARM64) |

### Deploy Preview

**Duration**: ~2-3 minutes

Deploys preview for pull requests to Vercel.

**Required Secrets**:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Create Release

**Duration**: ~1-2 minutes

Creates GitHub release when a version tag is pushed.

## Setting Up CI/CD

### Required Secrets

Add these in GitHub repository settings:

#### Vercel Deployment

```
VERCEL_TOKEN        - Vercel API token
VERCEL_ORG_ID       - Organization ID
VERCEL_PROJECT_ID   - Project ID
```

#### Codecov (Optional)

```
CODECOV_TOKEN       - Codecov upload token
```

#### Windows Code Signing (Optional)

```
WINDOWS_CERTIFICATE          - Base64 PFX certificate
WINDOWS_CERTIFICATE_PASSWORD - Certificate password
```

#### macOS Code Signing (Optional)

```
APPLE_CERTIFICATE          - Base64 .p12 certificate
APPLE_CERTIFICATE_PASSWORD - Certificate password
APPLE_SIGNING_IDENTITY     - Developer ID
APPLE_ID                   - Apple ID email
APPLE_PASSWORD             - App-specific password
APPLE_TEAM_ID              - Team ID
```

### Vercel Setup

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Link project:

   ```bash
   vercel login
   vercel link
   ```

3. Get credentials:

   ```bash
   cat .vercel/project.json
   ```

4. Add secrets to GitHub

## Creating Releases

### Automatic Release

Push a version tag to trigger release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow will:

1. Build all platforms
2. Create draft release
3. Attach installers
4. Generate changelog

### Manual Release

1. Go to GitHub Releases
2. Click "Draft a new release"
3. Choose tag
4. Add release notes
5. Publish

## Caching

The pipeline uses caching for faster builds:

| Cache         | Purpose            |
| ------------- | ------------------ |
| pnpm store    | Node.js packages   |
| Next.js cache | Build artifacts    |
| Rust cache    | Cargo dependencies |

**Speed Improvement**:

- First run: ~15-25 minutes
- Cached run: ~5-10 minutes

## Concurrency

Concurrent runs are managed automatically:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

This cancels outdated runs when new commits are pushed.

## Artifacts

Build artifacts are uploaded and retained:

| Artifact          | Retention | Description        |
| ----------------- | --------- | ------------------ |
| `test-results`    | 30 days   | JUnit XML results  |
| `coverage-report` | 30 days   | HTML coverage      |
| `nextjs-build`    | 7 days    | Web build          |
| `tauri-*`         | 30 days   | Desktop installers |

## Troubleshooting

### Tests Failing in CI

1. Check Node.js version matches (20.x)
2. Ensure `pnpm-lock.yaml` is committed
3. Check for environment-specific issues
4. Review test logs

### Tauri Build Failing

**Linux**:

```bash
# Check dependencies
sudo apt install libwebkit2gtk-4.1-dev
```

**Windows**:

```bash
# Check Rust toolchain
rustup show
```

**macOS**:

```bash
# Check Xcode tools
xcode-select --install
```

### Deployment Failures

1. Verify secrets are set correctly
2. Check Vercel project configuration
3. Review deployment logs
4. Ensure build succeeds locally

## Pre-commit Hooks

Local quality checks before commits:

- **ESLint**: Auto-fixes staged files
- **Prettier**: Formats staged files

These run automatically via Husky.

## Best Practices

1. **Test locally** before pushing
2. **Let hooks run** - they catch issues early
3. **Use feature branches** for development
4. **Create PRs** for code review
5. **Tag releases** with semantic versioning
6. **Review drafts** before publishing
7. **Monitor costs** and optimize

## Monitoring

### GitHub Actions Dashboard

View runs at: `https://github.com/NJUPT-SAST-CXX/sast-readium-web/actions`

### Notifications

Configure in: Settings → Notifications → Actions

### Slack Integration (Optional)

Add Slack notifications using `slack-send` action.

## Cost Optimization

### GitHub Actions Minutes

- Free tier: 2,000 minutes/month (private repos)
- Public repos: Unlimited

### Tips

1. Use caching effectively
2. Cancel outdated runs
3. Run expensive jobs conditionally
4. Consider self-hosted runners
