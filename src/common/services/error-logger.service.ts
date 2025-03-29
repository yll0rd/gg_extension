import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ErrorLoggerService {
  private readonly logger = new Logger(ErrorLoggerService.name);
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  logError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString();
    
    // Basic console logging
    this.logger.error({
      message: error.message,
      timestamp,
      stack: error.stack,
      context,
    });

    // In production, you might want to send to external monitoring service
    if (this.isProduction) {
      this.sendToExternalMonitoring(error, context);
    }
  }

  private sendToExternalMonitoring(error: Error, context?: string): void {
    // Implement integration with services like Sentry, DataDog, etc.
    // Example:
    // Sentry.captureException(error, { 
    //   extra: { context } 
    // });
    
    // For now just log a note about it
    this.logger.log('Would send to external monitoring service in production');
  }
}