# Configurable Authentication Framework

A flexible NextJS authentication framework that can be enabled or disabled through environment configuration, featuring a collapsible sidebar navigation and seamless integration with NextJS App Router.

## Features

- 🔐 **Configurable Authentication** - Enable/disable auth via environment variables
- 📱 **Responsive Sidebar** - Collapsible navigation menu with state persistence
- 🛡️ **Route Protection** - Client and server-side route protection
- 🚀 **NextJS Integration** - Full App Router, SSR, and middleware support
- 🧪 **Comprehensive Testing** - Property-based and unit testing
- 📚 **Complete Documentation** - Module-based documentation structure

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ENABLED` | `true` | Enable/disable authentication |
| `SESSION_TIMEOUT` | `3600000` | Session timeout in milliseconds |
| `REMEMBER_SIDEBAR` | `true` | Remember sidebar state across sessions |

## Project Structure

```
src/
├── app/                 # NextJS App Router pages
├── components/          # React components
├── lib/                 # Utility functions and configuration
├── types/               # TypeScript type definitions
└── middleware.ts        # NextJS middleware for route protection
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## Documentation

Detailed documentation for each module can be found in the `document/` directory:

- Authentication Module
- Sidebar Navigation Module  
- Route Protection Module
- Environment Configuration Module

## License

MIT