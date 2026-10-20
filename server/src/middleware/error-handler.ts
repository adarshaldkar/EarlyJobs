import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
export { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Handled Operational ApiErrors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: formattedErrors
      }
    });
    return;
  }

  // 3. MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const code = field === 'email' ? 'DUPLICATE_EMAIL' : 'DUPLICATE_RESOURCE';
    res.status(409).json({
      success: false,
      error: {
        code,
        message: `A candidate with this ${field} already exists.`
      }
    });
    return;
  }

  // 4. Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid identifier format: ${err.value}`
      }
    });
    return;
  }

  // 5. Malformed JSON Body
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload'
      }
    });
    return;
  }

  // 6. Request Entity Too Large (> 10kb)
  if ((err as any).type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds 10kb limit'
      }
    });
    return;
  }

  // 7. Multer Upload Errors (e.g. file size exceeded)
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: {
        code: err.code || 'UPLOAD_ERROR',
        message: err.message
      }
    });
    return;
  }

  // 8. Unhandled / Internal Server Errors
  console.error('\x1b[31m%s\x1b[0m', '💥 [server] Uncaught Exception:', err);

  const message = env.NODE_ENV === 'production' 
    ? 'Internal server error occurred' 
    : err.message || 'Internal server error';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message
    }
  });
};
