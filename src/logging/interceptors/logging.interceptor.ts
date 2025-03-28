import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from "@nestjs/common"
import type { Observable } from "rxjs"
import { tap, catchError } from "rxjs/operators"
import type { LoggingService } from "../services/logging.service"
import type { LoggingConfigService } from "../services/logging-config.service"
import type { Request, Response } from "express"
import { v4 as uuidv4 } from "uuid"

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: LoggingService

  constructor(
    private loggingService: LoggingService,
    private configService: LoggingConfigService,
  ) {
    this.logger = this.loggingService.setContext("HTTP")
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.configService.shouldLogRequests() && !this.configService.shouldLogResponses()) {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()
    const { method, url, headers, params, query } = request

    // Generate a unique request ID
    const requestId = uuidv4()
    request["requestId"] = requestId
    response.setHeader("X-Request-ID", requestId)

    // Get the request start time
    const startTime = Date.now()

    // Log the request
    if (this.configService.shouldLogRequests()) {
      const requestLog = {
        requestId,
        method,
        url,
        params,
        query,
        headers: this.sanitizeHeaders(headers),
      }

      // Optionally include request body
      if (this.configService.shouldLogRequestBody()) {
        const bodySizeLimit = this.configService.getRequestBodySizeLimit()
        requestLog["body"] = this.truncateBody(request.body, bodySizeLimit)
      }

      this.logger.log(`Request ${method} ${url}`, requestLog)
    }

    return next.handle().pipe(
      tap((data) => {
        // Log the response
        if (this.configService.shouldLogResponses()) {
          const responseTime = Date.now() - startTime
          const statusCode = response.statusCode

          const responseLog = {
            requestId,
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
          }

          // Optionally include response body
          if (this.configService.shouldLogResponseBody()) {
            const bodySizeLimit = this.configService.getResponseBodySizeLimit()
            responseLog["body"] = this.truncateBody(data, bodySizeLimit)
          }

          this.logger.log(`Response ${statusCode} ${method} ${url} - ${responseTime}ms`, responseLog)
        }
      }),
      catchError((error) => {
        // Log any errors
        const responseTime = Date.now() - startTime

        this.logger.error(`Error ${method} ${url} - ${responseTime}ms`, error.stack, {
          requestId,
          method,
          url,
          statusCode: error.status || 500,
          responseTime: `${responseTime}ms`,
          error: {
            name: error.name,
            message: error.message,
          },
        })

        throw error
      }),
    )
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers }

    // Remove sensitive headers
    const sensitiveHeaders = ["authorization", "cookie", "x-auth-token"]
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = "[REDACTED]"
      }
    })

    return sanitized
  }

  private truncateBody(body: any, sizeLimit: number): any {
    if (!body) return body

    const stringified = JSON.stringify(body)
    if (stringified.length <= sizeLimit) return body

    return {
      _truncated: true,
      _originalSize: stringified.length,
      _preview: stringified.substring(0, sizeLimit) + "...",
    }
  }
}

