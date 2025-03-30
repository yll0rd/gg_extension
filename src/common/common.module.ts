import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import { ErrorLoggerService } from './services/error-logger.service';

@Global()
@Module({
  providers: [
    ErrorLoggerService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [ErrorLoggerService],
})
export class CommonModule {}
