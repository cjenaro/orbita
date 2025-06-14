# Órbita - SPA Frontend Adapter 🛸

Órbita is the client-side adapter that provides [Inertia.js](https://reinink.ca/articles/introducing-inertia-js)-style SPA functionality, bridging Lua backend with Preact frontend.

## Features

- **SPA Experience** - No page reloads, smooth transitions
- **Server-Driven** - Backend controls routing and data
- **Preact Integration** - Built for Preact components
- **Form Handling** - Automatic form submission and validation
- **History Management** - Proper browser back/forward support
- **Progress Indicators** - Loading states and feedback

## Installation

```bash
npm install @foguete/orbita preact
```

## Quick Start

### Client Setup
```javascript
// src/app.js
import { Orbita } from '@foguete/orbita'
import { render } from 'preact'

Orbita.createApp(document.getElementById('app'), (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx')
    return pages[`./Pages/${name}.jsx`]().then(module => module.default)
})
```

### Server Integration
```lua
-- In your controller
function UsersController:show()
    local user = User:find(self.params.id)
    return self:render_inertia("Users/Show", { user = user })
end
```

## Navigation

### Programmatic Navigation
```javascript
import { Orbita } from '@foguete/orbita'

// Simple visit
Orbita.visit('/users/123')

// With options
Orbita.visit('/users', {
    method: 'post',
    data: { name: 'John', email: 'john@example.com' }
})
```

### Links
```jsx
import { Link } from '@foguete/orbita'

function UsersList({ users }) {
    return (
        <div>
            {users.map(user => (
                <Link href={`/users/${user.id}`} key={user.id}>
                    {user.name}
                </Link>
            ))}
        </div>
    )
}
```

## Forms

### Form Component
```jsx
import { useForm } from '@foguete/orbita'

function CreateUser() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: ''
    })

    const submit = (e) => {
        e.preventDefault()
        post('/users')
    }

    return (
        <form onSubmit={submit}>
            <input
                value={data.name}
                onChange={e => setData('name', e.target.value)}
            />
            {errors.name && <div>{errors.name}</div>}
            
            <button type="submit" disabled={processing}>
                Create User
            </button>
        </form>
    )
}
```

This SPA approach, as discussed in modern web development patterns, provides the best of both server-side simplicity and client-side UX.
