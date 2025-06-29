# Orbita Forms - Schema-Based Form Handling

Orbita provides a powerful, lightweight form handling solution designed specifically for PreactJS applications using **schema-based validation** with uncontrolled inputs for maximum performance.

## Features

- 🚀 **Zero Rerenders**: Uses uncontrolled inputs - no rerenders during typing
- 📝 **Schema-Based**: Built around Zod schemas with full type inference
- ✅ **Submit-Only Validation**: Validation only runs on form submission using z.treeifyError()
- 🔄 **Orbita Integration**: Seamless integration with Orbita router for form submissions
- 🎯 **TypeScript**: Full TypeScript support with excellent type inference
- 🎨 **Accessibility**: Built-in ARIA attributes for better accessibility
- 🏃 **Performance**: Native FormData handling for optimal performance

## Installation

Orbita forms require Zod as a peer dependency. Install both:

```bash
npm install @foguete/orbita zod
```

Orbita uses **zod/v4-mini** for optimal bundle size and performance.

## Basic Usage

```tsx
import { useForm, zodAdapter } from '@foguete/orbita';
import { z } from 'zod/v4-mini';

const contactSchema = z.object({
  name: z.string(),
  email: z.email(),
  message: z.string(),
});

type ContactFormData = z.infer<typeof contactSchema>;

function ContactForm() {
  const form = useForm({
    schema: contactSchema,
    adapter: zodAdapter<ContactFormData>(),
    onSubmit: async (values) => {
      // values is fully typed as ContactFormData
      console.log('Form submitted:', values);
    },
  });

  return (
    <form {...form.formProps}>
      <input {...form.getFieldProps('name')} placeholder="Name" />
      {form.errors.name && <span>{form.errors.name}</span>}
      
      <input {...form.getFieldProps('email')} placeholder="Email" />
      {form.errors.email && <span>{form.errors.email}</span>}
      
      <textarea {...form.getFieldProps('message')} placeholder="Message" />
      {form.errors.message && <span>{form.errors.message}</span>}
      
      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

## Advanced Validation

### Nested Objects

```tsx
import { useForm, zodAdapter } from '@foguete/orbita';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
  }),
});

type UserFormData = z.infer<typeof userSchema>;

function NestedForm() {
  const form = useForm({
    schema: userSchema,
    adapter: zodAdapter<UserFormData>(),
    onSubmit: async (values) => {
      console.log('User:', values.name);
      console.log('Address:', values.address.street, values.address.city);
    },
  });

  return (
    <form {...form.formProps}>
      <input {...form.getFieldProps('name')} placeholder="Name" />
      {form.errors.name && <span>{form.errors.name}</span>}
      
      <input {...form.getFieldProps('email')} placeholder="Email" />
      {form.errors.email && <span>{form.errors.email}</span>}
      
      <input {...form.getFieldProps('address.street')} placeholder="Street" />
      {form.errors['address.street'] && <span>{form.errors['address.street']}</span>}
      
      <input {...form.getFieldProps('address.city')} placeholder="City" />
      {form.errors['address.city'] && <span>{form.errors['address.city']}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Array Fields

```tsx
import { useRef } from 'preact/hooks';

function TagsForm() {
  const form = useForm({
    onSubmit: async (values) => {
      console.log('Tags submitted:', values.tags);
    },
  });

  const tagInputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    if (tagInputRef.current && tagInputRef.current.value.trim()) {
      const formElement = tagInputRef.current.closest('form');
      const existingTags = formElement?.querySelectorAll('[name^="tags["]').length || 0;
      
      // Create hidden input for the new tag
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = `tags[${existingTags}]`;
      hiddenInput.value = tagInputRef.current.value.trim();
      
      formElement?.appendChild(hiddenInput);
      tagInputRef.current.value = '';
    }
  };

  return (
    <form {...form.formProps} onSubmit={(e) => { e.preventDefault(); form.submit(); }}>
      <div>
        <h3>Tags</h3>
        <div>
          <input 
            ref={tagInputRef}
            type="text" 
            placeholder="Enter a tag" 
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <button type="button" onClick={addTag}>
            Add Tag
          </button>
        </div>
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Orbita Router Integration

```tsx
import { useForm, zodAdapter } from '@foguete/orbita';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

type PostData = z.infer<typeof postSchema>;

function CreatePostForm() {
  const form = useForm({
    schema: postSchema,
    adapter: zodAdapter<PostData>(),
  });

  const handleSubmit = () => {
    // Submit directly to server using Orbita router
    form.submit('/posts', {
      onSuccess: (page) => {
        // Orbita will handle the redirect automatically
        console.log('Post created!', page);
      },
      onError: (errors) => {
        // Server validation errors are automatically set
        console.log('Validation errors:', errors);
      },
    });
  };

  return (
    <form {...form.formProps} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <input {...form.getFieldProps('title')} placeholder="Title" />
      <textarea {...form.getFieldProps('content')} placeholder="Content" />
      
      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
```

## API Reference

### useForm(options)

#### Options

```tsx
useForm({
  schema: ZodSchema<T>,
  adapter: zodAdapter<T>(),
  onSubmit?: (values: T, helpers: FormHelpers<T>) => void | Promise<void>
})
```

#### Returns

- `errors`: Current validation errors (flattened from z.treeifyError())
- `processing`: Whether form is currently submitting
- `hasErrors`: Whether form has any errors
- `formProps`: Props to spread on the form element (includes ref and onSubmit)
- `getFieldProps(name, defaultValue?)`: Get props for a field (with TypeScript autocomplete)
- `getArrayFieldProps(name)`: Get props for array field manipulation
- `setFieldError(name, error)`: Set field error
- `setErrors(errors)`: Set multiple errors
- `clearErrors()`: Clear all errors
- `reset()`: Reset form to initial state
- `submit(url?, options?)`: Submit form

### zodAdapter<T>()

Creates a Zod adapter for schema-based forms with full TypeScript support and proper error handling using `z.treeifyError()`.

```tsx
import { z } from 'zod';
import { useForm, zodAdapter } from '@foguete/orbita';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  profile: z.object({
    name: z.string().min(1),
    age: z.number().min(18),
  }),
});

type FormData = z.infer<typeof schema>;

const form = useForm({
  schema,
  adapter: zodAdapter<FormData>(),
});

// Errors are automatically flattened:
// form.errors['email'] = 'Invalid email'
// form.errors['profile.name'] = 'Name is required'
// form.errors['profile.age'] = 'Must be at least 18'
```

#### Creating Custom Adapters

```tsx
import { SchemaAdapter } from '@foguete/orbita';

const myAdapter = <T>(): SchemaAdapter<MySchema<T>, T> => ({
  validate: (schema, data) => {
    // Return { success: boolean, data?: T, errors?: Record<string, string> }
    // Errors should be flattened with dot notation for nested fields
  },
});
```

### Array Field Methods

- `getFields(formData)`: Get current array fields from FormData
- `append(formData, value)`: Add item to end of array
- `prepend(formData, value)`: Add item to beginning of array
- `remove(formData, index)`: Remove item at index
- `move(formData, from, to)`: Move item from one index to another

**Note**: Array field methods work by manipulating hidden inputs in the DOM. For dynamic UI updates, you'll need to manage the visible state separately.

## Advanced Usage

### Custom Validation

```tsx
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const form = useForm({
  schema: passwordSchema,
  adapter: zodAdapter<PasswordFormData>(),
});
```

### Conditional Fields

```tsx
import { useState } from 'preact/hooks';
import { z } from 'zod';

const conditionalSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('personal'),
    name: z.string().min(1, 'Name is required'),
  }),
  z.object({
    type: z.literal('business'),
    name: z.string().min(1, 'Name is required'),
    companyName: z.string().min(1, 'Company name is required'),
  }),
]);

