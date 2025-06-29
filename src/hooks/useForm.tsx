import { useRef, useCallback, useMemo, useReducer } from "preact/hooks";
import { router } from "../router";
import { OrbitaVisitOptions } from "../types";
import { RefObject } from "preact";

export interface FormState {
  errors: Record<string, string[]>;
  processing: boolean;
  hasErrors: boolean;
}

// Schema adapter interface - only needs the schema, output is inferred
export interface SchemaAdapter<TData = unknown> {
  validate: (data: TData) => {
    success: boolean;
    data?: TData;
    errors?: Record<string, string[]>;
  };
}

// Schema-based form options
export interface UseFormOptions<TData = unknown> {
  adapter: SchemaAdapter<TData>;
  onSubmit?: (
    values: TData, // Type will be inferred from the schema at usage
    helpers: FormHelpers,
  ) => void | Promise<void>;
}

export interface FormHelpers {
  setFieldError: (name: string, error: string) => void;
  setErrors: (errors: Record<string, string[]>) => void;
  clearErrors: () => void;
  reset: () => void;
  submit: (
    url?: string,
    options?: Omit<OrbitaVisitOptions, "data">,
  ) => Promise<void>;
}

export interface FormReturn extends FormHelpers {
  errors: Record<string, string[]>;
  processing: boolean;
  hasErrors: boolean;
  formProps: {
    ref: RefObject<HTMLFormElement>;
    onSubmit: (e: Event) => void;
  };
  getFieldProps: (
    name: string,
    defaultValue?: string | number,
  ) => {
    name: string;
    defaultValue?: string | number;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  };
  getArrayFieldProps: (name: string) => {
    append: (formData: FormData, value: string) => void;
    prepend: (formData: FormData, value: string) => void;
    remove: (formData: FormData, index: number) => void;
    move: (formData: FormData, from: number, to: number) => void;
    getFields: (
      formData: FormData,
    ) => Array<{ key: string; name: string; value: string }>;
  };
}

let formIdCounter = 0;

