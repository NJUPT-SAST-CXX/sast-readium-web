# Contributing

Thank you for your interest in contributing to SAST Readium! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 20.x or later
- pnpm 8.x or later
- Git
- (For desktop) Rust 1.70+

### Setup

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sast-readium-web.git
   cd sast-readium-web
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the App

```bash
# Web development
pnpm dev

# Desktop development
pnpm tauri dev
```

### Code Quality

Before committing, ensure your code passes all checks:

```bash
# Linting
pnpm lint

# Type checking
pnpm typecheck

# Tests
pnpm test

# Formatting
pnpm format
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks that automatically:

- Run ESLint with auto-fix
- Format code with Prettier

## Making Changes

### Coding Standards

- Write TypeScript for all code
- Follow existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Component Guidelines

- Use functional components with hooks
- Define prop types with TypeScript interfaces
- Use `cn()` for conditional class names
- Follow shadcn/ui patterns for UI components

### State Management

- Use Zustand stores for global state
- Use selective subscriptions to prevent unnecessary re-renders
- Keep state minimal and derived when possible

### Styling

- Use Tailwind CSS utilities
- Use CSS variables for theme colors
- Follow mobile-first responsive design
- Avoid inline styles

## Submitting Changes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```
feat(pdf): add page rotation support
fix(annotations): resolve highlight color persistence
docs(readme): update installation instructions
refactor(store): simplify zoom calculations
test(hooks): add tests for usePDFNavigation
```

### Pull Requests

1. Push your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub

3. Fill out the PR template:
   - Describe your changes
   - Link related issues
   - Add screenshots for UI changes
   - List testing steps

4. Wait for review

### PR Requirements

- All CI checks must pass
- Code review approval required
- No merge conflicts
- Tests for new features
- Documentation updates if needed

## Testing

### Writing Tests

- Co-locate tests with source files
- Use descriptive test names
- Test behavior, not implementation
- Use React Testing Library queries

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Documentation

### Updating Docs

Documentation is in the `docs/` directory using MkDocs.

```bash
# Serve docs locally
mkdocs serve

# Build docs
mkdocs build
```

### Adding New Pages

1. Create markdown file in appropriate directory
2. Add to navigation in `mkdocs.yml`
3. Add Chinese translation in `docs/zh/`

## Issue Guidelines

### Reporting Bugs

Include:

- Steps to reproduce
- Expected vs actual behavior
- Environment info (OS, browser, version)
- Screenshots or error messages

### Feature Requests

Include:

- Use case description
- Proposed solution
- Alternative approaches considered

## Community

### Code of Conduct

Be respectful and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

### Getting Help

- Check existing issues and discussions
- Ask in GitHub Discussions
- Review the documentation

## Recognition

Contributors are recognized in:

- GitHub contributors list
- Release notes
- README acknowledgments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to SAST Readium! 🎉
