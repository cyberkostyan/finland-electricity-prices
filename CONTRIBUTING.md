# Contributing to Spothinta

Thank you for your interest in contributing to Spothinta! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [GitHub Issues](https://github.com/cyberkostyan/finland-electricity-prices/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information
   - Screenshots if applicable

### Suggesting Features

1. Open a new issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain why it would benefit users

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test your changes locally
5. Commit with clear messages (see [Commit Guidelines](#commit-guidelines))
6. Push to your fork
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- Yarn (not npm)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/finland-electricity-prices.git
cd finland-electricity-prices

# Install dependencies
yarn install

# Start development server
yarn dev
```

### Running Tests

```bash
# Lint code
yarn lint

# Build to check for errors
yarn build
```

## Code Style

### General Guidelines

- Use TypeScript for all new code
- Follow existing code patterns and structure
- Keep components small and focused
- Use meaningful variable and function names

### File Naming

- React components: `PascalCase.tsx`
- Utilities and hooks: `camelCase.ts`
- Pages follow Next.js conventions

### TypeScript

- Prefer explicit types over `any`
- Use interfaces for object shapes
- Export types when they may be reused

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use shadcn/ui components when possible
- Maintain dark mode compatibility

### Internationalization

- All user-facing text must be in translation files
- Add translations for both `en.json` and `fi.json`
- Use `useTranslations` hook from `next-intl`

## Commit Guidelines

Write clear, concise commit messages:

```
Add price alert notification sound

- Add audio file for notifications
- Implement sound toggle in settings
- Update translations
```

**Format:**
- First line: imperative mood, max 50 characters
- Blank line after first line (if adding details)
- Additional details in bullet points

**Good examples:**
- `Fix chart rendering on mobile devices`
- `Add temperature overlay to price chart`
- `Update Finnish translations for settings page`

**Avoid:**
- `Fixed stuff`
- `WIP`
- `Changes`

## Pull Request Process

1. **Title:** Clear description of the change
2. **Description:** Include:
   - What the PR does
   - Why the change is needed
   - How to test it
   - Screenshots for UI changes
3. **Size:** Keep PRs focused and reasonably sized
4. **Review:** Address feedback promptly

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Changes work in both light and dark mode
- [ ] Translations added for both languages (if applicable)
- [ ] No console errors or warnings
- [ ] `yarn build` completes successfully
- [ ] Tested on mobile and desktop

## Project Structure

```
app/           → Next.js App Router pages and API routes
components/    → React components
lib/           → Utility functions and API clients
i18n/          → Internationalization configuration
messages/      → Translation files
public/        → Static assets
```

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for helping improve Spothinta!
