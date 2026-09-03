import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { z, ZodError } from 'zod';
import { HttpError } from '../errors.js';

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  void _next;
  if (error instanceof ZodError) {
    response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: z.flattenError(error) } });
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: { code: error.status === 404 ? 'NOT_FOUND' : 'REQUEST_ERROR', message: error.message, details: error.details } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Work item not found' } });
      return;
    }
    if (error.code === 'P2002' || error.code === 'P2003') {
      response.status(409).json({ error: { code: 'CONFLICT', message: 'The request conflicts with existing data' } });
      return;
    }
  }
  console.error(error);
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
};
