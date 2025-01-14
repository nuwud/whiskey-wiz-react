# Decorator Configuration in WhiskeyWiz React Project

## Overview
This project uses experimental decorators with Next.js 14, TypeScript, and Babel. The configuration supports legacy decorators and metadata transforms.

## Configuration Details

### Babel Plugins
- `@babel/plugin-proposal-decorators`: Enables legacy decorator syntax
- `@babel/plugin-proposal-class-properties`: Supports class property transformations
- `babel-plugin-transform-typescript-metadata`: Generates metadata for decorated classes

### TypeScript Configuration
- `experimentalDecorators`: Enables decorator syntax support
- `emitDecoratorMetadata`: Generates metadata for decorated classes

### Key Considerations
1. Use `version: "legacy"` for decorator configuration
2. Explicitly disable SWC to use Babel transforms
3. Ensure compatibility with Next.js compiler

## Troubleshooting
- Verify all Babel plugins are installed
- Check TypeScript and Babel configurations match
- Restart development server after configuration changes

## Recommended Libraries
- TypeGraphQL
- Class-transformer
- Inversify (Dependency Injection)

## Limitations
- Decorators are still an experimental feature
- Performance may differ from native implementations
