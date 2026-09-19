import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateRequest = (
  schema:
    | ZodTypeAny
    | {
        body?: ZodTypeAny;
        query?: ZodTypeAny;
        params?: ZodTypeAny;
      }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('parseAsync' in schema) {
        const parsed = (await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        })) as any;

        if (parsed && typeof parsed === 'object') {
          if ('body' in parsed) req.body = parsed.body;
          if ('query' in parsed) req.query = parsed.query;
          if ('params' in parsed) req.params = parsed.params;
        }
      } else {
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.query) {
          req.query = (await schema.query.parseAsync(req.query)) as any;
        }
        if (schema.params) {
          req.params = (await schema.params.parseAsync(req.params)) as any;
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError('Input validation failed', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
