import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/preact';
import { z } from 'zod/v4-mini';
import { useForm, zodAdapter } from '../index';

interface TestFormData {
  name: string;
  email: string;
  tags: string[];
}

const testSchema = z.object({
  name: z.string(),
  email: z.email(),
  tags: z.optional(z.array(z.string())),
});

const noValidationSchema = z.object({
  name: z.optional(z.string()),
  email: z.optional(z.string()),
  tags: z.optional(z.array(z.string())),
});

const TestForm = ({ onSubmit, shouldValidate = false }: { onSubmit?: (values: TestFormData) => void; shouldValidate?: boolean }) => {
  const form = useForm({
    schema: shouldValidate ? testSchema : noValidationSchema,
    adapter: zodAdapter(),
    onSubmit: onSubmit ? (values) => onSubmit(values as TestFormData) : undefined,
  });

  return (
    <form {...form.formProps}>
      <input
        data-testid="name"
        {...form.getFieldProps('name')}
      />
      {form.errors.name && <span data-testid="name-error">{form.errors.name}</span>}
      
      <input
        data-testid="email"
        {...form.getFieldProps('email')}
      />
      {form.errors.email && <span data-testid="email-error">{form.errors.email}</span>}
      
      <div data-testid="tags-container">
        <input
          data-testid="tag-input"
          name="newTag"
          placeholder="Add a tag"
        />
        <button
          type="button"
          data-testid="add-tag"
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest('form');
            const input = form?.querySelector('[name="newTag"]') as HTMLInputElement;
            if (input && input.value) {
              const hiddenInput = document.createElement('input');
              hiddenInput.type = 'hidden';
              hiddenInput.name = `tags[${form?.querySelectorAll('[name^="tags["]').length || 0}]`;
              hiddenInput.value = input.value;
              form?.appendChild(hiddenInput);
              input.value = '';
            }
          }}
        >
          Add Tag
        </button>
      </div>
      
      <button type="submit" data-testid="submit" disabled={form.processing}>
        {form.processing ? 'Submitting...' : 'Submit'}
      </button>
      
      <div data-testid="form-state">
        {JSON.stringify({
          hasErrors: form.hasErrors,
          processing: form.processing,
        })}
      </div>
    </form>
  );
};

describe('useForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no errors', () => {
    const { getByTestId } = render(<TestForm />);
    
    expect(getByTestId('form-state').textContent).toContain('"hasErrors":false');
    expect(getByTestId('form-state').textContent).toContain('"processing":false');
  });

  it('should handle validation errors on submit', async () => {
    const { getByTestId } = render(<TestForm shouldValidate={true} />);
    
    fireEvent.click(getByTestId('submit'));
    
    await waitFor(() => {
      expect(getByTestId('email-error')).toBeTruthy();
      expect(getByTestId('form-state').textContent).toContain('"hasErrors":true');
    });
  });

  it('should handle form submission with data', async () => {
    const mockOnSubmit = vi.fn();
    const { getByTestId } = render(<TestForm onSubmit={mockOnSubmit} />);
    
    const nameInput = getByTestId('name') as HTMLInputElement;
    const emailInput = getByTestId('email') as HTMLInputElement;
    
    fireEvent.input(nameInput, { target: { value: 'John' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    fireEvent.click(getByTestId('submit'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ 
          name: 'John',
          email: 'john@example.com'
        })
      );
    });
  });

  it('should handle array fields through manual DOM manipulation', async () => {
    const mockOnSubmit = vi.fn();
    const { getByTestId } = render(<TestForm onSubmit={mockOnSubmit} />);
    
    const tagInput = getByTestId('tag-input') as HTMLInputElement;
    
    // Add first tag
    fireEvent.input(tagInput, { target: { value: 'react' } });
    fireEvent.click(getByTestId('add-tag'));
    
    // Add second tag
    fireEvent.input(tagInput, { target: { value: 'preact' } });
    fireEvent.click(getByTestId('add-tag'));
    
    fireEvent.click(getByTestId('submit'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ 
          tags: ['react', 'preact']
        })
      );
    });
  });

  it('should show processing state during submission', async () => {
    const mockOnSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    const { getByTestId } = render(<TestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(getByTestId('submit'));
    
    // Should show processing immediately
    expect(getByTestId('form-state').textContent).toContain('"processing":true');
    expect((getByTestId('submit') as HTMLButtonElement).disabled).toBe(true);
    
    await waitFor(() => {
      expect(getByTestId('form-state').textContent).toContain('"processing":false');
    });
  });

  it('should work with Zod adapter', () => {
    const schema = z.object({
      name: z.string(),
      email: z.email(),
    });
    
    const adapter = zodAdapter();
    const result = adapter.validate(schema, { name: '', email: 'invalid' });
    
    expect(result.success).toBe(false);
    expect(result.errors).toEqual({
      email: ['Invalid input'],
    });
  });

  it('should reset form correctly', async () => {
    const { getByTestId } = render(<TestForm />);
    
    const nameInput = getByTestId('name') as HTMLInputElement;
    fireEvent.input(nameInput, { target: { value: 'John' } });
    
    expect(nameInput.value).toBe('John');
    
    // Trigger reset through form helper (would need to expose reset button in real usage)
    const form = nameInput.closest('form');
    if (form) {
      form.reset();
    }
    
    expect(nameInput.value).toBe('');
  });

  it('should work with schema-based approach', async () => {
    const schema = z.object({
      name: z.string(),
      email: z.email(),
    });

    const mockOnSubmit = vi.fn();

    interface FormData {
      name: string;
      email: string;
    }

    const SchemaForm = () => {
      const form = useForm({
        schema,
        adapter: zodAdapter(),
        onSubmit: (values) => mockOnSubmit(values as FormData),
      });

      return (
        <form {...form.formProps}>
          <input data-testid="name" {...form.getFieldProps('name')} />
          <input data-testid="email" {...form.getFieldProps('email')} />
          <button type="submit" data-testid="submit">Submit</button>
        </form>
      );
    };

    const { getByTestId } = render(<SchemaForm />);
    
    const nameInput = getByTestId('name') as HTMLInputElement;
    const emailInput = getByTestId('email') as HTMLInputElement;
    
    fireEvent.input(nameInput, { target: { value: 'John' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    fireEvent.click(getByTestId('submit'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'John', email: 'john@example.com' })
      );
    });
  });
});