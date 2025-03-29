import { Module, Global, type DynamicModule } from "@nestjs/common"
import { LoggingService } from "./services/logging.service"
import { APP_INTERCEPTOR } from "@nestjs/core"
import { LoggingInterceptor } from "./interceptors/logging.interceptor"
import { LoggingConfigService } from "./services/logging-config.service"
import { FileLoggerService } from "./services/file-logger.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { LogEntry } from "./entities/log-entry.entity"
import { LogDashboardController } from "./controllers/ log-dashboard.controller"

@Global()
@Module({})
export class LoggingModule {
  static forRoot(options?: { dashboard?: boolean }): DynamicModule {
    const providers = [
      LoggingService,
      LoggingConfigService,
      FileLoggerService,
      {
        provide: APP_INTERCEPTOR,
        useClass: LoggingInterceptor,
      },
    ]

    const controllers: any[] = [] // Explicitly typed array
    const imports = [TypeOrmModule.forFeature([LogEntry])]

    if (options?.dashboard) {
      providers.push(LoggingService)
      controllers.push(LogDashboardController)
    }

    return {
      module: LoggingModule,
      imports,
      providers,
      controllers, // Ensure correct type inference
      exports: [LoggingService, FileLoggerService],
    }
  }
}
