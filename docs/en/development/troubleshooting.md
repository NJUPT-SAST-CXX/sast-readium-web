# Troubleshooting

This guide helps you resolve common issues when developing with SAST Readium.

## Development Server Issues

### Port 3000 Already in Use

**Symptoms**: Error message about port 3000 being in use.

**Solution**:

=== "Windows"

    ```powershell
    # Find process
    netstat -ano | findstr :3000

    # Kill process
    taskkill /PID <PID> /F
    ```

=== "macOS / Linux"

    ```bash
    # Find and kill process
    lsof -ti:3000 | xargs kill -9
    ```

### Hot Reload Not Working

**Symptoms**: Changes don't appear without manual refresh.

**Solutions**:

1. Check for syntax errors in your code
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```
3. Restart the development server
4. Check file watcher limits (Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### Module Not Found Errors

**Symptoms**: Import errors for installed packages.

**Solutions**:

1. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   pnpm install
   ```
2. Clear pnpm cache:
   ```bash
   pnpm store prune
   ```
3. Check path aliases in `tsconfig.json`

## Tauri Issues

### Tauri Build Fails

**Symptoms**: Error during `pnpm tauri build`.

**Solutions**:

1. Check Tauri environment:

   ```bash
   pnpm tauri info
   ```

2. Update Rust:

   ```bash
   rustup update
   ```

3. Clean Rust build cache:

   ```bash
   cd src-tauri
   cargo clean
   cd ..
   ```

4. Check system dependencies (see [Prerequisites](../getting-started/prerequisites.md))

### Tauri Dev Window Blank

**Symptoms**: Desktop window opens but shows nothing.

**Solutions**:

1. Ensure Next.js server is running on port 3000
2. Check `src-tauri/tauri.conf.json` for correct `devUrl`
3. Check browser console for errors (right-click → Inspect)
4. Verify CSP settings in Tauri config

### Filesystem Permission Errors

**Symptoms**: Cannot read/write files in Tauri app.

**Solutions**:

1. Check capabilities in `src-tauri/capabilities/default.json`
2. Add required paths to `fs:scope`:
   ```json
   {
     "permissions": [
       {
         "identifier": "fs:scope",
         "allow": [{ "path": "$APPCONFIG/*" }, { "path": "$DOCUMENT/*" }]
       }
     ]
   }
   ```

## PDF Rendering Issues

### PDF Not Loading

**Symptoms**: PDF fails to load or shows error.

**Solutions**:

1. Check browser console for errors
2. Verify PDF file is not corrupted
3. Check PDF.js worker configuration in `lib/pdf-utils.ts`
4. Try a different PDF file

### Text Selection Not Working

**Symptoms**: Cannot select text in PDF.

**Solutions**:

1. Ensure PDF has text layer (not scanned image)
2. Check text layer rendering in `pdf-text-layer.tsx`
3. Verify selection mode is enabled

### Slow PDF Rendering

**Symptoms**: Large PDFs render slowly.

**Solutions**:

1. Enable virtual scrolling (default in continuous mode)
2. Reduce zoom level
3. Close other browser tabs
4. Check system memory usage

## Build Issues

### TypeScript Errors

**Symptoms**: Type errors during build.

**Solutions**:

1. Run type check:
   ```bash
   pnpm typecheck
   ```
2. Fix reported errors
3. Update type definitions:
   ```bash
   pnpm update @types/*
   ```

### ESLint Errors

**Symptoms**: Linting errors blocking build.

**Solutions**:

1. Run lint with auto-fix:
   ```bash
   pnpm lint:fix
   ```
2. Review and fix remaining errors
3. Check ESLint config in `eslint.config.mjs`

### Out of Memory

**Symptoms**: Build crashes with memory error.

**Solutions**:

1. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm build
   ```
2. Close other applications
3. Check for memory leaks in code

## Testing Issues

### Tests Failing

**Symptoms**: Tests pass locally but fail in CI.

**Solutions**:

1. Check Node.js version matches CI (20.x)
2. Ensure `pnpm-lock.yaml` is committed
3. Run tests in CI mode locally:
   ```bash
   pnpm test --ci
   ```
4. Check for environment-specific code

### Coverage Too Low

**Symptoms**: Coverage below thresholds.

**Solutions**:

1. Add tests for uncovered code
2. Focus on `lib/` utilities
3. Check coverage report:
   ```bash
   pnpm test:coverage
   open coverage/index.html
   ```

### Mocking Issues

**Symptoms**: Mocks not working correctly.

**Solutions**:

1. Check mock placement (before imports)
2. Use `jest.mocked()` for TypeScript
3. Clear mocks between tests:
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

## i18n Issues

### Translation Not Loading

**Symptoms**: Shows translation keys instead of text.

**Solutions**:

1. Check language code mapping in `lib/i18n.ts`
2. Verify translation file exists in `locales/`
3. Check browser console for loading errors
4. Clear localStorage and refresh

### Wrong Language

**Symptoms**: App shows wrong language.

**Solutions**:

1. Clear localStorage:
   ```javascript
   localStorage.removeItem("i18nextLng");
   ```
2. Check language detection order in i18n config
3. Manually set language:
   ```typescript
   i18n.changeLanguage("en");
   ```

## AI Features Issues

### API Key Not Working

**Symptoms**: AI requests fail with authentication error.

**Solutions**:

1. Verify API key is correct
2. Check key has required permissions
3. Ensure billing is active on provider
4. Try regenerating the key

### Streaming Not Working

**Symptoms**: AI responses don't stream.

**Solutions**:

1. Check network connection
2. Verify provider supports streaming
3. Check browser console for errors
4. Try non-streaming mode

### MCP Connection Failed

**Symptoms**: Cannot connect to MCP server.

**Solutions**:

1. Verify server command is correct
2. Check server is installed:
   ```bash
   npx -y @your/mcp-server --help
   ```
3. Review server logs
4. Check firewall settings

## Performance Issues

### Slow Initial Load

**Symptoms**: App takes long to load.

**Solutions**:

1. Check network tab for slow requests
2. Enable production build for testing
3. Analyze bundle size:
   ```bash
   ANALYZE=true pnpm build
   ```

### Memory Leaks

**Symptoms**: Memory usage grows over time.

**Solutions**:

1. Check for missing cleanup in useEffect
2. Verify event listeners are removed
3. Use React DevTools Profiler
4. Check for large state objects

## Getting Help

If you can't resolve an issue:

1. Search [GitHub Issues](https://github.com/NJUPT-SAST-CXX/sast-readium-web/issues)
2. Check the [Discussions](https://github.com/NJUPT-SAST-CXX/sast-readium-web/discussions)
3. Open a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (`pnpm tauri info`)
   - Error messages and logs
