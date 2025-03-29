import { Injectable, Scope, type LogLevel as NestLogLevel } from "@nestjs/common"
import { createLogger, format, transports, type Logger as WinstonLogger } from "winston"
import type { LoggingConfigService } from "./logging-config.service"
import type { FileLoggerService } from "./file-logger.service"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { LogEntry } from "../entities/log-entry.entity"

// Define Winston log levels manually (since Winston does not export LogLevel)
type WinstonLogLevel = "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";

// Allow both NestJS and Winston log levels
type ExtendedLogLevel = NestLogLevel | WinstonLogLevel;

@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService {
  private context?: string
  private logger: WinstonLogger;

  constructor(
    private configService: LoggingConfigService,
    private fileLoggerService: FileLoggerService,
    @InjectRepository(LogEntry)
    private logEntryRepository: Repository<LogEntry>,
  ) {
    this.initializeLogger();
  }

  setContext(context: string): this {
    this.context = context
    return this
  }

  log(message: any, ...optionalParams: any[]) {
    this.logWithLevel("info", message, ...optionalParams)
  }

  error(message: any, trace?: string, ...optionalParams: any[]) {
    this.logWithLevel("error", message, ...[trace, ...optionalParams])
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logWithLevel("warn", message, ...optionalParams)
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logWithLevel("debug", message, ...optionalParams)
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logWithLevel("verbose", message, ...optionalParams)
  }

  private logWithLevel(level: ExtendedLogLevel, message: any, ...optionalParams: any[]) {
    const logData = this.formatLogData(message, optionalParams)

    // Log to Winston
    this.logger.log(level, message, logData)

    // Store in database for dashboard
    this.storeLogEntry(level, message, logData)
  }

  private formatLogData(message: any, optionalParams: any[]): Record<string, any> {
    const logData: Record<string, any> = {
      context: this.context,
      timestamp: new Date().toISOString(),
    }

    // Handle error objects
    if (message instanceof Error) {
      logData.message = message.message
      logData.stack = message.stack
      logData.name = message.name
    }

    // Add optional parameters as metadata
    if (optionalParams?.length) {
      logData.metadata = optionalParams.map((param) => {
        if (param instanceof Error) {
          return {
            message: param.message,
            stack: param.stack,
            name: param.name,
          }
        }
        return param
      })
    }

    return logData
  }

  private async storeLogEntry(level: ExtendedLogLevel, message: string, metadata: Record<string, any>) {
    try {
      const logEntry = this.logEntryRepository.create({
        level,
        message: typeof message === "string" ? message : JSON.stringify(message),
        context: this.context,
        metadata: metadata,
        timestamp: new Date(),
      })

      await this.logEntryRepository.save(logEntry)
    } catch (error) {
      console.error("Failed to store log entry:", error)
    }
  }

  private initializeLogger() {
    const logFormat = format.combine(format.timestamp(), format.errors({ stack: true }), format.json())

    this.logger = createLogger({
      level: this.configService.getLogLevel(),
      format: logFormat,
      defaultMeta: { service: "gasless-gossip-api" },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, context, ...meta }) => {
              return `${timestamp} [${level}] ${context ? `[${context}]` : ""} ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ""
              }`
            }),
          ),
        }),
        this.fileLoggerService.getTransport(),
      ],
    })
  }
}
