import { z } from 'zod/v4-mini';
import { useForm, zodAdapter } from '../index';
import { useRef } from 'preact/hooks';

// Real Zod schema
const formSchema = z.object({
  name: z.string(),
  email: z.email(),
  tags: z.optional(z.array(z.string())),
});

type FormData = z.infer<typeof formSchema>;

export function FormExample() {
  const form = useForm({
    schema: formSchema,
    adapter: zodAdapter(),
    onSubmit: async (values, helpers) => {
      // Type assertion since we know the schema validates to FormData
      const formData = values as FormData;
      console.log('Form submitted:', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      helpers.reset();
    },
  });

  const tagInputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    if (tagInputRef.current && tagInputRef.current.value.trim()) {
      const formElement = tagInputRef.current.closest('form');
      const existingTags = formElement?.querySelectorAll('[name^="tags["]').length || 0;
      
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = `tags[${existingTags}]`;
      hiddenInput.value = tagInputRef.current.value.trim();
      
      formElement?.appendChild(hiddenInput);
      tagInputRef.current.value = '';
    }
  };

  return (
    <form {...form.formProps}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          {...form.getFieldProps('name')}
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
          {...form.getFieldProps('email')}
        />
        {form.errors.email && (
          <span style={{ color: 'red' }}>{form.errors.email}</span>
        )}
      </div>

      <div>
        <label>Tags:</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            ref={tagInputRef}
            type="text"
            placeholder="Enter a tag"
          />
          <button type="button" onClick={addTag}>
            Add Tag
          </button>
        </div>
        {form.errors.tags && (
          <span style={{ color: 'red' }}>{form.errors.tags}</span>
        )}
      </div>

      <div>
        <button type="submit" disabled={form.processing}>
          {form.processing ? 'Submitting...' : 'Submit'}
        </button>
        <button type="button" onClick={form.reset}>
          Reset
        </button>
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
        <div>Has Errors: {form.hasErrors ? 'Yes' : 'No'}</div>
        <div>Processing: {form.processing ? 'Yes' : 'No'}</div>
      </div>
    </form>
  );
}

// Example with Orbita router integration
export function OrbitaFormExample() {
  const postSchema = z.object({
    title: z.string(),
    content: z.string(),
  });

  type PostData = z.infer<typeof postSchema>;

  const form = useForm({
    schema: postSchema,
    adapter: zodAdapter(),
  });

  const handleSubmit = () => {
    // Submit to server using Orbita router
    form.submit('/posts', {
      onSuccess: (page) => {
        console.log('Post created successfully:', page);
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
      },
    });
  };

  return (
    <form {...form.formProps} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div>
        <label htmlFor="title">Title:</label>
        <input
          id="title"
          type="text"
          {...form.getFieldProps('title')}
        />
        {form.errors.title && (
          <span style={{ color: 'red' }}>{form.errors.title}</span>
        )}
      </div>

      <div>
        <label htmlFor="content">Content:</label>
        <textarea
          id="content"
          {...form.getFieldProps('content')}
        />
        {form.errors.content && (
          <span style={{ color: 'red' }}>{form.errors.content}</span>
        )}
      </div>

      <button type="submit" disabled={form.processing}>
        {form.processing ? 'Creating Post...' : 'Create Post'}
      </button>
    </form>
  );
}