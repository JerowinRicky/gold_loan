import { z } from 'zod';

export const zodResolver = (schema: z.ZodType<any, any>) => async (data: any) => {
  const result = await schema.safeParseAsync(data);
  if (result.success) {
    return { values: result.data, errors: {} };
  }
  const fieldErrors: Record<string, any> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!fieldErrors[key]) {
      fieldErrors[key] = { type: issue.code, message: issue.message };
    }
  }
  return { values: {}, errors: fieldErrors };
};

