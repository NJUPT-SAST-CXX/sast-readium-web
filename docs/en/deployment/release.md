# Release Process

This guide covers the release workflow for SAST Readium, including versioning, changelog generation, and publishing.

## Versioning

SAST Readium follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

## Release Workflow

### 1. Prepare Release

1. Ensure all changes are merged to `main`
2. Update version numbers
3. Update changelog
4. Create release commit

### 2. Update Version Numbers

Update version in these files:

**`package.json`:**

```json
{
  "version": "1.0.0"
}
```

**`src-tauri/tauri.conf.json`:**

```json
{
  "version": "1.0.0"
}
```

**`src-tauri/Cargo.toml`:**

```toml
[package]
version = "1.0.0"
```

### 3. Update Changelog

Add release notes to `CHANGELOG.md`:

```markdown
## [1.0.0] - 2025-01-15

### Added

- New feature X
- New feature Y

### Changed

- Improved performance of Z

### Fixed

- Bug fix for issue #123

### Removed

- Deprecated feature W
```

### 4. Create Release Commit

```bash
git add .
git commit -m "chore: release v1.0.0"
git push origin main
```

### 5. Create Version Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the CI/CD pipeline to:

1. Run all tests
2. Build for all platforms
3. Create GitHub Release draft
4. Attach installers

### 6. Publish Release

1. Go to GitHub Releases
2. Find the draft release
3. Review release notes
4. Edit if needed
5. Click "Publish release"

## Automated Release

The GitHub Actions workflow handles:

### Build Matrix

| Platform | Architecture | Formats       |
| -------- | ------------ | ------------- |
| Windows  | x64          | MSI, NSIS     |
| macOS    | x64          | DMG, App      |
| macOS    | ARM64        | DMG, App      |
| Linux    | x64          | AppImage, Deb |

### Release Assets

Each release includes:

- Windows installers (MSI, EXE)
- macOS disk images (DMG)
- Linux packages (AppImage, Deb)
- Source code archives
- Checksums file

## Pre-release Versions

For beta or release candidate versions:

```bash
# Beta release
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1

# Release candidate
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```

Mark as pre-release in GitHub:

1. Edit the release
2. Check "Set as a pre-release"
3. Publish

## Hotfix Releases

For urgent fixes:

1. Create hotfix branch from tag:

   ```bash
   git checkout -b hotfix/1.0.1 v1.0.0
   ```

2. Apply fix and commit

3. Update version to patch:

   ```bash
   # Update version to 1.0.1
   ```

4. Merge to main:

   ```bash
   git checkout main
   git merge hotfix/1.0.1
   ```

5. Tag and release:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

## Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Upcoming features

## [1.0.0] - 2025-01-15

### Added

- Initial release
- PDF viewing with multiple modes
- Annotation tools
- AI assistant integration
- Desktop application support
```

## Release Checklist

Before releasing:

- [ ] All tests pass
- [ ] No critical bugs open
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version numbers updated
- [ ] Tested on all platforms
- [ ] Release notes prepared

After releasing:

- [ ] Verify all assets uploaded
- [ ] Test download links
- [ ] Announce release
- [ ] Update documentation site
- [ ] Close related issues

## Announcements

After publishing a release:

1. **GitHub Discussions**: Post release announcement
2. **Social Media**: Share on relevant platforms
3. **Documentation**: Update version references

## Rollback

If a release has critical issues:

1. **Immediate**: Mark release as pre-release or delete
2. **Hotfix**: Create patch release with fix
3. **Communication**: Notify users of issue

## Auto-Update Manifest

For Tauri auto-updates, update the manifest:

```json
{
  "version": "1.0.0",
  "notes": "See the release notes on GitHub",
  "pub_date": "2025-01-15T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/.../sast-readium_1.0.0_x64-setup.nsis.zip",
      "signature": "..."
    },
    "darwin-x86_64": {
      "url": "https://github.com/.../sast-readium_1.0.0_x64.app.tar.gz",
      "signature": "..."
    },
    "darwin-aarch64": {
      "url": "https://github.com/.../sast-readium_1.0.0_aarch64.app.tar.gz",
      "signature": "..."
    },
    "linux-x86_64": {
      "url": "https://github.com/.../sast-readium_1.0.0_amd64.AppImage.tar.gz",
      "signature": "..."
    }
  }
}
```

## Version History

Track all releases in the changelog and GitHub Releases page.
