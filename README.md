# 🛸 Orbita - Foguete SPA Adapter

Seamless Preact frontend integration for Foguete framework, inspired by Inertia.js patterns.

## Features

- 🚀 **SPA Navigation** - No full page reloads
- 🔄 **Server-Side Rendering** - Initial page load with embedded data
- 📝 **Form Handling** - POST requests with validation
- 💬 **Flash Messages** - Success/error notifications
- 🕰️ **History Management** - Browser back/forward support
- 🔒 **TypeScript Support** - Full type safety
- ⚡ **Vite Powered** - Fast development and building

## Installation

```bash
npm install @foguete/orbita preact
```

## Quick Start

### 1. Initialize Orbita App

```tsx
// main.tsx
import { createOrbitaApp } from '@foguete/orbita';

const pages = {
  'Home/Index': () => import('./pages/Home/Index'),
  'Users/Show': () => import('./pages/Users/Show')
};

async function resolveComponent(name: string) {
  const page = pages[name as keyof typeof pages];
  const module = await page();
  return module.default;
}

createOrbitaApp(document.getElementById('app')!, {
  resolveComponent
});
```

### 2. Create Preact Components

```tsx
// pages/Home/Index.tsx
import { OrbitaLink, OrbitaHead } from '@foguete/orbita';

interface HomeProps {
  title: string;
  users: User[];
}

export default function Home({ title, users }: HomeProps) {
  return (
    <>
      <OrbitaHead title={title} />
      <h1>{title}</h1>
      <OrbitaLink href="/users">View Users</OrbitaLink>
    </>
  );
}
```

### 3. Lua Backend Integration

```lua
-- Extend BaseController with Orbita
local BaseController = require("comando")
local orbita = require("orbita")
BaseController = orbita.extend_controller(BaseController)

-- Controller action
function HomeController:index()
    return self:render_orbita("Home/Index", {
        title = "Welcome",
        users = User:all()
    })
end
```

## API Reference

### Components

#### `OrbitaLink`
```tsx
<OrbitaLink 
  href="/users" 
  method="post"
  data={{ name: "John" }}
  preserveState={true}
>
  Create User
</OrbitaLink>
```

#### `OrbitaHead`
```tsx
<OrbitaHead title="Page Title" />
```

### Hooks

#### `useOrbita()`
```tsx
import { useOrbita } from '@foguete/orbita';

function MyComponent() {
  const { page, visit, post } = useOrbita();
  
  const handleSubmit = () => {
    post('/users', { name: 'John' });
  };
  
  return <div>Current page: {page.component}</div>;
}
```

### Router Methods

```tsx
import { router } from '@foguete/orbita';

// Navigate to page
router.visit('/users');

// POST request
router.post('/users', { name: 'John' });

// Other HTTP methods
router.put('/users/1', userData);
router.patch('/users/1', partialData);
router.delete('/users/1');
router.reload();
```

## Development

### Build the Package

```bash
npm run build
```

### Run Tests

```bash
npm test
npm run test:watch
npm run test:ui
```

### Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

## Configuration

### Vite Config

The package uses Vite for building with the following features:

- **Library Mode** - Builds as both ESM and CommonJS
- **TypeScript** - Full type generation with `vite-plugin-dts`
- **Preact Preset** - Optimized for Preact development
- **Testing** - Vitest with jsdom environment

### TypeScript Config

- **Modern Target** - ES2020 with bundler module resolution
- **JSX** - Preact JSX transform
- **Strict Mode** - Full TypeScript strict checking
- **Declaration Maps** - For better debugging

## Integration with Foguete

Orbita seamlessly integrates with other Foguete components:

- **Motor** - HTTP server handles both HTML and JSON responses
- **Rota** - Routes work with both traditional and SPA navigation
- **Comando** - Controllers use `render_orbita()` for SPA responses

## License

MIT
