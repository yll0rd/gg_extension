import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { ErrorLoggerService } from '../services/error-logger.service';
  
  interface HttpExceptionResponse {
    statusCode: number;
    message: string | string[];
    error?: string;
  }
  
  @Catch()
  export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);
  
    constructor(private readonly errorLoggerService: ErrorLoggerService) {}
  
    catch(exception: Error, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      
      // Format and log error
      this.errorLoggerService.logError(exception, request.url);
      
      let status: number;
      let errorResponse: any;
  
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exceptionResponse = exception.getResponse() as string | HttpExceptionResponse;
        
        if (typeof exceptionResponse === 'string') {
          errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: exceptionResponse,
          };
        } else {
          errorResponse = {
            ...exceptionResponse,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorResponse = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: 'Internal server error',
        };
        
        // Only log stack trace for non-HTTP exceptions
        this.logger.error(exception.stack);
      }
  
      response.status(status).json(errorResponse);
    }
  }