import type { FastifyError, FastifyInstance } from 'fastify';
import type { ErrorBody } from '@dev-darshan/contracts';
import { AppError, toErrorBody } from '@dev-darshan/platform';

export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    // Our own, expected errors: send their code and message.
    if (error instanceof AppError) {
      return reply.status(error.status).send(toErrorBody(error, request.id));
    }

    // Fastify's own client errors: bad JSON, body too large, …
    if (error.statusCode && error.statusCode < 500) {
      const body: ErrorBody = {
        error: { code: 'BAD_REQUEST', message: error.message, requestId: request.id },
      };
      return reply.status(error.statusCode).send(body);
    }

    // Anything else is a bug: log everything, reveal nothing.
    request.log.error({ err: error }, 'Unhandled error');
    const body: ErrorBody = {
      error: { code: 'INTERNAL', message: 'Something went wrong', requestId: request.id },
    };
    return reply.status(500).send(body);
  });

  app.setNotFoundHandler((request, reply) => {
    const body: ErrorBody = {
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
        requestId: request.id,
      },
    };
    return reply.status(404).send(body);
  });
}