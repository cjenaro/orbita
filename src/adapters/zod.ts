import { z, ZodMiniType } from "zod/v4-mini";
import { SchemaAdapter } from "../hooks/useForm";

// Zod adapter for useForm - pure bridge between Zod and useForm
export function zodAdapter<T>(schema: ZodMiniType<T>): SchemaAdapter<T> {
  return {
    validate: (data: T) => {
      const result = schema.safeParse(data);

      if (result.success) {
        return { success: true, data: result.data };
      }

      if (result.error) {
        const flattened = z.flattenError(result.error);
        // Convert the flattened errors to the expected format
        const errors: Record<string, string[]> = {};
        if (flattened.fieldErrors) {
          for (const key in flattened.fieldErrors) {
            const value = flattened.fieldErrors[key];
            if (value) {
              errors[key] = value;
            }
          }
        }
        return { success: false, errors };
      }

      return { success: false, errors: {} };
    },
  };
}
