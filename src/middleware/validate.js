import { badRequest } from '../lib/errors.js';

/**
 * Validates `req.body`, `req.query` and/or `req.params` against zod schemas.
 * Parsed (and coerced) values are exposed on `req.input` because Express 5
 * makes `req.query` read-only.
 *
 * @param {{ body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny }} schemas
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.input = req.input ?? {};
    for (const [source, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const issues = result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        }));
        return next(badRequest(`Invalid request ${source}`, issues));
      }
      req.input[source] = result.data;
    }
    next();
  };
}
