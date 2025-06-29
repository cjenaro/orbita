import { z } from 'zod/v4-mini';
import { useForm, zodAdapter } from '../index';

// Real Zod schema
const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number(),
  tags: z.optional(z.array(z.string())),
});

// Type inference from schema
type UserFormData = z.infer<typeof userSchema>;

// Example with Zod schema
export function ZodSchemaForm() {
  const form = useForm({
    schema: userSchema,
    adapter: zodAdapter(),
    onSubmit: async (values) => {
      // Type assertion since we know the schema validates to UserFormData
      const userData = values as UserFormData;
      console.log('Form submitted:', userData);
      console.log('Name:', userData.name); // TypeScript knows this is a string
      console.log('Age:', userData.age);   // TypeScript knows this is a number
    },
  });

  return (
    <form {...form.formProps}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          {...form.getFieldProps('name')} // TypeScript knows 'name' is valid
        />
        {form.errors.name && (
          <span style={{ color: 'red' }}>{form.errors.name}</span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          {...form.getFieldProps('email')} // TypeScript knows 'email' is valid
        />
        {form.errors.email && (
          <span style={{ color: 'red' }}>{form.errors.email}</span>
        )}
      </div>

      <div>
        <label htmlFor="age">Age:</label>
        <input
          id="age"
          type="number"
          {...form.getFieldProps('age')} // TypeScript knows 'age' is valid
        />
        {form.errors.age && (
          <span style={{ color: 'red' }}>{form.errors.age}</span>
        )}
      </div>

      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}



// Example with Orbita router integration
export function SchemaOrbitaForm() {
  const form = useForm({
    schema: userSchema,
    adapter: zodAdapter(),
  });

  const handleSubmit = () => {
    // Submit to server using Orbita router
    form.submit('/users', {
      onSuccess: (page) => {
        console.log('User created successfully:', page);
      },
      onError: (errors) => {
        console.error('Server validation errors:', errors);
      },
    });
  };

  return (
    <form {...form.formProps} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div>
        <input {...form.getFieldProps('name')} placeholder="Name" />
        {form.errors.name && <span>{form.errors.name}</span>}
      </div>
      
      <div>
        <input {...form.getFieldProps('email')} placeholder="Email" />
        {form.errors.email && <span>{form.errors.email}</span>}
      </div>
      
      <div>
        <input {...form.getFieldProps('age')} type="number" placeholder="Age" />
        {form.errors.age && <span>{form.errors.age}</span>}
      </div>

      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}