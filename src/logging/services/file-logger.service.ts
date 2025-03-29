import { Injectable, type OnModuleInit } from "@nestjs/common"
import type { LoggingConfigService } from "./logging-config.service"
import { format } from "winston"
import * as DailyRotateFile from "winston-daily-rotate-file"
import * as fs from "fs"
import * as path from "path"

@Injectable()
export class FileLoggerService implements OnModuleInit {
  private fileTransport: DailyRotateFile
  private logDir: string

  constructor(private configService: LoggingConfigService) {
    this.logDir = this.configService.getLogDir()
  }

  onModuleInit() {
    this.ensureLogDirectory()
    this.setupLogRotation()
    this.setupLogCleanup()
  }

  getTransport(): DailyRotateFile {
    return this.fileTransport
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private setupLogRotation() {
    this.fileTransport = new DailyRotateFile({
      dirname: this.logDir,
      filename: "application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: this.configService.getMaxLogSize(),
      maxFiles: this.configService.getMaxLogFiles(),
      format: format.combine(format.timestamp(), format.json()),
    })

    // Handle rotation events
    this.fileTransport.on("rotate", (oldFilename, newFilename) => {
      console.log(`Log rotated from ${oldFilename} to ${newFilename}`)
    })
  }

  private setupLogCleanup() {
    // Schedule daily cleanup of old logs
    setInterval(
      () => {
        this.cleanupOldLogs()
      },
      24 * 60 * 60 * 1000,
    ) // Run once per day

    // Also run cleanup on startup
    this.cleanupOldLogs()
  }

  private cleanupOldLogs() {
    const retentionDays = this.configService.getLogRetentionDays()
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000
    const now = Date.now()

    fs.readdir(this.logDir, (err, files) => {
      if (err) {
        console.error("Error reading log directory:", err)
        return
      }

      files.forEach((file) => {
        const filePath = path.join(this.logDir, file)

        fs.stat(filePath, (statErr, stats) => {
          if (statErr) {
            console.error(`Error getting stats for file ${filePath}:`, statErr)
            return
          }

          // If file is older than retention period, delete it
          if (now - stats.mtime.getTime() > retentionMs) {
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error(`Error deleting old log file ${filePath}:`, unlinkErr)
              } else {
                console.log(`Deleted old log file: ${filePath}`)
              }
            })
          }
        })
      })
    })
  }
}

