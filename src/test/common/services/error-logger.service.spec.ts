import { Test, TestingModule } from '@nestjs/testing';
import { ErrorLoggerService } from '../../../src/common/services/error-logger.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('ErrorLoggerService', () => {
  let service: ErrorLoggerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorLoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
      ],
    }).compile();

    service = module.get<ErrorLoggerService>(ErrorLoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log errors', () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const error = new Error('Test error');
    
    service.logError(error, 'test-context');
    
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
        timestamp: expect.any(String),
        stack: error.stack,
        context: 'test-context',
      })
    );
  });

  it('should handle production environment differently', () => {
    jest.spyOn(configService, 'get').mockReturnValue('production');
    const loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    
    // Re-create the service to pick up the production env
    service = new ErrorLoggerService(configService);
    
    const error = new Error('Test error');
    service.logError(error, 'test-context');
    
    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(loggerLogSpy).toHaveBeenCalledWith('Would send to external monitoring service in production');
  });
});
