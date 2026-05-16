import {
    ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
 
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx    = host.switchToHttp();
    const res    = ctx.getResponse<Response>();
    const req    = ctx.getRequest<Request>();
 
    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    // LOG THE FULL ERROR TO CONSOLE FOR DEBUGGING
    console.error('--- GLOBAL EXCEPTION CAUGHT ---');
    console.error(exception);
    console.error('--------------------------------');
 
    if (exception instanceof HttpException) {
      status  = exception.getStatus();
      const body = exception.getResponse();
      message   = typeof body === 'string' ? body : (body as any).message || message;
      errorCode = typeof body === 'object' ? (body as any).error || errorCode : errorCode;
    }
 
    res.status(status).json({
      success:    false,
      error_code: errorCode,
      message:    Array.isArray(message) ? message[0] : message,
      // INCLUDE ACTUAL ERROR IN RESPONSE FOR DEBUGGING
      debug:      status === 500 ? (exception as any).message || exception : undefined,
      statusCode: status,
      path:       req.url,
      timestamp:  new Date().toISOString(),
    });
  }
}
