import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"
import type { LoggingService } from "../services/logging.service"
import type { LoggingConfigService } from "../services/logging-config.service"
import { v4 as uuidv4 } from "uuid"

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger: LoggingService

  constructor(
    private loggingService: LoggingService,
    private configService: LoggingConfigService,
  ) {
    this.logger = this.loggingService.setContext("HTTP")
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.configService.shouldLogRequests()) {
      return next()
    }

    // Generate a unique request ID
    const requestId = uuidv4()
    req["requestId"] = requestId
    res.setHeader("X-Request-ID", requestId)

    // Get the request start time
    const startTime = Date.now()
    req["startTime"] = startTime

    // Log the request
    const { method, url, headers, params, query } = req

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
      requestLog["body"] = this.truncateBody(req.body, bodySizeLimit)
    }

    this.logger.log(`Request ${method} ${url}`, requestLog)

    // Log the response when it's finished
    res.on("finish", () => {
      if (!this.configService.shouldLogResponses()) {
        return
      }

      const responseTime = Date.now() - startTime
      const statusCode = res.statusCode

      const responseLog = {
        requestId,
        method,
        url,
        statusCode,
        responseTime: `${responseTime}ms`,
      }

      this.logger.log(`Response ${statusCode} ${method} ${url} - ${responseTime}ms`, responseLog)
    })

    next()
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