export function useForm<TData extends Record<string, unknown>>(
  options: UseFormOptions<TData>,
): FormReturn {
  const { adapter, onSubmit } = options;

  const formId = useMemo(() => `form-${++formIdCounter}`, []);
  const formRef = useRef<HTMLFormElement>(null);

  const stateRef = useRef<FormState>({
    errors: {},
    processing: false,
    hasErrors: false,
  });

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const updateState = useCallback(
    (updater: (state: FormState) => Partial<FormState>) => {
      const updates = updater(stateRef.current);
      Object.assign(stateRef.current, updates);

      stateRef.current.hasErrors =
        Object.keys(stateRef.current.errors).length > 0;

      forceUpdate({});
    },
    [],
  );

  const getFormData = useCallback(() => {
    if (!formRef.current) return new FormData();
    return new FormData(formRef.current);
  }, []);

  const formDataToObject = useCallback((formData: FormData): TData => {
    const obj: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (key.includes("[") && key.includes("]")) {
        // Handle array fields like "tags[0]", "tags[1]"
        const [arrayName, indexStr] = key.split("[");
        const index = parseInt(indexStr.replace("]", ""));

        if (!obj[arrayName]) {
          obj[arrayName] = [];
        }

        (obj[arrayName] as string[])[index] = value as string;
      } else {
        obj[key] = value;
      }
    }

    // Clean up sparse arrays
    Object.keys(obj).forEach((key) => {
      if (Array.isArray(obj[key])) {
        obj[key] = (obj[key] as (string | undefined)[]).filter(
          (item) => item !== undefined,
        );
      }
    });

    return obj as TData;
  }, []);

  const setFieldError = useCallback(
    (name: string, error: string) => {
      updateState((state) => ({
        errors: { ...state.errors, [name]: [error] },
      }));
    },
    [updateState],
  );

  const setErrors = useCallback(
    (errors: Record<string, string[]>) => {
      updateState(() => ({ errors }));
    },
    [updateState],
  );

  const clearErrors = useCallback(() => {
    updateState(() => ({ errors: {} }));
  }, [updateState]);

  const reset = useCallback(() => {
    if (formRef.current) {
      formRef.current.reset();
    }
    updateState(() => ({
      errors: {},
      processing: false,
    }));
  }, [updateState]);

  const submit = useCallback(
    async (url?: string, options: Omit<OrbitaVisitOptions, "data"> = {}) => {
      const formData = getFormData();
      const data = formDataToObject(formData);

      updateState(() => ({ processing: true, errors: {} }));

      try {
        const result = adapter.validate(data);
        if (!result.success) {
          const errors = result.errors || {};
          if (Object.keys(errors).length > 0) {
            updateState(() => ({ errors, processing: false }));
            return;
          }
        }

        if (onSubmit && !url && result.data) {
          await onSubmit(result.data, {
            setFieldError,
            setErrors,
            clearErrors,
            reset,
            submit,
          });
          updateState(() => ({ processing: false }));
        } else if (url) {
          await router.post(url, data, {
            ...options,
            preserveUrl: false,
            onError: (errors) => {
              // Convert Record<string, string> to Record<string, string[]>
              const formErrors: Record<string, string[]> = {};
              for (const key in errors) {
                formErrors[key] = [errors[key]];
              }
              updateState(() => ({ errors: formErrors, processing: false }));
            },
            onSuccess: (page) => {
              updateState(() => ({ processing: false }));
              options.onSuccess?.(page);
            },
            onFinish: () => {
              updateState(() => ({ processing: false }));
              options.onFinish?.();
            },
          });
        }
      } catch (error) {
        console.error("Form submission error:", error);
        updateState(() => ({ processing: false }));
      }
    },
    [
      adapter,
      onSubmit,
      getFormData,
      formDataToObject,
      setFieldError,
      setErrors,
      clearErrors,
      reset,
      updateState,
    ],
  );

  const getFieldProps = useCallback(
    (name: string, defaultValue?: string | number) => {
      return {
        name,
        defaultValue,
        "aria-invalid": !!stateRef.current.errors[name],
        "aria-describedby": stateRef.current.errors[name]
          ? `${formId}-${name}-error`
          : undefined,
      };
    },
    [formId],
  );

  const getArrayFieldProps = useCallback((name: string) => {
    return {
      append: (formData: FormData, value: string) => {
        const fields = getArrayFieldProps(name).getFields(formData);
        const newIndex = fields.length;

        // Create a new input element and add it to the form
        if (formRef.current) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = `${name}[${newIndex}]`;
          input.value = value;
          formRef.current.appendChild(input);
        }
      },

      prepend: (formData: FormData, value: string) => {
        const fields = getArrayFieldProps(name).getFields(formData);

        // Shift all existing indices up by 1
        fields.forEach((field, index) => {
          const input = formRef.current?.querySelector(
            `[name="${field.name}"]`,
          ) as HTMLInputElement;
          if (input) {
            input.name = `${name}[${index + 1}]`;
          }
        });

        // Add new item at index 0
        if (formRef.current) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = `${name}[0]`;
          input.value = value;
          formRef.current.appendChild(input);
        }
      },

      remove: (formData: FormData, index: number) => {
        const fieldName = `${name}[${index}]`;
        const input = formRef.current?.querySelector(
          `[name="${fieldName}"]`,
        ) as HTMLInputElement;
        if (input) {
          input.remove();
        }

        // Reindex remaining fields
        const fields = getArrayFieldProps(name).getFields(formData);
        fields.forEach((field, i) => {
          if (i > index) {
            const input = formRef.current?.querySelector(
              `[name="${field.name}"]`,
            ) as HTMLInputElement;
            if (input) {
              input.name = `${name}[${i - 1}]`;
            }
          }
        });
      },

      move: (formData: FormData, from: number, to: number) => {
        const fromInput = formRef.current?.querySelector(
          `[name="${name}[${from}]"]`,
        ) as HTMLInputElement;
        const toInput = formRef.current?.querySelector(
          `[name="${name}[${to}]"]`,
        ) as HTMLInputElement;

        if (fromInput && toInput) {
          const tempValue = fromInput.value;
          fromInput.value = toInput.value;
          toInput.value = tempValue;
        }
      },

      getFields: (formData: FormData) => {
        const fields: Array<{ key: string; name: string; value: string }> = [];

        for (const [key, value] of formData.entries()) {
          if (key.startsWith(`${name}[`) && key.endsWith("]")) {
            const indexStr = key.substring(name.length + 1, key.length - 1);
            const index = parseInt(indexStr);

            if (!isNaN(index)) {
              fields[index] = {
                key: `${name}[${index}]`,
                name: key,
                value: value as string,
              };
            }
          }
        }

        return fields.filter((field) => field !== undefined);
      },
    };
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      submit();
    },
    [submit],
  );

  // Expose form ref and onSubmit for external access
  const formProps = useMemo(
    () => ({
      ref: formRef,
      onSubmit: handleSubmit,
    }),
    [handleSubmit],
  );

  return {
    errors: stateRef.current.errors,
    processing: stateRef.current.processing,
    hasErrors: stateRef.current.hasErrors,
    setFieldError,
    setErrors,
    clearErrors,
    reset,
    submit,
    getFieldProps,
    getArrayFieldProps,
    formProps,
  };
}
