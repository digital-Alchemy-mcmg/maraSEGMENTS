# Quick Apps Template

## Overview
This is the base template for Quick Apps web applications. It provides a pre-configured React/TypeScript/Vite project structure that serves as the starting point for all Quick Apps.

## Template Structure

```
template/
├── package.json              # Root package configuration
├── package-lock.json         # Dependency lock file
└── webapp/                   # Main web application
    ├── package.json          # Webapp dependencies
    ├── vite.config.ts        # Vite build configuration
    ├── tsconfig.json         # TypeScript configuration
    ├── vitest.config.ts      # Test configuration
    ├── index.html            # Application entry point
    ├── .prettierrc           # Code formatting rules
    ├── public/               # Static assets
    │   └── fonts/            # Amazon Ember fonts
    └── src/                  # Source code
        ├── main.tsx          # React entry point
        ├── App.tsx           # Root component
        ├── api-client.tsx    # Pre-configured API client
        └── health-check/     # Health check component
```

## Key Features

### Pre-configured Build System
- **Vite**: Fast build tool with HMR (Hot Module Replacement)
- **TypeScript**: Type-safe development with strict mode
- **Vitest**: Fast unit testing framework
- **Prettier**: Consistent code formatting

### React Application
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application
- **API Client**: Pre-configured HTTP client for backend communication

### Styling
- **Amazon Ember Fonts**: Includes all required font weights
- Ready for Amazon-branded applications

### Development Experience
- Hot Module Replacement for instant feedback
- TypeScript type checking
- Automated code formatting
- Pre-configured test setup

## Usage

When creating a new Quick App, this template is copied to create the workspace:

1. Copy template to workspace directory
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build for production: `npm run build`

## API Client

The `api-client.tsx` file provides a pre-configured HTTP client that:
- Handles authentication
- Manages API base URL configuration
- Provides consistent error handling
- Includes proper headers and CORS settings

**Important**: Do not modify `api-client.tsx` unless necessary for configuration changes.

## TypeScript Configuration

The template includes two TypeScript configurations:
- `tsconfig.json`: Main application configuration
- `tsconfig.node.json`: Build tooling configuration

Both enforce strict type checking to ensure code quality.

## Available Scripts

From the `webapp/` directory:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run prettier` - Format code

## Font Files

Amazon Ember fonts are included in `public/fonts/`:
- AmazonEmber_W_Rg.woff2 (Regular)
- AmazonEmber_W_He.woff2 (Heavy/Bold)
- AmazonEmber_W_RgIt.woff2 (Regular Italic)
- AmazonEmber_W_SBd.woff2 (Semi-Bold)
- AmazonEmberMono_W_Rg.woff2 (Monospace)

## Migration from POC

This template was migrated from the QuickPagesCodingAgentPOC at:
`/home/cltsao/workplace/QuickPagesCodingAgentPOC/src/QuickPagesCodingAgentPOC/template/`

It preserves the proven project structure and configurations from the POC.

## Customization

When customizing for specific Quick Apps:
- Add new components in `src/components/`
- Add new services in `src/services/`
- Add new utilities in `src/utils/`
- Keep the pre-configured files (api-client, vite.config, etc.) intact

## Best Practices

1. **Maintain Type Safety**: Use TypeScript types for all components and functions
2. **Follow React Patterns**: Use functional components and hooks
3. **Code Formatting**: Run `npm run prettier` before committing
4. **Testing**: Write tests for new components
5. **Accessibility**: Include ARIA attributes and semantic HTML
