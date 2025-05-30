# ISBDM Project Development Guidelines

This document provides guidelines and information for developers working on the ISBDM (International Standard Bibliographic Description for Manifestation) project.

**Last Updated:** May 10, 2023

## Build and Configuration

### Prerequisites
- Node.js >= 18.0
- npm (comes with Node.js)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/iflastandards/ISBDM.git
   cd ISBDM
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server
Start the development server:
```bash
npm start
```
This will start a local development server at http://localhost:3000/ISBDM/ with hot reloading enabled.

### Build for Production
Build the site for production:
```bash
npm run build
```
The built files will be in the `build` directory.

### Serve Production Build
To serve the production build locally:
```bash
npm run serve
```

### Additional Scripts
- `npm run clear` - Clear the cache
- `npm run typecheck` - Run TypeScript type checking
- `npm run dev` - Run custom development script
- `npm run list` - List available commands
- `npm run generate` - Generate content
- `npm run parse-prd` - Parse PRD files

## Testing

### Testing Framework
The project uses Vitest as the test runner and React Testing Library for testing React components.

### Running Tests
- Run all tests:
  ```bash
  npm test
  ```

- Run tests with UI:
  ```bash
  npm run test:ui
  ```

- Run tests in watch mode:
  ```bash
  npm run test:watch
  ```

- Run specific test file:
  ```bash
  npm test -- path/to/test/file.test.tsx
  ```

### Test Structure
Tests are located in the `src/tests` directory, mirroring the structure of the `src` directory. For example, tests for components in `src/components/global/Button` would be in `src/tests/components/Button`.

### Writing Tests
Here's an example of a component test:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import { Button } from '../../../components/demo/Button';
import '@testing-library/jest-dom/vitest';

describe('Button component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: 'Click me' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toBeDisabled();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking Docusaurus Components
When testing components that use Docusaurus-specific features, you may need to mock them. The project has mocks set up in `src/tests/__mocks__/` directory. For example:

```tsx
// Mock for @docusaurus/Link
vi.mock('@docusaurus/Link', () => {
  return {
    default: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});
```

## Development Guidelines

### Project Structure
- `ISBDM` - Original HTML source that we're converting to Docusaurus. Use this folder as a reference when you need to know something about the original content.
- `src/components` - React components
  - `global` - Global components used throughout the site
  - `demo` - Demo components (like the Button component we created)
- `src/tests` - Test files
- `docs` - Documentation content in MDX format
- `blog` - Blog content
- `static` - Static assets
- `.junie` - Project-specific guidelines and documentation

### Component Structure
Components should follow this structure:
- Each component should be in its own directory
- The main component file should be `index.tsx`
- Styles should be in a `.module.scss` file
- Tests should be in the corresponding directory in `src/tests`

Example:
```
src/components/global/Button/
├── index.tsx
├── Button.module.scss
```

```
src/tests/components/Button/
├── Button.test.tsx
```

### TypeScript
- The project uses TypeScript for type safety
- Props interfaces should be exported for reuse
- Use React.FC<Props> for functional components
- Document props with JSDoc comments

### CSS/SCSS
- The project uses CSS Modules with SCSS
- Import styles with `import styles from './Component.module.scss'`
- Use `clsx` for conditional class names

### Internationalization
The project supports multiple languages:
- English (default)
- French
- Spanish
- German

### Accessibility
- Use semantic HTML elements
- Include proper ARIA attributes
- Test with jest-axe for accessibility issues

## Docusaurus-Specific Guidelines

### MDX Content
- Content is written in MDX (Markdown + JSX)
- Custom components can be used in MDX files
- The sidebar structure is defined in `sidebars.ts`

### Theme Customization
- Custom CSS is in `src/css/custom.css`
- Theme configuration is in `docusaurus.config.ts`

### Plugins
The project uses the following Docusaurus plugins:
- `docusaurus-plugin-sass` - For SCSS support