type ConditionalFormData = z.infer<typeof conditionalSchema>;

function ConditionalForm() {
  const [showCompanyField, setShowCompanyField] = useState(false);
  
  const form = useForm({
    schema: conditionalSchema,
    adapter: zodAdapter<ConditionalFormData>(),
  });

  return (
    <form {...form.formProps}>
      <select 
        {...form.getFieldProps('type')} 
        onChange={(e) => setShowCompanyField((e.target as HTMLSelectElement).value === 'business')}
      >
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>
      
      <input {...form.getFieldProps('name')} placeholder="Name" />
      {form.errors.name && <span>{form.errors.name}</span>}
      
      {showCompanyField && (
        <>
          <input {...form.getFieldProps('companyName')} placeholder="Company Name" />
          {form.errors.companyName && <span>{form.errors.companyName}</span>}
        </>
      )}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Form State Monitoring

```tsx
import { z } from 'zod';

const simpleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type SimpleFormData = z.infer<typeof simpleSchema>;

function FormWithStatus() {
  const form = useForm({
    schema: simpleSchema,
    adapter: zodAdapter<SimpleFormData>(),
  });

  return (
    <div>
      <form {...form.formProps}>
        <input {...form.getFieldProps('name')} placeholder="Name" />
        {form.errors.name && <span>{form.errors.name}</span>}
        <button type="submit">Submit</button>
      </form>
      
      <div>
        <p>Has Errors: {form.hasErrors ? 'Yes' : 'No'}</p>
        <p>Processing: {form.processing ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
```

## Performance Considerations

The `useForm` hook is designed for **zero rerenders during user input**:

1. **Uncontrolled inputs**: Uses native HTML form inputs with no React state
2. **FormData API**: Leverages native FormData for optimal performance
3. **Submit-only validation**: Validation only runs when the form is submitted
4. **Minimal state**: Only tracks errors and processing state, nothing else
5. **DOM manipulation**: Array operations work directly with DOM for efficiency

This approach provides the best possible performance for forms, especially with many fields or frequent user input.

## Integration with Orbita

When using `form.submit(url, options)`, the form automatically:

1. Validates the form data
2. Sends a POST request to the specified URL
3. Handles server validation errors (422 responses)
4. Follows redirects on successful submission
5. Updates the page state using Orbita's SPA navigation

This provides a seamless experience similar to traditional form submissions but with SPA benefits.