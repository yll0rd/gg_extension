import { Injectable } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"

@Injectable()
export class LoggingConfigService {
  constructor(private configService: ConfigService) {}

  getLogLevel(): string {
    return this.configService.get<string>("LOG_LEVEL", "info")
  }

  getLogDir(): string {
    return this.configService.get<string>("LOG_DIR", "logs")
  }

  getMaxLogSize(): string {
    return this.configService.get<string>("MAX_LOG_SIZE", "10m")
  }

  getMaxLogFiles(): number {
    return this.configService.get<number>("MAX_LOG_FILES", 5)
  }

  getLogRetentionDays(): number {
    return this.configService.get<number>("LOG_RETENTION_DAYS", 30)
  }

  isProductionEnvironment(): boolean {
    return this.configService.get<string>("NODE_ENV") === "production"
  }

  shouldLogRequests(): boolean {
    return this.configService.get<boolean>("LOG_REQUESTS", true)
  }

  shouldLogResponses(): boolean {
    return this.configService.get<boolean>("LOG_RESPONSES", true)
  }

  shouldLogRequestBody(): boolean {
    return this.configService.get<boolean>("LOG_REQUEST_BODY", false)
  }

  shouldLogResponseBody(): boolean {
    return this.configService.get<boolean>("LOG_RESPONSE_BODY", false)
  }

  getRequestBodySizeLimit(): number {
    return this.configService.get<number>("LOG_REQUEST_BODY_SIZE_LIMIT", 1024)
  }

  getResponseBodySizeLimit(): number {
    return this.configService.get<number>("LOG_RESPONSE_BODY_SIZE_LIMIT", 1024)
  }
}

